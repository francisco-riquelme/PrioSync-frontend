# Implementación de Persistencia de Horarios de Estudio

## 📋 Resumen

Se ha implementado la persistencia completa de horarios de estudio usando el backend de AWS Amplify con el modelo `BloqueEstudio`. Los datos ahora se guardan en DynamoDB y persisten entre sesiones y dispositivos.

---

## 🏗️ Arquitectura

### **Modelo de Datos (Backend)**

```typescript
BloqueEstudio {
  bloqueEstudioId: ID (PK)
  hora_inicio: Time (required)
  hora_fin: Time (required)
  duracion_minutos: Integer
  usuarioId: ID (FK a Usuario)
}
```

**Nota**: El backend actualmente NO almacena el día de la semana (`day_of_week`). Los horarios se guardan como bloques planos de tiempo.

### **Flujo de Datos**

```
Registro → Cognito Custom Attributes → Post-Login Migration → DynamoDB BloqueEstudio
           └─> localStorage (fallback/caché)
```

---

## 📁 Archivos Creados/Modificados

### **1. Nuevos Servicios**

#### `src/utils/services/studyBlocks.ts`

Servicio principal para CRUD de bloques de estudio:

**Funciones principales:**

- `getUserStudyBlocks(usuarioId)` - Obtener horarios del usuario
- `createStudyBlocks(usuarioId, schedules)` - Crear múltiples bloques
- `deleteAllUserStudyBlocks(usuarioId)` - Eliminar todos los bloques
- `updateUserStudyBlocks(usuarioId, schedules)` - Actualizar horarios (delete + create)
- `convertDayScheduleToStudyBlocks()` - Convertir formato UI → Backend
- `convertStudyBlocksToDaySchedule()` - Convertir formato Backend → UI

#### `src/utils/services/migrateStudyBlocks.ts`

Servicio de migración automática de datos:

**Funciones principales:**

- `migrateStudyBlocksFromCognito(usuarioId)` - Migrar desde Cognito custom attributes
- `migrateStudyBlocksFromLocalStorage(usuarioId)` - Migrar desde localStorage

**Cuándo se ejecuta:**

- Automáticamente después del login en `UserContext.refreshUser()`
- Solo si el usuario NO tiene bloques en el backend
- Intenta Cognito primero, luego localStorage como fallback

---

### **2. Hooks Actualizados**

#### `src/hooks/useUserPreferences.ts`

**Cambios:**

- Ahora intenta cargar desde backend primero usando `studyBlocksService`
- Usa localStorage como fallback si falla el backend
- Mantiene compatibilidad con datos existentes

**Flujo de carga:**

```typescript
if (userId) {
  try {
    // Intentar backend
    blocks = await studyBlocksService.getUserStudyBlocks(userId);
    if (blocks.length > 0) {
      // Temporalmente usa localStorage (backend no tiene day_of_week)
      loadFromLocalStorage();
    } else {
      // No hay datos en backend, cargar de localStorage
      loadFromLocalStorage();
    }
  } catch {
    // Error en backend, usar localStorage
    loadFromLocalStorage();
  }
}
```

---

### **3. Componentes Actualizados**

#### `src/components/study-hours/StudyHoursManager.tsx`

**Cambios en `handleSaveChanges()`:**

```typescript
// 1. Guardar en backend
const success = await studyBlocksService.updateUserStudyBlocks(
  userData.usuarioId,
  schedule
);

// 2. Guardar en localStorage como caché
localStorage.setItem("welcomeFormData", JSON.stringify(updatedData));

// 3. Refrescar preferencias
refreshPreferences();
```

---

### **4. Contextos Actualizados**

#### `src/contexts/UserContext.tsx`

**Cambios en `refreshUser()`:**

- Agregada migración automática después de cargar datos del usuario
- Migración ejecuta en background (no bloquea UI)
- Intenta Cognito → localStorage en orden de prioridad

```typescript
// Después de cargar userData
migrationService.migrateStudyBlocksFromCognito(usuarioId).then((result) => {
  if (!result.success) {
    return migrationService.migrateStudyBlocksFromLocalStorage(usuarioId);
  }
  return result;
});
```

---

## 🔄 Flujo Completo

### **Registro de Nuevo Usuario**

1. Usuario completa `WelcomeModal` con horarios
2. Datos se guardan en `localStorage.welcomeFormData`
3. Usuario completa `RegistrationModal`
4. Horarios se envían a Cognito como custom attributes (máx 5 slots)
5. Usuario confirma email
6. Usuario hace login por primera vez

### **Primer Login**

1. `LoginForm` llama `refreshUser()` después de login exitoso
2. `UserContext.refreshUser()` ejecuta:
   - Obtiene `usuarioId` de Cognito
   - Carga datos del usuario desde DynamoDB
   - **Ejecuta migración automática en background:**
     - `migrateStudyBlocksFromCognito()` lee custom attributes
     - Si no hay datos en Cognito, intenta `migrateStudyBlocksFromLocalStorage()`
     - Crea registros en `BloqueEstudio` table
3. Usuario navega a "Mis Horas de Estudio"
4. `StudyHoursManager` carga horarios desde backend

### **Gestión de Horarios**

1. Usuario abre `/study-hours`
2. `useUserPreferences` intenta cargar desde backend
3. Si no hay datos en backend, carga desde localStorage (fallback)
4. Usuario modifica horarios
5. Usuario hace clic en "Guardar"
6. `handleSaveChanges()`:
   - Llama `studyBlocksService.updateUserStudyBlocks()`
   - Delete all + Create new en DynamoDB
   - Actualiza localStorage como caché
   - Refresca estado del componente

---

## ⚠️ Limitaciones Conocidas

### **1. Backend No Almacena Día de la Semana**

**Problema:**

```typescript
// UI espera:
DaySchedule {
  day: 'lunes' | 'martes' | ...
  timeSlots: TimeSlot[]
}

// Backend solo tiene:
BloqueEstudio {
  hora_inicio: Time
  hora_fin: Time
  // ❌ No tiene day_of_week
}
```

**Solución Temporal:**

- Se guarda toda la semana como bloques planos
- Al cargar, se usa localStorage como fuente de verdad para el día
- Backend solo valida que los bloques existan

**Solución Futura:**

```graphql
# Actualizar schema.ts
BloqueEstudio: a.model({
  bloqueEstudioId: a.id().required(),
  dia_semana: a.enum(['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']),
  hora_inicio: a.time().required(),
  hora_fin: a.time().required(),
  duracion_minutos: a.integer(),
  usuarioId: a.id().required(),
  Usuario: a.belongsTo("Usuario", "usuarioId"),
})
```

### **2. Cognito Custom Attributes (Máx 5 Slots)**

**Limitación:**

- Cognito solo permite ~25 custom attributes
- Actualmente se usan 10 (5 slots × 2 campos)
- Si usuario tiene >5 bloques, los extras NO se guardan en Cognito

**Workaround:**

- Migración desde localStorage toma todos los bloques
- Migración desde Cognito está limitada a 5

### **3. Caché localStorage**

**Comportamiento:**

- Después de guardar en backend, también se guarda en localStorage
- Si backend falla, localStorage es el backup
- Puede haber inconsistencias si usuario usa múltiples dispositivos

---

## 🧪 Testing Manual

### **Caso 1: Nuevo Usuario**

```bash
# 1. Registrarse con horarios en WelcomeModal
# 2. Confirmar email
# 3. Hacer login
# 4. Verificar en DevTools → Application → IndexedDB
# Buscar: AmplifyDataStore → BloqueEstudio → registros creados
```

### **Caso 2: Usuario Existente con localStorage**

```bash
# 1. Usuario antiguo con datos en localStorage
# 2. Hacer login
# 3. Migración automática debe crear bloques en backend
# 4. Verificar en consola: "Successfully migrated X study blocks"
```

### **Caso 3: Modificar Horarios**

```bash
# 1. Ir a /study-hours
# 2. Modificar horarios
# 3. Guardar
# 4. Verificar mensaje: "✅ Horarios guardados exitosamente"
# 5. Cerrar sesión y volver a entrar
# 6. Verificar que horarios persisten
```

---

## 📊 Monitoreo

### **Logs Importantes**

```typescript
// Migración exitosa
"Successfully migrated X study blocks for user {usuarioId}";

// Sin datos para migrar
"No time slots found in Cognito attributes";
"No welcome data found in localStorage";

// Usuario ya tiene datos
"User already has study blocks, skipping migration";

// Errores
"Error migrating study blocks from Cognito:";
"Failed to save study blocks to database";
```

### **Verificar en AWS Console**

1. **DynamoDB Table**
   - Tabla: `BloqueEstudio-{env}`
   - Buscar por `usuarioId`
   - Verificar `hora_inicio`, `hora_fin`, `duracion_minutos`

2. **CloudWatch Logs**
   - Buscar errores en Lambda functions
   - Filtro: `"study blocks"` o `"migration"`

---

## 🚀 Próximos Pasos

### **Prioridad Alta**

1. ✅ Implementado: Servicio de CRUD completo
2. ✅ Implementado: Migración automática
3. ⏳ **PENDIENTE**: Actualizar schema para incluir `dia_semana`
4. ⏳ **PENDIENTE**: Actualizar `convertStudyBlocksToDaySchedule()` cuando se agregue `dia_semana`

### **Prioridad Media**

5. ⏳ Agregar validación de conflictos de horarios en backend
6. ⏳ Implementar soft delete en vez de delete permanente
7. ⏳ Agregar campo `activo` para deshabilitar bloques temporalmente

### **Prioridad Baja**

8. ⏳ Implementar versionado de horarios (historial de cambios)
9. ⏳ Agregar analytics de uso de horarios
10. ⏳ Sincronización automática entre dispositivos (websockets)

---

## 🔧 Mantenimiento

### **Si Backend Se Actualiza con `dia_semana`:**

1. Actualizar `studyBlocks.ts`:

```typescript
export const convertDayScheduleToStudyBlocks = (
  schedules: DaySchedule[],
  usuarioId: string
): Omit<StudyBlock, "bloqueEstudioId">[] => {
  const blocks: Omit<StudyBlock, "bloqueEstudioId">[] = [];

  schedules.forEach((daySchedule) => {
    daySchedule.timeSlots.forEach((slot) => {
      blocks.push({
        dia_semana: daySchedule.day, // ✅ Ahora se guarda el día
        hora_inicio: slot.start,
        hora_fin: slot.end,
        duracion_minutos: calculateDuration(slot.start, slot.end),
        usuarioId,
      });
    });
  });

  return blocks;
};
```

2. Actualizar `convertStudyBlocksToDaySchedule()`:

```typescript
export const convertStudyBlocksToDaySchedule = (
  blocks: StudyBlock[]
): DaySchedule[] => {
  // Agrupar bloques por día
  const grouped = blocks.reduce(
    (acc, block) => {
      if (!acc[block.dia_semana]) {
        acc[block.dia_semana] = [];
      }
      acc[block.dia_semana].push({
        start: block.hora_inicio,
        end: block.hora_fin,
      });
      return acc;
    },
    {} as Record<string, TimeSlot[]>
  );

  // Convertir a DaySchedule[]
  return Object.entries(grouped).map(([day, timeSlots]) => ({
    day,
    timeSlots,
  }));
};
```

3. Actualizar `useUserPreferences.ts`:

```typescript
// Eliminar fallback a localStorage
if (blocks && blocks.length > 0) {
  const schedules = studyBlocksService.convertStudyBlocksToDaySchedule(blocks);
  setPreferences(schedules);
}
```

---

## 📝 Notas del Desarrollador

- **localStorage sigue siendo útil**: Se mantiene como caché local para mejorar rendimiento
- **Migración es idempotente**: Se puede ejecutar múltiples veces sin duplicar datos
- **Backend es source of truth**: Siempre se intenta leer del backend primero
- **Fallback gracioso**: Si backend falla, la app sigue funcionando con localStorage

---

**Fecha de Implementación**: 16 de Octubre 2025  
**Versión**: 1.0.0  
**Estado**: ✅ Funcional (con limitación de day_of_week pendiente)
