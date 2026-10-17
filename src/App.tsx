import React, { useState, useEffect } from 'react';
import { RouterProvider, useRouter } from './context/RouterContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { SplashScreen } from './components/SplashScreen';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { TimetablePage } from './pages/TimetablePage';
import { CalendarPage } from './pages/CalendarPage';
import { CoordinatorPage } from './pages/CoordinatorPage';
import { UploadPage } from './pages/UploadPage';
import { NoticeDetailPage } from './pages/NoticeDetailPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { NotFoundPage } from './pages/NotFoundPage';

function AppContent() {
  const { path, navigate } = useRouter();
  const { user, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return !sessionStorage.getItem('nd_splash_dismissed');
      } catch {
        return false;
      }
    }
    return false;
  });

  const handleSplashComplete = () => {
    setShowSplash(false);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('nd_splash_dismissed', 'true');
      } catch {
        // ignore
      }
    }
  };

  // Protected route enforcement
  useEffect(() => {
    if (!loading && !user) {
      const protectedPaths = ['/dashboard', '/coordinator', '/settings'];
      if (protectedPaths.includes(path)) {
        navigate(`/auth/login?redirect=${encodeURIComponent(path)}`);
      }
    }
  }, [user, loading, path, navigate]);

  let PageComponent = NotFoundPage;

  if (path === '/') {
    PageComponent = LandingPage;
  } else if (path === '/dashboard') {
    PageComponent = DashboardPage;
  } else if (path === '/timetable') {
    PageComponent = TimetablePage;
  } else if (path === '/calendar') {
    PageComponent = CalendarPage;
  } else if (path === '/coordinator') {
    PageComponent = CoordinatorPage;
  } else if (path === '/settings') {
    PageComponent = SettingsPage;
  } else if (path === '/auth/login') {
    PageComponent = LoginPage;
  } else if (path === '/auth/signup') {
    PageComponent = SignupPage;
  } else if (path === '/notices/new') {
    PageComponent = UploadPage;
  } else if (path.startsWith('/notices/')) {
    PageComponent = NoticeDetailPage;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f6] text-slate-900 font-sans selection:bg-sky-200 selection:text-sky-900">
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <Navbar />
      <main className="flex-1">
        <PageComponent />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider>
        <AppContent />
      </RouterProvider>
    </AuthProvider>
  );
}
