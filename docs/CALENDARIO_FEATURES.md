# 🎯 Sistema de Calendario con Sugerencias Inteligentes

## ✅ ¿Cómo verificar que los datos se guardan en la BD?

### 🚀 **Método Rápido (30 segundos)**

1. Ve a: **http://localhost:3000/calendar**
2. Presiona **F12** para abrir la consola
3. Crea una sesión en el calendario
4. Busca este mensaje en la consola:
   ```
   ✅ Sesión guardada exitosamente en BD: {datos}
   ```

### 📊 **Método Visual (Página de Debug)**

1. Ve a: **http://localhost:3000/debug-sessions**
2. Verás una tabla con **todas las sesiones guardadas en BD**
3. Click en "Refrescar" para actualizar desde la BD
4. **Recarga la página (F5)** → Si las sesiones siguen ahí = **BD funciona** ✅

---

## 🎨 Funcionalidades Implementadas

### 1️⃣ **Sistema de Sugerencias Inteligentes**

**Archivos creados:**

- `src/utils/scheduleHelpers.ts` - Utilidades para horarios
- `src/hooks/useUserPreferences.ts` - Hook para preferencias de usuario

**Características:**

- ✅ Lee horarios disponibles del modal de registro (localStorage)
- ✅ Muestra chips clicables con horarios sugeridos
- ✅ Indica visualmente cuando el horario elegido es preferido
- ✅ Colorea días en el calendario (verde = horario preferido)
- ✅ Leyenda explicativa de colores

**Ejemplo en UI:**

```
┌─────────────────────────────────┐
│ 💡 Horarios sugeridos:          │
│ [09:00-12:00] [15:00-18:00]    │ ← Click para aplicar
│                                 │
│ Hora inicio: [09:00]            │
│ Hora fin:    [12:00]            │
│                                 │
│ ✅ Este horario coincide con    │
│    tus preferencias de estudio  │
└─────────────────────────────────┘
```

### 2️⃣ **Sistema de Logs Detallados**

**Archivo modificado:**

- `src/components/calendar/Calendar.tsx`

**Logs disponibles:**

```javascript
// Al crear sesión:
📝 Guardando nueva sesión en BD: {datos}
✅ Sesión guardada exitosamente en BD: {resultado}

// Al actualizar sesión:
📝 Actualizando sesión en BD: {datos}
✅ Sesión actualizada exitosamente en BD: {resultado}

// En caso de error:
❌ Error: La sesión no se guardó correctamente
```

### 3️⃣ **Página de Debug/Verificación**

**Archivo creado:**

- `src/app/debug-sessions/page.tsx`

**Características:**

- 📊 Tabla completa con todas las sesiones de BD
- 🔄 Botón "Refrescar" para actualizar datos
- 📈 Estadísticas: Total, Programadas, Completadas, Canceladas
- 🎨 Chips de colores por estado
- 📅 Iconos por tipo de sesión (📚 estudio, 🔄 repaso, 📝 examen)
- 💡 Instrucciones de verificación paso a paso

**Columnas mostradas:**
| ID Sesión | Fecha | Hora Inicio | Hora Fin | Duración | Tipo | Estado | Usuario ID | Creado |
|-----------|-------|-------------|----------|----------|------|--------|------------|--------|

---

## 📂 Estructura de Archivos

```
src/
├── app/
│   └── debug-sessions/
│       └── page.tsx                  # ← Página de verificación BD
├── components/
│   └── calendar/
│       ├── Calendar.tsx              # ← Logs de guardado agregados
│       └── StudySessionForm.tsx      # ← Sugerencias inteligentes
├── hooks/
│   └── useUserPreferences.ts         # ← Hook de preferencias (NUEVO)
└── utils/
    └── scheduleHelpers.ts            # ← Utilidades de horarios (NUEVO)

VERIFICACION_BD.md                    # ← Guía completa de verificación
```

---

## 🔧 Flujo de Datos

```
┌─────────────────┐
│ Usuario registra│
│ horarios en     │
│ welcome modal   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ localStorage    │
│ (temporal)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│useUserPreferences│ ← Lee preferencias
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Calendar.tsx    │ ← Colorea días
│ StudySessionForm│ ← Muestra sugerencias
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Usuario crea    │
│ sesión de       │
│ estudio         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ createSession() │ ← Guarda en BD
│ [logs en console]│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ AWS Amplify BD  │ ✅ Persistencia
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ /debug-sessions │ ← Verificación visual
└─────────────────┘
```

---

## 🧪 Pruebas de Verificación

### ✅ Checklist Básico

```bash
# 1. Inicia el servidor
npm run dev

# 2. Abre el navegador
# http://localhost:3000/calendar

# 3. Abre la consola (F12)

# 4. Crea una sesión
# - Click en un día
# - Completa formulario
# - Click "Crear"

# 5. Verifica el log
# Busca: ✅ Sesión guardada exitosamente

# 6. Ve a debug
# http://localhost:3000/debug-sessions

# 7. Recarga la página (F5)
# Si la sesión persiste = BD funciona ✅
```

---

## 📊 Ejemplo de Datos Guardados

```typescript
{
  sesionEstudioId: "a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8",
  usuarioId: "user_francisco_riquelme",
  fecha: "2025-10-15",
  hora_inicio: "09:00",
  hora_fin: "12:00",
  duracion_minutos: 180,
  tipo: "estudio",
  estado: "programada",
  cursoId: null,
  google_event_id: null,
  recordatorios: null,
  createdAt: "2025-10-13T14:30:00.000Z",
  updatedAt: "2025-10-13T14:30:00.000Z"
}
```

---

## 🎯 URLs Importantes

| Página         | URL               | Descripción                         |
| -------------- | ----------------- | ----------------------------------- |
| **Calendario** | `/calendar`       | Crear/editar sesiones de estudio    |
| **Debug BD**   | `/debug-sessions` | Verificar datos en BD               |
| **Dashboard**  | `/dashboard`      | Vista general del estudiante        |
| **Landing**    | `/`               | Registro inicial (captura horarios) |

---

## 🐛 Troubleshooting

### Problema: No veo las sugerencias de horarios

**Causa**: No has completado el modal de registro

**Solución**:

1. Ve a `/` (landing page)
2. Completa los 3 pasos del modal de bienvenida
3. En el paso 3, selecciona tus horarios disponibles
4. Vuelve al calendario

### Problema: No aparecen logs en la consola

**Solución**:

- Abre la consola ANTES de crear la sesión
- Verifica que no haya filtros activos
- Busca por "📝" o "✅" para encontrar los logs

### Problema: La sesión no persiste al recargar

**Causa**: No se está guardando en BD, solo en memoria

**Solución**:

1. Verifica conexión con AWS Amplify
2. Revisa logs del backend
3. Verifica schema con `amplify status`

---

## 📚 Documentación Adicional

- **[VERIFICACION_BD.md](./VERIFICACION_BD.md)** - Guía completa de verificación
- **README.md** - Documentación general del proyecto

---

## 🚀 Próximos Pasos

1. [ ] Integrar preferencias con backend (campo `horarios_disponibles` en Usuario)
2. [ ] Sincronización con Google Calendar
3. [ ] Notificaciones push para recordatorios
4. [ ] Dashboard de estadísticas de adherencia
5. [ ] Exportar sesiones a CSV/PDF

---

**Última actualización**: 13 de octubre de 2025  
**Estado**: ✅ Funcional - Listo para pruebas
