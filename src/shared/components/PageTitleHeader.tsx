import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface PageTitleHeaderProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  actions?: React.ReactNode;
  className?: string;
}

const PageTitleHeader: React.FC<PageTitleHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  actions,
  className = '',
}) => {
  return (
    <div className={`flex flex-col gap-4 md:flex-row md:items-center md:justify-between ${className}`}>
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-[0_8px_18px_-8px_rgba(79,70,229,0.65)]">
          <Icon className="h-8 w-8" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-[2.55rem] md:leading-tight">
            {title}
          </h1>
          <p className="text-sm font-bold text-indigo-700 md:text-[1.35rem]">
            {subtitle}
          </p>
        </div>
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
};

export default PageTitleHeader;
