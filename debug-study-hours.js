// Script de diagnóstico completo para debugging de horarios
// Ejecutar en la consola del navegador (F12) en /study-hours

console.log("\n🔬 ========================================");
console.log("🔬 DIAGNÓSTICO COMPLETO DE HORARIOS");
console.log("🔬 ========================================\n");

// 1. Verificar userId
console.log("👤 1. Usuario:");
const userDataFromContext = window.__NEXT_DATA__?.props?.pageProps?.userData;
console.log("   userData:", userDataFromContext);

// 2. Verificar localStorage
console.log("\n📦 2. LocalStorage:");
const welcomeData = localStorage.getItem("welcomeFormData");
if (welcomeData) {
  const data = JSON.parse(welcomeData);
  console.log("   ✅ welcomeFormData encontrado");
  console.log("   Contenido:", data);
  console.log("   Días con horarios:", data.tiempoDisponible?.length || 0);
  data.tiempoDisponible?.forEach((day, idx) => {
    console.log(`   ${idx + 1}. ${day.day}: ${day.timeSlots.length} slots`);
    day.timeSlots.forEach((slot, slotIdx) => {
      console.log(`      ${slotIdx + 1}. ${slot.start} - ${slot.end}`);
    });
  });
} else {
  console.log("   ⚠️ No hay welcomeFormData en localStorage");
}

// 3. Verificar estado de React
console.log("\n⚛️ 3. Estado de React:");
console.log("   INSTRUCCIONES:");
console.log("   - Abre React DevTools (extensión del navegador)");
console.log('   - Busca el componente "StudyHoursManager"');
console.log('   - Revisa el estado "schedule"');
console.log('   - Revisa el hook "useUserPreferences"');

// 4. Verificar elementos DOM
console.log("\n🌐 4. Elementos DOM:");
const totalElement = document.querySelector("[data-total-hours]");
if (totalElement) {
  console.log("   ✅ Elemento de total encontrado");
  console.log("   Contenido:", totalElement.textContent);
} else {
  console.log("   ⚠️ No se encontró elemento de total");
}

// Buscar tarjetas de días
const dayCards = document.querySelectorAll('div[role="button"], .MuiCard-root');
console.log(`   Tarjetas encontradas: ${dayCards.length}`);

// 5. Función de prueba interactiva
console.log("\n🧪 5. Función de prueba:");

window.debugSchedule = function () {
  console.log("\n🔍 Debug Schedule ejecutado:");

  // Intentar obtener el estado desde React DevTools
  const reactRoot = document.querySelector("#__next");
  if (reactRoot && reactRoot._reactRootContainer) {
    console.log("   ✅ React root encontrado");
  }

  // Verificar si hay datos visibles
  const text = document.body.innerText;
  const hasHours = text.includes("Total semanal");
  const hasDays = text.includes("Sin horarios configurados");

  console.log("   Página contiene:");
  console.log('     - "Total semanal":', hasHours ? "✅" : "❌");
  console.log('     - "Sin horarios configurados":', hasDays ? "✅" : "❌");

  // Buscar texto de horas
  const hoursMatch = text.match(/(\d+\.?\d*)\s*horas configuradas/);
  if (hoursMatch) {
    console.log(`     - Total detectado: ${hoursMatch[1]} horas`);
  }

  return {
    hasHours,
    hasDays,
    totalHours: hoursMatch ? hoursMatch[1] : null,
  };
};

// 6. Verificar migración
console.log("\n🔄 6. Estado de migración:");
console.log("   Busca en la consola logs que digan:");
console.log('   - "🔄 Starting study blocks migration"');
console.log('   - "✅ Study blocks migration completed"');
console.log('   - "📊 Loaded X study blocks from backend"');

// 7. Instrucciones finales
console.log("\n📋 7. INSTRUCCIONES:");
console.log("   A. Ejecuta: debugSchedule()");
console.log("   B. Recarga la página (F5) y busca los logs de:");
console.log("      - [StudyHoursManager] useEffect triggered");
console.log("      - [StudyHoursManager] preferences:");
console.log("      - [getDaySchedule] Buscando");
console.log("   C. Si no ves logs, es posible que:");
console.log("      - No hay datos en el backend");
console.log("      - La migración no se ejecutó");
console.log("      - El usuario no tiene usuarioId");

console.log("\n✅ Script de diagnóstico cargado");
console.log("🔧 Ejecuta: debugSchedule()");
console.log("🔬 ========================================\n");
