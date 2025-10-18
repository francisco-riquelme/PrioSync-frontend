# PrioSync-frontend

PrioSync es una aplicación web de gestión del aprendizaje que permite organizar sesiones de estudio y, especialmente, generar cursos a partir de contenidos educativos de YouTube. La generación de cursos está potenciada por modelos LLM para extraer, estructurar y enriquecer transcripciones y videos en lecciones, cuestionarios y recursos de reforzamiento. Incluye sincronización con calendario, transcripción de sesiones y autenticación mediante AWS Amplify (Cognito).

Características principales

- Generación de cursos desde YouTube potenciada por LLM: extrae vídeos y transcripciones, genera lecciones y materiales de refuerzo.
- Gestión de sesiones de estudio: creación y programación de bloques de estudio, seguimiento de progreso.
- Transcripción y enriquecimiento: guardado y procesamiento de transcripciones para generar contenidos de curso.
- Cuestionarios y evaluación: generación de tests y actividades de reforzamiento basadas en el contenido.
- Calendario integrado de la app y recordatorios: gestionar sesiones desde el calendario interno de la aplicación, programar y recibir notificaciones.
- Autenticación y perfiles: integración con AWS Cognito y paneles de usuario.

Resumen rápido

- Stack: Next.js (App Router), TypeScript, Tailwind CSS y Material UI (MUI), AWS Amplify.
- Carpeta principal de la app: `src/app/` (rutas y API routes).

Requisitos

- Node 18+ (recomendado).
- npm, pnpm o yarn.
- Credenciales AWS si vas a usar Amplify localmente.
- Variables de entorno para APIs/LLM y Amplify (configurar antes de producción).

Cómo ejecutar

Desarrollo (hot-reload):
```powershell
npm run dev
```

Build de producción:
```powershell
npm run build
```

Iniciar servidor de producción local (después de build):
```powershell
npm run start
```

Lint:
```powershell
npm run lint
```

Tests (si existen):
```powershell
npm test
```

Entornos y notas operativas

- Desarrollo: usa `npm run dev`. Asegúrate de tener las variables de entorno locales (Amplify/LLM/YouTube API) configuradas.
- Producción: configurar variables de entorno en el host (Vercel / AWS). Verifica la configuración de Amplify/Cognito y permisos de los servicios de IA.
- Styling: el proyecto usa Tailwind CSS para utilidades/maquetación y Material UI (MUI) para componentes complejos; evita mezclar estilos dentro de un mismo componente para mantener coherencia.

Dónde mirar

- Componentes: `src/components/`
- Contextos y hooks: `src/contexts/`, `src/hooks/`
- Páginas y rutas API: `src/app/` (p. ej. `dashboard`, `courses`, `calendar`, `study-hours`, `src/app/api/`)

Despliegue

- Recomendado: Vercel (configuración estándar Next.js). Si usas Amplify, asegura variables de entorno y configuración de Cognito/API.

Documentación adicional

- Repo: documentación adicional en `docs/`.
