import { supabase } from '@/shared/lib/supabaseClient';

export interface Feriado {
  fecha: string; // YYYY-MM-DD
  descripcion: string;
  esIrrenunciable: boolean;
}

/**
 * Caché en memoria de feriados para evitar llamadas repetidas
 */
let feriadosCache: Map<string, Feriado> | null = null;

/**
 * Cargar feriados de Chile desde la tabla feriados_chile
 * Usa caché en memoria para optimizar
 * 
 * @param forceRefresh - Si es true, recarga desde BD ignorando caché
 * @returns Promise con mapa de feriados (fecha como key)
 */
export const cargarFeriados = async (forceRefresh = false): Promise<Map<string, Feriado>> => {
  // Si hay caché y no se pide refresh, devolverlo
  if (feriadosCache && !forceRefresh) {
    return feriadosCache;
  }
  if (!supabase) {
    return new Map();
  }

  try {
    const { data, error } = await supabase
      .from('feriados_chile')
      .select('fecha, descripcion, es_irrenunciable')
      .order('fecha', { ascending: true });

    if (error) {
      console.warn('Error cargando feriados:', error);
      return new Map();
    }

    // Convertir array a Map con fecha como key
    const map = new Map<string, Feriado>();
    data?.forEach((f) => {
      const fechaStr = f.fecha; // Ya viene en formato YYYY-MM-DD
      map.set(fechaStr, {
        fecha: fechaStr,
        descripcion: f.descripcion || 'Feriado',
        esIrrenunciable: f.es_irrenunciable || false,
      });
    });

    // Guardar en caché
    feriadosCache = map;
    return map;
  } catch (err) {
    console.error('Error en cargarFeriados:', err);
    return new Map();
  }
};

/**
 * Verifica si una fecha es feriado
 * 
 * @param fecha - Fecha en string (YYYY-MM-DD) o Date
 * @param feriados - Mapa de feriados cargados
 * @returns true si es feriado
 */
export const esFeriado = (fecha: string | Date, feriados: Map<string, Feriado>): boolean => {
  let fechaStr: string;
  
  if (typeof fecha === 'string') {
    fechaStr = fecha.split('T')[0];
  } else {
    // Convertir Date a string local (YYYY-MM-DD)
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    fechaStr = `${year}-${month}-${day}`;
  }
  
  return feriados.has(fechaStr);
};

/**
 * Obtiene descripción del feriado
 * 
 * @param fecha - Fecha en string (YYYY-MM-DD) o Date
 * @param feriados - Mapa de feriados cargados
 * @returns Descripción del feriado o null si no existe
 */
export const obtenerDescripcionFeriado = (
  fecha: string | Date,
  feriados: Map<string, Feriado>
): string | null => {
  let fechaStr: string;
  
  if (typeof fecha === 'string') {
    fechaStr = fecha.split('T')[0];
  } else {
    // Convertir Date a string local (YYYY-MM-DD)
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    fechaStr = `${year}-${month}-${day}`;
  }

  const feriado = feriados.get(fechaStr);
  return feriado?.descripcion || null;
};

/**
 * Obtiene todos los feriados de un mes específico
 * 
 * @param year - Año
 * @param month - Mes (0-11)
 * @param feriados - Mapa de feriados cargados
 * @returns Array de feriados del mes
 */
export const obtenerFeriadosDelMes = (
  year: number,
  month: number,
  feriados: Map<string, Feriado>
): Feriado[] => {
  const result: Feriado[] = [];
  
  feriados.forEach((f) => {
    const fecha = new Date(f.fecha);
    if (fecha.getFullYear() === year && fecha.getMonth() === month) {
      result.push(f);
    }
  });

  return result;
};

/**
 * Verifica si una fecha es fin de semana (sábado=6, domingo=0)
 * 
 * @param fecha - Fecha en string (YYYY-MM-DD) o Date
 * @returns true si es sábado o domingo
 */
export const esFinDeSemana = (fecha: string | Date): boolean => {
  let date: Date;
  
  if (typeof fecha === 'string') {
    // Parsear string como local timezone, no UTC
    const [year, month, day] = fecha.split('-').map(Number);
    date = new Date(year, month - 1, day);
  } else {
    date = fecha;
  }
  
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6; // domingo=0, sábado=6
};

/**
 * Verifica si una fecha es día hábil (no feriado, no fin de semana)
 * 
 * @param fecha - Fecha en string (YYYY-MM-DD) o Date
 * @param feriados - Mapa de feriados cargados
 * @returns true si es día hábil
 */
export const esDiaHabil = (fecha: string | Date, feriados: Map<string, Feriado>): boolean => {
  return !esFinDeSemana(fecha) && !esFeriado(fecha, feriados);
};
