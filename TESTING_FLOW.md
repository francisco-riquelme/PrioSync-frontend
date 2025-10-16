# 🧪 Prueba del Flujo Completo - Horas de Estudio con Backend

**Fecha**: 16 de octubre de 2025  
**Objetivo**: Validar que la corrección de Amplify permite la migración y visualización correcta de horas de estudio  
**Commit**: 6a68105 - "fix: Resolver race condition en inicialización de Amplify y migración de datos"

---

## 📋 Preparación

### Pre-requisitos

- [x] Servidor de desarrollo corriendo en http://localhost:3000
- [ ] DevTools abierto en Chrome/Edge
- [ ] Consola del navegador visible (para logs)
- [ ] Terminal visible (para logs del servidor)
- [ ] LocalStorage limpio (opcional, para test desde cero)

### Limpieza de Datos Anteriores (Opcional)

```javascript
// En DevTools Console:
localStorage.clear();
// En Application tab:
// - Clear cookies
// - Clear local storage
// - Clear session storage
```

---

## 🔄 Flujo de Prueba Completo

### PASO 1: Landing Page

**URL**: http://localhost:3000  
**Acción**: Click en botón "Comenzar Ahora"

**Verificar**:

- [ ] WelcomeModal se abre correctamente
- [ ] Título: "¡Bienvenido a PrioSync!"
- [ ] Primer paso visible (Paso 1/4)

**Logs Esperados en Terminal**:

```
✅ Amplify initialized successfully
```

---

### PASO 2: Welcome Modal - Paso 1 (Información Personal)

**Acción**: Rellenar formulario

- **Nombre**: [Ingresar nombre de prueba]
- **Área de Estudio**: [Seleccionar área]

**Acción**: Click "Siguiente"

**Verificar**:

- [ ] Validación funciona (nombre requerido)
- [ ] Avanza a Paso 2/4

---

### PASO 3: Welcome Modal - Paso 2 (URL de YouTube) [OPCIONAL]

**Acción**:

- Dejar vacío o ingresar URL de playlist YouTube
- Click "Siguiente"

**Verificar**:

- [ ] Avanza a Paso 3/4

---

### PASO 4: Welcome Modal - Paso 3 (Horarios de Estudio) ⭐ CRÍTICO

**Acción**: Agregar bloques de tiempo

1. Seleccionar día (ej: Lunes)
2. Hora inicio: 09:00
3. Hora fin: 12:00
4. Click "Agregar Bloque de Tiempo"
5. Repetir para otro día (ej: Miércoles 14:00-17:00)

**Verificar**:

- [ ] Bloque aparece en la lista
- [ ] Muestra duración calculada (ej: "3 horas")
- [ ] Permite eliminar bloques
- [ ] Permite agregar múltiples bloques
- [ ] Validación de solapamientos funciona

**Acción**: Click "Siguiente"

**Verificar**:

- [ ] Avanza a Paso 4/4 (Resumen)

**Logs Esperados en Console (navegador)**:

```javascript
// Al agregar bloque:
{día: "Lunes", timeSlots: [{start: "09:00", end: "12:00"}]}
```

---

### PASO 5: Welcome Modal - Paso 4 (Resumen)

**Acción**: Revisar resumen y click "Finalizar"

**Verificar**:

- [ ] Muestra nombre ingresado
- [ ] Muestra área de estudio
- [ ] Muestra lista de horarios agregados
- [ ] Al hacer click "Finalizar":
  - [ ] Modal se cierra
  - [ ] Se abre RegistrationModal

**Logs Esperados en Console**:

```javascript
// localStorage debe tener:
welcomeFormData: {
  nombre: "...",
  estudio: "...",
  tiempoDisponible: [
    {día: "Lunes", timeSlots: [{start: "09:00", end: "12:00"}]},
    {día: "Miércoles", timeSlots: [{start: "14:00", end: "17:00"}]}
  ]
}
```

---

### PASO 6: Registration Modal ⭐ CRÍTICO

**Acción**: Rellenar formulario de registro

- **Nombre**: [Nombre]
- **Apellido**: [Apellido]
- **Email**: [email único, ej: test123@ejemplo.com]
- **Contraseña**: [Mínimo 8 caracteres, mayúscula, número]
- **Confirmar Contraseña**: [Misma contraseña]

**Acción**: Click "Registrarse"

**Verificar**:

- [ ] Validaciones funcionan
- [ ] Mensaje "Creando cuenta..." aparece
- [ ] Redirección a página de verificación

**Logs Esperados en Terminal** ⭐ **MUY IMPORTANTE**:

```
[Backend] POST /auth/signup
[Cognito] Creating user with custom attributes:
  - email: test123@ejemplo.com
  - given_name: ...
  - family_name: ...
  - custom:firstSlotStart: "09:00"
  - custom:firstSlotEnd: "12:00"
  - custom:secondSlotStart: "14:00"
  - custom:secondSlotEnd: "17:00"
  - custom:areaOfInterest: "..."
```

**IMPORTANTE**: Los bloques de tiempo SE GUARDAN en Cognito custom attributes (máximo 5 slots)

---

### PASO 7: Verificación de Email

**URL**: /auth/verification?email=test123@ejemplo.com

**Acción**:

1. Revisar email (simulado o real según configuración)
2. Copiar código de verificación
3. Ingresar código en formulario
4. Click "Verificar"

**Verificar**:

- [ ] Mensaje de éxito aparece
- [ ] Redirección a página de login

**NOTA**: En desarrollo, revisar CloudWatch Logs o terminal para el código

---

### PASO 8: Login ⭐ CRÍTICO - MIGRACIÓN AUTOMÁTICA

**URL**: /auth/login

**Acción**: Iniciar sesión

- **Email**: test123@ejemplo.com
- **Contraseña**: [La contraseña usada]
- Click "Iniciar Sesión"

**Logs Esperados en Terminal** ⭐ **MOMENTO CLAVE**:

```
✅ Amplify initialized successfully
⏳ Waiting for Amplify to initialize... (puede aparecer)
[UserContext] useEffect triggered { isInitialized: true }
[Auth] User logged in: abc-123-def-456
🔄 Starting study blocks migration for user: abc-123-def-456
[Migration] Attempting Cognito migration...
[Migration] Found custom attributes:
  - custom:firstSlotStart: "09:00"
  - custom:firstSlotEnd: "12:00"
  - custom:secondSlotStart: "14:00"
  - custom:secondSlotEnd: "17:00"
[DynamoDB] Creating study blocks in BloqueEstudio table...
✅ Cognito migration successful
✅ Study blocks migration completed successfully
```

**Verificar**:

- [ ] Redirección a /dashboard
- [ ] NO aparece error "Amplify has not been configured"
- [ ] Logs de migración exitosos en terminal

---

### PASO 9: Dashboard

**URL**: /dashboard

**Verificar**:

- [ ] Avatar muestra nombre del usuario (no ID)
- [ ] Dashboard carga correctamente
- [ ] Menú lateral tiene opción "Calendario"

---

### PASO 10: Calendario ⭐ VERIFICACIÓN PRINCIPAL

**URL**: /calendar

**Acción**: Navegar a página de calendario

**Verificar**:

- [ ] Calendario renderiza en vista semanal
- [ ] Toolbar visible con:
  - [ ] Selector de vista (Mes/Semana/Día)
  - [ ] Botón "Mis Horas de Estudio"
  - [ ] Botón "Nueva Sesión"
- [ ] Vista semanal muestra los días correctos

**NOTA**: Los bloques pueden NO aparecer en el calendario si el backend no tiene campo `day_of_week`

---

### PASO 11: "Mis Horas de Estudio" ⭐ VERIFICACIÓN CRÍTICA

**Acción**: Click en botón "Mis Horas de Estudio" en toolbar del calendario

**Verificar**:

- [ ] Redirección a /study-hours
- [ ] Página carga correctamente
- [ ] Título "Mis Horas de Estudio Semanales"

**Logs Esperados en Console (navegador)**:

```javascript
// useUserPreferences hook:
[useUserPreferences] Loading preferences for user: abc-123-def-456
[useUserPreferences] Trying backend first...
[studyBlocksService] getUserStudyBlocks(abc-123-def-456)
[DynamoDB] Querying BloqueEstudio table...
[studyBlocksService] Found X blocks in backend
[useUserPreferences] Backend returned data (may be empty if no day_of_week)
[useUserPreferences] Falling back to localStorage...
```

**Verificar Datos Mostrados**:

- [ ] Acordeón para cada día de la semana visible
- [ ] Días con bloques están expandidos
- [ ] **Lunes**:
  - [ ] Muestra chip "09:00 - 12:00 (3h 0m)"
  - [ ] Botón ❌ para eliminar
- [ ] **Miércoles**:
  - [ ] Muestra chip "14:00 - 17:00 (3h 0m)"
  - [ ] Botón ❌ para eliminar
- [ ] Botón "Agregar Horario" visible en cada día
- [ ] Total de horas calculado correctamente (ej: "6 horas totales por semana")

**SI LOS DATOS NO APARECEN** ⚠️:

```javascript
// Revisar en DevTools Console:
localStorage.getItem('userPreferences')
// Debería contener:
{
  "abc-123-def-456": {
    "Lunes": {
      "isActive": true,
      "timeSlots": [{"start": "09:00", "end": "12:00"}]
    },
    "Miércoles": {
      "isActive": true,
      "timeSlots": [{"start": "14:00", end: "17:00"}]
    }
  }
}
```

---

### PASO 12: Editar Horas de Estudio

**Acción**: Agregar nuevo bloque

1. Expandir día "Martes"
2. Click "Agregar Horario"
3. Hora inicio: 10:00
4. Hora fin: 13:00
5. Click ✓ (confirmar)

**Verificar**:

- [ ] Nuevo chip aparece: "10:00 - 13:00 (3h 0m)"
- [ ] Total de horas se actualiza (9 horas totales)
- [ ] Botón "Guardar Cambios" se habilita

**Acción**: Click "Guardar Cambios"

**Logs Esperados en Terminal**:

```
[StudyHoursManager] Saving changes...
[studyBlocksService] updateUserStudyBlocks(abc-123-def-456)
[DynamoDB] Deleting all existing blocks...
[DynamoDB] Creating 3 new blocks...
✅ Study blocks updated successfully in backend
[localStorage] Syncing to localStorage as backup...
```

**Verificar**:

- [ ] Mensaje de éxito: "Cambios guardados correctamente"
- [ ] Botón "Guardar Cambios" se deshabilita
- [ ] Datos persisten al recargar página

---

### PASO 13: Verificación en DynamoDB (Opcional)

**Acción**: Revisar AWS Console → DynamoDB → Tabla BloqueEstudio

**Verificar**:

- [ ] Existen registros con:
  - `usuarioId`: abc-123-def-456
  - `bloqueEstudioId`: [UUID generado]
  - `hora_inicio`: "09:00", "14:00", "10:00"
  - `hora_fin`: "12:00", "17:00", "13:00"
  - `duracion_minutos`: 180, 180, 180
  - `createdAt`: [timestamp]
  - `updatedAt`: [timestamp]

**LIMITACIÓN CONOCIDA**:

- ❌ NO hay campo `dia_semana` o `day_of_week`
- ⚠️ Por eso los datos NO se pueden reconstruir solo desde backend
- ✅ localStorage se usa como fallback

---

### PASO 14: Cerrar Sesión y Re-login

**Acción**:

1. Click en avatar → "Cerrar Sesión"
2. Volver a /auth/login
3. Login con las mismas credenciales

**Logs Esperados en Terminal**:

```
🔄 Starting study blocks migration for user: abc-123-def-456
[Migration] Attempting Cognito migration...
[Migration] Found existing blocks in DynamoDB, skipping migration
✅ Study blocks migration completed successfully (no-op)
```

**Verificar**:

- [ ] Login exitoso
- [ ] Dashboard carga
- [ ] Ir a /study-hours
- [ ] Datos persisten correctamente (3 bloques: Lunes, Martes, Miércoles)

---

## ✅ Checklist de Validación Final

### Funcionalidad Core

- [ ] Registro guarda datos en Cognito custom attributes
- [ ] Login ejecuta migración automática a DynamoDB
- [ ] "Mis Horas de Estudio" muestra datos correctamente
- [ ] CRUD completo funciona (Crear, Leer, Actualizar, Eliminar bloques)
- [ ] Datos persisten entre sesiones

### Inicialización de Amplify

- [ ] NO aparece error "Amplify has not been configured"
- [ ] Log "✅ Amplify initialized successfully" aparece
- [ ] UserContext espera a que `isInitialized === true`
- [ ] Migración se ejecuta DESPUÉS de login (no antes)

### Logs de Migración

- [ ] 🔄 "Starting study blocks migration" aparece
- [ ] ✅ "Cognito migration successful" o "localStorage migration successful"
- [ ] ✅ "Study blocks migration completed successfully"
- [ ] ❌ NO aparece "Amplify has not been configured"

### Backend Integration

- [ ] studyBlocksService.getUserStudyBlocks() se ejecuta
- [ ] studyBlocksService.updateUserStudyBlocks() guarda en DynamoDB
- [ ] Registros aparecen en tabla BloqueEstudio
- [ ] localStorage se usa como fallback/cache

---

## 🐛 Problemas Conocidos

### 1. Datos no aparecen en "Mis Horas de Estudio"

**Síntoma**: Página vacía o sin bloques  
**Causa**: Backend no devuelve datos (falta `day_of_week`)  
**Solución**: Verificar localStorage tiene los datos como fallback

### 2. Error "Amplify has not been configured"

**Síntoma**: Error en terminal al hacer login  
**Causa**: Race condition no resuelto  
**Solución**: Verificar commit 6a68105 está aplicado correctamente

### 3. Migración no se ejecuta

**Síntoma**: No hay logs de migración al hacer login  
**Causa**: UserContext no llama refreshUser()  
**Solución**: Verificar que login usa authService.signIn() correctamente

### 4. Bloques no aparecen en calendario

**Síntoma**: Calendar.tsx no muestra eventos  
**Causa**: Backend no tiene `day_of_week`, no se puede reconstruir schedule  
**Solución FUTURA**: Agregar campo al schema

---

## 📊 Resultados de la Prueba

**Fecha de Ejecución**: [Completar al terminar test]  
**Ejecutado por**: [Nombre]  
**Resultado General**: [ ] PASS / [ ] FAIL

### Tests Pasados

- [ ] Registro completo
- [ ] Login exitoso
- [ ] Migración automática
- [ ] Visualización en "Mis Horas de Estudio"
- [ ] CRUD de bloques
- [ ] Persistencia de datos
- [ ] NO hay error de Amplify

### Tests Fallidos

- [ ] [Describir si hay alguno]

### Observaciones

```
[Agregar notas, screenshots, o logs relevantes aquí]
```

---

## 🎯 Próximos Pasos

### Mejoras Inmediatas Recomendadas

1. **Agregar campo `dia_semana` a BloqueEstudio**
   - Modificar schema.ts
   - Actualizar convertDayScheduleToStudyBlocks()
   - Actualizar convertStudyBlocksToDaySchedule()
   - Eliminar dependencia de localStorage

2. **Mejorar logs de debugging**
   - Agregar timestamps a logs
   - Diferenciar colores en terminal
   - Crear archivo de logs persistente

3. **Testing automatizado**
   - Crear tests E2E con Playwright/Cypress
   - Tests unitarios para servicios
   - Tests de integración para migración

### Documentación Pendiente

- [ ] Video tutorial del flujo completo
- [ ] Actualizar README con instrucciones de setup
- [ ] Documentar API de backend
- [ ] Diagramas de arquitectura actualizados

---

## 📚 Referencias

- `AMPLIFY_INITIALIZATION_FIX.md` - Explicación del fix de race condition
- `STUDY_HOURS_BACKEND_INTEGRATION.md` - Documentación de backend
- Commit `6a68105` - Fix de Amplify
- Commit `270740a` - Implementación inicial de Study Hours
