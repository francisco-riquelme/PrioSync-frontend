# 🔧 Corrección de Inicialización de Amplify

## 📋 Problema Identificado

### Síntomas

- Usuarios registrados no veían sus horas de estudio en el calendario ni en "Mis Horas de Estudio"
- Error en terminal: **"Amplify has not been configured. Please call Amplify.configure() before using this service."**
- Migración automática de datos fallaba silenciosamente

### Causa Raíz

**Race condition entre la inicialización de Amplify y la ejecución de UserContext**

#### Flujo del Problema (ANTES)

```
1. App inicia → layout.tsx renderiza
2. AmplifyProvider monta → inicia useEffect
3. UserProvider monta → inicia useEffect
4. UserContext.useEffect ejecuta → intenta fetchAuthSession()
5. AmplifyProvider.useEffect completa → Amplify.configure() se ejecuta
   ❌ PERO UserContext ya intentó usar Amplify (falló)
```

**El problema**: `UserContext` está **dentro** de `AmplifyProvider` pero puede ejecutar código **ANTES** de que Amplify esté configurado, porque ambos `useEffect` se ejecutan en paralelo.

## ✅ Solución Implementada

### 1. Context de Inicialización en AmplifyProvider

**Archivo**: `src/components/providers/AmplifyProvider.tsx`

**Cambios**:

```typescript
// ANTES: AmplifyProvider solo bloqueaba el render mientras inicializaba
export default function AmplifyProvider({ children }: AmplifyProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  // ... initialization logic ...

  if (!isInitialized && !error) {
    return <LoadingScreen />;
  }

  return <>{children}</>;  // ❌ Children sin context
}

// DESPUÉS: Exporta estado de inicialización via Context
interface AmplifyContextType {
  isInitialized: boolean;
}

const AmplifyContext = createContext<AmplifyContextType>({ isInitialized: false });

export const useAmplify = () => useContext(AmplifyContext);

export default function AmplifyProvider({ children }: AmplifyProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  // ... initialization logic ...

  return (
    <AmplifyContext.Provider value={{ isInitialized }}>
      {children}  // ✅ Children tienen acceso a isInitialized
    </AmplifyContext.Provider>
  );
}
```

**Beneficios**:

- Componentes hijos pueden verificar `isInitialized` antes de usar Amplify
- Previene operaciones antes de que Amplify esté listo
- No bloquea el render completo, solo operaciones específicas

### 2. UserContext Espera Inicialización

**Archivo**: `src/contexts/UserContext.tsx`

**Cambios**:

```typescript
// ANTES: useEffect se ejecutaba inmediatamente
export const UserProvider = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    const checkAuthAndLoadUser = async () => {
      const session = await fetchAuthSession(); // ❌ Puede fallar si Amplify no está listo
      // ...
    };
    checkAuthAndLoadUser();
  }, []);
};

// DESPUÉS: useEffect espera a que Amplify esté inicializado
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { isInitialized } = useAmplify(); // ✅ Hook del context

  useEffect(() => {
    if (!isInitialized) {
      console.log("⏳ Waiting for Amplify to initialize...");
      return; // ✅ Sale temprano si Amplify no está listo
    }

    const checkAuthAndLoadUser = async () => {
      const session = await fetchAuthSession(); // ✅ Seguro, Amplify ya está configurado
      // ...
    };
    checkAuthAndLoadUser();
  }, [isInitialized]); // ✅ Re-ejecuta cuando Amplify se inicializa
};
```

**Flujo Corregido**:

```
1. App inicia → layout.tsx renderiza
2. AmplifyProvider monta → inicia useEffect
3. UserProvider monta → inicia useEffect
4. UserContext.useEffect verifica isInitialized → false → RETURN
5. AmplifyProvider.useEffect completa → Amplify.configure() → setIsInitialized(true)
6. UserContext.useEffect RE-EJECUTA (dependency: isInitialized)
7. isInitialized === true → ejecuta checkAuthAndLoadUser()
   ✅ Amplify está listo, todo funciona
```

### 3. Validación en refreshUser()

**Archivo**: `src/contexts/UserContext.tsx`

**Cambios**:

```typescript
const refreshUser = async (): Promise<void> => {
  // ✅ Verifica antes de ejecutar
  if (!isInitialized) {
    console.error("Cannot refresh user: Amplify not initialized");
    setError("Sistema no inicializado. Por favor recarga la página.");
    return;
  }

  // ... resto del código ...
};
```

**Beneficios**:

- Protección adicional para llamadas manuales a `refreshUser()`
- Mejor experiencia de usuario con mensaje específico
- Evita errores crípticos de Amplify

### 4. Logs Mejorados para Debugging

Agregados logs con emojis para rastrear el flujo:

```typescript
// En UserContext.tsx - refreshUser()
console.log("🔄 Starting study blocks migration for user:", usuarioId);
// ...
console.log("✅ Cognito migration successful");
// ...
console.warn("⚠️ Cognito migration failed, trying localStorage:", result.error);
// ...
console.log("✅ Study blocks migration completed successfully");
// ...
console.error("❌ Error during study blocks migration:", err);
```

## 🔍 Verificación de la Solución

### Checklist para Validar el Fix

- [ ] Terminal NO muestra "Amplify has not been configured"
- [ ] Usuario puede registrarse con horarios de estudio
- [ ] Después de login, migración automática se ejecuta (ver logs con 🔄)
- [ ] "Mis Horas de Estudio" muestra los bloques registrados
- [ ] Calendario refleja las horas de estudio en la vista semanal
- [ ] No hay race conditions en la consola del navegador

### Logs Esperados en Terminal (Flujo Exitoso)

```
✅ Amplify initialized successfully
⏳ Waiting for Amplify to initialize...
[user logs in]
🔄 Starting study blocks migration for user: abc-123-def-456
✅ Cognito migration successful
✅ Study blocks migration completed successfully
```

## 📊 Impacto

### Archivos Modificados

1. **src/components/providers/AmplifyProvider.tsx**
   - Agregado `AmplifyContext` y hook `useAmplify`
   - Exporta estado de inicialización

2. **src/contexts/UserContext.tsx**
   - Importa `useAmplify` hook
   - Verifica `isInitialized` antes de operaciones Amplify
   - Dependency `[isInitialized]` en useEffect
   - Validación en `refreshUser()`
   - Logs mejorados

### Otros Servicios Afectados

**NO requieren cambios** porque solo se usan DESPUÉS del login:

- `src/utils/services/studyBlocks.ts` - Solo se llama desde componentes autenticados
- `src/utils/services/migrateStudyBlocks.ts` - Solo se llama desde `refreshUser()` (post-login)
- `src/hooks/useUserPreferences.ts` - Solo se usa en páginas protegidas

## 🎯 Próximos Pasos

### Para Testing

1. **Limpiar estado anterior**:

   ```bash
   # Limpiar localStorage en DevTools
   # Eliminar cookies de sesión
   # Crear nuevo usuario desde cero
   ```

2. **Flujo de prueba completo**:

   ```
   1. Abrir landing page
   2. Click "Comenzar Ahora" → WelcomeModal
   3. Seleccionar días y horarios
   4. Siguiente → RegistrationModal
   5. Completar registro
   6. Verificar email
   7. Login
   8. Ir a "Mis Horas de Estudio"
   9. Verificar que aparecen los bloques
   10. Ir a Calendario
   11. Verificar que se reflejan en la vista semanal
   ```

3. **Verificar logs en terminal**:
   - ✅ "Amplify initialized successfully"
   - 🔄 "Starting study blocks migration"
   - ✅ "migration completed successfully"
   - ❌ NO debe aparecer "Amplify has not been configured"

### Para Mejorar en el Futuro

1. **Agregar campo `day_of_week` en BloqueEstudio**
   - Actualizar `schema.ts`
   - Modificar `convertDayScheduleToStudyBlocks()` para incluir día
   - Actualizar `convertStudyBlocksToDaySchedule()` para agrupar por día
   - Permitir eliminar fallback de localStorage

2. **Implementar retry logic**
   - Si migración falla, reintentar automáticamente
   - Mostrar progreso al usuario
   - Guardar estado de migración en DynamoDB

3. **Monitoring de inicialización**
   - Métricas de tiempo de inicialización de Amplify
   - Alertas si tarda más de X segundos
   - Analytics de tasas de éxito de migración

## 📚 Contexto Técnico

### Por qué esto es importante

**React useEffect Timing**: Todos los `useEffect` en componentes montados simultáneamente se ejecutan **en paralelo** después del primer render. No hay garantía de orden de ejecución entre componentes padre e hijo cuando ambos usan `useEffect`.

**Solución**: Usar **React Context + Dependencies** para coordinar operaciones asíncronas entre providers y consumidores.

### Alternativas consideradas

1. ❌ **Inicializar Amplify fuera de React** (en `_app.tsx` o script externo)
   - Problema: Pierde reactividad de React
   - Problema: Difícil manejar errores de inicialización

2. ❌ **Usar singleton con Promise global**
   - Problema: Anti-pattern en React
   - Problema: Difícil testing

3. ✅ **Context + useEffect dependencies** (elegida)
   - Ventaja: Idiomatic React
   - Ventaja: Testeable
   - Ventaja: Componentes reutilizables

## 🐛 Debugging Tips

Si el problema persiste:

1. **Verificar orden de providers en layout.tsx**:

   ```tsx
   <AmplifyProvider>
     {" "}
     {/* ✅ Debe estar afuera */}
     <UserProvider>
       {" "}
       {/* ✅ Debe estar adentro */}
       {children}
     </UserProvider>
   </AmplifyProvider>
   ```

2. **Agregar logs temporales**:

   ```typescript
   // En AmplifyProvider
   console.log("[AmplifyProvider] Initializing...", { timestamp: Date.now() });

   // En UserContext
   console.log("[UserContext] useEffect triggered", {
     isInitialized,
     timestamp: Date.now(),
   });
   ```

3. **Verificar que generateClient() no se llama en import**:

   ```typescript
   // ❌ MAL: Se ejecuta al importar
   const client = generateClient<MainTypes>();
   export const myService = {
     /* usa client */
   };

   // ✅ BIEN: Se ejecuta al llamar función
   export const myService = {
     getData: async () => {
       const client = generateClient<MainTypes>();
       return client.models.MyModel.list();
     },
   };
   ```

## ✅ Conclusión

Esta corrección resuelve el race condition entre la inicialización de Amplify y la ejecución de código que depende de ella. La migración de datos de estudio ahora funcionará correctamente porque:

1. ✅ Amplify se configura ANTES de que UserContext intente usarlo
2. ✅ migrationService se ejecuta SOLO después del login (cuando Amplify está listo)
3. ✅ Hay validación explícita de `isInitialized` antes de operaciones críticas
4. ✅ Logs claros para debugging futuro

**Resultado esperado**: Usuario registra horarios → datos se guardan en Cognito → login → migración automática a DynamoDB → datos aparecen en "Mis Horas de Estudio" y Calendario.
