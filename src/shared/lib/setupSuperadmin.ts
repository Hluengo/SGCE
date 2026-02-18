/**
 * Setup Superadmin - Utilidad para crear el superadministrador global
 * 
 * USO: Ejecutar esta función con credenciales de service_role en el backend
 * o desde una Edge Function con SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";

interface SuperadminSetupResult {
  success: boolean;
  userId?: string;
  profileId?: string;
  error?: string;
}

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === 'string') return maybeMessage;
  }
  return 'Error desconocido';
};

/**
 * Crea el superadministrador global con email y contraseña especificados
 * 
 * IMPORTANTE: Ejecutar solo con credenciales de service_role
 * 
 * @param serviceRoleKey - Clave de service_role desde variables de entorno
 * @param supabaseUrl - URL del proyecto Supabase
 * @returns Resultado de la creación
 */
export async function setupSuperadmin(
  serviceRoleKey: string,
  supabaseUrl: string,
  email: string = "admin@admin.cl",
  password: string = "123456"
): Promise<SuperadminSetupResult> {
  try {
    // Crear cliente con service_role (no usar auth.users desde frontend)
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 1) Crear usuario en auth.users
    console.log(`[SETUP] Creando usuario superadmin: ${email}`);
    const { data: { user }, error: userError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirmar email automáticamente
    });

    if (userError || !user) {
      throw new Error(`Error creando usuario auth: ${userError?.message}`);
    }

    console.log(`[SETUP] Usuario creado: ${user.id}`);

    // 2) Obtener o crear establecimiento SUPERADMIN
    console.log("[SETUP] Obteniendo/creando establecimiento SUPERADMIN");
    const { data: establecimientos, error: estError } = await adminClient
      .from("establecimientos")
      .select("id")
      .eq("rbd", "SUPERADMIN")
      .limit(1);

    if (estError) throw new Error(`Error consultando establecimientos: ${estError.message}`);

    let establishmentId: string;
    if (establecimientos && establecimientos.length > 0) {
      establishmentId = establecimientos[0].id;
      console.log(`[SETUP] Establecimiento SUPERADMIN encontrado: ${establishmentId}`);
    } else {
      // Crear establecimiento especial
      const { data: newEst, error: createEstError } = await adminClient
        .from("establecimientos")
        .insert({
          nombre: "SUPERADMIN GLOBAL",
          rbd: "SUPERADMIN",
        })
        .select("id")
        .single();

      if (createEstError || !newEst) {
        throw new Error(`Error creando establecimiento: ${createEstError?.message}`);
      }
      establishmentId = newEst.id;
      console.log(`[SETUP] Establecimiento SUPERADMIN creado: ${establishmentId}`);
    }

    // 3) Insertar perfil de superadmin
    console.log("[SETUP] Creando perfil de superadmin");
    const { data: profile, error: profileError } = await adminClient
      .from("perfiles")
      .insert({
        id: user.id,
        nombre: "Administrador Global",
        rol: "superadmin",
        establecimiento_id: establishmentId,
        activo: true,
        tenant_ids: [], // Acceso a todos los tenants
      })
      .select("id")
      .single();

    if (profileError) {
      // Si el perfil ya existe, loguear pero no fallar
      if (profileError.message.includes("duplicate key")) {
        console.log("[SETUP] Perfil ya existe, actualizando...");
        const { error: updateError } = await adminClient
          .from("perfiles")
          .update({
            nombre: "Administrador Global",
            rol: "superadmin",
            activo: true,
            tenant_ids: [],
          })
          .eq("id", user.id);

        if (updateError) {
          throw new Error(`Error actualizando perfil: ${updateError.message}`);
        }
      } else {
        throw new Error(`Error creando perfil: ${profileError.message}`);
      }
    }

    console.log("[SETUP] ✅ Superadmin creado exitosamente");
    return {
      success: true,
      userId: user.id,
      profileId: profile?.id || user.id,
    };
  } catch (error: unknown) {
    const message = toErrorMessage(error);
    console.error("[SETUP] ❌ Error:", message);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Verifica que el superadmin existe y tiene permisos correctos
 */
export async function verifySuperadminSetup(
  serviceRoleKey: string,
  supabaseUrl: string
): Promise<boolean> {
  try {
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verificar que existe el usuario
    const { data: users, error } = await adminClient
      .from("perfiles")
      .select("id, nombre, rol")
      .eq("rol", "superadmin");

    if (error) throw error;
    if (!users || users.length === 0) {
      console.log("❌ No se encontró superadmin");
      return false;
    }

    console.log("✅ Superadmin verificado:", users[0]);
    return true;
  } catch (error: unknown) {
    console.error("❌ Error verificando superadmin:", toErrorMessage(error));
    return false;
  }
}
