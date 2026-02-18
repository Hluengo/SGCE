import { GravedadFalta } from '@/types';
import { supabase } from '@/shared/lib/supabaseClient';

/**
 * Constantes de plazos legales según Circular 782
 * @see https://www.supereduc.cl/circulares/781-782/
 */
// Constants for legal deadlines (Circular 782)
export const BUSINESS_DAYS_EXPULSION = 10; // Aula Segura: 10 días hábiles
export const BUSINESS_DAYS_RELEVANTE = 45; // Faltas relevantes: ~2 meses
export const HOURS_LEVE = 24; // Faltas leves: 24 horas corridas
export const MILLISECONDS_PER_DAY = 86400000;

/**
 * Tipo para alertas de plazo
 */
export interface AlertaPlazo {
  expedienteId: string;
  diasRestantes: number;
  fechaLimite: string;
  gravedad: GravedadFalta;
}

/**
 * Calcular días restantes hasta el plazo fatal
 */
export const calcularDiasRestantes = (plazoFatal: string): number => {
  const hoy = new Date();
  const fatal = new Date(plazoFatal);
  const diferencia = fatal.getTime() - hoy.getTime();
  return Math.ceil(diferencia / MILLISECONDS_PER_DAY);
};

/**
 * Formatear fecha para display
 */
export const formatearFecha = (fechaIso: string): string => {
  const fecha = new Date(fechaIso);
  return fecha.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Formatear hora para display
 */
export const formatearHora = (fechaIso: string): string => {
  const fecha = new Date(fechaIso);
  return fecha.toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

/**
 * Verificar si el plazo está próximo a vencer (7 días o menos)
 */
export const esPlazoProximoVencer = (diasRestantes: number): boolean => {
  return diasRestantes >= 0 && diasRestantes <= 7;
};

/**
 * Verificar si el plazo está vencido
 */
export const estaVencido = (diasRestantes: number): boolean => {
  return diasRestantes < 0;
};

/**
 * Obtener estado del plazo para mostrar en UI
 */
export const getPlazoStatus = (plazoFatal: string): 'normal' | 'proximo' | 'urgente' | 'vencido' => {
  const dias = calcularDiasRestantes(plazoFatal);
  if (estaVencido(dias)) return 'vencido';
  if (dias <= 3) return 'urgente';
  if (esPlazoProximoVencer(dias)) return 'proximo';
  return 'normal';
};

/**
 * Agrega días hábiles a una fecha (excluye fines de semana)
 * @param startDate - Fecha inicial
 * @param days - Días hábiles a agregar
 * @returns Nueva fecha con días hábiles agregados
 */
export const addBusinessDays = (startDate: Date, days: number): Date => {
    let date = new Date(startDate.getTime());
    let count = 0;
    while (count < days) {
        date.setDate(date.getDate() + 1);
        if (date.getDay() !== 0 && date.getDay() !== 6) { // Excluye Sáb y Dom
            count++;
        }
    }
    return date;
};

/**
 * Calcula el plazo legal según la gravedad de la falta
 * Basado en Circular 782
 * 
 * @param fecha - Fecha de inicio del plazo
 * @param gravedad - Gravedad de la falta según normativa
 * @returns Fecha límite para resolver el expediente
 */
export const calcularPlazoLegal = (fecha: Date, gravedad: GravedadFalta): Date => {
    if (gravedad === 'LEVE') {
        return new Date(fecha.getTime() + HOURS_LEVE * 60 * 60 * 1000);
    }
    if (gravedad === 'GRAVISIMA_EXPULSION') {
        return addBusinessDays(fecha, BUSINESS_DAYS_EXPULSION);
    }
    return addBusinessDays(fecha, BUSINESS_DAYS_RELEVANTE);
};

/**
 * Calcula plazo legal usando SQL RPC (incluye feriados de Chile)
 * RECOMENDADO: uso en frontend para cálculos precisos con tabla feriados_chile
 * 
 * @param fechaInicio - Fecha de inicio del plazo
 * @param diasHabiles - Cantidad de días hábiles a agregar
 * @returns Promesa con fecha límite considerando feriados
 * 
 * @example
 * const plazoFatal = await calcularPlazoConFeriados("2026-02-17", 10);
 * // Retorna fecha exacta excluyendo fines de semana + feriados chilenos
 */
export const calcularPlazoConFeriados = async (
  fechaInicio: string | Date,
  diasHabiles: number
): Promise<Date> => {
  if (!supabase) {
    return addBusinessDays(
      typeof fechaInicio === 'string' ? new Date(fechaInicio) : fechaInicio,
      diasHabiles
    );
  }
  try {
    // Convertir a string en formato ISO
    const fechaStr = typeof fechaInicio === 'string' 
      ? fechaInicio.split('T')[0]  // Tomar solo la parte de fecha
      : fechaInicio.toISOString().split('T')[0];

    // Llamar función SQL que considera feriados_chile
    const { data, error } = await supabase.rpc('sumar_dias_habiles', {
      p_fecha_inicio: fechaStr,
      p_dias: diasHabiles,
    });

    if (error) {
      console.warn('Error en sumar_dias_habiles, usando fallback sin feriados:', error);
      return addBusinessDays(
        typeof fechaInicio === 'string' ? new Date(fechaInicio) : fechaInicio,
        diasHabiles
      );
    }

    return new Date(data); // data es una fecha del servidor
  } catch (err) {
    console.warn('Error calculando plazo con feriados:', err);
    // Fallback a cálculo simple (sin feriados)
    return addBusinessDays(
      typeof fechaInicio === 'string' ? new Date(fechaInicio) : fechaInicio,
      diasHabiles
    );
  }
};

/**
 * Obtiene días hábiles restantes hasta una fecha (considerando feriados)
 * 
 * @param fechaInicio - Fecha inicial
 * @param fechaFin - Fecha final
 * @returns Promesa con cantidad de días hábiles
 */
export const contarDiasHabilesRestantes = async (
  fechaInicio: string | Date,
  fechaFin: string | Date
): Promise<number> => {
  if (!supabase) return 0;
  try {
    const inicioStr = typeof fechaInicio === 'string'
      ? fechaInicio.split('T')[0]
      : fechaInicio.toISOString().split('T')[0];

    const finStr = typeof fechaFin === 'string'
      ? fechaFin.split('T')[0]
      : fechaFin.toISOString().split('T')[0];

    const { data, error } = await supabase.rpc('contar_dias_habiles', {
      p_inicio: inicioStr,
      p_fin: finStr,
    });

    if (error) {
      console.warn('Error en contar_dias_habiles:', error);
      return 0;
    }

    return data;
  } catch (err) {
    console.warn('Error contando días hábiles:', err);
    return 0;
  }
};
