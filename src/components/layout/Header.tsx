import React from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import { Coins, Flame, Shield, LogOut, User as UserIcon, Play, LayoutDashboard, Layers, BarChart2, Sun, Moon, Monitor, Gift } from 'lucide-react';
import { formatCredits, formatInr } from '../../utils/formatters.js';

interface HeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export function Header({ currentPath, onNavigate }: HeaderProps) {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header id="main-header" className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand */}
        <div className="flex items-center gap-6">
          <button
            id="brand-logo-btn"
            onClick={() => onNavigate(isAuthenticated ? '/dashboard' : '/')}
            className="flex items-center gap-3 text-left group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-500/40 bg-gradient-to-br from-cyan-950 to-slate-900 shadow-md shadow-cyan-950/50 group-hover:border-cyan-400 transition-all">
              <Flame className="h-5 w-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-white">TrafficLoop</span>
                <span className="rounded bg-cyan-950/80 px-1.5 py-0.2 text-[10px] font-semibold text-cyan-300 border border-cyan-800/60">
                  WebZoneBW
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Exchange Engine v1.0</p>
            </div>
          </button>

          {/* Desktop Nav */}
          {isAuthenticated ? (
            <nav className="hidden md:flex items-center gap-1">
              <button
                id="nav-dashboard-btn"
                onClick={() => onNavigate('/dashboard')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  currentPath === '/dashboard' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>

              <button
                id="nav-campaigns-btn"
                onClick={() => onNavigate('/campaigns')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  currentPath.startsWith('/campaigns') ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Layers className="w-4 h-4" />
                Campaigns
              </button>

              <button
                id="nav-tri-station-btn"
                onClick={() => onNavigate('/tri-station')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  currentPath.startsWith('/tri-station') ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Monitor className="w-4 h-4 text-cyan-400" />
                <span>Tri-Station</span>
                <span className="rounded bg-cyan-900/60 px-1 py-0.2 text-[10px] font-bold text-cyan-300 border border-cyan-700/60">3x</span>
              </button>

              <button
                id="nav-rewards-btn"
                onClick={() => onNavigate('/rewards')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  currentPath.startsWith('/rewards') ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Gift className="w-4 h-4 text-emerald-400" />
                <span>Sign In & Rewards</span>
              </button>

              <button
                id="nav-analytics-btn"
                onClick={() => onNavigate('/analytics')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  currentPath === '/analytics' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <BarChart2 className="w-4 h-4" />
                Analytics & Ledger
              </button>

              {isAdmin && (
                <button
                  id="nav-admin-btn"
                  onClick={() => onNavigate('/admin')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentPath.startsWith('/admin') ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/60' : 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/40'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  Admin Panel
                </button>
              )}
            </nav>
          ) : (
            <nav className="hidden md:flex items-center gap-1">
              <button
                id="nav-public-rewards-btn"
                onClick={() => onNavigate('/rewards')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  currentPath.startsWith('/rewards') ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Gift className="w-4 h-4 text-emerald-400" />
                <span>Sign In & Rewards</span>
                <span className="rounded bg-indigo-950 px-1.5 py-0.2 text-[10px] font-bold text-indigo-300 border border-indigo-800">450K IN</span>
              </button>
            </nav>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Light / Dark Mode Toggle */}
          <button
            id="theme-toggle-btn"
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700 hover:text-white transition-colors"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-cyan-400" />
            )}
          </button>

          {isAuthenticated ? (
            <>
              {/* Credit Balance Pill with Real-time INR Valuation */}
              <div
                id="header-credit-balance-pill"
                onClick={() => onNavigate('/analytics')}
                className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-1.5 shadow-inner cursor-pointer hover:border-cyan-500/40 transition-colors"
                title={`Equivalent Value: ${user?.formatted_inr_balance || formatInr((user?.credits || 0) * 1.5)} (Real-Time Market Rate)`}
              >
                <Coins className="h-4 w-4 text-amber-400" />
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm font-bold text-white tracking-tight">
                    {formatCredits(user?.credits)}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">CR</span>
                  <span className="hidden sm:inline-block text-[11px] font-medium text-emerald-400 border-l border-slate-800 pl-1.5">
                    {user?.formatted_inr_balance || formatInr((user?.credits || 0) * 1.5)}
                  </span>
                </div>
              </div>

              {/* Start Surfing Action Button */}
              <button
                id="header-start-surfing-btn"
                onClick={() => onNavigate('/surf')}
                className="relative inline-flex items-center gap-2 overflow-hidden rounded-lg bg-gradient-to-r from-cyan-600 to-sky-600 px-3.5 py-1.5 text-sm font-semibold text-white shadow-md shadow-cyan-950/50 hover:from-cyan-500 hover:to-sky-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950 transition-all"
              >
                <Play className="h-4 w-4 fill-white" />
                <span className="hidden sm:inline">Start Surfing</span>
                <span className="sm:hidden">Surf</span>
              </button>

              {/* Profile Link */}
              <button
                id="header-profile-btn"
                onClick={() => onNavigate('/profile')}
                className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
                  currentPath === '/profile'
                    ? 'border-cyan-500/80 bg-cyan-950 text-cyan-300'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-white'
                }`}
                title="Profile & Settings"
              >
                <UserIcon className="h-4 w-4" />
              </button>

              {/* Logout Button */}
              <button
                id="header-logout-btn"
                onClick={logout}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:border-rose-900/60 hover:bg-rose-950/40 hover:text-rose-400 transition-colors"
                title="Log Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                id="header-login-btn"
                onClick={() => onNavigate('/login')}
                className="rounded-lg px-3.5 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-900 hover:text-white transition-colors"
              >
                Log In
              </button>
              <button
                id="header-register-btn"
                onClick={() => onNavigate('/register')}
                className="rounded-lg bg-cyan-600 px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-cyan-500 transition-colors shadow-md shadow-cyan-950/40"
              >
                Register (+15 Bonus)
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
