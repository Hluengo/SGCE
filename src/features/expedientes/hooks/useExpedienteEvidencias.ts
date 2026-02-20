import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/shared/lib/supabaseClient';
import type { EvidenciaQueryRow } from '@/shared/types/supabase';

export interface EvidenciaDbRow
  extends Pick<EvidenciaQueryRow, 'id' | 'nombre' | 'tipo' | 'fecha' | 'url_storage' | 'created_at'> {}

export function useExpedienteEvidencias(expedienteDbId?: string) {
  const [evidenciasDb, setEvidenciasDb] = useState<EvidenciaDbRow[]>([]);
  const activeRef = useRef(true);

  const refreshEvidencias = useCallback(async () => {
    if (!supabase || !expedienteDbId) {
      if (activeRef.current) setEvidenciasDb([]);
      return;
    }

    const { data, error } = await supabase
      .from('evidencias')
      .select('id, nombre, tipo, fecha, url_storage, created_at')
      .eq('expediente_id', expedienteDbId)
      .order('created_at', { ascending: false });

    if (activeRef.current && !error && data) {
      // No firmar URLs en la carga inicial para evitar errores 400 innecesarios
      // en buckets/policies con reglas estrictas. Se puede firmar on-demand al abrir.
      setEvidenciasDb(data as EvidenciaDbRow[]);
    }
  }, [expedienteDbId]);

  useEffect(() => {
    activeRef.current = true;
    void refreshEvidencias();
    return () => {
      activeRef.current = false;
    };
  }, [refreshEvidencias]);

  return {
    evidenciasDb,
    refreshEvidencias,
  };
}
