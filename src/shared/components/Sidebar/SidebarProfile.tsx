import React, { useState } from 'react';
import { ChevronDown, ChevronUp, User, Lock, LogOut, Loader2 } from 'lucide-react';
import useAuth from '@/shared/hooks/useAuth';

interface SidebarProfileProps {
  isCollapsed: boolean;
}

export const SidebarProfile: React.FC<SidebarProfileProps> = ({ isCollapsed }) => {
  const { usuario, signOut, updatePassword } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [pwStatus, setPwStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isUpdatingPw, setIsUpdatingPw] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  const handlePasswordChange = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!newPassword.trim()) {
      setPwStatus({ type: 'error', message: 'Ingresa una contrasena.' });
      return;
    }

    if (newPassword.length < 10) {
      setPwStatus({ type: 'error', message: 'Minimo 10 caracteres.' });
      return;
    }

    setIsUpdatingPw(true);
    setPwStatus(null);

    try {
      await updatePassword(newPassword);
      setPwStatus({ type: 'success', message: 'Contrasena actualizada.' });
      setNewPassword('');
    } catch (error) {
      setPwStatus({ type: 'error', message: error instanceof Error ? error.message : 'Error actualizando contrasena.' });
    } finally {
      setIsUpdatingPw(false);
    }
  };

  if (isCollapsed) {
    return (
      <div className="p-3 border-t border-slate-700">
        <button
          onClick={() => void handleSignOut()}
          className="w-full min-h-11 flex justify-center items-center p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          title="Cerrar sesion"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-slate-700 p-4">
      <div className="relative">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="w-full min-h-11 flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 transition-colors"
          aria-expanded={isMenuOpen}
          aria-haspopup="true"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg">
            {usuario ? <User className="w-5 h-5 text-white" /> : <Loader2 className="w-5 h-5 text-white animate-spin" />}
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-medium text-white truncate">{usuario ? `${usuario.nombre} ${usuario.apellido}`.trim() : 'Cargando...'}</p>
            <p className="text-xs text-slate-400 capitalize">{usuario?.rol ?? 'sin rol'}</p>
          </div>
          {isMenuOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {isMenuOpen && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-slate-800 rounded-lg shadow-xl border border-slate-700 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="p-3 border-b border-slate-700">
              <div className="flex items-center gap-2 mb-2 text-slate-300">
                <Lock className="w-4 h-4" />
                <span className="text-xs font-medium">Cambiar contrasena</span>
              </div>
              <form onSubmit={handlePasswordChange} className="space-y-2">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nueva contrasena"
                  aria-label="Nueva contrasena"
                  className="w-full px-3 py-1.5 text-sm bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={isUpdatingPw}
                  className="w-full min-h-11 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isUpdatingPw ? 'Actualizando...' : 'Actualizar'}
                </button>
                {pwStatus && (
                  <p className={`text-xs ${pwStatus.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                    {pwStatus.message}
                  </p>
                )}
              </form>
            </div>

            <button
              onClick={() => void handleSignOut()}
              className="w-full min-h-11 flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-slate-700 transition-colors"
              role="menuitem"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesion</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SidebarProfile;
