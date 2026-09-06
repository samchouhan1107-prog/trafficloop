import React, { ReactNode } from 'react';

interface StatCardProps {
  id?: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  highlight?: boolean;
}

export function StatCard({ id, title, value, subtitle, icon, trend, highlight }: StatCardProps) {
  return (
    <div
      id={id}
      className={`relative overflow-hidden rounded-xl border p-5 transition-all duration-200 ${
        highlight
          ? 'border-cyan-500/40 bg-gradient-to-b from-slate-900 via-slate-900 to-cyan-950/30 shadow-lg shadow-cyan-950/20'
          : 'border-slate-800/80 bg-slate-900/80 backdrop-blur hover:border-slate-700'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white">{value}</span>
            {trend && (
              <span className={`text-xs font-medium ${trend.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </span>
            )}
          </div>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5 text-cyan-400">
          {icon}
        </div>
      </div>
    </div>
  );
}
