-- =============================================================================
-- 016_create_superadmin.sql
-- Crea superadministrador total con email admin@admin.cl y contraseña 123456
-- =============================================================================

-- IMPORTANTE: Esta migración requiere ejecución manual en la consola Supabase Auth
-- O ejecutar desde backend con las credenciales de service_role

-- 1) Crear usuario en auth.users (ejecutar manualmente en Supabase Console)
-- Ir a: Authentication > Users > Add user
--   Email: admin@admin.cl
--   Password: 123456
--   Auto send invite email: NO
--   Confirm password: 123456

-- 2) Una vez creado el usuario, obtener el UUID (ej: 550e8400-e29b-41d4-a716-446655440000)
-- 3) Ejecutar la siguiente inserción en SQL Editor:

-- Crear establecimiento especial para superadmin global
insert into public.establecimientos (nombre, rbd)
values ('SUPERADMIN GLOBAL', 'SUPERADMIN')
on conflict (id) do nothing;

-- Insertar perfil de superadmin (reemplazar UUID con el usuario creado)
-- insert into public.perfiles (
--   id,
--   nombre,
--   rol,
--   establecimiento_id,
--   activo,
--   tenant_ids
-- ) values (
--   'REEMPLAZAR_CON_UUID_DEL_USUARIO',
--   'Administrador Global',
--   'superadmin',
--   (select id from public.establecimientos where rbd = 'SUPERADMIN'),
--   true,
--   array[]::uuid[]
-- )
-- on conflict (id) do nothing;

-- =============================================================================
-- ALTERNATIVA: Si tienes acceso a service_role, ejecutar desde backend:
-- =============================================================================

-- const { data, error } = await supabase.auth.admin.createUser({
--   email: 'admin@admin.cl',
--   password: '123456',
--   email_confirm: true
-- });
--
-- if (data.user) {
--   const { error: profError } = await supabase
--     .from('perfiles')
--     .insert({
--       id: data.user.id,
--       nombre: 'Administrador Global',
--       rol: 'superadmin',
--       establecimiento_id: superadminEstablecimientoId,
--       activo: true,
--       tenant_ids: [] // Acceso a todos los tenants
--     });
-- }

comment on schema public is
  'Migration 016: Superadmin creation guide - executa paso a paso en console Supabase';
