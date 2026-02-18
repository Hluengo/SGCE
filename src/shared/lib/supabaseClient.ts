import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Validación de variables de entorno en desarrollo
if (!supabaseUrl || !supabaseAnonKey) {
  if (import.meta.env.DEV) {
    console.warn(
      '⚠️ Supabase configuration warning:\n' +
      'VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY are not set.\n' +
      'The application will work with mock data only.'
    );
  }
}

// Opciones del cliente Supabase con manejo de eventos de auth
const createSupabaseClient = (): SupabaseClient | null => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });

  // Escuchar eventos de autenticación para manejar errores de token
  client.auth.onAuthStateChange((event, session) => {
    if (event === 'TOKEN_REFRESHED') {
      console.log('🔄 Token refreshed successfully');
    } else if (event === 'SIGNED_OUT') {
      console.log('👋 User signed out');
      localStorage.removeItem('supabase.auth.token');
    } else if (event === 'USER_UPDATED') {
      console.log('👤 User updated');
    } else if (event === 'INITIAL_SESSION') {
      console.log('📱 Initial session loaded');
    }
  });

  return client;
};

export const supabase = createSupabaseClient();

/**
 * Helper seguro para usar Supabase
 * Lanza error descriptivo si Supabase no está configurado
 */
export const safeSupabase = () => {
  if (!supabase) {
    throw new Error(
      'Supabase client is not initialized. ' +
      'Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.'
    );
  }
  return supabase;
};

/**
 * Función para cerrar sesión limpiamente manejando errores de token
 */
export const signOutSafely = async (): Promise<void> => {
  if (!supabase) return;
  
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.warn('Sign out warning:', error.message);
    }
  } catch (err) {
    console.error('Sign out error:', err);
    // Limpiar manualmente
    localStorage.removeItem('supabase.auth.token');
  }
};
