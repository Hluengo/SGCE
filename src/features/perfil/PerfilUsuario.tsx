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
  const [state, setState] = useState({
    form: { email: '', nombre: '', rol: '' },
    isLoading: true,
    isSaving: false,
    status: ''
  });
  const form = state.form;

  useEffect(() => {
    const load = async () => {
      let nextForm = { email: '', nombre: '', rol: '' };
      let nextStatus = '';

      if (!supabase) {
        nextStatus = 'Error de conexion.';
      } else {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData.session?.user;
        if (!user) {
          nextStatus = 'Inicia sesion para ver tu perfil.';
        } else {
          nextForm = { email: user.email ?? '', nombre: '', rol: '' };
          const { data, error } = await supabase
            .from('perfiles')
            .select('nombre, rol')
            .eq('id', user.id)
            .single();

          if (!error && data) {
            nextForm = {
              email: user.email ?? '',
              nombre: data.nombre ?? '',
              rol: String(data.rol ?? '')
            };
          }
        }
      }

      setState(prev => ({ ...prev, form: nextForm, isLoading: false, status: nextStatus }));
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!supabase) {
      setState(prev => ({ ...prev, status: 'Error de conexion.' }));
      return;
    }
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) {
      setState(prev => ({ ...prev, status: 'Inicia sesion para guardar.' }));
      return;
    }
    if (!form.nombre.trim()) {
      setState(prev => ({ ...prev, status: 'Nombre es obligatorio.' }));
      return;
    }
    if (!form.rol || !ROLE_OPTIONS.includes(form.rol)) {
      setState(prev => ({ ...prev, status: 'Selecciona un rol valido.' }));
      return;
    }

    setState(prev => ({ ...prev, isSaving: true, status: '' }));

    const { error: perfilError } = await supabase
      .from('perfiles')
      .update({ nombre: form.nombre.trim(), rol: form.rol })
      .eq('id', user.id);

    const { error: userError } = await supabase.auth.updateUser({
      data: {
        display_name: form.nombre.trim(),
        Display_Name: form.nombre.trim()
      }
    });

    if (perfilError || userError) {
      setState(prev => ({ ...prev, status: 'No se pudo guardar.' }));
    } else {
      setState(prev => ({ ...prev, status: 'Guardado correctamente.' }));
    }
    setState(prev => ({ ...prev, isSaving: false }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xl p-6 md:p-8">
        <h1 className="text-xl font-black text-slate-900 uppercase tracking-widest">Perfil</h1>
        <p className="text-xs text-slate-500 font-bold mt-1">Informacion de usuario</p>

        {state.isLoading ? (
          <div className="mt-6 text-slate-400 text-sm font-semibold">Cargando...</div>
        ) : (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="perfil-nombre" className="text-xs font-black uppercase tracking-widest text-slate-400">Nombre</label>
              <input
                id="perfil-nombre"
                value={form.nombre}
                onChange={(e) => setState(prev => ({ ...prev, form: { ...prev.form, nombre: e.target.value } }))}
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-800"
                placeholder="Nombre completo"
              />
            </div>
            <div>
              <label htmlFor="perfil-rol" className="text-xs font-black uppercase tracking-widest text-slate-400">Rol</label>
              <select
                id="perfil-rol"
                value={form.rol}
                onChange={(e) => setState(prev => ({ ...prev, form: { ...prev.form, rol: e.target.value } }))}
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-800"
              >
                <option value="">Selecciona rol</option>
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Email</p>
              <p className="text-sm font-bold text-slate-800 mt-1">{form.email || 'Sin email'}</p>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Estado</p>
              <p className="text-sm font-bold text-slate-800 mt-1">{state.status || 'Activo'}</p>
            </div>
            <div className="md:col-span-2">
              <button
                onClick={handleSave}
                disabled={state.isSaving}
                className={`w-full px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest ${state.isSaving ? 'bg-slate-200 text-slate-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              >
                {state.isSaving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerfilUsuario;
