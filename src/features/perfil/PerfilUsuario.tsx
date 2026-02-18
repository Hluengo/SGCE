import React, { useEffect, useState } from 'react';
import { supabase } from '@/shared/lib/supabaseClient';

const ROLE_OPTIONS = [
  'admin',
  'director',
  'convivencia',
  'dupla',
  'inspector',
  'sostenedor'
];

const PerfilUsuario: React.FC = () => {
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!supabase) return;
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        setIsLoading(false);
        setStatus('Inicia sesion para ver tu perfil.');
        return;
      }
      setEmail(user.email ?? '');
      const { data, error } = await supabase
        .from('perfiles')
        .select('nombre, rol')
        .eq('id', user.id)
        .single();
      if (!error && data) {
        setNombre(data.nombre ?? '');
        setRol(String(data.rol ?? ''));
      }
      setIsLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!supabase) {
      setStatus('Error de conexion.');
      return;
    }
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) {
      setStatus('Inicia sesion para guardar.');
      return;
    }
    if (!nombre.trim()) {
      setStatus('Nombre es obligatorio.');
      return;
    }
    if (!rol || !ROLE_OPTIONS.includes(rol)) {
      setStatus('Selecciona un rol valido.');
      return;
    }

    setIsSaving(true);
    setStatus('');

    const { error: perfilError } = await supabase
      .from('perfiles')
      .update({ nombre: nombre.trim(), rol })
      .eq('id', user.id);

    const { error: userError } = await supabase.auth.updateUser({
      data: {
        display_name: nombre.trim(),
        Display_Name: nombre.trim()
      }
    });

    if (perfilError || userError) {
      setStatus('No se pudo guardar.');
    } else {
      setStatus('Guardado correctamente.');
    }
    setIsSaving(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xl p-6 md:p-8">
        <h1 className="text-xl font-black text-slate-900 uppercase tracking-widest">Perfil</h1>
        <p className="text-xs text-slate-500 font-bold mt-1">Informacion de usuario</p>

        {isLoading ? (
          <div className="mt-6 text-slate-400 text-sm font-semibold">Cargando...</div>
        ) : (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nombre</label>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-800"
                placeholder="Nombre completo"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rol</label>
              <select
                value={rol}
                onChange={(e) => setRol(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-800"
              >
                <option value="">Selecciona rol</option>
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email</p>
              <p className="text-sm font-bold text-slate-800 mt-1">{email || 'Sin email'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estado</p>
              <p className="text-sm font-bold text-slate-800 mt-1">{status || 'Activo'}</p>
            </div>
            <div className="md:col-span-2">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`w-full px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest ${isSaving ? 'bg-slate-200 text-slate-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              >
                {isSaving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerfilUsuario;