
import React from 'react';
import { Clock } from 'lucide-react';

interface PlazoCounterProps {
  fechaLimite: string;
}

const PlazoCounter: React.FC<PlazoCounterProps> = ({ fechaLimite }) => {
  const limite = new Date(fechaLimite);
  const hoy = new Date();
  const diffTime = limite.getTime() - hoy.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const getUrgencyColor = () => {
    if (diffDays <= 1) return 'text-red-600 bg-red-50 border-red-200';
    if (diffDays <= 3) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-slate-600 bg-slate-50 border-slate-200';
  };

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-md border text-[11px] font-semibold ${getUrgencyColor()}`}>
      <Clock className="w-3 h-3 mr-1" />
      {diffDays < 0 ? 'Plazo Vencido' : `${diffDays}d restantes`}
    </div>
  );
};

export default PlazoCounter;
