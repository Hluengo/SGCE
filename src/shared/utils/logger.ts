/**
 * Sistema de Logging Seguro
 * 
 * Este módulo proporciona funciones de logging que:
 * - Se desactivan automáticamente en producción
 * - Filtran información sensible
 * - Permiten niveles de log configurables
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  sensitiveKeys: string[];
}

const DEFAULT_CONFIG: LoggerConfig = {
  enabled: import.meta.env.DEV || import.meta.env.VITE_DEBUG_MODE === 'true',
  level: 'debug',
  sensitiveKeys: [
    'password',
    'token',
    'secret',
    'key',
    'credential',
    'auth',
    'session',
    'apiKey',
    'accessToken',
    'refreshToken',
    'privateKey',
    'sessionId',
  ],
};

let config = { ...DEFAULT_CONFIG };

/**
 * Configura el logger (llamar solo al inicio de la app)
 */
export function configureLogger(newConfig: Partial<LoggerConfig>) {
  config = { ...config, ...newConfig };
}

/**
 * Filtra información sensible de un objeto
 */
function filterSensitive<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(filterSensitive) as T;
  }

  const filtered: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = config.sensitiveKeys.some((sk) =>
      lowerKey.includes(sk.toLowerCase())
    );

    if (isSensitive) {
      filtered[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      filtered[key] = filterSensitive(value);
    } else {
      filtered[key] = value;
    }
  }

  return filtered as T;
}

/**
 * Obtiene timestamp formateado
 */
function getTimestamp(): string {
  return new Date().toISOString().substring(11, 23);
}

/**
 * Formatea el prefijo del log
 */
function formatPrefix(level: LogLevel, context?: string): string {
  const timestamp = getTimestamp();
  const contextStr = context ? ` [${context}]` : '';
  return `${timestamp}${contextStr}`;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function shouldLog(level: LogLevel): boolean {
  if (!config.enabled) {
    return false;
  }
  return LOG_LEVELS[level] >= LOG_LEVELS[config.level];
}

/**
 * Log de debug - Solo en desarrollo
 */
export function debug(context: string, message: string, data?: unknown): void {
  if (!shouldLog('debug')) return;
  const prefix = formatPrefix('debug', context);
  if (data !== undefined) {
    console.debug(`${prefix} ${message}`, filterSensitive(data));
  } else {
    console.debug(`${prefix} ${message}`);
  }
}

/**
 * Log de información
 */
export function info(context: string, message: string, data?: unknown): void {
  if (!shouldLog('info')) return;
  const prefix = formatPrefix('info', context);
  if (data !== undefined) {
    console.info(`${prefix} ${message}`, filterSensitive(data));
  } else {
    console.info(`${prefix} ${message}`);
  }
}

/**
 * Log de advertencia
 */
export function warn(context: string, message: string, data?: unknown): void {
  if (!shouldLog('warn')) return;
  const prefix = formatPrefix('warn', context);
  if (data !== undefined) {
    console.warn(`${prefix} ${message}`, filterSensitive(data));
  } else {
    console.warn(`${prefix} ${message}`);
  }
}

/**
 * Log de error - Siempre visible, pero filtra datos sensibles
 */
export function error(context: string, message: string, err?: unknown): void {
  if (!shouldLog('error')) return;
  const prefix = formatPrefix('error', context);
  
  if (err instanceof Error) {
    console.error(`${prefix} ${message}`, {
      name: err.name,
      message: err.message,
      stack: import.meta.env.DEV ? err.stack : undefined,
    });
  } else if (err !== undefined) {
    console.error(`${prefix} ${message}`, filterSensitive(err));
  } else {
    console.error(`${prefix} ${message}`);
  }
}

/**
 * Logger contextual para un módulo específico
 */
export function createLogger(context: string) {
  return {
    debug: (message: string, data?: unknown) => debug(context, message, data),
    info: (message: string, data?: unknown) => info(context, message, data),
    warn: (message: string, data?: unknown) => warn(context, message, data),
    error: (message: string, err?: unknown) => error(context, message, err),
  };
}

// Exportar instancia por defecto para uso directo
export const logger = {
  debug,
  info,
  warn,
  error,
  configure: configureLogger,
  create: createLogger,
};

export default logger;
