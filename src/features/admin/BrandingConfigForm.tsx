/**
 * BrandingConfigForm.tsx
 * Componente para gestionar la configuración de branding de un colegio
 * Permite editar logo, favicon, colores y tipografía
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  AlertCircle,
  Upload,
  Palette,
  Lock
} from 'lucide-react';
import { safeSupabase } from '@/shared/lib/supabaseClient';
import useAuth from '@/shared/hooks/useAuth';
import { TenantBrandingConfig } from '@/shared/hooks/useTenantBranding';

// Usar safeSupabase para evitar errores de null
const getSupabase = () => safeSupabase();

interface BrandingConfigFormProps {
  establecimientoId: string;
  establecimientoNombre: string;
  onClose: () => void;
  onSaved?: (branding: TenantBrandingConfig) => void;
}

const BrandingAlerts: React.FC<{
  isSuperadmin: boolean;
  error: string | null;
  success: string | null;
}> = ({ isSuperadmin, error, success }) => (
  <>
    {!isSuperadmin && (
      <div className="m-4 p-3 bg-amber-500/10 border border-amber-500/50 rounded-lg flex gap-2">
        <Lock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-300">Solo administradores pueden modificar la configuración de branding</p>
      </div>
    )}
    {error && (
      <div className="m-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
        <div className="flex gap-2 mb-2">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-300 flex-1">{error}</p>
        </div>
        {error.includes('Error al') && (
          <div className="mt-3 pl-7 text-xs text-red-200 bg-red-900/20 p-2 rounded border border-red-900/40">
            <p className="mb-2 font-semibold">💡 Si el error es &quot;403&quot; o &quot;policy&quot;:</p>
            <ol className="list-decimal ml-4 space-y-1">
              <li>Abre F12 (Console) y ejecuta: <code className="bg-black/40 px-1 rounded">const s = await supabase.auth.getSession(); console.log('Role:', s.data.session?.user?.user_metadata?.role)</code></li>
              <li>Verifica que el rol sea <code className="bg-black/40 px-1 rounded">SUPERADMIN</code></li>
              <li>Si el rol es correcto, ve a <code className="bg-black/40 px-1 rounded">docs/FIX_403_FORBIDDEN_ERROR.md</code> para troubleshooting completo</li>
            </ol>
          </div>
        )}
      </div>
    )}
    {success && (
      <div className="m-4 p-3 bg-green-500/10 border border-green-500/50 rounded-lg">
        <p className="text-sm text-green-300">✓ {success}</p>
      </div>
    )}
  </>
);

const BrandingAssetUploader: React.FC<{
  title: string;
  isSuperadmin: boolean;
  previewUrl?: string | null;
  previewClassName: string;
  onSelect: (file: File) => void;
  actionLabel: string;
}> = ({ title, isSuperadmin, previewUrl, previewClassName, onSelect, actionLabel }) => (
  <div>
    <p className="block text-sm font-medium text-slate-300 mb-2">{title}</p>
    <div className="flex gap-4">
      <div className="flex-1">
        <label
          className={`flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg transition-colors ${
            isSuperadmin ? 'cursor-pointer hover:bg-slate-800' : 'cursor-not-allowed opacity-50'
          }`}
        >
          <Upload className={`w-4 h-4 ${isSuperadmin ? 'text-blue-400' : 'text-slate-500'}`} />
          <span className="text-sm text-slate-300">{isSuperadmin ? actionLabel : 'Sin permisos'}</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files?.[0]) onSelect(e.target.files[0]);
            }}
            disabled={!isSuperadmin}
            className="hidden"
          />
        </label>
      </div>
      {previewUrl && (
        <div className="flex items-center justify-center px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg">
          <img src={previewUrl} alt={`${title} preview`} className={previewClassName} />
        </div>
      )}
    </div>
  </div>
);

const BrandingThemeFields: React.FC<{
  branding: Partial<TenantBrandingConfig>;
  onChange: (patch: Partial<TenantBrandingConfig>) => void;
}> = ({ branding, onChange }) => (
  <>
    <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
      <h3 className="text-sm font-semibold text-slate-300 mb-4">Paleta de Colores</h3>
      <div className="grid grid-cols-2 gap-4">
        {[
          { key: 'color_primario' as const, label: 'Color Primario' },
          { key: 'color_secundario' as const, label: 'Color Secundario' },
          { key: 'color_acento' as const, label: 'Color de Acento' },
          { key: 'color_texto' as const, label: 'Color de Texto' },
          { key: 'color_fondo' as const, label: 'Color de Fondo' },
        ].map(({ key, label }) => (
          <div key={key}>
            <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={branding[key] || '#000000'}
                onChange={(e) => onChange({ [key]: e.target.value })}
                className="w-12 h-10 rounded-lg cursor-pointer border border-slate-600"
              />
              <input
                type="text"
                value={branding[key] || '#000000'}
                onChange={(e) => onChange({ [key]: e.target.value })}
                className="flex-1 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-slate-300 font-mono"
                placeholder="#000000"
              />
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
      <h3 className="text-sm font-semibold text-slate-300 mb-4">Tipografías</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="branding-tipografia-body" className="block text-xs font-medium text-slate-400 mb-1">
            Tipografía del cuerpo
          </label>
          <input
            id="branding-tipografia-body"
            type="text"
            value={branding.tipografia_body || ''}
            onChange={(e) => onChange({ tipografia_body: e.target.value })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm text-slate-300"
            placeholder="ej: Inter, Roboto"
          />
        </div>
        <div>
          <label htmlFor="branding-tipografia-heading" className="block text-xs font-medium text-slate-400 mb-1">
            Tipografía de títulos
          </label>
          <input
            id="branding-tipografia-heading"
            type="text"
            value={branding.tipografia_heading || ''}
            onChange={(e) => onChange({ tipografia_heading: e.target.value })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm text-slate-300"
            placeholder="ej: Poppins, Montserrat"
          />
        </div>
      </div>
    </div>
  </>
);

const BrandingModalHeader: React.FC<{
  establecimientoNombre: string;
  onClose: () => void;
}> = ({ establecimientoNombre, onClose }) => (
  <div className="flex items-center justify-between p-6 border-b border-slate-700 sticky top-0 bg-slate-800">
    <div className="flex items-center gap-3">
      <Palette className="w-5 h-5 text-blue-400" />
      <h2 className="text-lg font-semibold text-white">
        Branding: {establecimientoNombre}
      </h2>
    </div>
    <button
      onClick={onClose}
      className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
    >
      <X className="w-5 h-5" />
    </button>
  </div>
);

const BrandingPreviewCard: React.FC<{
  branding: Partial<TenantBrandingConfig>;
}> = ({ branding }) => (
  <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
    <h3 className="text-sm font-semibold text-slate-300 mb-3">Vista Previa</h3>
    <div
      className="p-4 rounded-lg border-2"
      style={{
        backgroundColor: branding.color_fondo,
        borderColor: branding.color_primario,
        color: branding.color_texto,
      }}
    >
      <h2
        style={{ color: branding.color_primario }}
        className="text-xl font-bold mb-2"
      >
        {branding.nombre_publico || 'Preview'}
      </h2>
      <p
        style={{ color: branding.color_texto }}
        className="text-sm mb-2"
      >
        Este es un ejemplo de cómo se verá el branding.
      </p>
      <button
        style={{
          backgroundColor: branding.color_acento,
          color: branding.color_fondo,
        }}
        className="px-3 py-1 rounded text-sm font-medium transition-opacity hover:opacity-80"
      >
        Botón de ejemplo
      </button>
    </div>
  </div>
);

const BrandingFormFooter: React.FC<{
  isSaving: boolean;
  isSuperadmin: boolean;
  onClose: () => void;
  onSave: () => void;
}> = ({ isSaving, isSuperadmin, onClose, onSave }) => (
  <div className="flex items-center gap-3 p-6 border-t border-slate-700 sticky bottom-0 bg-slate-800">
    <button
      onClick={onClose}
      className="flex-1 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
    >
      Cancelar
    </button>
    <button
      onClick={onSave}
      disabled={isSaving || !isSuperadmin}
      title={!isSuperadmin ? 'Solo administradores pueden guardar cambios' : ''}
      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isSaving ? (
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <Save className="w-4 h-4" />
      )}
      Guardar Branding
    </button>
  </div>
);

const BrandingFormContent: React.FC<{
  branding: Partial<TenantBrandingConfig>;
  isSuperadmin: boolean;
  setBranding: React.Dispatch<React.SetStateAction<Partial<TenantBrandingConfig> | null>>;
  onUploadLogo: (file: File) => void;
  onUploadFavicon: (file: File) => void;
}> = ({ branding, isSuperadmin, setBranding, onUploadLogo, onUploadFavicon }) => (
  <div className="p-6 space-y-6">
    <div>
      <label htmlFor="branding-nombre-publico" className="block text-sm font-medium text-slate-300 mb-2">
        Nombre Público *
      </label>
      <input
        id="branding-nombre-publico"
        type="text"
        value={branding.nombre_publico || ''}
        onChange={(e) =>
          setBranding((prev) => ({ ...(prev ?? {}), nombre_publico: e.target.value }))
        }
        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Nombre del colegio en interfaz"
      />
      <p className="text-xs text-slate-500 mt-1">Se mostrará en el navegador y UI</p>
    </div>

    <BrandingAssetUploader
      title="Logo Institucional"
      isSuperadmin={isSuperadmin}
      previewUrl={branding.logo_url}
      previewClassName="max-h-12 max-w-32 object-contain"
      actionLabel="Subir logo"
      onSelect={onUploadLogo}
    />

    <BrandingAssetUploader
      title="Favicon (Icono de pestaña)"
      isSuperadmin={isSuperadmin}
      previewUrl={branding.favicon_url}
      previewClassName="w-6 h-6 object-contain"
      actionLabel="Subir favicon"
      onSelect={onUploadFavicon}
    />

    <BrandingThemeFields
      branding={branding}
      onChange={(patch) => setBranding((prev) => ({ ...(prev ?? {}), ...patch }))}
    />

    <BrandingPreviewCard branding={branding} />
  </div>
);

const BrandingConfigForm: React.FC<BrandingConfigFormProps> = ({
  establecimientoId,
  establecimientoNombre,
  onClose,
  onSaved,
}) => {
  const { usuario } = useAuth();
  const isSuperadmin = usuario?.rol === 'SUPERADMIN';
  
  // Cliente de Supabase (lanzará error si no está configurado)
  const sb = getSupabase();

  const defaultBranding: Partial<TenantBrandingConfig> = {
    nombre_publico: establecimientoNombre,
    color_primario: '#2563eb',
    color_secundario: '#1e40af',
    color_acento: '#059669',
    color_texto: '#1f2937',
    color_fondo: '#ffffff',
    tipografia_body: 'Inter',
    tipografia_heading: 'Poppins',
  };

  const [branding, setBranding] = useState<Partial<TenantBrandingConfig> | null>(null);

  const [uiState, setUiState] = useState<{
    isSaving: boolean;
    error: string | null;
    success: string | null;
  }>({
    isSaving: false,
    error: null,
    success: null
  });

  // Debug: Log authentication info on mount
  useEffect(() => {
    const debugAuth = async () => {
      const { data: { session } } = await sb.auth.getSession();
      console.log('[BrandingConfigForm] Auth Debug:', {
        userId: session?.user?.id,
        email: session?.user?.email,
        role: session?.user?.user_metadata?.role,
        formFrontendRole: usuario?.rol,
        isSuperadminFrontend: isSuperadmin,
        jwtAvailable: !!session,
        sessionExpiresAt: session?.expires_at,
      });
    };
    debugAuth();
  }, [usuario?.rol, isSuperadmin]);

  // Cargar configuración existente
  useEffect(() => {
    const fetchBranding = async () => {
      let nextBranding: Partial<TenantBrandingConfig> = defaultBranding;
      try {
        const { data, error: rpcError } = await sb.rpc('get_tenant_branding', {
          p_establecimiento_id: establecimientoId,
        });

        if (rpcError) throw rpcError;
        nextBranding = data && data.length > 0 ? data[0] : defaultBranding;
      } catch (err) {
        console.error('[BrandingConfigForm] Error loading branding:', err);
      }
      setBranding(nextBranding);
    };

    void fetchBranding();
  }, [establecimientoId]);

  const handleSave = async () => {
    const currentBranding = branding;
    if (!currentBranding?.nombre_publico?.trim()) {
      setUiState((prev) => ({ ...prev, error: 'El nombre público es requerido' }));
      return;
    }

    setUiState((prev) => ({ ...prev, isSaving: true, error: null }));

    try {
      // Verificar autenticación ANTES de intentar
      const { data: { session } } = await sb.auth.getSession();
      if (!session) {
        throw new Error('No hay sesión activa. Por favor, inicia sesión de nuevo.');
      }

      console.log('[BrandingConfigForm] Save attempt:', {
        userId: session.user?.id,
        userRole: session.user?.user_metadata?.role,
        isSuperadminCheck: isSuperadmin,
        establishmentId: establecimientoId,
      });

      // Si existe id, es actualización; si no, es inserción
      if (currentBranding.id) {
        // Actualizar
        const { error: updateError } = await sb
          .from('configuracion_branding')
          .update({
            nombre_publico: currentBranding.nombre_publico,
            color_primario: currentBranding.color_primario,
            color_secundario: currentBranding.color_secundario,
            color_acento: currentBranding.color_acento,
            color_texto: currentBranding.color_texto,
            color_fondo: currentBranding.color_fondo,
            tipografia_body: currentBranding.tipografia_body,
            tipografia_heading: currentBranding.tipografia_heading,
            logo_url: currentBranding.logo_url,
            favicon_url: currentBranding.favicon_url,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentBranding.id);

        if (updateError) {
          console.error('[BrandingConfigForm] Update error details:', {
            code: updateError.code,
            message: updateError.message,
            details: updateError.details,
            hint: updateError.hint,
          });
          throw new Error(`Error al actualizar: ${updateError.message}`);
        }
      } else {
        // Insertar
        const { error: insertError } = await sb
          .from('configuracion_branding')
          .insert({
            establecimiento_id: establecimientoId,
            nombre_publico: currentBranding.nombre_publico,
            color_primario: currentBranding.color_primario,
            color_secundario: currentBranding.color_secundario,
            color_acento: currentBranding.color_acento,
            color_texto: currentBranding.color_texto,
            color_fondo: currentBranding.color_fondo,
            tipografia_body: currentBranding.tipografia_body,
            tipografia_heading: currentBranding.tipografia_heading,
            logo_url: currentBranding.logo_url,
            favicon_url: currentBranding.favicon_url,
          });

        if (insertError) {
          console.error('[BrandingConfigForm] Insert error details:', {
            code: insertError.code,
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint,
          });
          throw new Error(`Error al guardar: ${insertError.message}`);
        }
      }

      setUiState((prev) => ({ ...prev, success: 'Configuración de branding guardada correctamente' }));
      if (onSaved) {
        onSaved(currentBranding as TenantBrandingConfig);
      }

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setUiState((prev) => ({ ...prev, error: message }));
      console.error('[BrandingConfigForm] Error saving:', {
        message,
        error: err,
        isSuperadmin,
        usuario: usuario?.rol,
      });
    } finally {
      setUiState((prev) => ({ ...prev, isSaving: false }));
    }
  };

  const handleFileUpload = async (
    file: File,
    fieldName: 'logo_url' | 'favicon_url'
  ) => {
    try {
      setUiState((prev) => ({ ...prev, error: null }));

      // Validar que sea superadmin
      if (!isSuperadmin) {
        throw new Error('Solo administradores pueden subir archivos de branding. Rol actual: ' + (usuario?.rol || 'desconocido'));
      }

      // Validar tipo de archivo
      const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`Tipo de archivo no permitido: ${file.type}. Use: PNG, JPEG, GIF, WebP o SVG`);
      }

      // Validar tamaño
      if (file.size > 5242880) { // 5MB
        throw new Error('Archivo demasiado grande. Máximo 5MB');
      }

      const fileName = `${establecimientoId}/${fieldName}/${Date.now()}_${file.name}`;
      
      console.log(`[BrandingConfigForm] Uploading ${fieldName}:`, { fileName, fileSize: file.size, fileType: file.type, isSuperadmin });

      // Subir a storage
      const { error: uploadError } = await sb.storage
        .from('branding-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error(`[BrandingConfigForm] Storage error:`, uploadError);
        throw uploadError;
      }

      // Obtener URL pública
      const { data: publicUrl } = sb.storage
        .from('branding-assets')
        .getPublicUrl(fileName);

      console.log(`[BrandingConfigForm] Upload successful, URL:`, publicUrl.publicUrl);

      setBranding((prev) => ({ ...prev, [fieldName]: publicUrl.publicUrl }));

      setUiState((prev) => ({ ...prev, success: `${fieldName === 'logo_url' ? 'Logo' : 'Favicon'} subido correctamente` }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido en carga de archivo';
      setUiState((prev) => ({ ...prev, error: message }));
      console.error(`[BrandingConfigForm] Error uploading ${fieldName}:`, err);
    }
  };

  if (!branding) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-8">
          <div className="w-8 h-8 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin mx-auto" />
          <p className="text-slate-300 text-center mt-4">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-2xl max-h-screen overflow-y-auto">
        <BrandingModalHeader establecimientoNombre={establecimientoNombre} onClose={onClose} />

        <BrandingAlerts
          isSuperadmin={isSuperadmin}
          error={uiState.error}
          success={uiState.success}
        />

        <BrandingFormContent
          branding={branding}
          isSuperadmin={isSuperadmin}
          setBranding={setBranding}
          onUploadLogo={(file) => { void handleFileUpload(file, 'logo_url'); }}
          onUploadFavicon={(file) => { void handleFileUpload(file, 'favicon_url'); }}
        />

        <BrandingFormFooter
          isSaving={uiState.isSaving}
          isSuperadmin={isSuperadmin}
          onClose={onClose}
          onSave={() => void handleSave()}
        />
      </div>
    </div>
  );
};

export default BrandingConfigForm;

