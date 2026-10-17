import React from 'react';
import { RouterProvider, useRouter } from './context/RouterContext';
import { AuthProvider } from './context/AuthContext';
import { DemoPersonaBanner } from './components/DemoPersonaBanner';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
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
  const { path } = useRouter();

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
      <DemoPersonaBanner />
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
