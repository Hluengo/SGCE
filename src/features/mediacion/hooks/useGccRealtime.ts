import { useEffect, useCallback, useRef } from 'react';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '@/shared/lib/supabaseClient';

export type RealtimeRecord = Record<string, unknown>;
export type RealtimePayload = RealtimePostgresChangesPayload<RealtimeRecord>;
export type RealtimePresenceData = Record<string, unknown>;
export type RealtimeBroadcastData = Record<string, unknown>;

/**
 * Hook para gestionar suscripciones en tiempo real a cambios de mediaciones
 * 
 * Actualiza estado cuando otros usuarios cambian mediaciones
 * Permite colaboración en vivo entre múltiples facilitadores
 */
export function useGccRealtime(mediacionId?: string) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  const subscribe = useCallback(
    (
      eventType: 'INSERT' | 'UPDATE' | 'DELETE',
      callback: (payload: RealtimePayload) => void
    ) => {
      if (!supabase || !mediacionId) return;

      // Crear o reutilizar canal
      if (!channelRef.current) {
        channelRef.current = supabase.channel(`mediaciones:${mediacionId}`, {
          config: {
            broadcast: { self: true },
            presence: { key: `user_${Date.now()}` }
          }
        });
      }

      const channel = channelRef.current;

      // Suscribirse a cambios PostgreSQL
      channel.on(
        'postgres_changes',
        {
          event: eventType,
          schema: 'public',
          table: 'mediaciones',
          filter: `id=eq.${mediacionId}`
        },
        (payload: RealtimePayload) => {
          console.log(`[Realtime] ${eventType}:`, payload);
          callback(payload);
        }
      ).subscribe((status) => {
        console.log(`[Realtime] Channel status: ${status}`);
      });

      // Cleanup
      return () => {
        channel.unsubscribe();
      };
    },
    [mediacionId]
  );

  const trackPresence = useCallback((userId: string, data: RealtimePresenceData = {}) => {
    if (!channelRef.current) return;

    // Enviar presencia
    channelRef.current.track({
      user_id: userId,
      online_at: new Date().toISOString(),
      ...data
    });
  }, []);

  const broadcastMessage = useCallback(
    (event: string, data: RealtimeBroadcastData = {}) => {
      if (!channelRef.current) return;

      channelRef.current.send({
        type: 'broadcast',
        event,
        payload: data
      });
    },
    []
  );

  useEffect(() => {
    return () => {
      if (channelRef.current) {
        if (supabase) {
          supabase.removeChannel(channelRef.current);
        }
        channelRef.current = null;
      }
    };
  }, []);

  return {
    subscribe,
    trackPresence,
    broadcastMessage,
    isConnected: !!channelRef.current
  };
}
