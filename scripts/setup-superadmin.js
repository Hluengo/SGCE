#!/usr/bin/env node

/**
 * setup-superadmin.js
 * Script para crear el superadministrador global
 * 
 * USO: node scripts/setup-superadmin.js
 * Requiere SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env o variables de entorno
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const SUPERADMIN_EMAIL = "admin@admin.cl";
const SUPERADMIN_PASSWORD = "123456";

async function setup() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "❌ ERROR: Variables de entorno SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY requeridas"
    );
    process.exit(1);
  }

  try {
    console.log("🔧 Iniciando setup de superadmin...\n");

    // Crear cliente admin
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 1) Crear usuario
    console.log(`📝 Creando usuario: ${SUPERADMIN_EMAIL}`);
    const { data: { user }, error: userError } = await supabase.auth.admin.createUser({
      email: SUPERADMIN_EMAIL,
      password: SUPERADMIN_PASSWORD,
      email_confirm: true,
    });

    if (userError) {
      if (userError.message.includes("already exists")) {
        console.log("⚠️  Usuario ya existe, continuando...");
        // Para obtener el usuario existente, usamos el email
        const { data: existingUser, error: fetchError } = await supabase
          .from("perfiles")
          .select("id")
          .eq("email", SUPERADMIN_EMAIL)
          .single();

        if (fetchError && !existingUser) {
          console.error(`❌ Error obteniendo usuario existente: ${fetchError.message}`);
          process.exit(1);
        }
      } else {
        console.error(`❌ Error creando usuario: ${userError.message}`);
        process.exit(1);
      }
    }

    const userId = user?.id;
    if (!userId) {
      console.error("❌ No se obtuvo ID del usuario");
      process.exit(1);
    }

    console.log(`✅ Usuario creado/encontrado: ${userId}\n`);

    // 2) Obtener o crear establecimiento SUPERADMIN
    console.log("🏢 Configurando establecimiento SUPERADMIN");
    const { data: establecimientos, error: estError } = await supabase
      .from("establecimientos")
      .select("id")
      .eq("rbd", "SUPERADMIN")
      .limit(1);

    if (estError) {
      console.error(`❌ Error consultando establecimientos: ${estError.message}`);
      process.exit(1);
    }

    let establishmentId;
    if (establecimientos && establecimientos.length > 0) {
      establishmentId = establecimientos[0].id;
      console.log(`✅ Establecimiento SUPERADMIN encontrado: ${establishmentId}\n`);
    } else {
      const { data: newEst, error: createEstError } = await supabase
        .from("establecimientos")
        .insert({
          nombre: "SUPERADMIN GLOBAL",
          rbd: "SUPERADMIN",
        })
        .select("id")
        .single();

      if (createEstError) {
        console.error(`❌ Error creando establecimiento: ${createEstError.message}`);
        process.exit(1);
      }

      establishmentId = newEst.id;
      console.log(`✅ Establecimiento SUPERADMIN creado: ${establishmentId}\n`);
    }

    // 3) Crear perfil de superadmin
    console.log("👤 Creando perfil de superadmin");
    const { data: profile, error: profileError } = await supabase
      .from("perfiles")
      .insert({
        id: userId,
        nombre: "Administrador Global",
        rol: "superadmin",
        establecimiento_id: establishmentId,
        activo: true,
        tenant_ids: [],
      })
      .select("id")
      .single();

    if (profileError) {
      if (profileError.message.includes("duplicate")) {
        console.log("⚠️  Perfil ya existe, actualizando...");
        const { error: updateError } = await supabase
          .from("perfiles")
          .update({
            nombre: "Administrador Global",
            rol: "superadmin",
            activo: true,
            tenant_ids: [],
          })
          .eq("id", userId);

        if (updateError) {
          console.error(`❌ Error actualizando perfil: ${updateError.message}`);
          process.exit(1);
        }
      } else {
        console.error(`❌ Error creando perfil: ${profileError.message}`);
        process.exit(1);
      }
    }

    console.log(`✅ Perfil de superadmin creado:\n`);
    console.log(`  📧 Email: ${SUPERADMIN_EMAIL}`);
    console.log(`  🔑 Contraseña: ${SUPERADMIN_PASSWORD}`);
    console.log(`  👤 ID Usuario: ${userId}`);
    console.log(`  🏢 Establecimiento: ${establishmentId}\n`);

    console.log("✅ Setup completado exitosamente\n");
    console.log("Siguiente paso: Inicia sesión en la aplicación con:");
    console.log(`  Email: ${SUPERADMIN_EMAIL}`);
    console.log(`  Contraseña: ${SUPERADMIN_PASSWORD}`);
  } catch (error) {
    console.error(`❌ Error inesperado: ${error.message}`);
    process.exit(1);
  }
}

setup();
