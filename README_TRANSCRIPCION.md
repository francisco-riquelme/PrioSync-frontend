# Guía de Usuario: Sistema de Transcripción de Videos

## Introducción

Este documento proporciona instrucciones detalladas para utilizar el sistema de transcripción de videos de PrioSync, que utiliza inteligencia artificial de Google Gemini para generar transcripciones automáticas y contenido educativo enriquecido.

## Requisitos Previos

- Acceso a la plataforma PrioSync con permisos de administrador
- Archivos de video en formato compatible (MP4, AVI, MOV, WEBM)
- Conexión estable a internet
- Navegador web moderno

## Acceso al Sistema

1. **Navegación**: Inicie sesión en PrioSync y diríjase a la sección de administración
2. **Menú**: Seleccione "Cursos" > "Subir Contenido"
3. **Ubicación**: La interfaz de carga se encuentra en `/admin/courses/upload`

## Proceso de Carga de Video

### Paso 1: Selección del Archivo

1. Haga clic en el área de "Arrastrar archivo aquí" o en el botón "Seleccionar archivo"
2. Seleccione el archivo de video desde su dispositivo
3. **Formatos soportados**: MP4, AVI, MOV, QuickTime, WMV, MKV
4. **Tamaño máximo**: 100MB por archivo
5. **Duración máxima**: 2 horas (7200 segundos)

### Paso 2: Completar Metadatos del Curso

Complete los siguientes campos obligatorios:

#### Información Básica
- **Título**: Nombre descriptivo de la lección o tema del video
  - Ejemplo: "Introducción al Cálculo Diferencial"
- **Descripción**: Resumen del contenido del video
  - Ejemplo: "Conceptos fundamentales de derivadas y límites"

#### Organización del Curso
- **ID del Curso**: Identificador único del curso
  - Formato recomendado: `materia-nivel-año`
  - Ejemplo: `calculo-avanzado-2025`
- **Nombre del Curso**: Denominación completa del curso
  - Ejemplo: "Cálculo Avanzado - Primer Semestre"

#### Metadatos Adicionales (Opcionales)
- **Instructor**: Nombre del profesor o facilitador
- **Duración**: Se detecta automáticamente del archivo
- **Categoría**: Clasificación temática del contenido

### Paso 3: Validación Automática

El sistema realizará las siguientes validaciones:

- **Formato de archivo**: Verificación de tipo MIME (MP4, AVI, MOV, QuickTime, WMV, MKV)
- **Tamaño del archivo**: Máximo 100MB permitido
- **Duración**: Máximo 2 horas de contenido
- **Integridad**: Verificación de que el archivo no esté corrupto
- **Metadatos**: Validación de campos obligatorios

## Proceso de Transcripción

### Inicio de la Transcripción

1. **Envío**: Haga clic en "Procesar Video"
2. **Confirmación**: El sistema generará un ID de solicitud único
3. **Estado inicial**: La transcripción comenzará en estado "Pendiente"

### Monitoreo del Progreso

El sistema proporciona retroalimentación en tiempo real:

#### Estados de Procesamiento
- **Pendiente**: La solicitud está en cola de procesamiento
- **Procesando**: El video está siendo analizado por IA
- **Completado**: La transcripción y análisis han finalizado
- **Error**: Se ha producido un problema en el procesamiento

#### Barra de Progreso
- Actualización automática cada 3 segundos
- Indicador visual del porcentaje completado
- Tiempo estimado de finalización

### Tiempo de Procesamiento Estimado

| Duración del Video | Tiempo de Procesamiento |
|-------------------|------------------------|
| 0-5 minutos | 30-60 segundos |
| 5-15 minutos | 1-3 minutos |
| 15-30 minutos | 3-6 minutos |
| 30-60 minutos | 6-12 minutos |
| 60-120 minutos | 12-25 minutos |

## Resultados de la Transcripción

### Tipos de Contenido Generado

El sistema produce tres tipos de contenido:

#### 1. Análisis Educativo
Información estructurada sobre el contenido:
- **Resumen ejecutivo**: Síntesis del tema principal
- **Temas clave**: Conceptos principales identificados
- **Nivel de dificultad**: Básico, intermedio o avanzado
- **Recomendaciones**: Sugerencias pedagógicas

#### 2. Contenido Educativo Enriquecido
Material optimizado para el aprendizaje:
- **Introducción estructurada**: Contextualización del tema
- **Conceptos principales**: Explicaciones organizadas
- **Ejemplos y aplicaciones**: Casos prácticos identificados
- **Conclusión**: Síntesis de puntos clave

#### 3. Transcripción Literal
Texto exacto del audio del video:
- **Formato original**: Sin modificaciones del contenido hablado
- **Marcas temporales**: Referencias de tiempo (cuando sea aplicable)
- **Fidelidad**: Transcripción directa del audio

### Visualización de Resultados

#### Panel de Análisis Educativo
- **Resumen**: Vista general del contenido procesado
- **Temas clave**: Chips interactivos con los conceptos identificados
- **Nivel de dificultad**: Indicador visual codificado por colores
- **Recomendaciones**: Lista de sugerencias pedagógicas

#### Acordeones de Contenido
1. **Contenido Educativo Enriquecido**: Material estructurado para enseñanza
2. **Transcripción Literal**: Texto original del video

### Opciones de Descarga

#### Descarga de Contenido Educativo
- **Formato**: Archivo de texto (.txt)
- **Nombre**: `contenido_educativo_[ID_solicitud].txt`
- **Contenido**: Material enriquecido y estructurado

#### Descarga de Transcripción Literal
- **Formato**: Archivo de texto (.txt)
- **Nombre**: `transcripcion_literal_[ID_solicitud].txt`
- **Contenido**: Transcripción exacta del audio

## Gestión de Errores Comunes

### Errores de Formato de Archivo
**Problema**: "Formato de archivo no soportado"
**Solución**: Verifique que el archivo sea MP4, AVI, MOV o WEBM

### Errores de Tamaño
**Problema**: "Archivo demasiado grande"
**Solución**: El archivo debe ser menor a 100MB. Comprima el video o divídalo en segmentos menores

### Errores de Duración
**Problema**: "Video demasiado largo"
**Solución**: La duración máxima es de 2 horas. Divida el contenido en sesiones más cortas

### Errores de Procesamiento
**Problema**: "Error en la transcripción"
**Solución**: 
1. Verifique la calidad del audio
2. Reintente con un archivo de mejor calidad
3. Contacte al administrador si persiste

### Errores de Conexión
**Problema**: "Tiempo de espera agotado"
**Solución**: 
1. Verifique su conexión a internet
2. Refresque la página
3. Reintente la carga

## Mejores Prácticas

### Calidad del Video
- **Audio claro**: Asegúrese de que el audio sea nítido y sin ruido
- **Velocidad de habla**: Ritmo moderado para mejor reconocimiento
- **Idioma**: El sistema está optimizado para español

### Organización de Contenido
- **Títulos descriptivos**: Use nombres específicos y claros
- **Descripciones completas**: Proporcione contexto suficiente
- **Categorización**: Organice por materias y niveles

### Gestión de Archivos
- **Nomenclatura consistente**: Use convenciones de nombres estándares
- **Respaldo**: Mantenga copias de seguridad de videos importantes
- **Versioning**: Use números de versión para contenido actualizado

## Solución de Problemas

### Verificación del Estado del Sistema
1. Consulte el panel de estado en la interfaz
2. Revise los logs de procesamiento
3. Verifique la conectividad con los servicios de IA

---

**Versión del documento**: 1.0  
**Fecha de actualización**: 30 de septiembre de 2025  
**Responsable**: Equipo de Desarrollo PrioSync