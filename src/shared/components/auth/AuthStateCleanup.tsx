import { useEffect } from 'react';
import useAuth from '@/shared/hooks/useAuth';
import { useConvivencia } from '@/shared/context/ConvivenciaContext';

/**
 * Componente que limpia datos cuando el usuario se desautentica
 * Evita que queden residuos de sesiones anteriores
 */
export const AuthStateCleanup = () => {
  const { isAuthenticated } = useAuth();
  const { setExpedientes, setEstudiantes, setExpedienteSeleccionado } = useConvivencia();

  useEffect(() => {
    if (!isAuthenticated) {
      // Limpiar estado de expedientes cuando se desautentica
      setExpedientes([]);
      setEstudiantes([]);
      setExpedienteSeleccionado(null);
    }
  }, [isAuthenticated, setExpedientes, setEstudiantes, setExpedienteSeleccionado]);

  return null;
};
