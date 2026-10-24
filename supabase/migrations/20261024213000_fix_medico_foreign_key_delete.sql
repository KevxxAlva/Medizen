-- Fix foreign key constraints when deleting a medico or user
ALTER TABLE public.citas 
  DROP CONSTRAINT IF EXISTS citas_id_medico_fkey,
  ADD CONSTRAINT citas_id_medico_fkey 
    FOREIGN KEY (id_medico) 
    REFERENCES public.medicos(id_medico) 
    ON DELETE SET NULL;

ALTER TABLE public.consultas 
  DROP CONSTRAINT IF EXISTS consultas_id_medico_fkey,
  ADD CONSTRAINT consultas_id_medico_fkey 
    FOREIGN KEY (id_medico) 
    REFERENCES public.medicos(id_medico) 
    ON DELETE SET NULL;

ALTER TABLE public.horarios_medicos 
  DROP CONSTRAINT IF EXISTS horarios_medicos_id_medico_fkey,
  ADD CONSTRAINT horarios_medicos_id_medico_fkey 
    FOREIGN KEY (id_medico) 
    REFERENCES public.medicos(id_medico) 
    ON DELETE CASCADE;

-- Allow audit_logs user_id to be nullable on delete
ALTER TABLE public.audit_logs ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.audit_logs 
  DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey,
  ADD CONSTRAINT audit_logs_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE SET NULL;

-- Medicos cascade on user delete
ALTER TABLE public.medicos 
  DROP CONSTRAINT IF EXISTS medicos_id_usuario_fkey,
  ADD CONSTRAINT medicos_id_usuario_fkey 
    FOREIGN KEY (id_usuario) 
    REFERENCES public.usuarios(id_usuario) 
    ON DELETE CASCADE;

-- Update stored procedure admin_delete_staff_user to gracefully handle related records
CREATE OR REPLACE FUNCTION public.admin_delete_staff_user(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id_medico integer;
  v_id_usuario integer;
BEGIN
  -- 1. Obtener los IDs del usuario y médico
  SELECT id_usuario INTO v_id_usuario FROM public.usuarios WHERE auth_id = p_user_id;
  
  IF v_id_usuario IS NOT NULL THEN
    SELECT id_medico INTO v_id_medico FROM public.medicos WHERE id_usuario = v_id_usuario;
  END IF;

  -- 2. Limpiar y desvincular referencias del médico para proteger historial clínico
  IF v_id_medico IS NOT NULL THEN
    DELETE FROM public.horarios_medicos WHERE id_medico = v_id_medico;
    UPDATE public.citas SET id_medico = NULL WHERE id_medico = v_id_medico;
    UPDATE public.consultas SET id_medico = NULL WHERE id_medico = v_id_medico;
    DELETE FROM public.medicos WHERE id_medico = v_id_medico;
  END IF;

  -- 3. Desvincular registros de auditoría de este usuario para que no queden huérfanos ni bloqueen
  UPDATE public.audit_logs SET user_id = NULL WHERE user_id = p_user_id;

  -- 4. Eliminar de usuarios
  IF v_id_usuario IS NOT NULL THEN
    DELETE FROM public.usuarios WHERE id_usuario = v_id_usuario;
  END IF;

  -- 5. Eliminar de auth.users si existe
  DELETE FROM auth.users WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$;


-- Update admin_create_staff_user to support Recepcionista role
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
SET search_path TO 'public', 'auth', 'extensions'
AS $function$
DECLARE
  v_auth_id uuid := gen_random_uuid();
  v_user_id int;
  v_rol_id int;
  v_especialidad_id int;
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
    RAISE EXCEPTION 'El correo ya se encuentra registrado.';
  END IF;

  -- Determinar el rol según p_role
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

  -- Especialidad (solo si es doctor/médico y se especificó)
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

  -- Crear usuario en auth.users
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token,
    email_change_token_new, email_change_token_current, email_change, phone_change,
    phone_change_token, reauthentication_token, email_change_confirm_status,
    is_sso_user, is_anonymous, created_at, updated_at
  ) VALUES (
    v_auth_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', p_full_name, 'email_verified', true),
    '', '', '', '', '', '', '', '', 0, false, false,
    now(),
    now()
  );

  -- Crear registro en public.usuarios
  INSERT INTO public.usuarios (nombre_usuario, contrasena_hash, id_rol, estado, creado_en, auth_id)
  VALUES (p_full_name, 'supabase_auth', v_rol_id, true, now(), v_auth_id)
  RETURNING id_usuario INTO v_user_id;

  -- Crear perfil en public.medicos solo si es doctor
  IF LOWER(p_role) IN ('doctor', 'medico') THEN
    INSERT INTO public.medicos (id_usuario, id_especialidad, nombre, apellido, email, estado)
    VALUES (
      v_user_id,
      v_especialidad_id,
      split_part(p_full_name, ' ', 1),
      COALESCE(nullif(substr(p_full_name, length(split_part(p_full_name, ' ', 1)) + 2), ''), ''),
      p_email,
      true
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'auth_id', v_auth_id,
    'id_usuario', v_user_id
  );
END;
$function$;
