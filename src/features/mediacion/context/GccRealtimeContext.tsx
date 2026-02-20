import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useGccRealtime, type RealtimePayload, type RealtimeRecord } from '../hooks/useGccRealtime';

/**
 * GCC Realtime Context
 * 
 * Proporciona acceso a:
 * - Cambios en tiempo real de mediaciones
 * - Presencia de otros usuarios
 * - Broadcasting de eventos
 */

export interface RealtimeUser {
  user_id: string;
  online_at: string;
  user_name?: string;
  status?: string;
}

export interface RealtimeMediacion {
  id: string;
  changed_at: string;
  new_record?: RealtimeRecord;
  old_record?: RealtimeRecord;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
}

export interface GccRealtimeContextType {
  // Estado
  isConnected: boolean;
  activeUsers: Map<string, RealtimeUser>;
  lastUpdate: RealtimeMediacion | null;
  
  // Subscripciones
  onMediacionUpdate: (callback: (data: RealtimeMediacion) => void) => void;
  onMediacionDelete: (callback: (data: RealtimeMediacion) => void) => void;
  onPresenceChange: (callback: (users: RealtimeUser[]) => void) => void;
  
  // Acciones
  trackPresence: (userId: string, data: RealtimeRecord) => void;
  broadcastEvent: (event: string, data: RealtimeRecord) => void;
}

const GccRealtimeContext = createContext<GccRealtimeContextType | undefined>(undefined);

/**
 * Provider para GCC Realtime
 * 
 * Uso:
 * <GccRealtimeProvider mediacionId={mediacionId}>
 *   <App />
 * </GccRealtimeProvider>
 */
export function GccRealtimeProvider({
  mediacionId,
  children
}: {
  mediacionId?: string;
  children: React.ReactNode;
}) {
  const extractId = useCallback((record: RealtimeRecord | undefined): string => {
    const rawId = record?.id;
    if (typeof rawId === 'string') return rawId;
    if (typeof rawId === 'number') return String(rawId);
    return '';
  }, []);

  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<Map<string, RealtimeUser>>(new Map());
  const [lastUpdate, setLastUpdate] = useState<RealtimeMediacion | null>(null);
  const [updateCallbacks, setUpdateCallbacks] = useState<((data: RealtimeMediacion) => void)[]>([]);
  const [deleteCallbacks, setDeleteCallbacks] = useState<((data: RealtimeMediacion) => void)[]>([]);
  const [presenceCallbacks, setPresenceCallbacks] = useState<((users: RealtimeUser[]) => void)[]>([]);

  const { subscribe, trackPresence, broadcastMessage, isConnected: realtimeConnected } = useGccRealtime(mediacionId);

  // Suscribirse a cambios cuando cambia mediacionId
  useEffect(() => {
    if (!mediacionId) return;

    setIsConnected(realtimeConnected);

    // Subscribe a updates
    const unsubscribeUpdate = subscribe('UPDATE', (payload: RealtimePayload) => {
      const data: RealtimeMediacion = {
        id: extractId(payload.new),
        changed_at: new Date().toISOString(),
        new_record: payload.new,
        old_record: payload.old,
        eventType: 'UPDATE'
      };

      setLastUpdate(data);
      updateCallbacks.forEach(cb => cb(data));
    });

    // Subscribe a deletes
    const unsubscribeDelete = subscribe('DELETE', (payload: RealtimePayload) => {
      const data: RealtimeMediacion = {
        id: extractId(payload.old),
        changed_at: new Date().toISOString(),
        old_record: payload.old,
        eventType: 'DELETE'
      };

      deleteCallbacks.forEach(cb => cb(data));
    });

    return () => {
      unsubscribeUpdate?.();
      unsubscribeDelete?.();
    };
  }, [mediacionId, subscribe, updateCallbacks, deleteCallbacks, realtimeConnected, extractId]);

  const handleOnMediacionUpdate = useCallback((callback: (data: RealtimeMediacion) => void) => {
    setUpdateCallbacks(prev => [...prev, callback]);
  }, []);

  const handleOnMediacionDelete = useCallback((callback: (data: RealtimeMediacion) => void) => {
    setDeleteCallbacks(prev => [...prev, callback]);
  }, []);

  const handleOnPresenceChange = useCallback((callback: (users: RealtimeUser[]) => void) => {
    setPresenceCallbacks(prev => [...prev, callback]);
  }, []);

  const handleTrackPresence = useCallback(
    (userId: string, data: RealtimeRecord) => {
      trackPresence(userId, data);

      // Actualizar estado local
      const newUsers = new Map(activeUsers);
      newUsers.set(userId, {
        user_id: userId,
        online_at: new Date().toISOString(),
        ...data
      });
      setActiveUsers(newUsers);

      // Notificar listeners
      presenceCallbacks.forEach(cb => cb(Array.from(newUsers.values())));
    },
    [trackPresence, activeUsers, presenceCallbacks]
  );

  const handleBroadcastEvent = useCallback(
    (event: string, data: RealtimeRecord) => {
      broadcastMessage(event, data);
    },
    [broadcastMessage]
  );

  const value: GccRealtimeContextType = {
    isConnected,
    activeUsers,
    lastUpdate,
    onMediacionUpdate: handleOnMediacionUpdate,
    onMediacionDelete: handleOnMediacionDelete,
    onPresenceChange: handleOnPresenceChange,
    trackPresence: handleTrackPresence,
    broadcastEvent: handleBroadcastEvent
  };

  return (
    <GccRealtimeContext.Provider value={value}>
      {children}
    </GccRealtimeContext.Provider>
  );
}

/**
 * Hook para usar GCC Realtime Context
 * 
 * Uso:
 * const { isConnected, activeUsers } = useGccRealtimeContext();
 */
export function useGccRealtimeContext() {
  const context = useContext(GccRealtimeContext);
  if (!context) {
    throw new Error('useGccRealtimeContext debe usarse dentro de GccRealtimeProvider');
  }
  return context;
}
