import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, Search, User, LogOut, X, Globe, Moon, Sun, ShoppingCart, UserPlus, CreditCard, AlertTriangle } from 'lucide-react';
import Link from './Link';

export default function Header({ isOpen, setIsOpen, title }) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const dropdownRef = useRef(null);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Sync dark mode
    useEffect(() => {
        if (darkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [darkMode]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        window.location.href = '/react/login';
    };

    return (
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40 transition-colors">
            <div className="h-full flex items-center justify-between px-6 lg:px-8">
                {/* Left: Hamburger & Title */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="p-2 -ml-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg md:hidden transition-colors"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="flex flex-col">
                        <h1 className="text-lg font-bold text-gray-900 dark:text-white capitalize truncate max-w-[150px] sm:max-w-none">
                            {title}
                        </h1>
                        <p className="hidden xs:block text-[10px] text-gray-500 font-medium uppercase tracking-wider">StockMaster Enterprise</p>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 sm:gap-4">
                    {/* Search - Desktop */}
                    <div className="hidden lg:flex relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Type to search..."
                            className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-transparent focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-sm transition-all outline-none w-64 dark:text-white"
                        />
                    </div>

                    {/* Dark Mode Toggle */}
                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>

                    {/* Notifications */}
                    <div className="relative">
                        <Link
                            href="/react/notifications"
                            className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors inline-block"
                        >
                            <Bell className="w-5 h-5" />
                            <NotificationBadge />
                        </Link>
                    </div>

                    {/* Vertical Line */}
                    <div className="h-6 w-px bg-gray-200 dark:bg-gray-800 mx-1 sm:mx-2 hidden xs:block"></div>

                    {/* User Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="flex items-center gap-3 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors outline-none"
                        >
                            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/20">
                                {user.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className="hidden sm:block text-left text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[100px]">
                                {user.name || 'User'}
                            </div>
                        </button>

                        {dropdownOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl py-2 animate-in fade-in slide-in-from-top-2">
                                <Link
                                    href="/react/profile"
                                    onClick={() => setDropdownOpen(false)}
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <User className="w-4 h-4 text-gray-400" />
                                    <span>Profile Settings</span>
                                </Link>
                                <div className="border-t border-gray-100 dark:border-gray-800 my-1"></div>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>Logout Account</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <ToastOverlay />
        </header>
    );
}

const NotificationBadge = () => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const updateCount = () => {
            const saved = JSON.parse(localStorage.getItem('vcl_notifications') || '[]');
            const unread = saved.filter(n => !n.read).length;
            setCount(unread);
        };
        updateCount();
        window.addEventListener('vcl-notification-added', updateCount);
        return () => window.removeEventListener('vcl-notification-added', updateCount);
    }, []);

    if (count === 0) return null;
    return (
        <span className="absolute top-1 right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[10px] text-white font-bold items-center justify-center">
                {count > 9 ? '9+' : count}
            </span>
        </span>
    );
};
const ToastOverlay = () => {
    const [toast, setToast] = useState(null);

    useEffect(() => {
        const showToast = () => {
            const saved = JSON.parse(localStorage.getItem('vcl_notifications') || '[]');
            if (saved.length > 0) {
                setToast(saved[0]);
                setTimeout(() => setToast(null), 4000);
            }
        };
        window.addEventListener('vcl-notification-added', showToast);
        return () => window.removeEventListener('vcl-notification-added', showToast);
    }, []);

    if (!toast) return null;

    return (
        <div className="fixed top-24 right-4 z-[200] animate-in slide-in-from-right fade-in duration-300 pointer-events-none">
            <div className="bg-white dark:bg-gray-800 border-l-4 border-blue-600 shadow-2xl rounded-xl p-4 flex items-center gap-4 max-w-sm">
                <div className="h-10 w-10 shrink-0 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                    <h4 className="font-bold text-xs text-gray-900 dark:text-white uppercase tracking-wider">{toast.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{toast.message}</p>
                </div>
            </div>
        </div>
    );
};
