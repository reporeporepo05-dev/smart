import React from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { Home, Send, List, LogOut, Sun, Moon, Upload } from 'lucide-react';
import { useStore } from '../lib/store';
import clsx from 'clsx';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme, logout } = useStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Send Single SMS', path: '/send-single', icon: Send },
    { name: 'Send Bulk SMS', path: '/send-bulk', icon: Upload },
    { name: 'History', path: '/history', icon: List },
  ];

  return (
    <div className={clsx("min-h-screen bg-gray-50 flex flex-col pb-16 sm:pb-0", theme === 'dark' ? 'dark' : '')}>
      <div className="dark:bg-gray-900 min-h-screen w-full transition-colors duration-200">
        {/* Top bar for desktop */}
        <header className="hidden sm:flex items-center justify-between px-6 py-4 bg-white shadow-sm dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">BeemSMS</h1>
            <nav className="flex space-x-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.path;
                return (
                  <Link key={item.name} to={item.path} className={clsx("flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors", active ? "bg-blue-50 text-blue-700 dark:bg-gray-700 dark:text-white" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white")}>
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={toggleTheme} className="p-2 rounded-full text-gray-400 hover:text-gray-500 dark:hover:text-white transition-colors">
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button onClick={handleLogout} className="flex items-center space-x-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors">
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="sm:hidden flex items-center justify-between px-4 py-4 bg-white dark:bg-gray-800 shadow-sm">
           <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">BeemSMS</h1>
           <div className="flex items-center space-x-3">
             <button onClick={toggleTheme} className="p-2 rounded-full text-gray-400 hover:text-gray-500 dark:hover:text-white transition-colors">
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
             </button>
             <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-white transition-colors">
                <LogOut className="w-5 h-5" />
             </button>
           </div>
        </header>

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </main>

        {/* Bottom bar for mobile */}
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
          <div className="flex justify-around items-center h-16">
             {navItems.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.path;
                return (
                  <Link key={item.name} to={item.path} className={clsx("flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors", active ? "text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white")}>
                     <Icon className="w-5 h-5" />
                     <span className="text-[10px] font-medium leading-none">{item.name}</span>
                  </Link>
                );
             })}
          </div>
        </nav>
      </div>
    </div>
  );
}
