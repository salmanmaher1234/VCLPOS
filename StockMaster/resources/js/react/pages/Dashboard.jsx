import React, { useEffect, useState } from 'react';

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [isOpen, setIsOpen] = useState(false); // Sidebar state
    const [stats, setStats] = useState({
        totalSales: 0,
        revenue: 0,
        customersCount: 0,
        productsCount: 0,
        suppliersCount: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check authentication
        const token = localStorage.getItem('auth_token');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
            window.location.href = '/react/login';
            return;
        }

        setUser(JSON.parse(userData));
        fetchDashboardData(token);
    }, []);

    const fetchDashboardData = async (token) => {
        try {
            const response = await fetch('/api/dashboard-data', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <main className="py-6 px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500 animate-pulse">Loading Dashboard Data...</div>
                </div>
            </main>
        );
    }

    return (
        <main className="py-6 px-4 sm:px-6 lg:px-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {/* Total Sales Card */}
                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900 text-orange-500 dark:text-orange-300">
                            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Total Sales</p>
                            <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                                ${stats.totalSales.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Revenue Card */}
                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-green-100 dark:bg-green-900 text-green-500 dark:text-green-300">
                            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Revenue</p>
                            <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                                ${stats.revenue.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Customers Card */}
                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-500 dark:text-blue-300">
                            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Customers</p>
                            <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                                {stats.customersCount}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Products Card */}
                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-500 dark:text-purple-300">
                            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Products</p>
                            <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                                {stats.productsCount}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Suppliers Card */}
                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-500 dark:text-indigo-300">
                            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Suppliers</p>
                            <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                                {stats.suppliersCount || 0}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dashboard Content */}
            <div className="flex items-center justify-center p-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Welcome to StockMaster</h2>
                    <p className="text-gray-500 dark:text-gray-400">Use the sidebar to navigate through your inventory and sales.</p>
                </div>
            </div>
        </main>
    );
}
