/**
 * Almacenamiento Seguro
 * 
 * Proporciona una capa de abstracción sobre localStorage/sessionStorage
 * con encriptación básica y limpieza automática de datos sensibles.
 */

// Clave para encriptación simple (en producción usar una clave real desde env)
const getEncryptionKey = (): string => {
  // En producción, esto debería venir de una variable de entorno
  // y ser único por sesión de usuario
  return 'sgce-storage-key-v1';
};

/**
 * Encriptación simple usando XOR (para producción usar Web Crypto API)
 * Esto es una medida de ofuscación, no encriptación real.
 * El objetivo es dificultar la lectura directa de datos sensibles.
 */
function simpleEncrypt(text: string, key: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(
      text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return btoa(result); // Base64 encode
}

/**
 * Desencriptación simple
 */
function simpleDecrypt(encoded: string, key: string): string {
  try {
    const text = atob(encoded);
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(
        text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return result;
  } catch {
    return '';
  }
}

/**
 * Opciones de almacenamiento
 */
interface StorageOptions {
  /** Usar sessionStorage en lugar de localStorage */
  session?: boolean;
  /** Encriptar el valor almacenado */
  encrypt?: boolean;
  /** Tiempo de vida en milisegundos (0 = sin expiración) */
  ttl?: number;
}

interface StoredValue<T> {
  value: T;
  timestamp: number;
  ttl: number;
}

/**
 * Almacena un valor de forma segura
 */
export function setSecureItem<T>(
  key: string,
  value: T,
  options: StorageOptions = {}
): void {
  const { session = false, encrypt = false, ttl = 0 } = options;
  const storage = session ? sessionStorage : localStorage;

  const storedValue: StoredValue<T> = {
    value,
    timestamp: Date.now(),
    ttl,
  };

  let serialized = JSON.stringify(storedValue);

  if (encrypt) {
    serialized = simpleEncrypt(serialized, getEncryptionKey());
  }

  try {
    storage.setItem(key, serialized);
  } catch (error) {
    console.warn('[SecureStorage] Error guardando item:', error);
  }
}

/**
 * Obtiene un valor almacenado de forma segura
 */
export function getSecureItem<T>(
  key: string,
  options: StorageOptions = {}
): T | null {
  const { session = false, encrypt = false } = options;
  const storage = session ? sessionStorage : localStorage;

  try {
    let serialized = storage.getItem(key);
    if (!serialized) return null;

    if (encrypt) {
      serialized = simpleDecrypt(serialized, getEncryptionKey());
      if (!serialized) return null;
    }

    const storedValue: StoredValue<T> = JSON.parse(serialized);

    // Verificar expiración
    if (storedValue.ttl > 0) {
      const expiresAt = storedValue.timestamp + storedValue.ttl;
      if (Date.now() > expiresAt) {
        storage.removeItem(key);
        return null;
      }
    }

    return storedValue.value;
  } catch (error) {
    console.warn('[SecureStorage] Error leyendo item:', error);
    return null;
  }
}

/**
 * Elimina un item del almacenamiento
 */
export function removeSecureItem(
  key: string,
  options: StorageOptions = {}
): void {
  const { session = false } = options;
  const storage = session ? sessionStorage : localStorage;
  storage.removeItem(key);
}

/**
 * Limpia todos los datos de la aplicación
 * Mantiene datos de otros orígenes
 */
export function clearAppStorage(): void {
  const keysToPreserve = ['theme', 'language'];

  // Limpiar localStorage
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key && !keysToPreserve.includes(key)) {
      localStorage.removeItem(key);
    }
  }

  // Limpiar sessionStorage completamente
  sessionStorage.clear();
}

/**
 * Limpia datos sensibles al cerrar sesión
 */
export function clearSensitiveDataOnLogout(): void {
  const sensitiveKeys = [
    'tenant_id',
    'user_preferences',
    'sge_expedientes_v1',
    'auth_token',
    'session_data',
  ];

  sensitiveKeys.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
}

/**
 * Hook para almacenamiento seguro con React
 */
export function useSecureStorage<T>(
  key: string,
  defaultValue: T,
  options: StorageOptions = {}
): [T, (value: T) => void, () => void] {
  const [storedValue, setStoredValue] = React.useState<T>(() => {
    const item = getSecureItem<T>(key, options);
    return item !== null ? item : defaultValue;
  });

  const setValue = (value: T) => {
    setStoredValue(value);
    setSecureItem(key, value, options);
  };

  const removeValue = () => {
    setStoredValue(defaultValue);
    removeSecureItem(key, options);
  };

  return [storedValue, setValue, removeValue];
}

// Importar React para el hook
import React from 'react';

export default {
  setItem: setSecureItem,
  getItem: getSecureItem,
  removeItem: removeSecureItem,
  clearApp: clearAppStorage,
  clearSensitive: clearSensitiveDataOnLogout,
};
