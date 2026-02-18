import React from 'react';

/** Skeleton base con animación */
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
}) => {
  const baseStyles = 'animate-pulse bg-slate-200';
  
  const variantStyles = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
};

/** Skeleton para tabla */
export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 6 }) => {
  return (
    <div className="space-y-3" role="status" aria-label="Cargando datos">
      {/* Header */}
      <div className="grid grid-cols-6 gap-4 px-6 py-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={`header-${i}`} width="100%" height={16} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="grid grid-cols-6 gap-4 px-6 py-4 border-t border-slate-100">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton key={`${rowIndex}-${colIndex}`} width="100%" height={20} />
          ))}
        </div>
      ))}
    </div>
  );
};

/** Skeleton para tarjeta */
export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3" role="status" aria-label="Cargando">
      <div className="flex items-center justify-between">
        <Skeleton width={100} height={24} variant="circular" />
        <Skeleton width={60} height={20} />
      </div>
      <Skeleton width="100%" height={16} />
      <Skeleton width="80%" height={16} />
      <div className="flex items-center justify-between pt-2">
        <Skeleton width={80} height={16} />
        <Skeleton width={60} height={24} variant="circular" />
      </div>
    </div>
  );
};

/** Skeleton para formulario */
export const SkeletonForm: React.FC<{ fields?: number }> = ({ fields = 4 }) => {
  return (
    <div className="space-y-4" role="status" aria-label="Cargando formulario">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton width={100} height={14} />
          <Skeleton width="100%" height={44} />
        </div>
      ))}
    </div>
  );
};

/** Skeleton para estadísticas */
export const SkeletonStats: React.FC<{ items?: number }> = ({ items = 4 }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4" role="status" aria-label="Cargando estadísticas">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
          <Skeleton width={80} height={12} />
          <Skeleton width={60} height={32} />
        </div>
      ))}
    </div>
  );
};

export default Skeleton;
