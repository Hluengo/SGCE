import type { FC } from 'react';
import type { Permiso, RolUsuario } from '@/shared/hooks/useAuth';
import type { ProfileRow, RolePermissionFormState, TenantRow } from '../types';

interface UiClasses {
  card: string;
  cardTitle: string;
  tableHead: string;
  input: string;
  buttonPrimary: string;
  buttonSecondary: string;
  buttonDanger: string;
}

type ConfirmAction = { type: 'deactivate' | 'delete'; profile: ProfileRow };
type PermissionLevelFilter = 'Basico' | 'Operativo' | 'Critico';

const ROLE_LABELS: Record<RolUsuario, { label: string; help: string }> = {
  SUPERADMIN: { label: 'Superadministrador', help: 'Control total de plataforma y tenants.' },
  SOSTENEDOR: { label: 'Sostenedor', help: 'Supervisa múltiples colegios y configuraciones globales.' },
  DIRECTOR: { label: 'Director/a', help: 'Gestión integral del colegio y su equipo.' },
  INSPECTOR_GENERAL: { label: 'Inspector/a General', help: 'Gestión operativa y seguimiento disciplinario.' },
  CONVIVENCIA_ESCOLAR: { label: 'Convivencia Escolar', help: 'Atención y gestión de casos de convivencia.' },
  PSICOLOGO: { label: 'Psicólogo/a', help: 'Apoyo psicoeducativo y seguimiento de casos.' },
  PSICOPEDAGOGO: { label: 'Psicopedagogo/a', help: 'Apoyo pedagógico y acompañamiento.' },
  PROFESOR_JEFE: { label: 'Profesor/a Jefe', help: 'Seguimiento de estudiantes y coordinación de aula.' },
  ADMINISTRADOR: { label: 'Administrador/a', help: 'Administración operativa del sistema del colegio.' },
  SECRETARIA: { label: 'Secretaría', help: 'Gestión administrativa y soporte documental.' },
};

type PermissionDescriptor = { label: string; help: string; example: string; area: string; level: 'Basico' | 'Operativo' | 'Critico' };

const PERMISSION_LABELS: Record<Permiso, PermissionDescriptor> = {
  'expedientes:crear': { label: 'Crear expedientes', help: 'Permite abrir casos nuevos.', example: 'Ejemplo: registrar un incidente nuevo.', area: 'Expedientes', level: 'Operativo' },
  'expedientes:leer': { label: 'Ver expedientes', help: 'Permite consultar casos.', example: 'Ejemplo: revisar estado de un caso.', area: 'Expedientes', level: 'Basico' },
  'expedientes:editar': { label: 'Editar expedientes', help: 'Permite modificar datos del caso.', example: 'Ejemplo: corregir antecedentes o etapa.', area: 'Expedientes', level: 'Operativo' },
  'expedientes:eliminar': { label: 'Eliminar expedientes', help: 'Permite borrar casos.', example: 'Ejemplo: eliminar un registro creado por error.', area: 'Expedientes', level: 'Critico' },
  'expedientes:archivar': { label: 'Archivar expedientes', help: 'Permite cerrar/archivar casos.', example: 'Ejemplo: archivar un caso resuelto.', area: 'Expedientes', level: 'Operativo' },
  'expedientes:asignar': { label: 'Asignar expedientes', help: 'Permite asignar responsables.', example: 'Ejemplo: derivar un caso a convivencia.', area: 'Expedientes', level: 'Operativo' },
  'documentos:subir': { label: 'Subir documentos', help: 'Permite adjuntar archivos.', example: 'Ejemplo: subir actas o informes.', area: 'Documentos', level: 'Basico' },
  'documentos:eliminar': { label: 'Eliminar documentos', help: 'Permite borrar adjuntos.', example: 'Ejemplo: retirar un archivo incorrecto.', area: 'Documentos', level: 'Critico' },
  'reportes:generar': { label: 'Generar reportes', help: 'Permite construir reportes internos.', example: 'Ejemplo: reporte mensual de convivencia.', area: 'Reportes', level: 'Basico' },
  'reportes:exportar': { label: 'Exportar reportes', help: 'Permite descargar reportes.', example: 'Ejemplo: exportar reporte a Excel/PDF.', area: 'Reportes', level: 'Operativo' },
  'usuarios:gestionar': { label: 'Gestionar usuarios', help: 'Permite administrar cuentas.', example: 'Ejemplo: activar o desactivar perfiles.', area: 'Usuarios', level: 'Critico' },
  'usuarios:roles:gestionar': { label: 'Gestionar roles y permisos', help: 'Permite cambiar nivel de acceso.', example: 'Ejemplo: convertir usuario en director.', area: 'Usuarios', level: 'Critico' },
  'configuracion:editar': { label: 'Editar configuración', help: 'Permite ajustar parámetros del sistema.', example: 'Ejemplo: cambiar reglas internas.', area: 'Configuración', level: 'Operativo' },
  'configuracion:tenant:editar': { label: 'Editar configuración del colegio', help: 'Permite cambiar configuración del tenant.', example: 'Ejemplo: ajustar opciones por establecimiento.', area: 'Configuración', level: 'Critico' },
  'bitacora:ver': { label: 'Ver bitácora', help: 'Permite revisar trazabilidad.', example: 'Ejemplo: ver historial de acciones.', area: 'Bitácora', level: 'Basico' },
  'bitacora:exportar': { label: 'Exportar bitácora', help: 'Permite descargar bitácora.', example: 'Ejemplo: exportar evidencias para auditoría.', area: 'Bitácora', level: 'Operativo' },
  'archivo:sostenedor:ver': { label: 'Ver archivo del sostenedor', help: 'Permite acceder al repositorio documental institucional.', example: 'Ejemplo: consultar documentos del sostenedor.', area: 'Archivo', level: 'Critico' },
  'sie:ver': { label: 'Ver auditoría SIE', help: 'Permite acceder al panel de cumplimiento SIE.', example: 'Ejemplo: revisar alertas de auditoría regulatoria.', area: 'Auditoría', level: 'Critico' },
  'tenants:gestionar': { label: 'Gestionar colegios (tenants)', help: 'Permite administrar varios establecimientos.', example: 'Ejemplo: cambiar entre colegios y administrar.', area: 'Plataforma', level: 'Critico' },
  'dashboard:analitica:ver': { label: 'Ver analítica de dashboard', help: 'Permite acceder a métricas y paneles.', example: 'Ejemplo: revisar KPIs de gestión.', area: 'Analítica', level: 'Basico' },
  'monitorizacion:ver': { label: 'Ver monitorización', help: 'Permite observar estado operativo.', example: 'Ejemplo: revisar estado de módulos.', area: 'Analítica', level: 'Operativo' },
  'mantenimiento:ejecutar': { label: 'Ejecutar mantenimiento', help: 'Permite correr tareas de mantenimiento.', example: 'Ejemplo: ejecutar limpieza operativa.', area: 'Plataforma', level: 'Critico' },
  'backend:configurar': { label: 'Configurar backend', help: 'Permite ajustes técnicos avanzados.', example: 'Ejemplo: cambiar parámetros de backend.', area: 'Plataforma', level: 'Critico' },
  'system:manage': { label: 'Administración total del sistema', help: 'Permite control completo.', example: 'Ejemplo: acceso total a toda la plataforma.', area: 'Plataforma', level: 'Critico' },
};

const LEVEL_STYLES: Record<PermissionDescriptor['level'], string> = {
  Basico: 'bg-slate-100 text-slate-700 border-slate-200',
  Operativo: 'bg-blue-100 text-blue-700 border-blue-200',
  Critico: 'bg-rose-100 text-rose-700 border-rose-200',
};

const roleBadgeClass = (rawRole: string | null | undefined) => {
  const role = String(rawRole ?? '').toUpperCase();
  if (role === 'SUPERADMIN') return 'bg-violet-100 text-violet-700 border-violet-200';
  if (role === 'ADMIN' || role === 'ADMINISTRADOR' || role === 'SOSTENEDOR') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (role === 'DIRECTOR') return 'bg-cyan-100 text-cyan-700 border-cyan-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
};

export const ProfilesTablePanel: FC<{
  ui: UiClasses;
  search: string;
  roleFilter: RolUsuario | 'ALL';
  statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE';
  roleOptions: RolUsuario[];
  paginatedProfiles: ProfileRow[];
  currentPage: number;
  totalPages: number;
  onSearchChange: (value: string) => void;
  onRoleFilterChange: (value: RolUsuario | 'ALL') => void;
  onStatusFilterChange: (value: 'ALL' | 'ACTIVE' | 'INACTIVE') => void;
  onLoadProfile: (profile: ProfileRow) => void;
  onOpenConfirm: (action: ConfirmAction) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
}> = ({
  ui,
  search,
  roleFilter,
  statusFilter,
  roleOptions,
  paginatedProfiles,
  currentPage,
  totalPages,
  onSearchChange,
  onRoleFilterChange,
  onStatusFilterChange,
  onLoadProfile,
  onOpenConfirm,
  onPrevPage,
  onNextPage,
}) => (
  <section className={`xl:col-span-2 ${ui.card} p-4 space-y-3`}>
    <p className="text-[0.75rem] font-black uppercase tracking-[0.12em] text-slate-500">Perfiles existentes</p>
    <div className="space-y-2">
      <input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Buscar por id, nombre o rol"
        className={ui.input}
      />
      <div className="grid grid-cols-2 gap-2">
        <select value={roleFilter} onChange={(e) => onRoleFilterChange(e.target.value as RolUsuario | 'ALL')} className={ui.input}>
          <option value="ALL">Todos los roles</option>
          {roleOptions.map((role) => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => onStatusFilterChange(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')} className={ui.input}>
          <option value="ALL">Todos los estados</option>
          <option value="ACTIVE">Activos</option>
          <option value="INACTIVE">Inactivos</option>
        </select>
      </div>
    </div>
    <div className="max-h-96 overflow-auto rounded-[0.75rem] border border-slate-200">
      <table className="w-full text-[11px]">
        <thead className={ui.tableHead}>
          <tr>
            <th className="p-2 text-left">Usuario</th>
            <th className="p-2 text-left">Rol</th>
            <th className="p-2 text-left">Estado</th>
            <th className="p-2 text-left">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {paginatedProfiles.map((profile) => (
            <tr key={profile.id} className="border-t border-slate-100">
              <td className="p-2">
                <p className="font-bold text-slate-800">{profile.nombre ?? 'Sin nombre'} {profile.apellido ?? ''}</p>
                <p className="text-[10px] text-slate-500 break-all">{profile.id}</p>
              </td>
              <td className="p-2">
                <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${roleBadgeClass(profile.rol)}`}>
                  {String(profile.rol ?? 'sin_rol')}
                </span>
              </td>
              <td className="p-2">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${profile.activo === false ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {profile.activo === false ? 'inactivo' : 'activo'}
                </span>
              </td>
              <td className="p-2">
                <div className="flex flex-wrap gap-1">
                  <button onClick={() => onLoadProfile(profile)} className={ui.buttonSecondary} title="Cargar en formulario">Editar</button>
                  <button onClick={() => onOpenConfirm({ type: 'deactivate', profile })} className={ui.buttonSecondary} title="Desactivar perfil">Baja</button>
                  <button onClick={() => onOpenConfirm({ type: 'delete', profile })} className={ui.buttonDanger} title="Borrado físico">Eliminar</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {paginatedProfiles.length === 0 && <p className="p-3 text-xs text-slate-500">Sin resultados para los filtros actuales.</p>}
    </div>
    <div className="flex items-center justify-between text-xs text-slate-600">
      <p>Pagina {currentPage} de {totalPages}</p>
      <div className="flex gap-2">
        <button disabled={currentPage <= 1} onClick={onPrevPage} className={ui.buttonSecondary}>Anterior</button>
        <button disabled={currentPage >= totalPages} onClick={onNextPage} className={ui.buttonSecondary}>Siguiente</button>
      </div>
    </div>
  </section>
);

export const ProfileAccessFormPanel: FC<{
  ui: UiClasses;
  roleOptions: RolUsuario[];
  allPermissions: Permiso[];
  tenants: TenantRow[];
  form: RolePermissionFormState;
  emailLookup: string;
  resolvingEmail: boolean;
  saving: boolean;
  status: string | null;
  statusTone: 'error' | 'success' | null;
  permissionLevelFilter: PermissionLevelFilter;
  trimmedProfileId: string;
  profileExistsInPerfiles: boolean;
  profileIdLooksValid: boolean;
  profileIdInputClassName: string;
  onEmailLookupChange: (value: string) => void;
  onFormPatch: (payload: Partial<RolePermissionFormState>) => void;
  onPermissionLevelFilterChange: (value: PermissionLevelFilter) => void;
  onResolveByEmail: () => void;
  onTogglePermission: (permission: Permiso) => void;
  onSubmit: () => void;
  onDeactivate: () => void;
  onHardDelete: () => void;
  grantorLabel: string;
}> = ({
  ui,
  roleOptions,
  allPermissions,
  tenants,
  form,
  emailLookup,
  resolvingEmail,
  saving,
  status,
  statusTone,
  permissionLevelFilter,
  trimmedProfileId,
  profileExistsInPerfiles,
  profileIdLooksValid,
  profileIdInputClassName,
  onEmailLookupChange,
  onFormPatch,
  onPermissionLevelFilterChange,
  onResolveByEmail,
  onTogglePermission,
  onSubmit,
  onDeactivate,
  onHardDelete,
  grantorLabel,
}) => (
  <section className={`xl:col-span-3 ${ui.card} p-4 space-y-4`}>
    <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3">
      <p className="text-[11px] font-black uppercase tracking-widest text-indigo-700">Resumen de autorización</p>
      <div className="mt-2 grid gap-2 md:grid-cols-4">
        <div className="rounded-lg border border-indigo-200 bg-white px-3 py-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Quién otorga</p>
          <p className="text-xs font-semibold text-slate-800">{grantorLabel}</p>
        </div>
        <div className="rounded-lg border border-indigo-200 bg-white px-3 py-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">A quién se otorga</p>
          <p className="text-xs font-semibold text-slate-800">
            {`${form.nombre || 'Usuario'} ${form.apellido || ''}`.trim() || 'Usuario sin nombre'}
          </p>
          <p className="text-[10px] text-slate-500 break-all">{form.profileId || 'UUID pendiente'}</p>
        </div>
        <div className="rounded-lg border border-indigo-200 bg-white px-3 py-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Dónde tendrá acceso</p>
          <p className="text-xs font-semibold text-slate-800">{tenants.find((tenant) => tenant.id === form.establecimientoId)?.nombre ?? 'Tenant no seleccionado'}</p>
        </div>
        <div className="rounded-lg border border-indigo-200 bg-white px-3 py-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nivel de acceso</p>
          <p className="text-xs font-semibold text-slate-800">{ROLE_LABELS[form.rol].label}</p>
          <p className="text-[10px] text-slate-500">{form.permisos.length} permisos activos</p>
        </div>
      </div>
      <p className="mt-2 text-[11px] text-indigo-800">
        Cada permiso define una acción concreta. Marca solo lo necesario para el trabajo diario del usuario.
      </p>
    </div>

    <div className="grid md:grid-cols-2 gap-3">
      <label className="space-y-1 text-xs md:col-span-2">
        <span className="font-black uppercase tracking-widest text-slate-500">Buscar por email (Auth)</span>
        <div className="flex flex-col md:flex-row gap-2">
          <input
            value={emailLookup}
            onChange={(e) => onEmailLookupChange(e.target.value)}
            placeholder="usuario@colegio.cl"
            className={ui.input}
          />
          <button onClick={onResolveByEmail} disabled={resolvingEmail} className={ui.buttonSecondary}>
            {resolvingEmail ? 'Buscando...' : 'Obtener UUID'}
          </button>
        </div>
      </label>
      <label className="space-y-1 text-xs">
        <span className="font-black uppercase tracking-widest text-slate-500">User UUID</span>
        <input
          value={form.profileId}
          onChange={(e) => onFormPatch({ profileId: e.target.value })}
          placeholder="UUID auth.users / perfiles.id"
          className={profileIdInputClassName}
        />
        {profileIdLooksValid && (
          <p className={`text-[11px] ${profileExistsInPerfiles ? 'text-emerald-700' : 'text-amber-700'}`}>
            {profileExistsInPerfiles
              ? 'UUID encontrado en tabla perfiles: puedes desactivar o borrar.'
              : 'UUID valido, pero sin fila en perfiles: crea/carga perfil antes de borrar.'}
          </p>
        )}
      </label>
      <label className="space-y-1 text-xs">
        <span className="font-black uppercase tracking-widest text-slate-500">Tenant</span>
        <select value={form.establecimientoId ?? ''} onChange={(e) => onFormPatch({ establecimientoId: e.target.value || null })} className={ui.input}>
          <option value="">Sin tenant</option>
          {tenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>{tenant.nombre}</option>
          ))}
        </select>
      </label>
      <label className="space-y-1 text-xs">
        <span className="font-black uppercase tracking-widest text-slate-500">Nombre</span>
        <input value={form.nombre} onChange={(e) => onFormPatch({ nombre: e.target.value })} className={ui.input} />
      </label>
      <label className="space-y-1 text-xs">
        <span className="font-black uppercase tracking-widest text-slate-500">Apellido</span>
        <input value={form.apellido} onChange={(e) => onFormPatch({ apellido: e.target.value })} className={ui.input} />
      </label>
      <label className="space-y-1 text-xs">
        <span className="font-black uppercase tracking-widest text-slate-500">Rol</span>
        <select value={form.rol} onChange={(e) => onFormPatch({ rol: e.target.value as RolUsuario })} className={ui.input}>
          {roleOptions.map((role) => (
            <option key={role} value={role}>{ROLE_LABELS[role].label}</option>
          ))}
        </select>
        <p className="text-[11px] text-slate-500">{ROLE_LABELS[form.rol].help}</p>
      </label>
      <label className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-xs">
        <span className="font-black uppercase tracking-widest text-slate-500">Activo</span>
        <input type="checkbox" checked={form.activo} onChange={(e) => onFormPatch({ activo: e.target.checked })} />
      </label>
    </div>

    <div>
      <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Permisos y privilegios</p>
      <p className="text-[11px] text-slate-600 mb-3">Estado visual: <span className="font-semibold text-emerald-700">Permitido</span> o <span className="font-semibold text-slate-500">No permitido</span>.</p>
      <div className="mb-3 rounded-xl border border-slate-200 bg-white p-2">
        <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Filtro por nivel de acceso</p>
        <div className="grid grid-cols-3 gap-2">
          {(['Basico', 'Operativo', 'Critico'] as PermissionLevelFilter[]).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => onPermissionLevelFilterChange(level)}
              className={`rounded-lg border px-2 py-1.5 text-[11px] font-bold transition-all ${
                permissionLevelFilter === level
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {level === 'Basico' ? 'Básico' : level}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {Object.entries(
          allPermissions.reduce<Record<string, Permiso[]>>((acc, permission) => {
            const area = PERMISSION_LABELS[permission].area;
            if (!acc[area]) acc[area] = [];
            acc[area].push(permission);
            return acc;
          }, {})
        ).map(([area, permissions]) => (
          <div key={area} className="rounded-xl border border-slate-200 bg-slate-50/50 p-2.5">
            <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-slate-600">{area}</p>
            <div className="grid md:grid-cols-2 gap-2">
              {permissions
                .filter((permission) => PERMISSION_LABELS[permission].level === permissionLevelFilter)
                .map((permission) => {
                const descriptor = PERMISSION_LABELS[permission];
                const enabled = form.permisos.includes(permission);
                return (
                  <label
                    key={permission}
                    className={`rounded-[0.75rem] border px-2.5 py-2 text-xs transition-all duration-200 ease-in-out cursor-pointer ${
                      enabled
                        ? 'border-emerald-300 bg-emerald-50'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <input type="checkbox" checked={enabled} onChange={() => onTogglePermission(permission)} className="mt-0.5" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">{descriptor.label}</span>
                          <span className={`inline-flex rounded-full border px-1.5 py-0.5 text-[10px] font-bold ${LEVEL_STYLES[descriptor.level]}`}>
                            {descriptor.level}
                          </span>
                          <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-bold ${enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                            {enabled ? 'Permitido' : 'No permitido'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">{descriptor.help}</p>
                        <p className="text-[10px] text-slate-500">{descriptor.example}</p>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
            {permissions.filter((permission) => PERMISSION_LABELS[permission].level === permissionLevelFilter).length === 0 && (
              <p className="text-[11px] text-slate-500">No hay permisos de este nivel en esta área.</p>
            )}
          </div>
        ))}
      </div>
    </div>

    <div className="flex items-center gap-3">
      <button onClick={onSubmit} disabled={saving} className={ui.buttonPrimary}>{saving ? 'Guardando...' : 'Guardar autorización'}</button>
      <button onClick={onDeactivate} disabled={saving} className={ui.buttonDanger}>Desactivar perfil</button>
      <button
        onClick={onHardDelete}
        disabled={saving || !profileExistsInPerfiles}
        title={!profileExistsInPerfiles ? 'El UUID debe existir en tabla perfiles para borrar.' : undefined}
        className={ui.buttonDanger}
      >
        Borrado fisico
      </button>
      {!profileExistsInPerfiles && trimmedProfileId.length > 0 && (
        <p className="text-xs text-amber-700">UUID cargado sin fila en `perfiles`; el borrado físico está bloqueado.</p>
      )}
      {status && (
        <p className={`inline-flex items-center gap-1 rounded-[0.75rem] px-3 py-2 text-xs ${statusTone === 'error' ? 'bg-rose-50 text-rose-700' : statusTone === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-600'}`}>
          {status}
        </p>
      )}
    </div>
  </section>
);

export const ConfirmActionModal: FC<{
  action: ConfirmAction | null;
  ui: UiClasses;
  onCancel: () => void;
  onConfirm: () => void;
}> = ({ action, ui, onCancel, onConfirm }) => {
  if (!action) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className={`${ui.card} w-full max-w-md p-5 space-y-3`}>
        <h3 className={ui.cardTitle}>Confirmar acción crítica</h3>
        <p className="text-sm text-slate-700">
          {action.type === 'delete'
            ? 'Esta acción eliminará físicamente el perfil si no tiene referencias históricas. No se puede deshacer.'
            : 'Esta acción desactivará el perfil y removerá permisos operativos.'}
        </p>
        <p className="text-xs text-slate-500 break-all">{action.profile.id}</p>
        <div className="flex justify-end gap-2">
          <button className={ui.buttonSecondary} onClick={onCancel}>Cancelar</button>
          <button className={action.type === 'delete' ? ui.buttonDanger : ui.buttonPrimary} onClick={onConfirm}>Confirmar</button>
        </div>
      </div>
    </div>
  );
};

export type { ConfirmAction };
