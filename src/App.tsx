import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { ThemeProvider, useTheme } from './context/ThemeContext.js';
import { ToastProvider } from './context/ToastContext.js';
import { ToastContainer } from './components/common/ToastContainer.js';
import { ErrorBoundary } from './components/common/ErrorBoundary.js';
import { Header } from './components/layout/Header.js';
import { Footer } from './components/layout/Footer.js';
import { LandingPage } from './pages/LandingPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { CampaignsPage } from './pages/CampaignsPage.js';
import { SurfPage } from './pages/SurfPage.js';
import { TriStationPage } from './pages/TriStationPage.js';
import { AnalyticsPage } from './pages/AnalyticsPage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { AdminPage } from './pages/AdminPage.js';
import { RewardsPage } from './pages/RewardsPage.js';

function AppContent() {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const { theme } = useTheme();
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Automatic redirect if authenticated on auth pages
  useEffect(() => {
    if (!isLoading && isAuthenticated && (currentPath === '/login' || currentPath === '/register')) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, isLoading, currentPath]);

  // Protected route guard
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const protectedRoutes = ['/dashboard', '/campaigns', '/surf', '/analytics', '/profile', '/admin'];
      if (protectedRoutes.some(route => currentPath.startsWith(route))) {
        navigate('/login');
      }
    }
  }, [isAuthenticated, isLoading, currentPath]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-glow-cyan text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin shadow-lg shadow-cyan-950" />
          <span className="text-xs font-medium tracking-wide animate-pulse">Connecting to TrafficLoop Network...</span>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    if (currentPath === '/login') {
      return <LoginPage onNavigate={navigate} />;
    }
    if (currentPath === '/register') {
      return <RegisterPage onNavigate={navigate} />;
    }
    if (currentPath === '/dashboard') {
      return <DashboardPage onNavigate={navigate} />;
    }
    if (currentPath.startsWith('/campaigns')) {
      return <CampaignsPage onNavigate={navigate} />;
    }
    if (currentPath.startsWith('/surf')) {
      return <SurfPage onNavigate={navigate} />;
    }
    if (currentPath.startsWith('/tri-station')) {
      return <TriStationPage onNavigate={navigate} />;
    }
    if (currentPath.startsWith('/rewards')) {
      return <RewardsPage onNavigate={navigate} />;
    }
    if (currentPath === '/analytics') {
      return <AnalyticsPage />;
    }
    if (currentPath === '/profile') {
      return <ProfilePage />;
    }
    if (currentPath.startsWith('/admin')) {
      return <AdminPage />;
    }
    return <LandingPage onNavigate={navigate} />;
  };

  return (
    <div className={`flex min-h-screen flex-col selection:bg-cyan-500 selection:text-white transition-colors duration-200 ${
      theme === 'light' ? 'bg-slate-900 text-slate-100' : 'bg-slate-950 text-slate-100'
    }`}>
      <ToastContainer />
      <Header currentPath={currentPath} onNavigate={navigate} />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-6">
        {renderPage()}
      </main>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
