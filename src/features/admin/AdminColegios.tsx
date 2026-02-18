import React, { useEffect, useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  Upload,
  X,
  Save,
  AlertCircle,
  CheckCircle,
  Eye,
  Download,
  Palette
} from 'lucide-react';
import { supabase } from '@/shared/lib/supabaseClient';
import { useTenant } from '@/shared/context/TenantContext';
import ImportarEstudiantes from '@/shared/components/ImportarEstudiantes';
import BrandingConfigForm from './BrandingConfigForm';

interface Colegio {
  id: string;
  nombre: string;
  rbd: string;
  activo: boolean;
  created_at?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  niveles_educativos?: string[] | null;
  establecimiento_id?: string;
}

interface Estudiante {
  id: string;
  nombre_completo: string;
  rut: string;
  curso: string;
}

const NIVELES_DISPONIBLES = ['Parvularia', 'Basica', 'Media', 'Tecnico Profesional', 'Adultos'];

const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'object' && err !== null && 'message' in err && typeof (err as { message?: unknown }).message === 'string') {
    return (err as { message: string }).message;
  }
  return 'Error desconocido';
};

const AdminColegios: React.FC = () => {
  const { tenantId, setTenantId } = useTenant();

  const [colegios, setColegios] = useState<Colegio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'activos' | 'inactivos'>('todos');
  const [filtroNivel, setFiltroNivel] = useState<string>('todos');
  const [modalAbierto, setModalAbierto] = useState<'crear' | 'editar' | 'importar' | null>(null);
  const [colegioSeleccionado, setColegioSeleccionado] = useState<Colegio | null>(null);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [mostrarListaEstudiantes, setMostrarListaEstudiantes] = useState(false);
  const [eliminando, setEliminando] = useState<string | null>(null);
  const [mostrarBrandingModal, setMostrarBrandingModal] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    rbd: '',
    direccion: '',
    telefono: '',
    email: '',
    niveles_educativos: [] as string[],
    activo: true
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    void cargarColegios();
  }, []);

  const cargarColegios = async () => {
    setIsLoading(true);

    if (!supabase) {
      setColegios([
        {
          id: 'demo-establecimiento',
          nombre: 'Colegio Demo',
          rbd: 'DEMO',
          activo: true,
          direccion: 'Calle Demo 123',
          telefono: '+56912345678',
          email: 'demo@colegio.cl',
          niveles_educativos: ['Basica', 'Media']
        }
      ]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('establecimientos')
        .select('id, nombre, rbd, direccion, telefono, email, niveles_educativos, activo, created_at')
        .order('nombre');

      if (fetchError) throw fetchError;
      setColegios((data as Colegio[]) || []);
    } catch (err) {
      console.error('Error cargando colegios:', err);
      setError('Error al cargar los colegios');
    } finally {
      setIsLoading(false);
    }
  };

  const cargarEstudiantes = async (colegioId: string) => {
    if (!supabase) {
      setEstudiantes([
        { id: '1', nombre_completo: 'Juan Perez', rut: '12345678-9', curso: '8A' },
        { id: '2', nombre_completo: 'Maria Gonzalez', rut: '98765432-1', curso: '7B' }
      ]);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('estudiantes')
        .select('id, nombre_completo, rut, curso')
        .eq('establecimiento_id', colegioId)
        .order('nombre_completo')
        .limit(200);

      if (fetchError) throw fetchError;
      setEstudiantes(data || []);
    } catch (err) {
      console.error('Error cargando estudiantes:', err);
    }
  };

  const colegiosFiltrados = colegios.filter((col) => {
    const textoBusqueda = busqueda.toLowerCase();
    const cumpleBusqueda =
      col.nombre.toLowerCase().includes(textoBusqueda) ||
      col.rbd?.toLowerCase().includes(textoBusqueda) ||
      col.email?.toLowerCase().includes(textoBusqueda);

    const cumpleEstado =
      filtroEstado === 'todos' ||
      (filtroEstado === 'activos' && col.activo) ||
      (filtroEstado === 'inactivos' && !col.activo);

    const cumpleNivel =
      filtroNivel === 'todos' ||
      (col.niveles_educativos || []).includes(filtroNivel);

    return cumpleBusqueda && cumpleEstado && cumpleNivel;
  });

  const abrirModalCrear = () => {
    setFormData({
      nombre: '',
      rbd: '',
      direccion: '',
      telefono: '',
      email: '',
      niveles_educativos: [],
      activo: true
    });
    setColegioSeleccionado(null);
    setModalAbierto('crear');
    setError(null);
  };

  const abrirModalEditar = (colegio: Colegio) => {
    setFormData({
      nombre: colegio.nombre,
      rbd: colegio.rbd || '',
      direccion: colegio.direccion || '',
      telefono: colegio.telefono || '',
      email: colegio.email || '',
      niveles_educativos: colegio.niveles_educativos || [],
      activo: colegio.activo
    });
    setColegioSeleccionado(colegio);
    setModalAbierto('editar');
    setError(null);
  };

  const abrirBrandingModal = (colegio: Colegio) => {
    setColegioSeleccionado(colegio);
    setMostrarBrandingModal(true);
  };

  const handleGuardar = async () => {
    if (!formData.nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('El email no tiene un formato valido');
      return;
    }

    setGuardando(true);
    setError(null);

    try {
      if (modalAbierto === 'crear') {
        if (!supabase) throw new Error('Supabase no disponible');
        const { data, error: insertError } = await supabase
          .from('establecimientos')
          .insert({
            nombre: formData.nombre,
            rbd: formData.rbd || null,
            direccion: formData.direccion || null,
            telefono: formData.telefono || null,
            email: formData.email || null,
            niveles_educativos: formData.niveles_educativos,
            activo: formData.activo
          })
          .select()
          .single();

        if (insertError) throw insertError;

        setColegios([...colegios, data as Colegio]);
        setSuccess('Colegio creado correctamente');
      } else if (modalAbierto === 'editar' && colegioSeleccionado) {
        const { error: updateError } = !supabase
          ? { error: null }
          : await supabase
              .from('establecimientos')
              .update({
                nombre: formData.nombre,
                rbd: formData.rbd || null,
                direccion: formData.direccion || null,
                telefono: formData.telefono || null,
                email: formData.email || null,
                niveles_educativos: formData.niveles_educativos,
                activo: formData.activo
              })
              .eq('id', colegioSeleccionado.id);

        if (updateError) throw updateError;

        setColegios(
          colegios.map((c) =>
            c.id === colegioSeleccionado.id
              ? { ...c, ...formData }
              : c
          )
        );
        setSuccess('Colegio actualizado correctamente');
      }

      setModalAbierto(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (colegio: Colegio) => {
    if (!confirm(`¿Estas seguro de eliminar "${colegio.nombre}"?`)) return;

    setEliminando(colegio.id);

    try {
      if (!supabase) throw new Error('Supabase no disponible');
      const { error: deleteError } = await supabase
        .from('establecimientos')
        .delete()
        .eq('id', colegio.id);

      if (deleteError) throw deleteError;

      setColegios(colegios.filter((c) => c.id !== colegio.id));
      setSuccess('Colegio eliminado correctamente');
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setEliminando(null);
    }
  };

  const handleCambiarColegio = (colegio: Colegio) => {
    setTenantId(colegio.id);
    setSuccess(`Cambiado a ${colegio.nombre}`);
  };

  const abrirImportar = (colegio: Colegio) => {
    setColegioSeleccionado(colegio);
    setTenantId(colegio.id);
    setModalAbierto('importar');
  };

  const handleVerEstudiantes = async (colegio: Colegio) => {
    setColegioSeleccionado(colegio);
    await cargarEstudiantes(colegio.id);
    setMostrarListaEstudiantes(true);
  };

  const handleDescargarEstudiantes = () => {
    if (estudiantes.length === 0) return;

    const headers = ['rut', 'nombre_completo', 'curso'];
    const rows = estudiantes.map((e) => [e.rut, e.nombre_completo, e.curso].join(','));
    const csv = [headers.join(','), ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `estudiantes_${colegioSeleccionado?.nombre || 'colegio'}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Building2 className="w-7 h-7 text-blue-400" />
            Administracion de Colegios
          </h1>
          <p className="text-slate-400 mt-1">
            Gestiona los establecimientos educacionales
          </p>
        </div>
        <button
          onClick={abrirModalCrear}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Colegio
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-medium">Error</p>
            <p className="text-sm text-red-300/80">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <p className="text-green-400">{success}</p>
          <button onClick={() => setSuccess(null)} className="ml-auto text-green-400 hover:text-green-300">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, RBD o email..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as 'todos' | 'activos' | 'inactivos')}
            className="px-3 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todos">Todos</option>
            <option value="activos">Activos</option>
            <option value="inactivos">Inactivos</option>
          </select>
          <select
            value={filtroNivel}
            onChange={(e) => setFiltroNivel(e.target.value)}
            className="px-3 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todos">Todos niveles</option>
            {NIVELES_DISPONIBLES.map((nivel) => (
              <option key={nivel} value={nivel}>{nivel}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 mt-3">Cargando colegios...</p>
        </div>
      ) : colegiosFiltrados.length === 0 ? (
        <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700">
          <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No se encontraron colegios</p>
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="mt-2 text-blue-400 hover:text-blue-300 text-sm"
            >
              Limpiar busqueda
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {colegiosFiltrados.map((colegio) => (
            <div
              key={colegio.id}
              className={`
                bg-slate-800 rounded-xl border p-5 transition-all hover:shadow-lg
                ${colegio.id === tenantId ? 'border-blue-500 ring-1 ring-blue-500/30' : 'border-slate-700 hover:border-slate-600'}
              `}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white truncate">{colegio.nombre}</h3>
                    {colegio.id === tenantId && (
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                        Actual
                      </span>
                    )}
                  </div>
                  {colegio.rbd && (
                    <p className="text-sm text-slate-400 mt-0.5">RBD: {colegio.rbd}</p>
                  )}
                </div>
                <div
                  className={`
                    w-3 h-3 rounded-full flex-shrink-0
                    ${colegio.activo ? 'bg-green-400' : 'bg-slate-500'}
                  `}
                  title={colegio.activo ? 'Activo' : 'Inactivo'}
                />
              </div>

              <div className="space-y-1.5 text-sm text-slate-400 mb-4">
                {colegio.direccion && <p className="truncate">{colegio.direccion}</p>}
                {colegio.email && <p className="truncate">{colegio.email}</p>}
                {colegio.telefono && <p>{colegio.telefono}</p>}
                {colegio.niveles_educativos && colegio.niveles_educativos.length > 0 && (
                  <p className="text-xs text-blue-300/90">
                    Niveles: {colegio.niveles_educativos.join(', ')}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-700">
                <button
                  onClick={() => void handleVerEstudiantes(colegio)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  title="Ver estudiantes"
                >
                  <Users className="w-4 h-4" />
                  Estudiantes
                </button>
                <button
                  onClick={() => abrirImportar(colegio)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg transition-colors"
                  title="Importar estudiantes"
                >
                  <Upload className="w-4 h-4" />
                  Importar
                </button>
              </div>

              <div className="flex items-center gap-2 mt-2">
                {colegio.id !== tenantId && (
                  <button
                    onClick={() => handleCambiarColegio(colegio)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Cambiar a este
                  </button>
                )}
                <button
                  onClick={() => abrirBrandingModal(colegio)}
                  className="p-2 text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors"
                  title="Configurar branding"
                >
                  <Palette className="w-4 h-4" />
                </button>
                <button
                  onClick={() => abrirModalEditar(colegio)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  title="Editar"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => void handleEliminar(colegio)}
                  disabled={eliminando === colegio.id}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white">
                {modalAbierto === 'crear' ? 'Nuevo Colegio' : 'Editar Colegio'}
              </h2>
              <button
                onClick={() => setModalAbierto(null)}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nombre del establecimiento"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  RBD
                </label>
                <input
                  type="text"
                  value={formData.rbd}
                  onChange={(e) => setFormData({ ...formData, rbd: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Rol Base de Datos"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Direccion
                </label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Direccion del establecimiento"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Telefono
                  </label>
                  <input
                    type="text"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+56 9 XXXX XXXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="email@colegio.cl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Niveles educativos
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {NIVELES_DISPONIBLES.map((nivel) => {
                    const checked = formData.niveles_educativos.includes(nivel);
                    return (
                      <label key={nivel} className="flex items-center gap-2 text-sm text-slate-300">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...formData.niveles_educativos, nivel]
                              : formData.niveles_educativos.filter((n) => n !== nivel);
                            setFormData({ ...formData, niveles_educativos: next });
                          }}
                          className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500"
                        />
                        {nivel}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="activo"
                  checked={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="activo" className="text-sm text-slate-300">
                  Colegio activo
                </label>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 border-t border-slate-700">
              <button
                onClick={() => setModalAbierto(null)}
                className="flex-1 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => void handleGuardar()}
                disabled={guardando}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {guardando ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {modalAbierto === 'crear' ? 'Crear' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalAbierto === 'importar' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Importar Estudiantes
                </h2>
                <p className="text-sm text-slate-400">
                  {colegioSeleccionado?.nombre}
                </p>
              </div>
              <button
                onClick={() => {
                  setModalAbierto(null);
                  void cargarColegios();
                }}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              <ImportarEstudiantes />
            </div>
          </div>
        </div>
      )}

      {mostrarListaEstudiantes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Estudiantes
                </h2>
                <p className="text-sm text-slate-400">
                  {colegioSeleccionado?.nombre} ({estudiantes.length} estudiantes)
                </p>
              </div>
              <button
                onClick={() => setMostrarListaEstudiantes(false)}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              {estudiantes.length > 0 && (
                <div className="flex justify-end mb-3">
                  <button
                    onClick={handleDescargarEstudiantes}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Descargar CSV
                  </button>
                </div>
              )}

              {estudiantes.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No hay estudiantes registrados</p>
                </div>
              ) : (
                <div className="border border-slate-700 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-900/50">
                      <tr>
                        <th className="px-3 py-2 text-left text-slate-400 font-medium">RUT</th>
                        <th className="px-3 py-2 text-left text-slate-400 font-medium">Nombre</th>
                        <th className="px-3 py-2 text-left text-slate-400 font-medium">Curso</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {estudiantes.map((est) => (
                        <tr key={est.id} className="hover:bg-slate-700/30">
                          <td className="px-3 py-2 text-slate-300 font-mono">{est.rut}</td>
                          <td className="px-3 py-2 text-white">{est.nombre_completo}</td>
                          <td className="px-3 py-2 text-slate-300">{est.curso}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Branding */}
      {mostrarBrandingModal && colegioSeleccionado && (
        <BrandingConfigForm
          establecimientoId={colegioSeleccionado.id}
          establecimientoNombre={colegioSeleccionado.nombre}
          onClose={() => {
            setMostrarBrandingModal(false);
            setColegioSeleccionado(null);
          }}
        />
      )}
    </div>
  );
};

export default AdminColegios;
