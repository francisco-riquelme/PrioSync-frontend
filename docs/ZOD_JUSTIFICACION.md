# Justificación para usar Zod en la generación de material de estudio

Este documento explica por qué recomendamos mantener Zod en el frontend para validar el JSON generado (material de estudio), qué beneficios aporta, los riesgos de no usarlo y cómo coordinar validación con el backend.

## Resumen ejecutivo

- Zod proporciona validación en tiempo de ejecución y tipado inferido en TypeScript (z.infer), evitando duplicar interfaces y reduciendo errores de integración.
- Dado que los contenidos son generados por modelos de IA (con variabilidad en estructura y formato), Zod protege la UI frente a formatos inesperados (double-encoded JSON, campos renombrados, HTML embebido) y permite mostrar un fallback seguro en lugar de romper la página.
- Recomendamos mantener Zod en el frontend como segunda capa de defensa, aun cuando el backend valide/normalice datos.

## Beneficios concretos

- Validación runtime: `schema.safeParse(...)` permite distinguir entre datos válidos e inválidos sin lanzar excepciones y tomar decisiones UI (modo compatibilidad, banner, fallback HTML sanitizado).
- Tipos DRY: `type T = z.infer<typeof schema>` elimina la duplicación manual de tipos y previene desincronizaciones entre schema y tipos TS.
- Diagnóstico estructurado: `res.error.issues` ofrece información accesible para logging y para detectar patrones de fallo en la IA o transformaciones.
- Seguridad: combinado con `DOMPurify` para HTML, evitamos XSS si la IA retorna HTML embebido.

## Riesgos de no usar Zod (solo confiar en tipos TS / checks mínimos)

- La IA puede devolver strings JSON dobles ("{\"key\":...}") o campos con nombres alternativos. Sin validación, el render puede mostrar JSON crudo o romper.
- Perderás información estructurada de por qué falló la validación — más difícil depurar prompts o normalización.
- Tendrás que mantener tests y guardas manuales en muchos puntos del frontend.


## Conclusión

Mantener Zod en el frontend aporta robustez y mejores diagnósticos en un flujo donde la fuente de verdad (IA) es inherentemente ruidosa y variable. Combinado con validación server-side, proporciona una estrategia en capas que reduce errores en producción y facilita la mejora iterativa de prompts y normalizaciones.
