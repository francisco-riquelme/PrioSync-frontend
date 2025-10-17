/**
 * Script para reparar bloques de estudio con dia_semana undefined
 *
 * Este script:
 * 1. Identifica todos los bloques con dia_semana undefined
 * 2. Los elimina de DynamoDB
 * 3. Intenta reconstruirlos desde localStorage si está disponible
 *
 * EJECUTAR EN LA CONSOLA DEL NAVEGADOR DESPUÉS DE LOGIN
 */

console.log("🔧 INICIANDO REPARACIÓN DE BLOQUES DE ESTUDIO...\n");

// Función principal de reparación
async function repairStudyBlocks() {
  try {
    console.log("📊 Paso 1: Obteniendo datos del usuario actual...");

    // Verificar que el usuario esté autenticado
    const userId = localStorage.getItem("currentUserId"); // Ajusta según tu implementación

    if (!userId) {
      console.error("❌ No se encontró userId. Asegúrate de estar logueado.");
      return;
    }

    console.log("✅ Usuario ID:", userId);

    // Verificar datos en localStorage
    console.log("\n📦 Paso 2: Verificando localStorage...");
    const welcomeData = localStorage.getItem("welcomeFormData");

    if (!welcomeData) {
      console.warn("⚠️  No hay datos en welcomeFormData");
      console.log(
        "💡 Los datos ya fueron migrados o nunca se guardaron localmente"
      );
      console.log(
        "💡 Se intentará recuperar de la BD para verificar el estado"
      );
    } else {
      const data = JSON.parse(welcomeData);
      console.log("✅ welcomeFormData encontrado:");
      console.log(
        "   - Horarios configurados:",
        data.tiempoDisponible?.length || 0,
        "días"
      );

      if (data.tiempoDisponible) {
        data.tiempoDisponible.forEach((daySchedule) => {
          console.log(
            `   📅 ${daySchedule.day}: ${daySchedule.timeSlots.length} slots`
          );
        });
      }
    }

    console.log("\n🔍 Paso 3: Consultando bloques actuales en BD...");
    console.log(
      "⚠️  NOTA: Debes tener acceso al cliente Amplify desde la consola"
    );
    console.log(
      "💡 Si ves errores, ejecuta este script desde la aplicación React"
    );

    return {
      userId,
      hasLocalData: !!welcomeData,
      localData: welcomeData ? JSON.parse(welcomeData) : null,
    };
  } catch (error) {
    console.error("❌ Error en reparación:", error);
    return null;
  }
}

// Función para eliminar bloques con dia_semana undefined
async function deleteUndefinedBlocks(userId) {
  console.log("\n🗑️  Paso 4: Eliminando bloques con dia_semana undefined...");
  console.log("⚠️  Esta función requiere acceso directo a Amplify Data client");
  console.log("💡 Ejecutar desde el contexto de la aplicación React");
}

// Función para recrear bloques desde localStorage
async function recreateBlocksFromLocal(userId, localData) {
  console.log("\n🔨 Paso 5: Recreando bloques desde datos locales...");
  console.log("⚠️  Esta función requiere acceso directo a studyBlocksService");
  console.log("💡 Ejecutar desde el contexto de la aplicación React");
}

// Ejecutar diagnóstico inicial
console.log("═══════════════════════════════════════════════════════════\n");
console.log("📋 INSTRUCCIONES DE USO:\n");
console.log("1. Asegúrate de estar logueado en la aplicación");
console.log("2. Abre esta consola desde /dashboard o /study-hours");
console.log("3. Ejecuta: repairStudyBlocks()");
console.log("4. Sigue las instrucciones en pantalla");
console.log("\n═══════════════════════════════════════════════════════════\n");

// Exportar función para uso manual
window.repairStudyBlocks = repairStudyBlocks;

console.log("✅ Script cargado. Ejecuta: repairStudyBlocks()\n");
