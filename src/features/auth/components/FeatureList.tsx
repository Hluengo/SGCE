import type { FeatureItem } from '@/features/auth/content';

type FeatureListProps = {
  items: FeatureItem[];
  className?: string;
};

const FeatureList: React.FC<FeatureListProps> = ({ items, className = '' }) => {
  return (
    <ul className={`grid gap-2 sm:grid-cols-2 text-sm text-slate-300 leading-snug ${className}`}>
      {items.map(({ icon: Icon, text }) => (
        <li key={text} className="flex gap-2 items-start">
          <Icon className="w-4 h-4 mt-0.5 text-cyan-300 shrink-0" aria-hidden="true" />
          <span>{text}</span>
        </li>
      ))}
    </ul>
  );
};

export default FeatureList;

