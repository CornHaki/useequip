import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, LayoutDashboard, Compass, History, UserCheck, Building2, LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const defaultDashboard = isAdmin ? '/admin-dashboard' : '/user-dashboard';

  const handleLogout = () => { logout(); navigate('/'); };
  const navLinks = [
    ...(!isAdmin ? [
      { path: '/user-dashboard', label: 'My Dashboard', icon: LayoutDashboard },
      { path: '/browse', label: 'Browse Equipment', icon: Compass }
    ] : []),
    ...(isAdmin ? [{ path: '/admin-dashboard', label: 'Owner Dashboard', icon: Building2 }] : []),
    { path: '/history', label: 'Activity History', icon: History }
  ];

  return (
    <header className="sticky top-0 z-40 bg-primary shadow-md">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 min-h-20 py-3 md:py-0 flex flex-wrap items-center justify-between gap-3 md:gap-4">
        <Link to={defaultDashboard} className="flex items-center gap-3.5 group">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-white shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-white text-lg leading-none">UseEquip</span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-white/10 text-white border border-white/20 text-[10px] font-bold uppercase tracking-wider">Campus OS</span>
            </div>
            <span className="text-xs font-medium text-secondary mt-1 block opacity-90">Accountable Equipment & Lab Sharing</span>
          </div>
        </Link>

        <nav className="mobile-nav-scroll order-3 md:order-none flex w-full md:w-auto items-center justify-between md:justify-start gap-1 overflow-x-auto bg-white/10 p-1.5 rounded-xl border border-white/5">
          {navLinks.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} aria-current={isActive ? 'page' : undefined} className={`flex shrink-0 items-center gap-1.5 md:gap-2 px-2 sm:px-4 md:px-5 py-2.5 rounded-lg text-[11px] sm:text-sm font-semibold whitespace-nowrap transition-colors duration-200 ${isActive ? 'bg-white/20 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}>
                <item.icon className={`hidden sm:block w-3.5 h-3.5 md:w-4 md:h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} /> {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2.5 bg-transparent px-4 py-2 rounded-xl border border-white/20">
            {isAdmin ? <Building2 className="w-4 h-4 text-slate-300" /> : <UserCheck className="w-4 h-4 text-slate-300" />}
            <span className="text-sm font-semibold text-white">{user.name}</span>
          </div>
          <button onClick={handleLogout} aria-label="Log out" className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/5 text-slate-300 hover:text-white transition-colors"><LogOut className="w-4 h-4" /></button>
        </div>
      </div>
    </header>
  );
}