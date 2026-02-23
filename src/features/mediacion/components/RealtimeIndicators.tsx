import React, { FC, useEffect, useState } from 'react';
import {
  useGccRealtimeContext,
  type RealtimeMediacion,
  type RealtimeUser
} from '../context/GccRealtimeContext';

/**
 * Componente que muestra usuarios conectados en tiempo real
 */
export const RealtimePresenceIndicator: FC<{ currentUserId?: string }> = ({ currentUserId }) => {
  const { activeUsers, onPresenceChange } = useGccRealtimeContext();
  const [displayUsers, setDisplayUsers] = useState(Array.from(activeUsers.values()));

  useEffect(() => {
    const handlePresenceChange = (users: RealtimeUser[]) => {
      setDisplayUsers(users);
    };

    onPresenceChange(handlePresenceChange);
  }, [onPresenceChange]);

  const otherUsers = displayUsers.filter(u => u.user_id !== currentUserId);

  if (otherUsers.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded">
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-xs font-medium text-gray-700">
          {otherUsers.length} {otherUsers.length === 1 ? 'usuario' : 'usuarios'} conectado{otherUsers.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="flex -space-x-1">
        {otherUsers.slice(0, 3).map(user => (
          <div
            key={user.user_id}
            className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-xs text-white border border-blue-300"
            title={user.user_name || user.user_id}
          >
            {user.user_name?.charAt(0).toUpperCase() || 'U'}
          </div>
        ))}
      </div>

      {otherUsers.length > 3 && (
        <span className="text-xs text-gray-500">+{otherUsers.length - 3}</span>
      )}
    </div>
  );
};

/**
 * Componente que muestra indicador de actividad en tiempo real
 */
export const RealtimeActivityIndicator: FC = () => {
  const { isConnected, lastUpdate } = useGccRealtimeContext();
  const [lastActivity, setLastActivity] = useState<string>('');

  useEffect(() => {
    if (lastUpdate) {
      const eventLabel = {
        INSERT: '✨ Nuevo',
        UPDATE: '🔄 Configurado',
        DELETE: '🗑️ Eliminado'
      }[lastUpdate.eventType];

      setLastActivity(eventLabel);

      // Clear después de 3 segundos
      const timer = setTimeout(() => setLastActivity(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [lastUpdate]);

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
      <span className="text-xs font-medium text-gray-600">
        {isConnected ? 'Conectado' : 'Desconectado'}
      </span>
      {lastActivity && (
        <span className="text-xs text-blue-600 animate-fadeOut">{lastActivity}</span>
      )}
    </div>
  );
};

/**
 * Componente para notificar cambios en tiempo real
 */
export const RealtimeNotification: FC<{ disabled?: boolean }> = ({ disabled = false }) => {
  const { onMediacionUpdate } = useGccRealtimeContext();
  const [notification, setNotification] = useState<string | null>(null);

  React.useEffect(() => {
    if (disabled) return;

    const handleUpdate = (data: RealtimeMediacion) => {
      const { new_record, eventType } = data;
      const estado = typeof new_record?.estado === 'string' ? new_record.estado : null;

      if (eventType === 'UPDATE' && estado) {
        setNotification(`Estado actualizado a: ${estado}`);

        setTimeout(() => setNotification(null), 4000);
      }
    };

    onMediacionUpdate(handleUpdate);
  }, [onMediacionUpdate, disabled]);

  if (!notification) return null;

  return (
    <div
      className="fixed bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded shadow-lg animate-slideIn max-w-[min(26rem,calc(100vw-1.5rem))]"
      style={{
        right: 'calc(env(safe-area-inset-right, 0px) + 0.75rem)',
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)',
      }}
    >
      {notification}
    </div>
  );
};
