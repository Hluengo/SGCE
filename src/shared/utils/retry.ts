/**
 * Opciones para configuración de reintentos
 */
export type RetryOptions = {
  /** Número de reintentos adicionales (default: 2) */
  retries?: number;
  /** Delay base en milisegundos (default: 600ms) */
  baseDelayMs?: number;
  /** Lista de códigos de error HTTP que deben reintentarse */
  retryableStatusCodes?: number[];
  /** Nombres de errores que deben reintentarse */
  retryableErrors?: string[];
};

/**
 * Códigos de estado HTTP que justifican reintento */
const DEFAULT_RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504];

/**
 * Nombres de errores que justifican reintento */
const DEFAULT_RETRYABLE_ERRORS = [
  'ECONNRESET',
  'ETIMEDOUT',
  'ECONNREFUSED',
  'NetworkError',
  'FetchError',
  'TimeoutError'
];

/**
 * Función auxiliar para pausar la ejecución
 * @param ms - Milisegundos a esperar
 */
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Determina si un error es recuperable y debe reintentarse
 */
function isRetryableError(error: unknown, options: RetryOptions): boolean {
  const retryableStatusCodes = options.retryableStatusCodes ?? DEFAULT_RETRYABLE_STATUS_CODES;
  const retryableErrors = options.retryableErrors ?? DEFAULT_RETRYABLE_ERRORS;
  
  // Si es un objeto de respuesta de API (tiene status)
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: number }).status;
    if (retryableStatusCodes.includes(status)) {
      return true;
    }
  }
  
  // Si es un Error de JavaScript
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();
    const errorName = error.name.toLowerCase();
    
    // Verificar si el nombre del error está en la lista
    if (retryableErrors.some(e => errorName.includes(e.toLowerCase()))) {
      return true;
    }
    
    // Verificar códigos de estado en el mensaje (ej: "503 Service Unavailable")
    for (const code of retryableStatusCodes) {
      if (errorMessage.includes(code.toString())) {
        return true;
      }
    }
    
    // Verificar palabras clave en el mensaje
    const retryableKeywords = ['unavailable', 'timeout', 'reset', 'refused', 'temporary'];
    if (retryableKeywords.some(keyword => errorMessage.includes(keyword))) {
      return true;
    }
  }
  
  return false;
}

/**
 * Ejecuta una función asíncrona con reintentos automáticos
 * Útil para operaciones que pueden fallar transitoriamente (ej: llamadas a API)
 * 
 * @param fn - Función asíncrona a ejecutar
 * @param options - Configuración de reintentos
 * @returns Promesa con el resultado de la función
 * @throws El último error si todos los reintentos fallan
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const retries = options.retries ?? 2;
  const baseDelayMs = options.baseDelayMs ?? 600;
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      
      // Solo reintentar si el error es recuperable Y quedan intentos
      if (attempt < retries && isRetryableError(err, options)) {
        // Delay exponencial: 600ms, 1200ms, 2400ms...
        const delay = baseDelayMs * Math.pow(2, attempt);
        await sleep(delay);
        continue;
      }
      
      // Error no recuperable o sin reintentos restantes
      break;
    }
  }

  throw lastError;
}
