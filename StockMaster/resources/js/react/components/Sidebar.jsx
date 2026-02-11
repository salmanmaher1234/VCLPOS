import React, { useState } from 'react';
import Link from './Link';

export default function Sidebar({ activeItem = 'Dashboard', isOpen, setIsOpen }) {
    const menuItems = [
        { name: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', href: '/react/dashboard' },
    ];

    const inventoryItems = [
        { name: 'Products', href: '/react/products' },
        { name: 'Purchase Returns', href: '/react/purchase-returns' },
        { name: 'Purchases', href: '/react/purchases' },
        { name: 'Adjustments', href: '/react/adjustments' },
    ];

    const salesItems = [
        { name: 'POS System', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z', href: '/react/pos' },
        { name: 'Sales List', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', href: '/react/sales' },
        { name: 'Sales Returns', icon: 'M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6', href: '/react/sales-returns' },
    ];

    const peopleItems = [
        { name: 'Employees', href: '/react/employees' },
        { name: 'Customers', href: '/react/customers' },
        { name: 'Suppliers', href: '/react/suppliers' },
    ];

    const financeItems = [
        { name: 'Expenses', href: '/react/expenses' },
    ];

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-30 bg-gray-600 bg-opacity-50 md:hidden"
                    onClick={() => setIsOpen(false)}
                ></div>
            )}

            {/* Sidebar */}
            <div
                className={`fixed inset-y-0 left-0 z-50 w-60 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    } md:translate-x-0`}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-2">
                            <img src="/images/logo.png" alt="Logo" className="h-10 w-10" />
                            <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-blue-600 bg-clip-text text-transparent">StockMaster</span>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="md:hidden text-gray-600 hover:text-gray-900"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                        {menuItems.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg ${activeItem === item.name
                                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-200'
                                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                                </svg>
                                {item.name}
                            </Link>
                        ))}

                        {/* Inventory Section */}
                        <div className="pt-4">
                            <h3 className="px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                INVENTORY
                            </h3>
                            <div className="mt-2 space-y-1">
                                {inventoryItems.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg ${activeItem === item.name
                                            ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-200'
                                            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        {item.name}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Sales & POS Section */}
                        <div className="pt-4">
                            <h3 className="px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                SALES & POS
                            </h3>
                            <div className="mt-2 space-y-1">
                                {salesItems.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg ${activeItem === item.name
                                            ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-200'
                                            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        {item.name}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* People Section */}
                        <div className="pt-4">
                            <h3 className="px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                PEOPLE
                            </h3>
                            <div className="mt-2 space-y-1">
                                {peopleItems.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg ${activeItem === item.name
                                            ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-200'
                                            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        {item.name}
                                    </Link>
                                ))}
                            </div>
                        </div>
                        {/* Finance Section */}
                        <div className="pt-4">
                            <h3 className="px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                FINANCE
                            </h3>
                            <div className="mt-2 space-y-1">
                                {financeItems.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg ${activeItem === item.name
                                            ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-200'
                                            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        {item.name}
                                    </Link>
                                ))}
                            </div>
                        </div>
                        <div className="pt-4 pb-20"> {/* pb-20 to ensure bottom button has space if scrolled */}
                            <div className="p-4 border-t border-gray-200 dark:border-gray-700 mt-4 rounded-xl bg-gray-50 dark:bg-gray-700/30">
                                <div className="flex items-center mb-3">
                                    <div className="flex-shrink-0">
                                        <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center text-orange-600 dark:text-orange-300 font-bold text-xs">
                                            {JSON.parse(localStorage.getItem('user') || '{}').name?.[0] || 'U'}
                                        </div>
                                    </div>
                                    <div className="ml-3 overflow-hidden">
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                                            {JSON.parse(localStorage.getItem('user') || '{}').name || 'User'}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        localStorage.removeItem('auth_token');
                                        localStorage.removeItem('user');
                                        window.location.href = '/react/login';
                                    }}
                                    className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white transition-all duration-200 bg-red-600 rounded-lg shadow-sm hover:bg-red-700 hover:shadow hover:scale-[1.02] focus:outline-none"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </nav>
                </div>
            </div >
        </>
    );
}
