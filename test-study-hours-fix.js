// Script de prueba para verificar que los horarios se guardan y recuperan correctamente
// Ejecutar en la consola del navegador después de hacer login

console.log("🧪 Iniciando prueba de horarios de estudio...\n");

// 1. Verificar datos en localStorage
console.log("📦 1. Verificando localStorage:");
const welcomeData = localStorage.getItem("welcomeFormData");
if (welcomeData) {
  const data = JSON.parse(welcomeData);
  console.log("✅ welcomeFormData encontrado:");
  console.log(
    "   - Horarios:",
    data.tiempoDisponible?.length || 0,
    "días configurados"
  );
  console.log("   - Área de estudio:", data.estudio);
  console.log("   - Canal YouTube:", data.youtubeUrl);

  // Contar slots totales
  const totalSlots =
    data.tiempoDisponible?.reduce(
      (sum, day) => sum + day.timeSlots.length,
      0
    ) || 0;
  console.log("   - Total de slots:", totalSlots);
} else {
  console.log(
    "⚠️  No hay datos en welcomeFormData (esto es normal después de migración exitosa)"
  );
}

console.log("\n📊 2. Probando servicio de studyBlocks:");

// Importar servicios (necesitas hacerlo manualmente en la consola)
// Para esta prueba, usaremos fetch directo

// Obtener userId del usuario actual
async function testStudyBlocks() {
  try {
    // Nota: Este script es para pruebas manuales
    // Reemplaza 'YOUR_USER_ID' con tu usuarioId real
    const userId = "YOUR_USER_ID"; // Obtener de UserContext

    console.log("   - Usuario ID:", userId);

    // Verificar si hay datos en la página actual
    const preference = document.querySelector('[data-testid="study-hours"]');
    if (preference) {
      console.log("✅ Página de Mis Horas de Estudio encontrada");
    }

    // Verificar si hay días con horarios
    const dayCards = document.querySelectorAll("[data-day]");
    console.log("   - Tarjetas de días encontradas:", dayCards.length);

    dayCards.forEach((card) => {
      const day = card.getAttribute("data-day");
      const slots = card.querySelectorAll("[data-timeslot]");
      if (slots.length > 0) {
        console.log(`   ✅ ${day}: ${slots.length} horarios configurados`);
      } else {
        console.log(`   ⚠️  ${day}: Sin horarios configurados`);
      }
    });

    // Verificar el total semanal
    const totalWeekly = document.querySelector("[data-total-hours]");
    if (totalWeekly) {
      const hours = totalWeekly.textContent;
      console.log(`   📅 Total semanal: ${hours}`);

      if (hours.includes("0.0")) {
        console.log("   ❌ PROBLEMA: Total semanal es 0.0 horas");
        console.log(
          "   💡 Solución: Verificar que los datos se migraron correctamente"
        );
      } else {
        console.log("   ✅ Horarios configurados correctamente");
      }
    }
  } catch (error) {
    console.error("❌ Error en prueba:", error);
  }
}

console.log("\n📝 3. Para ejecutar prueba completa:");
console.log("   - Copia y pega: testStudyBlocks()");
console.log("   - O navega a /study-hours y verifica visualmente");

// Hacer la función disponible globalmente
window.testStudyBlocks = testStudyBlocks;

console.log(
  "\n✅ Script de prueba listo. Ejecuta testStudyBlocks() cuando estés listo.\n"
);
