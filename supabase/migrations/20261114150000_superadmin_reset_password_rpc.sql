-- ==============================================================================
-- RPC DE SOPORTE SAAS: RESTABLECER CONTRASEÑA DE CUALQUIER USUARIO / ADMIN
-- + SANITIZACIÓN DE SESIÓN AUTH.USERS PARA SUPER ADMIN (kevinja1406@gmail.com)
-- ==============================================================================

-- 1. Sanitizar todos los usuarios en auth.users (incluyendo Super Admin) y asegurar id_clinica en FemeSalud
UPDATE public.usuarios
SET id_clinica = 'c0000000-0000-0000-0000-000000000001'
WHERE id_clinica IS NULL;

DO $$
DECLARE
  v_user record;
  v_id_type text;
BEGIN
  SELECT data_type INTO v_id_type
  FROM information_schema.columns
  WHERE table_schema = 'auth' AND table_name = 'identities' AND column_name = 'id';

  FOR v_user IN SELECT id, email FROM auth.users WHERE email IS NOT NULL LOOP
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
      role = 'authenticated',
      email_confirmed_at = COALESCE(email_confirmed_at, now())
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

-- 2. Crear función RPC para que el Super Admin cambie la contraseña de cualquier usuario (por auth_id o por email)
DROP FUNCTION IF EXISTS public.superadmin_reset_user_password(uuid, text);
DROP FUNCTION IF EXISTS public.superadmin_reset_user_password(uuid, text, text);

CREATE OR REPLACE FUNCTION public.superadmin_reset_user_password(
  p_auth_id uuid DEFAULT NULL,
  p_new_password text DEFAULT NULL,
  p_email text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'extensions' AS $$
DECLARE
  v_target_id uuid;
BEGIN
  IF NOT public.is_superadmin() THEN
    RAISE EXCEPTION 'Acceso denegado: solo el Super Administrador puede restablecer contraseñas.';
  END IF;

  IF p_new_password IS NULL OR length(trim(p_new_password)) < 6 THEN
    RAISE EXCEPTION 'La nueva contraseña debe tener al menos 6 caracteres.';
  END IF;

  -- Resolver el usuario por auth_id o por correo electrónico
  IF p_auth_id IS NOT NULL THEN
    SELECT id INTO v_target_id FROM auth.users WHERE id = p_auth_id LIMIT 1;
  END IF;

  IF v_target_id IS NULL AND p_email IS NOT NULL AND trim(p_email) <> '' THEN
    SELECT id INTO v_target_id FROM auth.users WHERE LOWER(email) = LOWER(trim(p_email)) LIMIT 1;
  END IF;

  IF v_target_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró la cuenta de usuario en auth.users.';
  END IF;

  UPDATE auth.users
  SET
    encrypted_password = crypt(trim(p_new_password), gen_salt('bf')),
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    updated_at = now()
  WHERE id = v_target_id;

  RETURN jsonb_build_object(
    'success', true,
    'auth_id', v_target_id
  );
END;
$$;
