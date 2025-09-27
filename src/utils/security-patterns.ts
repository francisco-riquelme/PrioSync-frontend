import securityConfig from '@/config/security-patterns.json';

/**
 * Configuración de seguridad para prevención de inyección de prompts
 * Los patrones se cargan desde un archivo de configuración externo
 * para permitir actualizaciones sin redeployment
 */
export interface SecurityConfig {
  promptInjectionPatterns: {
    directCommands: string[];
    roleManipulation: string[];
    systemMarkers: string[];
    instructionInjection: string[];
    escapePatterns: string[];
    legacyPatterns: string[];
  };
  fallbackValues: {
    title: string;
    courseName: string;
    genericTitle: string;
    genericCourse: string;
  };
  limits: {
    maxTitleLength: number;
    maxCourseNameLength: number;
    promptTitleLength: number;
    promptCourseLength: number;
  };
}

/**
 * Obtener configuración de seguridad
 * En el futuro, esto podría extenderse para cargar desde variables de entorno
 * o una base de datos para actualizaciones dinámicas
 */
export function getSecurityConfig(): SecurityConfig {
  // Verificar si hay overrides desde variables de entorno
  const envPatterns = process.env.PROMPT_INJECTION_PATTERNS;
  
  if (envPatterns) {
    try {
      const parsedPatterns = JSON.parse(envPatterns);
      return {
        ...securityConfig,
        promptInjectionPatterns: {
          ...securityConfig.promptInjectionPatterns,
          ...parsedPatterns
        }
      };
    } catch (error) {
      console.warn('Error parsing PROMPT_INJECTION_PATTERNS from env, using defaults:', error);
    }
  }
  
  return securityConfig;
}

/**
 * Compilar todos los patrones de seguridad en expresiones regulares
 */
export function getCompiledSecurityPatterns(): RegExp[] {
  const config = getSecurityConfig();
  const allPatterns: string[] = [];
  
  // Combinar todos los tipos de patrones
  Object.values(config.promptInjectionPatterns).forEach(patternGroup => {
    allPatterns.push(...patternGroup);
  });
  
  // Compilar a RegExp con flag case-insensitive
  return allPatterns.map(pattern => new RegExp(pattern, 'i'));
}

/**
 * Verificar si un texto contiene patrones peligrosos
 */
export function containsDangerousPatterns(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }
  
  const compiledPatterns = getCompiledSecurityPatterns();
  return compiledPatterns.some(pattern => pattern.test(text));
}

/**
 * Obtener valores de fallback seguros
 */
export function getFallbackValues() {
  const config = getSecurityConfig();
  return config.fallbackValues;
}

/**
 * Obtener límites de longitud configurados
 */
export function getLimits() {
  const config = getSecurityConfig();
  return config.limits;
}