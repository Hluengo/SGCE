import type { InfoCard } from '@/features/auth/content';

type InfoCardGridProps = {
  cards: InfoCard[];
  firstValue?: string;
};

const InfoCardGrid: React.FC<InfoCardGridProps> = ({ cards, firstValue }) => {
  const resolvedCards = cards.map((card, index) => (index === 0 && firstValue ? { ...card, value: firstValue } : card));

  return (
    <div className="grid sm:grid-cols-2 gap-3 text-xs">
      {resolvedCards.map((card) => (
        <article key={card.title} className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <p className="font-black uppercase tracking-widest text-cyan-200">{card.title}</p>
          <p className="mt-1 text-sm font-bold text-slate-100">{card.value}</p>
          <p className="text-slate-400 mt-1">{card.caption}</p>
        </article>
      ))}
    </div>
  );
};

export default InfoCardGrid;

