-- ==============================================================================
-- FIX DEFINITIVO: PERSONAL MULTI-TENANT (usuarios.id_clinica + RPC + GoTrue Auth)
-- ==============================================================================

-- 1. Asegurar que public.usuarios tenga DEFAULT current_user_clinic_id() en id_clinica
ALTER TABLE public.usuarios
  ALTER COLUMN id_clinica SET DEFAULT public.current_user_clinic_id();

-- 2. Reparar usuarios cuyo id_clinica quedó en NULL pero su registro en medicos sí tiene id_clinica (ej. Maria Perez)
UPDATE public.usuarios u
SET id_clinica = m.id_clinica
FROM public.medicos m
WHERE m.id_usuario = u.id_usuario
  AND u.id_clinica IS NULL
  AND m.id_clinica IS NOT NULL;

-- 3. Asegurar que todos los usuarios de clínicas tengan auth.users sanitizado y su fila en auth.identities
DO $$
DECLARE
  v_user record;
  v_id_type text;
BEGIN
  SELECT data_type INTO v_id_type
  FROM information_schema.columns
  WHERE table_schema = 'auth' AND table_name = 'identities' AND column_name = 'id';

  FOR v_user IN
    SELECT au.id, au.email
    FROM auth.users au
    JOIN public.usuarios u ON u.auth_id = au.id
    WHERE u.id_clinica IS NOT NULL
  LOOP
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
  END LOOP;
END $$;

-- 4. Actualizar RPC admin_create_staff_user con id_clinica explícito + auth.identities
DROP FUNCTION IF EXISTS public.admin_create_staff_user(text, text, text, text, text);

CREATE OR REPLACE FUNCTION public.admin_create_staff_user(
  p_email text,
  p_password text,
  p_full_name text,
  p_role text,
  p_specialty text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'extensions' AS $$
DECLARE
  v_auth_id uuid := gen_random_uuid();
  v_user_id int;
  v_rol_id int;
  v_especialidad_id int;
  v_clinic_id uuid;
  v_caller_is_admin boolean;
  v_id_type text;
  v_clean_email text := LOWER(TRIM(p_email));
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.usuarios u
    LEFT JOIN public.roles r ON r.id_rol = u.id_rol
    WHERE u.auth_id = auth.uid()
      AND u.estado = true
      AND (u.es_superadmin = true OR u.id_rol = 1 OR LOWER(COALESCE(r.nombre_rol, '')) LIKE 'admin%')
  ) INTO v_caller_is_admin;

  IF NOT COALESCE(v_caller_is_admin, false) THEN
    RAISE EXCEPTION 'Acceso denegado: solo los administradores pueden registrar personal.';
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = v_clean_email) THEN
    RAISE EXCEPTION 'El correo ya se encuentra registrado.';
  END IF;

  v_clinic_id := public.current_user_clinic_id();
  IF v_clinic_id IS NULL AND NOT public.is_superadmin() THEN
    RAISE EXCEPTION 'Error: No se pudo identificar la clínica asociada al usuario.';
  END IF;

  IF LOWER(p_role) IN ('admin', 'administrador') THEN
    SELECT id_rol INTO v_rol_id FROM public.roles WHERE LOWER(nombre_rol) LIKE 'admin%' LIMIT 1;
    IF v_rol_id IS NULL THEN v_rol_id := 1; END IF;
  ELSIF LOWER(p_role) IN ('recepcion', 'recepcionista') THEN
    SELECT id_rol INTO v_rol_id FROM public.roles WHERE LOWER(nombre_rol) LIKE 'recep%' LIMIT 1;
    IF v_rol_id IS NULL THEN v_rol_id := 3; END IF;
  ELSE
    SELECT id_rol INTO v_rol_id FROM public.roles WHERE LOWER(nombre_rol) LIKE 'medic%' LIMIT 1;
    IF v_rol_id IS NULL THEN v_rol_id := 2; END IF;
  END IF;

  IF LOWER(p_role) IN ('doctor', 'medico') AND p_specialty IS NOT NULL AND TRIM(p_specialty) <> '' THEN
    SELECT id_especialidad INTO v_especialidad_id
    FROM public.especialidades
    WHERE LOWER(nombre) = LOWER(TRIM(p_specialty))
    LIMIT 1;

    IF v_especialidad_id IS NULL THEN
      INSERT INTO public.especialidades (nombre) VALUES (TRIM(p_specialty))
      RETURNING id_especialidad INTO v_especialidad_id;
    END IF;
  END IF;

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
    v_clean_email,
    crypt(p_password, gen_salt('bf')),
    now(),
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'), 'id_clinica', v_clinic_id),
    jsonb_build_object('full_name', TRIM(p_full_name), 'email_verified', true, 'role', LOWER(p_role)),
    '', '', '', '', '', NULL, '', '', '', 0, false, false,
    now(),
    now()
  );

  SELECT data_type INTO v_id_type
  FROM information_schema.columns
  WHERE table_schema = 'auth' AND table_name = 'identities' AND column_name = 'id';

  IF v_id_type = 'uuid' THEN
    EXECUTE 'INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at) ' ||
            'VALUES ($1, $1, jsonb_build_object(''sub'', $1::text, ''email'', $2), ''email'', $1::text, now(), now(), now())'
    USING v_auth_id, v_clean_email;
  ELSE
    EXECUTE 'INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at) ' ||
            'VALUES ($1::text, $1, jsonb_build_object(''sub'', $1::text, ''email'', $2), ''email'', $1::text, now(), now(), now())'
    USING v_auth_id, v_clean_email;
  END IF;

  INSERT INTO public.usuarios (nombre_usuario, contrasena_hash, id_rol, id_clinica, estado, creado_en, auth_id)
  VALUES (TRIM(p_full_name), 'supabase_auth', v_rol_id, v_clinic_id, true, now(), v_auth_id)
  RETURNING id_usuario INTO v_user_id;

  IF LOWER(p_role) IN ('doctor', 'medico') THEN
    INSERT INTO public.medicos (id_usuario, id_clinica, id_especialidad, nombre, apellido, email, estado)
    VALUES (
      v_user_id,
      v_clinic_id,
      v_especialidad_id,
      split_part(TRIM(p_full_name), ' ', 1),
      COALESCE(NULLIF(substr(TRIM(p_full_name), length(split_part(TRIM(p_full_name), ' ', 1)) + 2), ''), ''),
      v_clean_email,
      true
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'auth_id', v_auth_id,
    'id_usuario', v_user_id,
    'id_clinica', v_clinic_id
  );
END;
$$;

-- 5. Actualizar RPC admin_delete_staff_user
DROP FUNCTION IF EXISTS public.admin_delete_staff_user(uuid);

CREATE OR REPLACE FUNCTION public.admin_delete_staff_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth' AS $$
DECLARE
  v_caller_is_admin boolean;
  v_caller_clinic uuid;
  v_target_clinic uuid;
  v_target_usuario_id int;
BEGIN
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'No puedes eliminarte a ti mismo.';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.usuarios u
    LEFT JOIN public.roles r ON r.id_rol = u.id_rol
    WHERE u.auth_id = auth.uid()
      AND u.estado = true
      AND (u.es_superadmin = true OR u.id_rol = 1 OR LOWER(COALESCE(r.nombre_rol, '')) LIKE 'admin%')
  ) INTO v_caller_is_admin;

  IF NOT COALESCE(v_caller_is_admin, false) THEN
    RAISE EXCEPTION 'Acceso denegado: solo los administradores pueden eliminar personal.';
  END IF;

  v_caller_clinic := public.current_user_clinic_id();

  SELECT id_usuario, id_clinica
  INTO v_target_usuario_id, v_target_clinic
  FROM public.usuarios
  WHERE auth_id = p_user_id
  LIMIT 1;

  IF NOT public.is_superadmin() AND v_target_clinic IS DISTINCT FROM v_caller_clinic THEN
    RAISE EXCEPTION 'Acceso denegado: no puedes eliminar personal de otra clínica.';
  END IF;

  IF v_target_usuario_id IS NOT NULL THEN
    DELETE FROM public.medicos WHERE id_usuario = v_target_usuario_id;
    DELETE FROM public.usuarios WHERE id_usuario = v_target_usuario_id;
  END IF;

  DELETE FROM auth.identities WHERE user_id = p_user_id;
  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;
