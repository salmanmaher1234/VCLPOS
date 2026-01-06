import React, { useState, useRef, useEffect } from 'react';
import Link from './Link';

export default function Header({ isOpen, setIsOpen, title }) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        window.location.href = '/react/login';
    };

    return (
        <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-20">
            <div className="flex items-center justify-between px-6 py-4">
                {/* Left - Hamburger + Page Title */}
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="md:hidden p-2 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
                    >
                        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 6H20M4 12H20M4 18H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    <h1 className={`text-xl font-semibold text-gray-900 dark:text-white capitalize ${title === 'POS System' ? 'hidden sm:block opacity-0 w-0' : ''}`}>{title}</h1>
                </div>

                {/* Right - Actions & User Dropdown */}
                <div className="flex items-center space-x-6">

                    {/* User Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full py-1 px-2 transition-all duration-200 focus:outline-none"
                        >
                            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-orange-400 to-red-500 flex items-center justify-center text-white font-bold shadow-md">
                                {user.name ? user.name[0].toUpperCase() : 'U'}
                            </div>
                            <div className="text-left hidden sm:block">
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{user.name || 'User'}</p>
                            </div>
                            <svg className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {/* Dropdown Menu */}
                        {dropdownOpen && (
                            <div className="absolute right-0 mt-3 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl py-2 border border-gray-100 dark:border-gray-700 transform opacity-100 scale-100 transition-all duration-200">
                                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Account</p>
                                </div>
                                <Link
                                    href="/react/profile"
                                    className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-orange-600 transition-colors"
                                >
                                    Your Profile
                                </Link>
                                <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left block px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium"
                                >
                                    Log Out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
