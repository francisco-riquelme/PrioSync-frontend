# Guía de Scripts de Prueba para API de Transcripción

Esta guía explica las diferencias entre los scripts de prueba disponibles para la API `/api/transcribe-course` y cuándo usar cada uno.

## **Comparación de Scripts de Prueba**

### **`test-transcription-api.js` - Tests Unitarios**

**Propósito**: Validar cada endpoint individualmente y casos de error

**Lo que prueba**:
- **Validaciones de entrada**: Archivo faltante, datos faltantes, tipos no soportados
- **Respuestas de error**: Status codes 400, mensajes de error correctos
- **Endpoints básicos**: GET y POST funcionan
- **Formato de respuesta**: Estructura JSON correcta

**Enfoque**: **Pruebas rápidas y aisladas**
```bash
# Ejecuta 6 tests en ~2 segundos
Test 1: Subida exitosa          → Status 201 ✓
Test 2: Error por archivo faltante → Status 400 ✓
Test 3: Error por datos faltantes  → Status 400 ✓
Test 4: Tipo no soportado         → Status 400 ✓
Test 5: Consultar estado          → Status 200 ✓
Test 6: Listar transcripciones     → Status 200 ✓
```

**Cómo ejecutar**:
```bash
node test-transcription-api.js
```

---

### **`test-transcription-complete.js` - Test de Integración**

**Propósito**: Simular el flujo completo que usaría un usuario real

**Lo que prueba**:
- **Flujo end-to-end completo**: Subida → Procesamiento → Transcripción final
- **Estados dinámicos**: `processing` (0%) → `completed` (100%)
- **Transcripción real**: Genera y devuelve texto contextual
- **Almacenamiento persistente**: Los jobs se mantienen entre requests
- **Experiencia de usuario**: Como funcionaría en la aplicación real

**Enfoque**: **Simulación realista del usuario final**
```bash
# Ejecuta flujo completo en ~8 segundos
Paso 1: Subir video               → Request ID generado
Paso 2: Estado inicial            → processing (0%)
Paso 3: Esperar procesamiento     → 6 segundos (simula LLM real)
Paso 4: Estado final              → completed (100% + transcripción)
Paso 5: Listar todo               → Historial persistente
```

**Cómo ejecutar**:
```bash
node test-transcription-complete.js
```

## **Diferencias Técnicas Clave**

| Aspecto | `test-transcription-api.js` | `test-transcription-complete.js` |
|---------|---------------------------|--------------------------------|
| **Duración** | ~2 segundos | ~8 segundos |
| **Enfoque** | Validación técnica | Experiencia de usuario |
| **Estados** | Solo estado inicial | Estado inicial → final |
| **Transcripción** | No verifica texto | Verifica transcripción generada |
| **Almacenamiento** | No valida persistencia | Valida almacenamiento entre requests |
| **Casos de error** | 4 casos de error diferentes | Solo flujo exitoso |
| **Polling** | No simula | Simula polling real del frontend |

## **Flujos de Datos Diferentes**

### **Script API (Unitario)**:
```
POST → Respuesta inmediata (201/400)
GET  → Datos mock estáticos
```

### **Script Complete (Integración)**:
```
POST → Job creado (processing)
  ↓
Espera 6 segundos (simula LLM)
  ↓
GET  → Job completado + transcripción
  ↓
GET  → Lista con historial persistente
```

## **Cuándo Usar Cada Uno**

### **`test-transcription-api.js`** - Para desarrollo:
- Verificar que la API maneja errores correctamente
- Validar estructura de respuestas JSON
- Debug rápido de problemas específicos
- CI/CD pipeline (tests rápidos)
- Desarrollo iterativo de la API

### **`test-transcription-complete.js`** - Para demo/QA:
- Demostrar funcionalidad completa a stakeholders
- Verificar que el flujo asíncrono funciona
- Probar como lo usaría el frontend real
- Validar la experiencia de usuario completa
- Testing de integración end-to-end


## 🚀 **Prerequisitos**

Antes de ejecutar cualquier script, asegúrate de que:

1. **El servidor Next.js esté corriendo**:
   ```bash
   npm run dev
   ```

2. **El servidor esté disponible en**: `http://localhost:3000`

3. **La API route esté implementada**: `src/app/api/transcribe-course/route.ts`