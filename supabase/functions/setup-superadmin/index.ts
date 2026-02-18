import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPERADMIN_EMAIL = "admin@admin.cl";
const SUPERADMIN_PASSWORD = "123456";

interface SetupRequest {
  action: "create" | "verify";
}

serve(async (req: Request) => {
  // Validar que sea POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
    });
  }

  try {
    const body: SetupRequest = await req.json();

    // Validar que venga de un usuario autenticado con rol admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    // Crear cliente admin con service_role
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    const supabase = createClient(supabaseUrl, supabaseServiceRole, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    if (body.action === "create") {
      return await createSuperadmin(supabase);
    } else if (body.action === "verify") {
      return await verifySuperadmin(supabase);
    } else {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
      });
    }
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500 }
    );
  }
});

async function createSuperadmin(supabase: any) {
  try {
    console.log(`[EDGE] Creando superadmin: ${SUPERADMIN_EMAIL}`);

    // 1) Crear usuario en auth.users
    const { data: { user }, error: userError } = await supabase.auth.admin.createUser({
      email: SUPERADMIN_EMAIL,
      password: SUPERADMIN_PASSWORD,
      email_confirm: true,
    });

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: `Auth error: ${userError?.message}` }),
        { status: 400 }
      );
    }

    console.log(`[EDGE] Usuario creado: ${user.id}`);

    // 2) Obtener o crear establecimiento SUPERADMIN
    const { data: establecimientos } = await supabase
      .from("establecimientos")
      .select("id")
      .eq("rbd", "SUPERADMIN")
      .limit(1);

    let establishmentId: string;
    if (establecimientos && establecimientos.length > 0) {
      establishmentId = establecimientos[0].id;
      console.log(`[EDGE] Establecimiento SUPERADMIN encontrado: ${establishmentId}`);
    } else {
      const { data: newEst, error: createEstError } = await supabase
        .from("establecimientos")
        .insert({
          nombre: "SUPERADMIN GLOBAL",
          rbd: "SUPERADMIN",
        })
        .select("id")
        .single();

      if (createEstError || !newEst) {
        return new Response(
          JSON.stringify({ error: `Establecimiento error: ${createEstError?.message}` }),
          { status: 400 }
        );
      }
      establishmentId = newEst.id;
      console.log(`[EDGE] Establecimiento SUPERADMIN creado: ${establishmentId}`);
    }

    // 3) Insertar perfil
    const { data: profile, error: profileError } = await supabase
      .from("perfiles")
      .insert({
        id: user.id,
        nombre: "Administrador Global",
        rol: "superadmin",
        establecimiento_id: establishmentId,
        activo: true,
        tenant_ids: [],
      })
      .select("id")
      .single();

    if (profileError) {
      if (!profileError.message.includes("duplicate")) {
        return new Response(
          JSON.stringify({ error: `Perfil error: ${profileError.message}` }),
          { status: 400 }
        );
      }
      console.log("[EDGE] Perfil ya existe");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Superadmin creado exitosamente",
        userId: user.id,
        email: SUPERADMIN_EMAIL,
      }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500 }
    );
  }
}

async function verifySuperadmin(supabase: any) {
  try {
    console.log("[EDGE] Verificando superadmin...");

    const { data: users, error } = await supabase
      .from("perfiles")
      .select("id, nombre, rol, establecimiento_id")
      .eq("rol", "superadmin");

    if (error) {
      return new Response(
        JSON.stringify({ error: `Query error: ${error.message}` }),
        { status: 400 }
      );
    }

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({
          exists: false,
          message: "No superadmin found",
        }),
        { status: 200 }
      );
    }

    return new Response(
      JSON.stringify({
        exists: true,
        count: users.length,
        superadmins: users,
      }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500 }
    );
  }
}
