import React, { useState } from 'react';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import {
  PlusCircle,
  Menu,
  X,
  Calendar,
  BookOpen,
  User,
  LogOut,
  Settings,
  LogIn,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { path, navigate } = useRouter();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navLinks = user
    ? [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Upload Notice', href: '/notices/new' },
        { label: 'Timetable', href: '/timetable' },
        { label: 'Calendar', href: '/calendar' },
      ]
    : [
        { label: 'Overview', href: '/' },
      ];

  const handleNav = (href: string) => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    navigate(href);
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

              return (
                <button
                  key={link.href}
                  onClick={() => handleNav(link.href)}
                  className={`whitespace-nowrap shrink-0 transition-colors py-1 relative flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'text-sky-800 font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{link.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-700 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Section: Auth Profile & Action */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-xs font-semibold text-slate-800 cursor-pointer shadow-2xs"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      className="w-6 h-6 rounded-md object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-md bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-[11px]">
                      {user.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="max-w-[130px] truncate">{user.displayName}</span>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-slate-200 shadow-lg py-1 z-50 text-xs">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="font-semibold text-slate-900 truncate">{user.displayName}</p>
                      <p className="text-slate-500 text-[11px] truncate">{user.email}</p>
                    </div>

                    <button
                      onClick={() => handleNav('/dashboard')}
                      className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <span>Student Dashboard</span>
                    </button>

                    <button
                      onClick={() => handleNav('/settings')}
                      className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-400" />
                      <span>Account Settings</span>
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
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg shadow-2xs cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 text-slate-500" />
                  <span>Sign In</span>
                </button>
                <button
                  onClick={() => handleNav('/auth/login')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs cursor-pointer transition-colors"
                >
                  <span>Continue with Google</span>
                </button>
              </div>
            )}

            {user && (
              <button
                onClick={() => handleNav('/notices/new')}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-sky-300" />
                <span>Decode Notice</span>
              </button>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center gap-2">
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
                  <div className="flex items-center gap-2">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName}
                        className="w-7 h-7 rounded-md object-cover"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-md bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-xs">
                        {user.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <span className="font-bold text-slate-900 block truncate max-w-[180px]">
                        {user.displayName}
                      </span>
                      <span className="text-slate-500 text-[11px] truncate block max-w-[180px]">
                        {user.email}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      setMobileMenuOpen(false);
                      await signOut();
                      navigate('/');
                    }}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => handleNav('/notices/new')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 shadow-xs cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-sky-300" />
                  <span>Decode Notice</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleNav('/auth/login')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg shadow-2xs cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-slate-600" />
                <span>Continue with Google</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
