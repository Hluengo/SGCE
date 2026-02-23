import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, LockKeyhole, MailCheck, ShieldCheck } from 'lucide-react';
import useAuth from '@/shared/hooks/useAuth';
import { useTenant } from '@/shared/context/TenantContext';
import praxiaNovusLogo from '@/assets/praxia-novus-logo-auth.png';
import FeatureList from '@/features/auth/components/FeatureList';
import InfoCardGrid from '@/features/auth/components/InfoCardGrid';
import { AUTH_FEATURES, AUTH_INFO_CARDS } from '@/features/auth/content';

const loginSchema = z.object({
  email: z.string().trim().email('Ingresa un correo valido'),
  password: z
    .string()
    .min(8, 'La contrasena debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Incluye al menos una letra mayuscula')
    .regex(/[0-9]/, 'Incluye al menos un numero'),
});

const forgotSchema = z.object({
  email: z.string().trim().email('Ingresa un correo valido'),
});

const resetSchema = z
  .object({
    password: z
      .string()
      .min(10, 'La contrasena debe tener al menos 10 caracteres')
      .regex(/[A-Z]/, 'Incluye al menos una letra mayuscula')
      .regex(/[a-z]/, 'Incluye al menos una letra minuscula')
      .regex(/[0-9]/, 'Incluye al menos un numero')
      .regex(/[^A-Za-z0-9]/, 'Incluye al menos un simbolo'),
    confirmPassword: z.string().min(1, 'Confirma la contrasena'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Las contrasenas no coinciden',
    path: ['confirmPassword'],
  });

type LoginValues = z.infer<typeof loginSchema>;
type ForgotValues = z.infer<typeof forgotSchema>;
type ResetValues = z.infer<typeof resetSchema>;
type AuthTab = 'login' | 'forgot' | 'reset';

const authTabs: ReadonlyArray<{ id: AuthTab; label: string }> = [
  { id: 'login', label: 'Ingreso' },
  { id: 'forgot', label: 'Recuperar' },
  { id: 'reset', label: 'Nueva clave' },
];

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { signIn, requestPasswordReset, updatePassword, isAuthenticated, isPasswordRecovery } = useAuth();
  const { establecimiento } = useTenant();
  const [showVisualPanel, setShowVisualPanel] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(min-width: 1024px)').matches;
  });

  const nextPath = useMemo(() => {
    const value = params.get('next');
    if (!value) return '/';
    return value.startsWith('/') ? value : '/';
  }, [params]);

  const mode = params.get('mode');
  const [activeTab, setActiveTab] = useState<AuthTab>(mode === 'reset' || isPasswordRecovery ? 'reset' : 'login');
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [globalSuccess, setGlobalSuccess] = useState<string | null>(null);

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const forgotForm = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  const resetForm = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(min-width: 1024px)');
    const update = () => setShowVisualPanel(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (mode === 'reset' || isPasswordRecovery) {
      setActiveTab('reset');
      return;
    }

    if (isAuthenticated && activeTab !== 'reset') {
      navigate(nextPath, { replace: true });
    }
  }, [activeTab, isAuthenticated, isPasswordRecovery, mode, navigate, nextPath]);

  const resetMessages = () => {
    setGlobalError(null);
    setGlobalSuccess(null);
  };

  const handleLoginSubmit = loginForm.handleSubmit(async (values) => {
    resetMessages();
    const { error } = await signIn(values.email, values.password);
    if (error) {
      setGlobalError(error.message || 'No fue posible iniciar sesion');
      return;
    }
    navigate(nextPath, { replace: true });
  });

  const handleForgotSubmit = forgotForm.handleSubmit(async (values) => {
    resetMessages();
    const { error } = await requestPasswordReset(values.email);
    if (error) {
      setGlobalError(error.message || 'No se pudo enviar el correo de recuperacion');
      return;
    }
    setGlobalSuccess('Te enviamos un enlace seguro para recuperar tu cuenta.');
    forgotForm.reset();
  });

  const handleResetSubmit = resetForm.handleSubmit(async (values) => {
    resetMessages();
    try {
      await updatePassword(values.password);
      setGlobalSuccess('Contrasena actualizada correctamente. Inicia sesion nuevamente.');
      resetForm.reset();
      setActiveTab('login');
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : 'No se pudo actualizar la contrasena');
    }
  });

  return (
    <main className="min-h-[100dvh] bg-[radial-gradient(circle_at_top_left,_#0f172a_0%,_#111827_40%,_#020617_100%)] text-slate-100">
      <div className="min-h-[100dvh] w-full grid lg:grid-cols-[1.15fr_0.85fr]">
        {showVisualPanel && (
        <section className="hidden lg:block relative overflow-hidden p-5 lg:p-8 border-b lg:border-b-0 lg:border-r border-white/10">
          <div className="absolute -top-24 -left-20 w-72 h-72 rounded-full bg-cyan-400/20 blur-3xl" aria-hidden="true" />
          <div className="absolute -bottom-20 right-0 w-80 h-80 rounded-full bg-sky-500/20 blur-3xl" aria-hidden="true" />

          <div className="relative z-10 space-y-4">
            <img src={praxiaNovusLogo} alt="Praxia Novus" className="h-28 sm:h-32 lg:h-36 w-auto object-contain rounded-2xl" />

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-300/40 bg-cyan-400/10 text-cyan-100 text-[10px] font-black uppercase tracking-widest">
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              Procedimiento correcto. Respaldo institucional.
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-black leading-[1.05] tracking-tight">Gestion y Cumplimiento Escolar</h1>
              <p className="text-base lg:text-lg text-cyan-100 leading-relaxed max-w-[95%]">
                Plataforma de gobernanza que transforma la convivencia escolar en un proceso trazable, defendible y alineado a las Circulares 781 y 782.
              </p>
            </div>

            <InfoCardGrid cards={AUTH_INFO_CARDS} firstValue={establecimiento?.nombre ?? 'Colegio Demo Convivencia'} />
            <FeatureList items={AUTH_FEATURES} />
          </div>
        </section>
        )}

        <section className="p-6 sm:p-8 lg:p-10 flex items-center justify-center lg:justify-start min-h-[100dvh]">
          <div className="w-full max-w-lg rounded-3xl border border-white/15 bg-slate-900/60 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-black/40">
            <div className="mb-5 lg:hidden">
              <p className="text-xs uppercase tracking-widest font-black text-cyan-200">Gestion y Cumplimiento Escolar</p>
              <p className="mt-2 text-sm text-slate-300">Ingreso seguro para gestionar convivencia, GCC y trazabilidad normativa.</p>
            </div>
            <div className="flex items-center justify-between mb-5">
              <p className="text-xs uppercase tracking-widest font-black text-cyan-200">Acceso seguro</p>
              <Link to="/inicio" className="text-xs font-bold text-slate-300 hover:text-cyan-200 transition-colors">
                Ver inicio
              </Link>
            </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-800/70 p-1.5 rounded-2xl text-xs font-black uppercase tracking-wider" role="tablist" aria-label="Opciones de acceso">
              {authTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-pressed={activeTab === tab.id}
                  onClick={() => {
                    resetMessages();
                    setActiveTab(tab.id);
                  }}
                  className={`py-2 min-h-11 rounded-xl transition-colors ${activeTab === tab.id ? 'bg-cyan-400 text-slate-900' : 'text-slate-300 hover:bg-slate-700/70'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="mt-6 space-y-4">
              {activeTab === 'login' && (
                <form className="space-y-4" onSubmit={handleLoginSubmit} noValidate>
                  <div>
                    <label htmlFor="auth-login-email" className="text-xs uppercase tracking-wider font-black text-slate-300">
                      Correo institucional
                    </label>
                    <input
                      id="auth-login-email"
                      type="email"
                      autoComplete="username"
                      {...loginForm.register('email')}
                      className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-950 px-4 py-3 text-sm focus:outline-none focus:border-cyan-300"
                    />
                    {loginForm.formState.errors.email && <p className="text-xs text-rose-300 mt-1">{loginForm.formState.errors.email.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="auth-login-password" className="text-xs uppercase tracking-wider font-black text-slate-300">
                      Contrasena
                    </label>
                    <input
                      id="auth-login-password"
                      type="password"
                      autoComplete="current-password"
                      {...loginForm.register('password')}
                      className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-950 px-4 py-3 text-sm focus:outline-none focus:border-cyan-300"
                    />
                    {loginForm.formState.errors.password && <p className="text-xs text-rose-300 mt-1">{loginForm.formState.errors.password.message}</p>}
                  </div>
                  <button
                    type="submit"
                    disabled={loginForm.formState.isSubmitting}
                    className="w-full py-3 rounded-xl bg-cyan-400 text-slate-900 text-xs font-black uppercase tracking-widest disabled:opacity-50"
                  >
                    {loginForm.formState.isSubmitting ? 'Validando...' : 'Ingresar'}
                  </button>
                </form>
              )}

              {activeTab === 'forgot' && (
                <form className="space-y-4" onSubmit={handleForgotSubmit} noValidate>
                  <p className="text-xs text-slate-300">Enviaremos un enlace temporal con validez limitada para restablecer tu acceso.</p>
                  <div>
                    <label htmlFor="auth-forgot-email" className="text-xs uppercase tracking-wider font-black text-slate-300">
                      Correo de recuperacion
                    </label>
                    <input
                      id="auth-forgot-email"
                      type="email"
                      autoComplete="email"
                      {...forgotForm.register('email')}
                      className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-950 px-4 py-3 text-sm focus:outline-none focus:border-cyan-300"
                    />
                    {forgotForm.formState.errors.email && <p className="text-xs text-rose-300 mt-1">{forgotForm.formState.errors.email.message}</p>}
                  </div>
                  <button
                    type="submit"
                    disabled={forgotForm.formState.isSubmitting}
                    className="w-full py-3 rounded-xl bg-cyan-400 text-slate-900 text-xs font-black uppercase tracking-widest disabled:opacity-50"
                  >
                    {forgotForm.formState.isSubmitting ? 'Enviando...' : 'Enviar enlace'}
                  </button>
                </form>
              )}

              {activeTab === 'reset' && (
                <form className="space-y-4" onSubmit={handleResetSubmit} noValidate>
                  <p className="text-xs text-slate-300">Define una nueva contrasena robusta para proteger tu sesion.</p>
                  <div>
                    <label htmlFor="auth-reset-password" className="text-xs uppercase tracking-wider font-black text-slate-300">
                      Nueva contrasena
                    </label>
                    <input
                      id="auth-reset-password"
                      type="password"
                      autoComplete="new-password"
                      {...resetForm.register('password')}
                      className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-950 px-4 py-3 text-sm focus:outline-none focus:border-cyan-300"
                    />
                    {resetForm.formState.errors.password && <p className="text-xs text-rose-300 mt-1">{resetForm.formState.errors.password.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="auth-reset-confirm-password" className="text-xs uppercase tracking-wider font-black text-slate-300">
                      Confirmar contrasena
                    </label>
                    <input
                      id="auth-reset-confirm-password"
                      type="password"
                      autoComplete="new-password"
                      {...resetForm.register('confirmPassword')}
                      className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-950 px-4 py-3 text-sm focus:outline-none focus:border-cyan-300"
                    />
                    {resetForm.formState.errors.confirmPassword && (
                      <p className="text-xs text-rose-300 mt-1">{resetForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={resetForm.formState.isSubmitting}
                    className="w-full py-3 rounded-xl bg-cyan-400 text-slate-900 text-xs font-black uppercase tracking-widest disabled:opacity-50"
                  >
                    {resetForm.formState.isSubmitting ? 'Actualizando...' : 'Guardar nueva clave'}
                  </button>
                </form>
              )}

              {globalError && (
                <div role="alert" aria-live="assertive" className="rounded-xl border border-rose-400/50 bg-rose-400/10 p-4 text-xs text-rose-100 flex gap-2 items-start">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                  <p>{globalError}</p>
                </div>
              )}

              {globalSuccess && (
                <div role="status" aria-live="polite" className="rounded-xl border border-emerald-400/50 bg-emerald-400/10 p-4 text-xs text-emerald-100 flex gap-2 items-start">
                  {activeTab === 'login' ? (
                    <LockKeyhole className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                  ) : (
                    <MailCheck className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                  )}
                  <p>{globalSuccess}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default AuthPage;

