/**
 * useTenantBranding.ts
 * Hook para obtener y aplicar la configuración de branding del tenant actual
 * 
 * Proporciona colores, logos, tipografía y otros estilos personalizados
 * según el establecimiento/colegio actual
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabaseClient';
import { useTenant } from '@/shared/context';

export interface TenantBrandingConfig {
  id: string;
  establecimiento_id: string;
  logo_url: string | null;
  favicon_url: string | null;
  color_primario: string;
  color_secundario: string;
  color_acento: string;
  color_texto: string;
  color_fondo: string;
  nombre_publico: string;
  tipografia_body: string;
  tipografia_heading: string;
}

interface UseTenantBrandingReturn {
  branding: TenantBrandingConfig | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook que obtiene la configuración de branding del tenant actual
 * 
 * @returns {UseTenantBrandingReturn} Configuración de branding, estado de carga y función para refrescar
 */
export function useTenantBranding(): UseTenantBrandingReturn {
  const { tenantId } = useTenant();
  const [branding, setBranding] = useState<TenantBrandingConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBranding = async () => {
    if (!tenantId || !supabase) {
      setBranding(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Llamar a la RPC get_tenant_branding
      const { data, error: rpcError } = await supabase
        .rpc('get_tenant_branding', {
          p_establecimiento_id: tenantId,
        });

      if (rpcError) {
        throw rpcError;
      }

      // La RPC devuelve un array, extraemos el primer elemento
      if (data && data.length > 0) {
        setBranding(data[0] as TenantBrandingConfig);
      } else {
        // Si no existe configuración, usar valores por defecto
        setBranding({
          id: '',
          establecimiento_id: tenantId,
          logo_url: null,
          favicon_url: null,
          color_primario: '#2563eb',
          color_secundario: '#1e40af',
          color_acento: '#059669',
          color_texto: '#1f2937',
          color_fondo: '#ffffff',
          nombre_publico: 'Gestion Convivencia',
          tipografia_body: 'Inter',
          tipografia_heading: 'Poppins',
        } as TenantBrandingConfig);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useTenantBranding] Error fetchBranding:', message);
      
      // Usar valores por defecto en caso de error
      setBranding({
        id: '',
        establecimiento_id: tenantId || '',
        logo_url: null,
        favicon_url: null,
        color_primario: '#2563eb',
        color_secundario: '#1e40af',
        color_acento: '#059669',
        color_texto: '#1f2937',
        color_fondo: '#ffffff',
        nombre_publico: 'Gestion Convivencia',
        tipografia_body: 'Inter',
        tipografia_heading: 'Poppins',
      } as TenantBrandingConfig);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch al montar o cuando cambia el tenantId
  useEffect(() => {
    fetchBranding();
  }, [tenantId]);

  return {
    branding,
    isLoading,
    error,
    refetch: fetchBranding,
  };
}

/**
 * Hook para aplicar branding dinámicamente al documento
 * Inyecta CSS variables y actualiza título/favicon
 * 
 * @returns {void}
 */
export function useApplyBrandingStyles() {
  const { branding } = useTenantBranding();

  useEffect(() => {
    if (!branding) return;

    // Inyectar CSS variables en :root
    const root = document.documentElement;
    root.style.setProperty('--color-primario', branding.color_primario);
    root.style.setProperty('--color-secundario', branding.color_secundario);
    root.style.setProperty('--color-acento', branding.color_acento);
    root.style.setProperty('--color-texto', branding.color_texto);
    root.style.setProperty('--color-fondo', branding.color_fondo);

    // Actualizar título del documento
    if (branding.nombre_publico) {
      document.title = branding.nombre_publico;
    }

    // Actualizar favicon si existe
    if (branding.favicon_url) {
      let favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement;
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }
      favicon.href = branding.favicon_url;
    }

    // Actualizar tipografías via CSS variables o classes
    const htmlElement = document.documentElement;
    htmlElement.style.setProperty('--font-body', branding.tipografia_body);
    htmlElement.style.setProperty('--font-heading', branding.tipografia_heading);

  }, [branding]);
}
