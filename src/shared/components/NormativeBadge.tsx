
import React from 'react';
import { GravedadFalta } from '@/types';

interface NormativeBadgeProps {
  gravedad: GravedadFalta;
}

const NormativeBadge: React.FC<NormativeBadgeProps> = ({ gravedad }) => {
  const styles: Record<GravedadFalta, string> = {
    LEVE: "bg-blue-100 text-blue-800 border-blue-200",
    RELEVANTE: "bg-amber-100 text-amber-800 border-amber-200",
    GRAVE: "bg-orange-100 text-orange-800 border-orange-200",
    GRAVISIMA_EXPULSION: "bg-red-100 text-red-800 border-red-200 ring-1 ring-red-400/30"
  };

  const labels: Record<GravedadFalta, string> = {
    LEVE: "Leve",
    RELEVANTE: "Relevante",
    GRAVE: "Grave",
    GRAVISIMA_EXPULSION: "Gravísima / Expulsión"
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${styles[gravedad]}`}>
      {labels[gravedad]}
    </span>
  );
};

export default NormativeBadge;
