import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/shared/lib/supabaseClient';

export interface HitoDbRow {
  id: string;
  titulo: string;
  descripcion: string | null;
  fecha_cumplimiento: string | null;
  completado: boolean;
  created_at: string;
}

interface UseExpedienteHitosParams {
  expedienteDbId?: string;
  hitoTitle: string;
  currentEtapa: string;
  setHitoResumen: (value: string) => void;
  setHitoFecha: (value: string) => void;
}

export function useExpedienteHitos({
  expedienteDbId,
  hitoTitle,
  currentEtapa,
  setHitoResumen,
  setHitoFecha,
}: UseExpedienteHitosParams) {
  const [hitosDb, setHitosDb] = useState<HitoDbRow[]>([]);
  const activeRef = useRef(true);

  const refreshHitos = useCallback(async () => {
    if (!supabase || !expedienteDbId) {
      if (activeRef.current) setHitosDb([]);
      return;
    }

    const { data, error } = await supabase
      .from('hitos_expediente')
      .select('*')
      .eq('expediente_id', expedienteDbId)
      .order('created_at', { ascending: true });

    if (activeRef.current && !error && data) {
      setHitosDb(data as HitoDbRow[]);
    }
  }, [expedienteDbId]);

  useEffect(() => {
    activeRef.current = true;
    let isCancelled = false;

    const loadCurrentHito = async () => {
      if (!supabase || !expedienteDbId) return;

      // Cambiar de etapa debe limpiar estado local para no reutilizar el hito previo.
      setHitoResumen('');
      setHitoFecha('');

      const { data, error } = await supabase
        .from('hitos_expediente')
        .select('*')
        .eq('expediente_id', expedienteDbId)
        .eq('titulo', hitoTitle)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error || !data || data.length === 0 || isCancelled) return;
      const row = data[0] as HitoDbRow;
      if (row.descripcion) setHitoResumen(row.descripcion);
      if (row.fecha_cumplimiento) setHitoFecha(row.fecha_cumplimiento);
    };

    void loadCurrentHito();
    return () => {
      isCancelled = true;
      activeRef.current = false;
    };
  }, [expedienteDbId, hitoTitle, setHitoResumen, setHitoFecha]);

  useEffect(() => {
    void refreshHitos();
  }, [refreshHitos, currentEtapa]);

  return {
    hitosDb,
    refreshHitos,
  };
}
