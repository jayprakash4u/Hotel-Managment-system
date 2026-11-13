'use client';

import React, { useContext } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WorkspaceTabsContext } from '@/context/WorkspaceTabsContext';

export interface BackButtonProps {
  href?: string;
  label?: string;
  className?: string;
  onClick?: () => void;
}

export const BackButton: React.FC<BackButtonProps> = ({
  href = '/accounts',
  label = 'Back',
  className,
  onClick,
}) => {
  const router = useRouter();
  const tabsContext = useContext(WorkspaceTabsContext);

  const content = (
    <>
      <ArrowLeft className="w-3.5 h-3.5 stroke-[1.5] transition-transform group-hover:-translate-x-0.5" />
      <span>{label}</span>
    </>
  );

  const buttonClasses = cn(
    'group inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-[4px]',
    'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900',
    'text-slate-600 dark:text-slate-300 hover:text-[#0B3D32] dark:hover:text-emerald-400',
    'hover:border-[#0B3D32]/40 dark:hover:border-emerald-600/40 hover:bg-slate-50 dark:hover:bg-slate-800/70',
    'shadow-2xs transition-all duration-150 cursor-pointer select-none shrink-0',
    className
  );

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick();
      return;
    }
    if (tabsContext && href && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      tabsContext.openTab({ path: href });
      return;
    }
    if (!href) {
      e.preventDefault();
      router.back();
    }
  };

  if (onClick || !href) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={buttonClasses}
        title={label}
      >
        {content}
      </button>
    );
  }

  return (
    <Link href={href} onClick={handleClick} className={buttonClasses} title={label}>
      {content}
    </Link>
  );
};

export default BackButton;

