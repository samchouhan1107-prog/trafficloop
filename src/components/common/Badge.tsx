import React from 'react';
import { CampaignStatus, UserRole } from '../../types.js';

interface BadgeProps {
  status?: CampaignStatus | UserRole | string;
  variant?: 'cyan' | 'green' | 'amber' | 'red' | 'purple' | 'slate';
  children?: React.ReactNode;
  size?: 'sm' | 'md';
}

export function Badge({ status, variant, children, size = 'sm' }: BadgeProps) {
  let style = 'bg-slate-800 text-slate-300 border-slate-700';
  let label = children || status;

  if (status === 'active' || status === 'approved' || variant === 'green') {
    style = 'bg-emerald-950/70 text-emerald-300 border-emerald-800/60';
    if (!children) label = 'Active';
  } else if (status === 'pending_review' || status === 'pending' || variant === 'amber') {
    style = 'bg-amber-950/70 text-amber-300 border-amber-800/60';
    if (!children) label = 'Pending Review';
  } else if (status === 'paused') {
    style = 'bg-slate-800 text-slate-300 border-slate-700';
    if (!children) label = 'Paused';
  } else if (status === 'completed') {
    style = 'bg-sky-950/70 text-sky-300 border-sky-800/60';
    if (!children) label = 'Budget Completed';
  } else if (status === 'rejected' || status === 'suspended' || variant === 'red') {
    style = 'bg-rose-950/70 text-rose-300 border-rose-800/60';
    if (!children) label = 'Rejected';
  } else if (status === 'admin' || variant === 'purple') {
    style = 'bg-indigo-950/70 text-indigo-300 border-indigo-800/60';
    if (!children) label = 'Administrator';
  } else if (variant === 'cyan') {
    style = 'bg-cyan-950/70 text-cyan-300 border-cyan-800/60';
  }

  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-md border whitespace-nowrap ${sizeClasses} ${style}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  );
}
