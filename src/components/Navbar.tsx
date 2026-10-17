import React, { useState } from 'react';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { NotificationCenter } from './NotificationCenter';
import {
  PlusCircle,
  Menu,
  X,
  Calendar,
  FileText,
  User,
  LogOut,
  Settings,
  LogIn,
  Building2,
  ArrowRightLeft,
  GraduationCap,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { path, navigate } = useRouter();
  const { user, signOut, isCoordinator, switchPersona } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navLinks = user
    ? [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Timetable', href: '/timetable' },
        { label: 'Calendar', href: '/calendar' },
        ...(isCoordinator ? [{ label: 'Coordinator Portal', href: '/coordinator' }] : []),
        { label: 'Upload Notice', href: '/notices/new' },
      ]
    : [
        { label: 'Overview', href: '/' },
        { label: 'Upload Notice', href: '/notices/new' },
      ];

  const handleNav = (href: string) => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    navigate(href);
  };

  const handleToggleRole = async () => {
    setUserDropdownOpen(false);
    if (isCoordinator) {
      await switchPersona('student');
      navigate('/dashboard');
    } else {
      await switchPersona('coordinator');
      navigate('/coordinator');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#faf9f6]/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Brand Wordmark with ND monogram */}
          <button
            onClick={() => handleNav(user ? '/dashboard' : '/')}
            className="flex items-center gap-2.5 text-left text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity cursor-pointer"
          >
            <span className="w-8 h-8 rounded-lg bg-sky-700 text-white flex items-center justify-center font-bold text-sm shadow-xs font-mono">
              ND
            </span>
            <span className="font-sans">Notice Decoder</span>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            {navLinks.map((link) => {
              const isActive = path === link.href || (link.href !== '/' && path.startsWith(link.href));
              const isCoord = link.href === '/coordinator';

              return (
                <button
                  key={link.href}
                  onClick={() => handleNav(link.href)}
                  className={`whitespace-nowrap shrink-0 transition-colors py-1 relative flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'text-sky-800 font-semibold'
                      : isCoord
                      ? 'text-amber-800 hover:text-amber-900 font-medium'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isCoord && <Building2 className="w-3.5 h-3.5 text-amber-600" />}
                  <span>{link.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-700 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Section: Notifications, Actions & Auth Profile */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            {user && <NotificationCenter />}

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-xs font-semibold text-slate-800 cursor-pointer shadow-2xs"
                >
                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-[11px] ${
                      isCoordinator ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'
                    }`}
                  >
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[120px] truncate">{user.displayName.split(' ')[0]}</span>
                  <span
                    className={`px-1 py-0.2 rounded-xs text-[9px] font-bold ${
                      isCoordinator ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'
                    }`}
                  >
                    {isCoordinator ? 'COORD' : 'STUDENT'}
                  </span>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl border border-slate-200 shadow-lg py-1 z-50 text-xs">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p className="font-semibold text-slate-900 truncate">{user.displayName}</p>
                        <span
                          className={`px-1.5 py-0.2 text-[9px] font-bold rounded-xs ${
                            isCoordinator
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-sky-100 text-sky-800 border border-sky-200'
                          }`}
                        >
                          {isCoordinator ? 'COORDINATOR' : 'STUDENT'}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] truncate">{user.email}</p>
                    </div>

                    {isCoordinator && (
                      <button
                        onClick={() => handleNav('/coordinator')}
                        className="w-full text-left px-3 py-2 text-amber-800 hover:bg-amber-50 flex items-center gap-2 font-medium cursor-pointer"
                      >
                        <Building2 className="w-3.5 h-3.5 text-amber-600" />
                        <span>Coordinator Portal</span>
                      </button>
                    )}

                    <button
                      onClick={handleToggleRole}
                      className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" />
                      <span>Switch to {isCoordinator ? 'Student' : 'Coordinator'} Role</span>
                    </button>

                    <button
                      onClick={() => handleNav('/settings')}
                      className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-400" />
                      <span>Settings & Account</span>
                    </button>

                    <button
                      onClick={async () => {
                        setUserDropdownOpen(false);
                        await signOut();
                        navigate('/');
                      }}
                      className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-slate-100 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleNav('/auth/login')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg shadow-2xs cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 text-slate-500" />
                  <span>Sign In</span>
                </button>
                <button
                  onClick={() => handleNav('/auth/signup')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-800 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 transition-colors cursor-pointer"
                >
                  <span>Sign Up</span>
                </button>
              </div>
            )}

            <button
              onClick={() => handleNav('/notices/new')}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-sky-300" />
              <span>Decode Notice</span>
            </button>
          </div>

          {/* Mobile hamburger menu */}
          <div className="flex md:hidden items-center gap-2">
            {user && <NotificationCenter />}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 focus:outline-hidden cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-[#faf9f6] px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => {
            const isActive = path === link.href || (link.href !== '/' && path.startsWith(link.href));
            return (
              <button
                key={link.href}
                onClick={() => handleNav(link.href)}
                className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-medium cursor-pointer ${
                  isActive ? 'bg-sky-50 text-sky-900 font-semibold' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {link.label}
              </button>
            );
          })}

          <div className="pt-2 border-t border-slate-200 space-y-2">
            {user ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-slate-200 text-xs">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 block">{user.displayName}</span>
                      <span
                        className={`px-1 py-0.2 rounded-xs text-[9px] font-bold ${
                          isCoordinator ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'
                        }`}
                      >
                        {isCoordinator ? 'COORD' : 'STUDENT'}
                      </span>
                    </div>
                    <span className="text-slate-500 text-[11px]">{user.email}</span>
                  </div>
                  <button
                    onClick={async () => {
                      setMobileMenuOpen(false);
                      await signOut();
                      navigate('/');
                    }}
                    className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={handleToggleRole}
                  className="w-full text-center px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg cursor-pointer"
                >
                  Switch to {isCoordinator ? 'Student' : 'Coordinator'} Role
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleNav('/auth/login')}
                  className="w-1/2 flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
                <button
                  onClick={() => handleNav('/auth/signup')}
                  className="w-1/2 flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-sky-800 bg-sky-50 border border-sky-200 rounded-lg cursor-pointer"
                >
                  <span>Sign Up</span>
                </button>
              </div>
            )}

            <button
              onClick={() => handleNav('/notices/new')}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-sky-300" />
              <span>Decode Notice</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
