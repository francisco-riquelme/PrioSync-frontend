# Guía de Usuario: Importación de Playlists de YouTube con IA

## Introducción

Este documento proporciona instrucciones detalladas para utilizar la funcionalidad de importación de playlists de YouTube de PrioSync, que permite crear cursos completos automáticamente utilizando inteligencia artificial de Google Gemini para generar estructuras educativas organizadas.

## Características Principales

### Generación Automática de Estructura
- Análisis inteligente del contenido de la playlist
- Organización automática en módulos y lecciones
- Generación de objetivos de aprendizaje específicos
- Identificación de temas clave por lección

### Personalización Avanzada
- Edición de título y descripción del curso
- Selección de categoría y nivel de dificultad
- Definición de audiencia objetivo
- Customización completa antes de la creación

### Control Granular
- Límite configurable de lecciones (1-100)
- Vista previa completa antes de confirmar
- Validación de URLs de YouTube
- Manejo robusto de errores

## Requisitos Previos

### Configuración Necesaria
- Acceso a PrioSync con permisos de administrador
- Variables de entorno configuradas correctamente
- Conexión estable a internet
- Playlist de YouTube accesible públicamente

### Variables de Entorno Requeridas

Debe tener configuradas las siguientes variables en `.env.local`:

```bash
# Google Gemini API Configuration (OBLIGATORIO)
GOOGLE_GENERATIVE_AI_API_KEY=su_clave_api_de_google_gemini

# YouTube Data API Configuration (OBLIGATORIO)
YOUTUBE_API_KEY=su_clave_api_de_youtube

# Habilitar modo administrador (OBLIGATORIO)
NEXT_PUBLIC_IS_ADMIN_MODE=true
```

#### Obtención de Claves API

**YouTube Data API Key**:
1. Acceda a [Google Cloud Console](https://console.cloud.google.com/)
2. Cree un proyecto nuevo o seleccione uno existente
3. Habilite "YouTube Data API v3"
4. Cree credenciales tipo "API Key"
5. Configure restricciones de dominio (recomendado)

**Google Gemini API Key**:
1. Visite [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Genere una nueva clave API
3. Mantenga la clave confidencial

## Acceso a la Funcionalidad

1. **Navegación**: Inicie sesión en PrioSync como administrador
2. **Ubicación**: Vaya a `/admin/courses/upload`
3. **Selección**: Haga clic en la pestaña **"Importar de YouTube"**
4. **Interfaz**: Se mostrará el formulario de importación

## Proceso de Importación Paso a Paso

### Paso 1: Configuración de la Importación

#### Introducir URL de Playlist
1. **Campo URL**: Pegue la URL completa de la playlist de YouTube
2. **Formatos soportados**:
   - `https://www.youtube.com/playlist?list=PLxxxxxx`
   - `https://www.youtube.com/watch?v=xxxxxx&list=PLxxxxxx`
   - `https://youtu.be/xxxxxx?list=PLxxxxxx`

#### Configurar Límite de Lecciones
1. **Campo numérico**: Especifique el máximo número de videos a procesar
2. **Rango válido**: Entre 1 y 100 lecciones
3. **Propósito**: Controlar el tamaño del curso generado
4. **Recomendación**: 
   - Cursos básicos: 10-20 lecciones
   - Cursos intermedios: 20-40 lecciones
   - Cursos avanzados: 40-80 lecciones

#### Validación Automática
El sistema validará:
- Formato válido de URL de YouTube
- Existencia de la playlist
- Accesibilidad pública de la playlist
- Límite de lecciones dentro del rango permitido

### Paso 2: Procesamiento de la Playlist

#### Extracción de Metadatos
Al hacer clic en **"Procesar"**, el sistema:

1. **Conexión a YouTube**: Utiliza YouTube Data API v3
2. **Extracción de información**:
   - Título de la playlist
   - Descripción general
   - Información del canal
   - Lista completa de videos

3. **Metadatos por video**:
   - Título del video
   - Descripción
   - Duración (formato legible)
   - Miniatura de alta calidad
   - Fecha de publicación
   - Estadísticas (vistas)

#### Aplicación de Límites
- Si la playlist tiene más videos que el límite especificado
- El sistema tomará los primeros N videos según el límite
- Se mostrará una advertencia visual del filtrado aplicado

#### Indicadores de Progreso
- **Barra de progreso**: Actualización en tiempo real
- **Estado actual**: "Obteniendo información de la playlist..."
- **Porcentaje**: Progreso visual del 0% al 100%

### Paso 3: Vista Previa de la Playlist

#### Información General
Una vez procesada, se mostrará:
- **Miniatura**: Imagen representativa de la playlist
- **Título**: Nombre completo de la playlist
- **Canal**: Nombre del creador de contenido
- **Estadísticas**:
  - Número total de videos
  - Duración total calculada
  - Indicador si se aplicó límite

#### Lista de Videos (Expandible)
- **Vista condensada**: Primeros 10 videos visible por defecto
- **Expansión**: Botón para mostrar lista completa
- **Información por video**:
  - Miniatura
  - Título completo
  - Duración individual
  - Posición en la playlist

#### Botón de Continuación
- **"Procede a generar la estructura del curso"**
- Mensaje de confirmación para continuar al siguiente paso

### Paso 4: Generación de Estructura con IA

#### Inicio de Generación
1. **Activación**: Haga clic en "Generar Estructura con IA"
2. **Proceso**: El sistema enviará los datos a Google Gemini AI
3. **Duración**: Entre 30-90 segundos dependiendo del contenido

#### Proceso de Análisis IA
El sistema de inteligencia artificial realizará:

1. **Análisis de contenido**:
   - Evaluación de títulos y descripciones
   - Identificación de temas y patrones
   - Determinación de progresión lógica

2. **Estructuración educativa**:
   - Agrupación de videos en módulos coherentes
   - Creación de títulos descriptivos para módulos
   - Generación de objetivos de aprendizaje

3. **Enriquecimiento pedagógico**:
   - Identificación de conceptos clave
   - Sugerencias de nivel de dificultad
   - Creación de descripciones educativas

#### Indicadores Durante Generación
- **Mensaje de estado**: "Generando estructura del curso..."
- **Descripción**: "La IA está analizando los X videos..."
- **Barra de progreso**: Animación continua
- **Tiempo estimado**: "Este proceso puede tomar entre 30-60 segundos"

### Paso 5: Vista Previa de Estructura Generada

#### Información General del Curso
La IA generará y mostrará:

**Metadatos principales**:
- **Título del curso**: Basado en el análisis de contenido
- **Descripción completa**: 200-300 palabras explicativas
- **Categoría**: Clasificación automática del tema
- **Nivel**: Beginner, Intermediate, o Advanced
- **Instructor**: Nombre del canal de YouTube
- **Duración estimada**: Tiempo total del curso

**Elementos educativos**:
- **Objetivos del curso**: 3-5 objetivos generales de aprendizaje
- **Etiquetas**: Tags relevantes generados automáticamente
- **Audiencia objetivo**: Descripción del público meta

#### Estructura de Módulos
**Organización automática**:
- **Máximo 6 módulos**: Para mantener estructura manejable
- **Agrupación lógica**: Videos relacionados en el mismo módulo
- **Progresión educativa**: Desde conceptos básicos a avanzados

**Información por módulo**:
- **Título descriptivo**: Basado en el contenido del módulo
- **Descripción**: Resumen de lo que se cubrirá
- **Duración del módulo**: Tiempo total de todas las lecciones
- **Número de lecciones**: Cantidad de videos incluidos

#### Detalles de Lecciones
**Para cada lección**:
- **Título optimizado**: Versión mejorada del título original
- **Descripción educativa**: Contexto y objetivos específicos
- **Duración**: Tiempo del video original
- **Objetivos específicos**: 2-3 objetivos de aprendizaje por lección
- **Temas clave**: Conceptos principales cubiertos
- **Chips visuales**: Elementos interactivos para navegación

### Paso 6: Personalización del Curso

#### Acceso a Personalización
- **Botón "Personalizar"**: En la esquina superior derecha
- **Ícono de edición**: Junto al título del curso
- **Diálogo modal**: Se abre una ventana de edición

#### Campos Editables
**Información básica**:
- **Título del curso**: Edite el nombre generado automáticamente
- **Descripción**: Modifique la descripción de 200-300 palabras
- **Categoría**: Seleccione de una lista o ingrese personalizada

**Configuración académica**:
- **Nivel de dificultad**: 
  - Principiante (verde)
  - Intermedio (amarillo)
  - Avanzado (rojo)
- **Instructor**: Modifique el nombre del instructor
- **Audiencia objetivo**: Especifique el público meta

#### Regeneración Inteligente
- **Aplicar cambios**: Al guardar, la IA regenera la estructura
- **Integración**: Los cambios se incorporan manteniendo la estructura
- **Tiempo**: Regeneración toma 15-30 segundos adicionales

### Paso 7: Confirmación y Creación

#### Revisión Final
Antes de crear el curso, revise:
- Título y descripción del curso
- Organización de módulos y lecciones
- Objetivos de aprendizaje
- Metadatos y configuración

#### Creación del Curso
1. **Botón "Confirmar y Crear Curso"**: En la parte inferior
2. **Procesamiento**: El sistema crea la estructura en la base de datos
3. **Confirmación**: Mensaje de éxito con estadísticas del curso creado

#### Resultado Final
**Mensaje de éxito incluye**:
- Nombre del curso creado
- Número total de módulos
- Número total de lecciones
- Tiempo total del curso
- Enlace para acceder al curso creado

## Gestión de Errores

### Errores de Configuración

#### Error: "YouTube API key no configurada"
**Causa**: Variable `YOUTUBE_API_KEY` faltante o incorrecta
**Solución**:
1. Verifique que la variable esté en `.env.local`
2. Confirme que la clave es válida en Google Cloud Console
3. Reinicie el servidor de desarrollo

#### Error: "URL de playlist inválida"
**Causa**: Formato de URL incorrecto o playlist inexistente
**Solución**:
1. Verifique que la URL es de una playlist (contiene `list=`)
2. Confirme que la playlist es pública
3. Pruebe acceder a la URL en un navegador

#### Error: "Playlist no encontrada"
**Causa**: La playlist puede ser privada o haber sido eliminada
**Solución**:
1. Verifique que la playlist existe y es pública
2. Contacte al propietario para verificar permisos
3. Pruebe con otra playlist pública

### Errores de Procesamiento

#### Error: "Tiempo de procesamiento agotado"
**Causa**: La playlist es muy grande o hay problemas de conectividad
**Solución**:
1. Reduzca el límite de lecciones
2. Verifique su conexión a internet
3. Reintente el proceso

#### Error: "Servicio de IA no disponible"
**Causa**: Problemas con Google Gemini API
**Solución**:
1. Verifique que la clave de Gemini es válida
2. Confirme que tiene cuota disponible en la API
3. Espere unos minutos y reintente

#### Error: "Error al generar estructura"
**Causa**: Contenido de la playlist no es adecuado para análisis
**Solución**:
1. Utilice el botón "Reintentar" 
2. Verifique que los videos tienen títulos descriptivos
3. Pruebe con una playlist de contenido educativo

### Errores de Validación

#### Error: "Número de lecciones inválido"
**Causa**: Límite fuera del rango 1-100
**Solución**:
1. Ingrese un valor entre 1 y 100
2. Para playlists grandes, use un límite razonable (20-50)

#### Error: "Playlist sin videos"
**Causa**: La playlist está vacía o los videos son privados
**Solución**:
1. Verifique que la playlist contiene videos públicos
2. Pruebe con otra playlist que tenga contenido visible

## Mejores Prácticas

### Selección de Playlists
**Características ideales**:
- **Contenido educativo**: Videos con propósito de enseñanza
- **Títulos descriptivos**: Nombres claros que indican el tema
- **Progresión lógica**: Videos organizados de básico a avanzado
- **Duración apropiada**: Videos de 5-30 minutos por lección
- **Calidad consistente**: Mismo instructor o estilo de enseñanza

### Configuración Óptima
**Límite de lecciones**:
- **Cursos introductorios**: 10-15 lecciones
- **Cursos completos**: 20-40 lecciones  
- **Especializaciones**: 40-60 lecciones
- **Evitar**: Más de 80 lecciones por curso

### Personalización Efectiva
**Títulos de curso**:
- Use nombres específicos y descriptivos
- Incluya el nivel de dificultad
- Mencione la tecnología o tema principal
- Ejemplo: "React.js Avanzado - Desarrollo de SPAs"

**Descripciones**:
- Explique claramente los objetivos
- Mencione prerrequisitos
- Describa lo que el estudiante aprenderá
- Incluya información sobre proyectos prácticos

**Categorización**:
- Use categorías consistentes
- Ejemplos: "Programación", "Diseño", "Marketing", "Idiomas"
- Facilita la organización y búsqueda

### Optimización de Resultados
**Para mejor análisis de IA**:
- Seleccione playlists con descripciones detalladas
- Prefiera contenido en español para mejor comprensión
- Use playlists de canales educativos reconocidos
- Evite playlists con contenido muy heterogéneo

## Casos de Uso Recomendados

### 1. Cursos de Programación
- **Playlists ideales**: Tutoriales de tecnologías específicas
- **Límite sugerido**: 25-40 lecciones
- **Personalización**: Enfoque en proyectos prácticos

### 2. Cursos de Idiomas
- **Playlists ideales**: Lecciones progresivas por nivel
- **Límite sugerido**: 30-50 lecciones
- **Personalización**: Especificar nivel de entrada

### 3. Cursos de Ciencias
- **Playlists ideales**: Conferencias o clases magistrales
- **Límite sugerido**: 15-30 lecciones
- **Personalización**: Incluir prerrequisitos matemáticos

### 4. Cursos de Arte y Diseño
- **Playlists ideales**: Tutoriales prácticos paso a paso
- **Límite sugerido**: 20-35 lecciones
- **Personalización**: Mencionar software requerido

### 5. Cursos de Negocios
- **Playlists ideales**: Casos de estudio y estrategias
- **Límite sugerido**: 15-25 lecciones
- **Personalización**: Definir audiencia (emprendedores, ejecutivos, etc.)

## Solución de Problemas Avanzados

### Optimización de Rendimiento
**Para playlists grandes**:
1. Use límites conservadores (30-40 lecciones)
2. Procese en horarios de menor tráfico
3. Verifique la estabilidad de su conexión

**Para contenido complejo**:
1. Permita tiempo adicional para el análisis de IA
2. Use títulos y descripciones detalladas en los videos originales
3. Considere dividir playlists muy largas en múltiples cursos

### Troubleshooting de APIs
**Google Gemini API**:
- Verifique cuotas y límites de uso
- Confirme que el modelo está disponible en su región
- Revise logs de la consola del navegador

**YouTube Data API**:
- Confirme que el servicio está habilitado
- Verifique restricciones de dominio
- Revise cuotas diarias de la API

### Backup y Recuperación
**Antes de procesar**:
1. Guarde la URL de la playlist original
2. Documente las configuraciones personalizadas
3. Considere crear múltiples versiones con diferentes límites

**En caso de errores**:
1. Use el botón "Intentar de nuevo" en la interfaz
2. Refresque la página y reinicie el proceso
3. Contacte al administrador si persisten los problemas

---

**Versión del documento**: 1.0  
**Fecha de creación**: 2 de octubre de 2025  
**Responsable**: Equipo de Desarrollo PrioSync  
**Documento relacionado**: [README_TRANSCRIPCION.md](./README_TRANSCRIPCION.md)