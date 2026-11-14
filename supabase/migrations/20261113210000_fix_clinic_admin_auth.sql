-- ==============================================================================
-- REPARACIÓN DEFINITIVA DE AUTENTICACIÓN GO-TRUE PARA ADMINISTRADORES DE CLÍNICAS
-- Soluciona: "Database error querying schema" en supabase.auth.signInWithPassword
-- Adaptado 100% al esquema nativo de Medizen (public.usuarios)
-- ==============================================================================

-- 1. REPARAR USUARIOS EN AUTH.USERS Y CREAR SUS IDENTIDADES EN AUTH.IDENTITIES
DO $$
DECLARE
  v_user record;
  v_id_type text;
BEGIN
  -- Detectar el tipo de columna id en auth.identities (uuid o text)
  SELECT data_type INTO v_id_type 
  FROM information_schema.columns 
  WHERE table_schema = 'auth' AND table_name = 'identities' AND column_name = 'id';

  FOR v_user IN 
    SELECT u.*, us.id_clinica, us.id_rol
    FROM auth.users u
    LEFT JOIN public.usuarios us ON us.auth_id = u.id
    WHERE u.email = 'ingridma1977@gmail.com' 
       OR us.id_clinica IS NOT NULL
  LOOP
    -- 1.1 Sanitizar auth.users para evitar el crash del scanner de GoTrue
    UPDATE auth.users
    SET 
      confirmation_token = COALESCE(confirmation_token, ''),
      recovery_token = COALESCE(recovery_token, ''),
      email_change_token_new = COALESCE(email_change_token_new, ''),
      email_change_token_current = COALESCE(email_change_token_current, ''),
      email_change = COALESCE(email_change, ''),
      phone = NULLIF(phone, ''),
      phone_change = COALESCE(phone_change, ''),
      phone_change_token = COALESCE(phone_change_token, ''),
      reauthentication_token = COALESCE(reauthentication_token, ''),
      email_change_confirm_status = COALESCE(email_change_confirm_status, 0),
      is_sso_user = COALESCE(is_sso_user, false),
      is_anonymous = COALESCE(is_anonymous, false),
      aud = 'authenticated',
      role = 'authenticated'
    WHERE id = v_user.id;

    -- 1.2 Insertar en auth.identities (obligatorio para GoTrue signInWithPassword)
    IF v_id_type = 'uuid' THEN
      EXECUTE 'INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at) ' ||
              'VALUES ($1, $1, jsonb_build_object(''sub'', $1::text, ''email'', $2), ''email'', $1::text, now(), now(), now()) ' ||
              'ON CONFLICT DO NOTHING'
      USING v_user.id, v_user.email;
    ELSE
      EXECUTE 'INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at) ' ||
              'VALUES ($1::text, $1, jsonb_build_object(''sub'', $1::text, ''email'', $2), ''email'', $1::text, now(), now(), now()) ' ||
              'ON CONFLICT DO NOTHING'
      USING v_user.id, v_user.email;
    END IF;

    -- 1.3 Asegurar que en public.usuarios esté activo con rol Administrador (id_rol = 1)
    UPDATE public.usuarios
    SET 
      id_rol = 1,
      estado = true
    WHERE auth_id = v_user.id;

  END LOOP;
END $$;

-- 2. ACTUALIZAR SUPERADMIN_CREATE_CLINIC (ESQUEMA MEDIZEN PURO)
CREATE OR REPLACE FUNCTION public.superadmin_create_clinic(
  p_slug text,
  p_nombre text,
  p_rif text,
  p_telefono text,
  p_direccion text,
  p_plan text,
  p_admin_email text,
  p_admin_password text,
  p_admin_name text,
  p_tipo_clinica text DEFAULT 'Consultorio Ginecológico Obstétrico',
  p_color_primario text DEFAULT '#0ea5e9'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'extensions' AS $$
DECLARE
  v_id_clinica uuid := gen_random_uuid();
  v_auth_id uuid := gen_random_uuid();
  v_user_id int;
  v_id_type text;
BEGIN
  IF NOT public.is_superadmin() THEN
    RAISE EXCEPTION 'Acceso denegado: solo el Super Administrador puede crear clínicas.';
  END IF;

  IF EXISTS (SELECT 1 FROM public.clinicas WHERE slug = LOWER(TRIM(p_slug))) THEN
    RAISE EXCEPTION 'El subdominio o slug "%" ya está en uso por otra clínica.', p_slug;
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = LOWER(TRIM(p_admin_email))) THEN
    RAISE EXCEPTION 'El correo "%" ya se encuentra registrado.', p_admin_email;
  END IF;

  -- 1. Insertar Clínica
  INSERT INTO public.clinicas (
    id_clinica, slug, nombre, rif, telefono, direccion, plan_suscripcion, 
    estado, color_primario, tipo_clinica, email_contacto, creado_en
  ) VALUES (
    v_id_clinica, LOWER(TRIM(p_slug)), p_nombre, p_rif, p_telefono, p_direccion, 
    COALESCE(p_plan, 'pro'), 'activo', COALESCE(p_color_primario, '#0ea5e9'), 
    COALESCE(p_tipo_clinica, 'Consultorio Ginecológico Obstétrico'), LOWER(TRIM(p_admin_email)), now()
  );

  -- 2. Crear Usuario en auth.users con todos los campos sanitizados
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token,
    email_change_token_new, email_change_token_current, email_change, phone,
    phone_change, phone_change_token, reauthentication_token, email_change_confirm_status,
    is_sso_user, is_anonymous, created_at, updated_at
  ) VALUES (
    v_auth_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    LOWER(TRIM(p_admin_email)),
    crypt(p_admin_password, gen_salt('bf')),
    now(),
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'), 'id_clinica', v_id_clinica),
    jsonb_build_object('full_name', p_admin_name, 'email_verified', true),
    '', '', '', '', '', NULL, '', '', '', 0, false, false,
    now(),
    now()
  );

  -- 3. Crear Registro en auth.identities
  SELECT data_type INTO v_id_type 
  FROM information_schema.columns 
  WHERE table_schema = 'auth' AND table_name = 'identities' AND column_name = 'id';

  IF v_id_type = 'uuid' THEN
    EXECUTE 'INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at) ' ||
            'VALUES ($1, $1, jsonb_build_object(''sub'', $1::text, ''email'', $2), ''email'', $1::text, now(), now(), now()) ' ||
            'ON CONFLICT DO NOTHING'
    USING v_auth_id, LOWER(TRIM(p_admin_email));
  ELSE
    EXECUTE 'INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at) ' ||
            'VALUES ($1::text, $1, jsonb_build_object(''sub'', $1::text, ''email'', $2), ''email'', $1::text, now(), now(), now()) ' ||
            'ON CONFLICT DO NOTHING'
    USING v_auth_id, LOWER(TRIM(p_admin_email));
  END IF;

  -- 4. Crear Usuario en public.usuarios (Admin de esa clínica, id_rol = 1)
  INSERT INTO public.usuarios (
    nombre_usuario, contrasena_hash, id_rol, id_clinica, estado, creado_en, auth_id, es_superadmin
  ) VALUES (
    p_admin_name, 'supabase_auth', 1, v_id_clinica, true, now(), v_auth_id, false
  )
  RETURNING id_usuario INTO v_user_id;

  -- 5. Sembrar servicios médicos base
  INSERT INTO public.servicios (id_clinica, nombre_servicio, costo_base, descripcion) VALUES
    (v_id_clinica, 'Consulta General / Primera Vez', 40.00, 'Evaluación médica integral'),
    (v_id_clinica, 'Control Periódico / Seguimiento', 30.00, 'Revisión y evolución médica');

  -- 6. Sembrar métodos de pago base
  INSERT INTO public.payment_methods (id_clinica, name, category, status) VALUES
    (v_id_clinica, 'Efectivo Divisas ($)', 'Efectivo', 'Active'),
    (v_id_clinica, 'Pago Móvil', 'Pago Móvil', 'Active'),
    (v_id_clinica, 'Punto de Venta', 'Punto de Venta', 'Active');

  RETURN jsonb_build_object(
    'success', true,
    'id_clinica', v_id_clinica,
    'slug', p_slug,
    'admin_user_id', v_user_id,
    'auth_id', v_auth_id
  );
END;
$$;
