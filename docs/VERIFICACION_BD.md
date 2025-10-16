# 📋 Guía de Verificación de Base de Datos

## ✅ Cómo verificar que las sesiones se guardan correctamente en la BD

Hemos implementado **3 métodos** para verificar que los datos se están guardando correctamente en la base de datos:

---

## **Método 1: Logs en la Consola del Navegador** 🔍

### Paso a paso:

1. **Abre el navegador** y ve a: http://localhost:3000/calendar

2. **Abre la Consola de Desarrollador**:
   - **Chrome/Edge**: Presiona `F12` o `Ctrl + Shift + I`
   - **Firefox**: Presiona `F12` o `Ctrl + Shift + K`
   - **Safari**: `Cmd + Option + C`

3. **Ve a la pestaña "Console"**

4. **Crea una nueva sesión de estudio**:
   - Haz clic en cualquier día del calendario
   - Completa el formulario con fecha y hora
   - Haz clic en "Crear"

5. **Busca estos mensajes en la consola**:

   ```
   📝 Guardando nueva sesión en BD: {datos de la sesión}
   ✅ Sesión guardada exitosamente en BD: {resultado}
   ```

6. **Si ves errores**, aparecerán así:
   ```
   ❌ Error: La sesión no se guardó correctamente
   ```

### ¿Qué significa cada log?

- **📝 Guardando...**: Confirma que la aplicación está intentando guardar
- **✅ Sesión guardada exitosamente**: Los datos llegaron a la BD
- **❌ Error**: Hubo un problema (revisar el mensaje de error)

---

## **Método 2: Página de Debug/Verificación** 📊

### Paso a paso:

1. **Ve a la página de debug**: http://localhost:3000/debug-sessions

2. **Verás una tabla con todas las sesiones guardadas** que incluye:
   - ID de la sesión
   - Fecha y hora
   - Duración
   - Tipo (estudio/repaso/examen)
   - Estado (programada/completada/cancelada)
   - Usuario ID
   - Fecha de creación

3. **Estadísticas en tiempo real**:
   - Total de sesiones
   - Sesiones programadas
   - Sesiones completadas
   - Sesiones canceladas

4. **Botón "Refrescar"**: Actualiza los datos desde la BD sin recargar la página

### Prueba de persistencia:

1. Crea una sesión en el calendario
2. Ve a `/debug-sessions`
3. **Recarga la página completa** (Ctrl+R o F5)
4. Si la sesión sigue apareciendo → **Datos guardados correctamente en BD** ✅

---

## **Método 3: Network Tab (Avanzado)** 🌐

### Paso a paso:

1. **Abre las DevTools** (F12)

2. **Ve a la pestaña "Network"** (Red)

3. **Filtra por "Fetch/XHR"**

4. **Crea una sesión en el calendario**

5. **Busca estas peticiones**:
   - `POST` a endpoint de creación (puede ser GraphQL o REST)
   - Estado: `200 OK` (éxito)
   - Response: Verás el objeto JSON de la sesión guardada

6. **Inspecciona la respuesta**:
   - Haz clic en la petición
   - Ve a "Response" o "Preview"
   - Deberías ver los datos de la sesión con su ID generado

---

## **🎯 Checklist de Verificación Completa**

Marca cada punto cuando lo hayas verificado:

- [ ] **Los logs aparecen en la consola** al crear una sesión
- [ ] **El log muestra "✅ Sesión guardada exitosamente"**
- [ ] **La sesión aparece en `/debug-sessions`**
- [ ] **Al refrescar `/debug-sessions`, la sesión sigue ahí**
- [ ] **Al recargar el navegador (F5), la sesión persiste**
- [ ] **La sesión aparece en el calendario después de recargar**
- [ ] **Puedo editar la sesión y los cambios se guardan**
- [ ] **Puedo eliminar la sesión y desaparece de la BD**

---

## **🐛 Troubleshooting (Solución de Problemas)**

### Problema: No veo logs en la consola

**Solución**:

- Asegúrate de tener la consola abierta ANTES de crear la sesión
- Verifica que no haya filtros activos (botón "Filter" debe estar vacío)
- En la consola, asegúrate de que "All levels" esté seleccionado

### Problema: La sesión no aparece en `/debug-sessions`

**Posibles causas**:

1. **Error de autenticación**: Verifica que `userData?.usuarioId` no sea null
2. **Error de red**: Revisa la pestaña Network por errores HTTP
3. **Error del backend**: Revisa los logs del servidor backend

**Solución**:

```bash
# Verifica la consola del navegador
console.log('Usuario ID:', userData?.usuarioId);

# Si es null, hay problema con la autenticación
```

### Problema: Las sesiones desaparecen al recargar

**Causa**: Los datos NO se están guardando en BD, solo en memoria

**Solución**:

1. Verifica la conexión con AWS Amplify
2. Revisa que el schema esté desplegado (`amplify push`)
3. Verifica las credenciales de AWS

---

## **🔧 Archivos Modificados**

Los siguientes archivos contienen los logs y la página de debug:

### Logs de guardado:

- `src/components/calendar/Calendar.tsx` (líneas ~460-490)

### Página de debug:

- `src/app/debug-sessions/page.tsx`

### Hook actualizado:

- `src/components/courses/hooks/useStudySessions.ts`

---

## **📱 URLs Útiles**

- **Calendario**: http://localhost:3000/calendar
- **Debug de Sesiones**: http://localhost:3000/debug-sessions
- **Dashboard**: http://localhost:3000/dashboard
- **Landing Page**: http://localhost:3000/

---

## **💡 Ejemplo de Flujo Completo**

1. **Abre**: http://localhost:3000/calendar
2. **Abre la consola**: F12 → Console
3. **Crea una sesión**: Selecciona un día → Completa formulario → Crear
4. **Verifica el log**: Busca "✅ Sesión guardada exitosamente"
5. **Ve a debug**: http://localhost:3000/debug-sessions
6. **Confirma que aparece** en la tabla
7. **Recarga la página**: Ctrl+R
8. **Confirma que persiste**: La sesión sigue en la tabla

---

## **✨ Funcionalidades Implementadas**

### Sistema de Sugerencias Inteligentes:

- ✅ **Hook de preferencias**: `useUserPreferences` lee horarios del localStorage
- ✅ **Utilidades de horarios**: `scheduleHelpers.ts` con funciones de validación
- ✅ **Chips de sugerencias**: Muestra horarios preferidos en el formulario
- ✅ **Indicador visual**: Alert verde cuando el horario coincide con preferencias
- ✅ **Leyenda en calendario**: Muestra código de colores para días preferidos
- ✅ **Coloración de días**: Días con horarios preferidos tienen fondo verde claro

### Sistema de Logs:

- ✅ **Log al crear**: Muestra datos enviados a BD
- ✅ **Log al actualizar**: Muestra datos de actualización
- ✅ **Log de éxito/error**: Confirma si la operación fue exitosa
- ✅ **Página de debug**: Tabla completa con todas las sesiones
- ✅ **Estadísticas**: Contadores por estado (programada/completada/cancelada)

---

## **🚀 Próximos Pasos**

Una vez verificado que todo funciona:

1. **Integrar con backend real** (cuando esté el schema de Usuario con `horarios_disponibles`)
2. **Agregar sincronización con Google Calendar** (opcional)
3. **Implementar notificaciones push** para recordatorios
4. **Dashboard de estadísticas** de adherencia a horarios preferidos
5. **Exportar datos** a CSV/PDF

---

## **📞 Soporte**

Si encuentras algún problema:

1. Revisa los logs en la consola
2. Ve a `/debug-sessions` para ver el estado de la BD
3. Verifica la pestaña Network por errores HTTP
4. Revisa que Amplify esté configurado correctamente

---

**Última actualización**: 13 de octubre de 2025
**Versión**: 1.0.0
