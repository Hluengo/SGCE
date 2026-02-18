/**
 * useExpedienteHistorial.ts - Hook para cargar el historial de un expediente
 * Consolida datos de múltiples fuentes: logs_auditoria, hitos, evidencias, medidas, etc.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTenant } from '@/shared/context';
import { supabase } from '@/shared/lib/supabaseClient';
import { isUuid } from '@/shared/utils/expedienteRef';

export interface HistorialEntry {
  id: string;
  fecha: string;
  titulo: string;
  descripcion: string;
  tipo: 'creacion' | 'estado' | 'documento' | 'derivacion' | 'medida' | 'comentario' | 'evidencia' | 'hito' | 'investigacion';
  usuario?: string;
  usuarioId?: string;
  detalles?: Record<string, unknown>;
}

export interface HistorialFilters {
  tipo?: string;
  usuarioId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

export function useExpedienteHistorial(expedienteId: string | null) {
  const [entries, setEntries] = useState<HistorialEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { tenantId } = useTenant();
  const requestSeqRef = useRef(0);

  const loadHistorial = useCallback(async () => {
    if (!expedienteId || !tenantId || !supabase || !isUuid(tenantId)) return;

    setIsLoading(true);
    setError(null);
    const currentRequestSeq = ++requestSeqRef.current;
    const isCurrentRequest = () => currentRequestSeq === requestSeqRef.current;

    try {
      const client = supabase;
      const historialEntries: HistorialEntry[] = [];
      const isExpedienteUuid = isUuid(expedienteId);
      let resolvedExpedienteId = expedienteId;
      let resolvedEstudianteId: string | null = null;

      // Si llega folio (EXP-...), resolvemos primero el UUID real del expediente.
      if (!isExpedienteUuid) {
        const { data: expedienteByFolio, error: expedienteByFolioError } = await client
          .from('expedientes')
          .select('id, estudiante_id, folio')
          .eq('folio', expedienteId)
          .eq('establecimiento_id', tenantId)
          .maybeSingle();

        if (expedienteByFolioError || !expedienteByFolio?.id) {
          if (!isCurrentRequest()) return;
          setEntries([]);
          setError('No se encontró el expediente para cargar historial');
          return;
        }

        resolvedExpedienteId = expedienteByFolio.id;
        resolvedEstudianteId = expedienteByFolio.estudiante_id ?? null;
      } else {
        const { data: expedienteById } = await client
          .from('expedientes')
          .select('estudiante_id')
          .eq('id', resolvedExpedienteId)
          .eq('establecimiento_id', tenantId)
          .maybeSingle();
        resolvedEstudianteId = expedienteById?.estudiante_id ?? null;
      }

      // 1. Cargar desde logs_auditoria
      const { data: auditLogs, error: auditError } = await client
        .from('logs_auditoria')
        .select('*')
        .eq('establecimiento_id', tenantId)
        .eq('registro_id', resolvedExpedienteId)
        .order('created_at', { ascending: false });

      if (auditError) {
        console.error('Error cargando audit logs:', auditError);
      } else if (auditLogs) {
        for (const log of auditLogs) {
          const detalle = log.detalle as Record<string, unknown>;
          historialEntries.push({
            id: log.id,
            fecha: log.created_at,
            titulo: getTituloFromAccion(log.accion, detalle),
            descripcion: getDescripcionFromAccion(detalle),
            tipo: getTipoFromAccion(log.accion),
            usuarioId: log.usuario_id,
            detalles: detalle
          });
        }
      }

      // 2. Cargar hitos del expediente
      const { data: hitos, error: hitosError } = await client
        .from('hitos_expediente')
        .select('*')
        .eq('expediente_id', resolvedExpedienteId)
        .order('created_at', { ascending: false });

      if (!hitosError && hitos) {
        for (const hito of hitos) {
          historialEntries.push({
            id: hito.id,
            fecha: hito.created_at,
            titulo: hito.completado ? 'Hito completado' : 'Hito creado',
            descripcion: `${hito.titulo}: ${hito.descripcion}`,
            tipo: 'hito',
            detalles: { completado: hito.completado, evidencia_url: hito.evidencia_url }
          });
        }
      }

      // 3. Cargar evidencias del expediente
      const { data: evidencias, error: evError } = await client
        .from('evidencias')
        .select('*')
        .eq('establecimiento_id', tenantId)
        .eq('expediente_id', resolvedExpedienteId)
        .order('created_at', { ascending: false });

      if (!evError && evidencias) {
        for (const ev of evidencias) {
          historialEntries.push({
            id: ev.id,
            fecha: ev.created_at,
            titulo: 'Evidencia adjuntada',
            descripcion: `${ev.nombre || ev.tipo_archivo} - ${ev.descripcion || 'Sin descripción'}`,
            tipo: 'evidencia',
            usuarioId: ev.subido_por,
            detalles: { url: ev.url_storage, tipo: ev.tipo }
          });
        }
      }

      // 4. Cargar medidas de apoyo del estudiante vinculado al expediente
      // Primero obtener el estudiante_id del expediente
      if (!resolvedEstudianteId) {
        const { data: expedienteData } = await client
          .from('expedientes')
          .select('estudiante_id')
          .eq('id', resolvedExpedienteId)
          .eq('establecimiento_id', tenantId)
          .maybeSingle();
        resolvedEstudianteId = expedienteData?.estudiante_id ?? null;
      }

      if (resolvedEstudianteId) {
        const { data: medidas } = await client
          .from('medidas_apoyo')
          .select('*')
          .eq('establecimiento_id', tenantId)
          .eq('estudiante_id', resolvedEstudianteId)
          .order('created_at', { ascending: false });

        if (medidas) {
          for (const medida of medidas) {
            historialEntries.push({
              id: medida.id,
              fecha: medida.created_at,
              titulo: 'Medida de apoyo registrada',
              descripcion: `${medida.tipo_accion} - ${medida.objetivo}`,
              tipo: 'medida',
              detalles: { estado: medida.estado, responsable: medida.responsable }
            });
          }
        }
      }

      // 5. Cargar incidentes relacionados
      const { data: incidentes, error: incError } = await client
        .from('incidentes')
        .select('*')
        .eq('establecimiento_id', tenantId)
        .eq('expediente_id', resolvedExpedienteId)
        .order('created_at', { ascending: false });

      if (!incError && incidentes) {
        for (const inc of incidentes) {
          historialEntries.push({
            id: inc.id,
            fecha: inc.created_at,
            titulo: 'Incidente registrado',
            descripcion: inc.descripcion,
            tipo: 'creacion',
            usuarioId: inc.creado_por
          });
        }
      }

      // 6. Obtener nombres de usuarios
      const usuarioIds = [...new Set(historialEntries.map(e => e.usuarioId).filter(Boolean))];
      if (usuarioIds.length > 0) {
        const { data: perfiles } = await client
          .from('perfiles')
          .select('id, nombre')
          .eq('establecimiento_id', tenantId)
          .in('id', usuarioIds);

        if (perfiles) {
          const perfilMap = new Map(perfiles.map(p => [p.id, p.nombre]));
          historialEntries.forEach(entry => {
            if (entry.usuarioId && perfilMap.has(entry.usuarioId)) {
              entry.usuario = perfilMap.get(entry.usuarioId);
            }
          });
        }
      }

      // Ordenar por fecha descendente
      historialEntries.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

      // Evitar duplicados semánticos causados por doble escritura de auditoría
      // o reintentos del cliente en una misma acción.
      if (!isCurrentRequest()) return;
      setEntries(dedupeHistorialEntries(historialEntries));
    } catch (err) {
      if (!isCurrentRequest()) return;
      console.error('Error general cargando historial:', err);
      setError('Error al cargar el historial del expediente');
    } finally {
      if (!isCurrentRequest()) return;
      setIsLoading(false);
    }
  }, [expedienteId, tenantId]);

  useEffect(() => {
    void loadHistorial();
  }, [loadHistorial]);

  // Función para filtrar entradas
  const filterEntries = (filters: HistorialFilters): HistorialEntry[] => {
    return entries.filter(entry => {
      if (filters.tipo && filters.tipo !== 'todos' && entry.tipo !== filters.tipo) return false;
      if (filters.usuarioId && entry.usuarioId !== filters.usuarioId) return false;
      if (filters.fechaDesde && new Date(entry.fecha) < new Date(filters.fechaDesde)) return false;
      if (filters.fechaHasta && new Date(entry.fecha) > new Date(filters.fechaHasta)) return false;
      return true;
    });
  };

  return {
    entries,
    isLoading,
    error,
    reload: loadHistorial,
    filterEntries
  };
}

// Funciones helper para transformar datos
function getTituloFromAccion(accion: string, detalle: Record<string, unknown>): string {
  const accionLower = accion?.toLowerCase() || '';
  
  if (accionLower.includes('insert')) return 'Registro creado';
  if (accionLower.includes('update')) return 'Registro actualizado';
  if (accionLower.includes('delete')) return 'Registro eliminado';
  if (accionLower.includes('select')) return 'Registro visualizado';
  
  // Detectar tipo de cambio en el detalle
  const detalleNew = detalle?.new as Record<string, unknown> | undefined;
  if (detalleNew?.estado_legal) {
    return `Cambio de estado: ${String(detalleNew.estado_legal)}`;
  }
  if (detalleNew?.etapa_proceso) {
    return `Cambio de etapa: ${String(detalleNew.etapa_proceso)}`;
  }
  
  return 'Actualización';
}

function getDescripcionFromAccion(detalle: Record<string, unknown>): string {
  if (!detalle) return 'Sin detalles';
  
  const oldData = detalle.old as Record<string, unknown> | undefined;
  const newData = detalle.new as Record<string, unknown> | undefined;
  
  if (oldData && newData) {
    // Encontrar qué campos cambiaron
    const cambios = Object.keys(newData).filter(key => 
      key !== 'updated_at' && oldData[key] !== newData[key]
    );
    
    if (cambios.length > 0) {
      return cambios.map(c => `${c}: ${oldData[c]} → ${newData[c]}`).join(', ');
    }
  }
  
  return 'Se realizaron modificaciones en el registro';
}

function getTipoFromAccion(accion: string): HistorialEntry['tipo'] {
  const accionLower = accion?.toLowerCase() || '';
  
  if (accionLower.includes('insert')) return 'creacion';
  if (accionLower.includes('update')) return 'estado';
  if (accionLower.includes('select')) return 'comentario';
  
  return 'estado';
}

function normalizeForKey(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function dedupeHistorialEntries(entries: HistorialEntry[]): HistorialEntry[] {
  const seen = new Map<string, number>();
  const deduped: HistorialEntry[] = [];

  for (const entry of entries) {
    // Los hitos y comentarios deben mostrarse completos para no ocultar acciones válidas.
    if (entry.tipo === 'hito' || entry.tipo === 'comentario') {
      deduped.push(entry);
      continue;
    }

    const fechaMs = new Date(entry.fecha).getTime();
    const key = [
      normalizeForKey(entry.tipo),
      normalizeForKey(entry.titulo),
      normalizeForKey(entry.descripcion),
      normalizeForKey(entry.usuarioId),
      normalizeForKey(entry.usuario),
    ].join('|');

    const lastSeen = seen.get(key);
    // Si la misma acción aparece nuevamente en <= 5s, se considera duplicada.
    if (lastSeen !== undefined && Math.abs(lastSeen - fechaMs) <= 5000) {
      continue;
    }

    seen.set(key, fechaMs);
    deduped.push(entry);
  }

  return deduped;
}

export default useExpedienteHistorial;
