import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldCheck, Building2, KeyRound, AlertCircle, MailCheck } from 'lucide-react';
import useAuth from '@/shared/hooks/useAuth';
import { useTenant } from '@/shared/context/TenantContext';

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

const AuthPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { signIn, requestPasswordReset, updatePassword, isAuthenticated, isPasswordRecovery } = useAuth();
  const { establecimiento } = useTenant();

  const nextPath = useMemo(() => {
    const value = params.get('next');
    if (!value) {
      return '/';
    }

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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#0f172a_0%,_#111827_40%,_#020617_100%)] text-slate-100">
      <div className="min-h-screen grid lg:grid-cols-2">
        <section className="relative overflow-hidden p-8 lg:p-14 border-b lg:border-b-0 lg:border-r border-white/10">
          <div className="absolute -top-24 -left-20 w-72 h-72 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute -bottom-20 right-0 w-80 h-80 rounded-full bg-sky-500/20 blur-3xl" />

          <div className="relative z-10 max-w-xl space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-300/40 bg-cyan-400/10 text-cyan-100 text-xs font-black uppercase tracking-widest">
              <ShieldCheck className="w-4 h-4" />
              Motor de Cumplimiento Normativo • Circulares 781 y 782
            </div>

            <div>
              <h1 className="text-3xl lg:text-5xl font-black leading-tight tracking-tight">
                Gestor Integral de Convivencia Escolar
              </h1>
              <p className="mt-4 text-sm lg:text-base text-slate-300 leading-relaxed">
                Plataforma multi-tenant que asegura el cumplimiento del "Justo y Racional Procedimiento" exigido por la Superintendencia de Educación. Automatiza investigaciones, medidas formativas y gestión colaborativa de conflictos.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 text-xs">
              <article className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-black uppercase tracking-widest text-cyan-200">Establecimientos Conectados</p>
                <p className="mt-2 text-sm font-bold">{establecimiento?.nombre ?? 'Colegio Demo Convivencia'}</p>
                <p className="text-slate-400 mt-1">Datos aislados y seguros</p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-black uppercase tracking-widest text-cyan-200">Estado Legal</p>
                <p className="mt-2 text-sm font-bold">Vigente para 2026</p>
                <p className="text-slate-400 mt-1">Conforme Circulares 781/782</p>
              </article>
            </div>

            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex gap-3 items-start"><ShieldCheck className="w-4 h-4 mt-0.5 text-cyan-300" />Workflow de 4 niveles: faltas leves, relevantes, expulsión y cancelación.</li>
              <li className="flex gap-3 items-start"><Building2 className="w-4 h-4 mt-0.5 text-cyan-300" />Gestión Colaborativa de Conflictos (GCC) y mediación obligatoria.</li>
              <li className="flex gap-3 items-start"><KeyRound className="w-4 h-4 mt-0.5 text-cyan-300" />Registro documental íntegro, derecho a defensa y recursos de reconsideración.</li>
            </ul>
          </div>
        </section>

        <section className="p-6 sm:p-10 lg:p-14 flex items-center justify-center">
          <div className="w-full max-w-md rounded-3xl border border-white/15 bg-slate-900/60 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-black/40">
            <div className="grid grid-cols-3 gap-2 bg-slate-800/70 p-1.5 rounded-2xl text-[11px] font-black uppercase tracking-wider">
              <button onClick={() => { resetMessages(); setActiveTab('login'); }} className={`py-2 rounded-xl ${activeTab === 'login' ? 'bg-cyan-400 text-slate-900' : 'text-slate-300'}`}>Ingreso</button>
              <button onClick={() => { resetMessages(); setActiveTab('forgot'); }} className={`py-2 rounded-xl ${activeTab === 'forgot' ? 'bg-cyan-400 text-slate-900' : 'text-slate-300'}`}>Recuperar</button>
              <button onClick={() => { resetMessages(); setActiveTab('reset'); }} className={`py-2 rounded-xl ${activeTab === 'reset' ? 'bg-cyan-400 text-slate-900' : 'text-slate-300'}`}>Nueva clave</button>
            </div>

            <div className="mt-6 space-y-4">
              {activeTab === 'login' && (
                <form className="space-y-4" onSubmit={handleLoginSubmit}>
                  <div>
                    <label className="text-[11px] uppercase tracking-wider font-black text-slate-300">Correo institucional</label>
                    <input type="email" {...loginForm.register('email')} className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-950 px-4 py-3 text-sm focus:outline-none focus:border-cyan-300" />
                    {loginForm.formState.errors.email && <p className="text-xs text-rose-300 mt-1">{loginForm.formState.errors.email.message}</p>}
                  </div>
                  <div>
                    <label className="text-[11px] uppercase tracking-wider font-black text-slate-300">Contrasena</label>
                    <input type="password" {...loginForm.register('password')} className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-950 px-4 py-3 text-sm focus:outline-none focus:border-cyan-300" />
                    {loginForm.formState.errors.password && <p className="text-xs text-rose-300 mt-1">{loginForm.formState.errors.password.message}</p>}
                  </div>
                  <button type="submit" disabled={loginForm.formState.isSubmitting} className="w-full py-3 rounded-xl bg-cyan-400 text-slate-900 text-xs font-black uppercase tracking-widest disabled:opacity-50">
                    {loginForm.formState.isSubmitting ? 'Validando...' : 'Ingresar'}
                  </button>
                </form>
              )}

              {activeTab === 'forgot' && (
                <form className="space-y-4" onSubmit={handleForgotSubmit}>
                  <p className="text-xs text-slate-300">Enviaremos un enlace temporal con validez limitada para restablecer tu acceso.</p>
                  <div>
                    <label className="text-[11px] uppercase tracking-wider font-black text-slate-300">Correo de recuperacion</label>
                    <input type="email" {...forgotForm.register('email')} className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-950 px-4 py-3 text-sm focus:outline-none focus:border-cyan-300" />
                    {forgotForm.formState.errors.email && <p className="text-xs text-rose-300 mt-1">{forgotForm.formState.errors.email.message}</p>}
                  </div>
                  <button type="submit" disabled={forgotForm.formState.isSubmitting} className="w-full py-3 rounded-xl bg-cyan-400 text-slate-900 text-xs font-black uppercase tracking-widest disabled:opacity-50">
                    {forgotForm.formState.isSubmitting ? 'Enviando...' : 'Enviar enlace'}
                  </button>
                </form>
              )}

              {activeTab === 'reset' && (
                <form className="space-y-4" onSubmit={handleResetSubmit}>
                  <p className="text-xs text-slate-300">Define una nueva contrasena robusta para proteger tu sesion.</p>
                  <div>
                    <label className="text-[11px] uppercase tracking-wider font-black text-slate-300">Nueva contrasena</label>
                    <input type="password" {...resetForm.register('password')} className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-950 px-4 py-3 text-sm focus:outline-none focus:border-cyan-300" />
                    {resetForm.formState.errors.password && <p className="text-xs text-rose-300 mt-1">{resetForm.formState.errors.password.message}</p>}
                  </div>
                  <div>
                    <label className="text-[11px] uppercase tracking-wider font-black text-slate-300">Confirmar contrasena</label>
                    <input type="password" {...resetForm.register('confirmPassword')} className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-950 px-4 py-3 text-sm focus:outline-none focus:border-cyan-300" />
                    {resetForm.formState.errors.confirmPassword && <p className="text-xs text-rose-300 mt-1">{resetForm.formState.errors.confirmPassword.message}</p>}
                  </div>
                  <button type="submit" disabled={resetForm.formState.isSubmitting} className="w-full py-3 rounded-xl bg-cyan-400 text-slate-900 text-xs font-black uppercase tracking-widest disabled:opacity-50">
                    {resetForm.formState.isSubmitting ? 'Actualizando...' : 'Guardar nueva clave'}
                  </button>
                </form>
              )}

              {globalError && (
                <div className="rounded-xl border border-rose-400/50 bg-rose-400/10 p-3 text-xs text-rose-100 flex gap-2 items-start">
                  <AlertCircle className="w-4 h-4 mt-0.5" />
                  <p>{globalError}</p>
                </div>
              )}

              {globalSuccess && (
                <div className="rounded-xl border border-emerald-400/50 bg-emerald-400/10 p-3 text-xs text-emerald-100 flex gap-2 items-start">
                  <MailCheck className="w-4 h-4 mt-0.5" />
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
