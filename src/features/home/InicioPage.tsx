import { ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import praxiaNovusLogo from '@/assets/praxia-novus-logo-auth.png';
import FeatureList from '@/features/auth/components/FeatureList';
import InfoCardGrid from '@/features/auth/components/InfoCardGrid';
import { AUTH_FEATURES, AUTH_INFO_CARDS } from '@/features/auth/content';

const InicioPage: React.FC = () => {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#0f172a_0%,_#111827_40%,_#020617_100%)] text-slate-100">
      <div className="w-full px-5 sm:px-8 lg:px-12 py-8 lg:py-10">
        <header className="flex items-center justify-between gap-4">
          <img src={praxiaNovusLogo} alt="Praxia Novus" className="h-20 sm:h-24 w-auto object-contain" />
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 text-xs sm:text-sm font-black uppercase tracking-widest text-slate-900 hover:bg-cyan-300 transition-colors"
          >
            Acceder
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </header>

        <section className="mt-8 grid lg:grid-cols-[1.2fr_0.8fr] gap-8 lg:gap-10 items-start">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-300/40 bg-cyan-400/10 text-cyan-100 text-[10px] font-black uppercase tracking-widest">
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              Procedimiento correcto. Respaldo institucional.
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.02] tracking-tight">
                Gestion y Cumplimiento Escolar
              </h1>
              <p className="text-base lg:text-lg text-slate-300 leading-relaxed">
                Plataforma de gobernanza que transforma la convivencia escolar en un proceso trazable, defendible y alineado a las Circulares 781 y 782.
              </p>
            </div>

            <InfoCardGrid cards={AUTH_INFO_CARDS} />
          </div>

          <aside className="rounded-3xl border border-white/15 bg-slate-900/60 backdrop-blur-xl p-6 shadow-2xl shadow-black/40">
            <h2 className="text-sm font-black uppercase tracking-widest text-cyan-200">Capacidades clave</h2>
            <p className="mt-3 text-sm text-slate-300 leading-relaxed">
              Visualiza en minutos el estado normativo, el avance de los casos y los compromisos GCC con una experiencia enfocada en cumplimiento real.
            </p>
            <div className="mt-5">
              <Link
                to="/auth"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-300/40 bg-cyan-400/15 px-4 py-3 text-xs font-black uppercase tracking-widest text-cyan-100 hover:bg-cyan-400/25 transition-colors"
              >
                Ir a acceso seguro
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </aside>
        </section>

        <section className="mt-8">
          <FeatureList items={AUTH_FEATURES} />
        </section>
      </div>
    </main>
  );
};

export default InicioPage;
