import React, { useState, useEffect } from 'react';
import { Bell, Search, Filter, Trash2, CheckCircle, Clock, ShoppingCart, UserPlus, CreditCard, AlertTriangle, MoreVertical, X, Calendar, ArrowLeft } from 'lucide-react';

export default function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('All');

    useEffect(() => {
        const loadNotifs = () => {
            try {
                const saved = JSON.parse(localStorage.getItem('vcl_notifications') || '[]');
                setNotifications(Array.isArray(saved) ? saved : []);
            } catch (e) {
                console.error("Failed to parse notifications:", e);
                setNotifications([]);
            }
        };
        loadNotifs();

        // Listen for new notifications
        const handleNewNotif = () => {
            const updated = JSON.parse(localStorage.getItem('vcl_notifications') || '[]');
            setNotifications(updated);
        };
        window.addEventListener('vcl-notification-added', handleNewNotif);
        return () => window.removeEventListener('vcl-notification-added', handleNewNotif);
    }, []);

    const saveNotifications = (newNotifs) => {
        setNotifications(newNotifs);
        localStorage.setItem('vcl_notifications', JSON.stringify(newNotifs));
        window.dispatchEvent(new Event('vcl-notification-added'));
    };

    const handleMarkAsRead = (id) => {
        const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
        saveNotifications(updated);
    };

    const handleDelete = (id) => {
        const updated = notifications.filter(n => n.id !== id);
        saveNotifications(updated);
    };

    const handleClearAll = () => {
        if (confirm('Permanently purge entire activity log?')) {
            saveNotifications([]);
        }
    };

    const handleMarkAllRead = () => {
        const updated = notifications.map(n => ({ ...n, read: true }));
        saveNotifications(updated);
    };

    const filteredNotifs = notifications.filter(n => {
        const matchesSearch = n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            n.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (n.invoice && n.invoice.toLowerCase().includes(searchTerm.toLowerCase()));

        let matchesFilter = true;
        if (filter === 'sales') matchesFilter = n.type === 'sale';
        if (filter === 'payment') matchesFilter = n.type === 'payment';
        if (filter === 'low stock') matchesFilter = n.type === 'low_stock';
        if (filter === 'staff') matchesFilter = n.type === 'staff';
        if (filter === 'today') {
            const today = new Date().toDateString();
            const logDate = n.timestamp ? new Date(n.timestamp).toDateString() : (n.date || '');
            matchesFilter = logDate === today;
        }
        if (filter === 'this week') {
            const now = new Date();
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const logTimestamp = n.timestamp ? new Date(n.timestamp).getTime() : 0;
            matchesFilter = logTimestamp > weekAgo.getTime();
        }

        return matchesSearch && matchesFilter;
    });

    const getIcon = (type) => {
        switch (type) {
            case 'sale': return <ShoppingCart className="w-5 h-5" />;
            case 'payment': return <CreditCard className="w-5 h-5" />;
            case 'low_stock': return <AlertTriangle className="w-5 h-5" />;
            case 'product': return <Filter className="w-5 h-5" />; // Reusing filter for product representation
            case 'purchase': return <ShoppingCart className="w-5 h-5" />;
            case 'return': return <ArrowLeft className="w-5 h-5" />;
            case 'adjustment': return <Filter className="w-5 h-5" />;
            case 'customer': return <UserPlus className="w-5 h-5" />;
            case 'staff': return <Clock className="w-5 h-5" />;
            default: return <Bell className="w-5 h-5" />;
        }
    };

    const getColorClass = (type) => {
        switch (type) {
            case 'sale': return 'bg-blue-500 text-white shadow-blue-500/20';
            case 'payment': return 'bg-emerald-500 text-white shadow-emerald-500/20';
            case 'low_stock': return 'bg-rose-500 text-white shadow-rose-500/20';
            case 'product': return 'bg-indigo-500 text-white shadow-indigo-500/20';
            case 'purchase': return 'bg-cyan-500 text-white shadow-cyan-500/20';
            case 'return': return 'bg-orange-500 text-white shadow-orange-500/20';
            case 'adjustment': return 'bg-purple-500 text-white shadow-purple-500/20';
            case 'customer': return 'bg-teal-500 text-white shadow-teal-500/20';
            case 'staff': return 'bg-indigo-600 text-white shadow-indigo-600/20';
            default: return 'bg-gray-500 text-white shadow-gray-500/20';
        }
    };

    return (
        <main className="p-3 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Executive Summary Header */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 gap-8">
                <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                    <div className="p-4 bg-gradient-to-r from-[#FF7d1f] to-[#2b59ff] rounded-2xl shadow-lg shadow-orange-500/20">
                        <Bell className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">System Logs</h2>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-1">Monitoring {notifications.length} Historical Events</p>
                    </div>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button
                        onClick={handleMarkAllRead}
                        className="flex-1 md:px-6 py-3.5 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-gradient-to-r hover:from-[#FF7d1f] hover:to-[#2b59ff] hover:text-white transition-all shadow-sm border border-transparent hover:shadow-lg hover:shadow-orange-500/20"
                    >
                        Acknowledge All
                    </button>
                    <button
                        onClick={handleClearAll}
                        className="flex-1 md:px-6 py-3.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm border border-transparent"
                    >
                        Purge History
                    </button>
                </div>
            </div>

            {/* Strategic Filters */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="relative md:col-span-3 group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search logs by title or details..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-14 pr-8 py-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all outline-none font-semibold text-sm dark:text-white"
                    />
                </div>
                <div className="relative group">
                    <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="w-full pl-14 pr-12 py-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all outline-none appearance-none font-bold text-xs uppercase text-gray-700 dark:text-gray-200"
                    >
                        <option value="All">All Categories</option>
                        <option value="sales">Sales & Revenue</option>
                        <option value="staff">Staff Operations</option>
                        <option value="payment">Financial & Payroll</option>
                        <option value="low stock">Inventory Alerts</option>
                        <option value="customer">Client Records</option>
                        <option value="today">Today Only</option>
                        <option value="this week">Recent Week</option>
                    </select>
                </div>
            </div>

            {/* Event Stream */}
            <div className="space-y-4 sm:space-y-6">
                {filteredNotifs.length > 0 ? (
                    filteredNotifs.map((notif) => (
                        <div
                            key={notif.id}
                            className={`group p-6 rounded-3xl transition-all border ${notif.read
                                ? 'bg-white/50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800'
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-800 shadow-sm ring-1 ring-blue-500/5'
                                }`}
                        >
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                                <div className={`shrink-0 p-3.5 rounded-2xl shadow-lg ${getColorClass(notif.type)}`}>
                                    {getIcon(notif.type)}
                                </div>

                                <div className="flex-1 text-center sm:text-left min-w-0">
                                    <div className="flex flex-col sm:flex-row items-center gap-3 mb-2">
                                        <h4 className={`text-lg font-bold tracking-tight ${notif.read ? 'text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                                            {notif.title}
                                        </h4>
                                        {notif.invoice && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-50 dark:bg-gray-900 text-gray-400 rounded-lg border border-gray-100 dark:border-gray-800">
                                                #{notif.invoice}
                                            </span>
                                        )}
                                    </div>
                                    <p className={`text-sm font-medium leading-relaxed mb-3 ${notif.read ? 'text-gray-400' : 'text-gray-600 dark:text-gray-300'}`}>
                                        {notif.message}
                                    </p>
                                    <div className="flex items-center justify-center sm:justify-start gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-900 px-3 py-1 rounded-lg">
                                            <Clock className="w-3.5 h-3.5 text-blue-500" />
                                            <span>{notif.time || '00:00'}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-900 px-3 py-1 rounded-lg">
                                            <Calendar className="w-3.5 h-3.5 text-orange-500" />
                                            <span>{notif.date || 'TBD'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex sm:flex-col gap-2 shrink-0">
                                    {!notif.read && (
                                        <button
                                            onClick={() => handleMarkAsRead(notif.id)}
                                            className="p-3 bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 rounded-xl hover:bg-gradient-to-r hover:from-[#FF7d1f] hover:to-[#2b59ff] hover:text-white transition-all shadow-sm"
                                            title="Mark as Read"
                                        >
                                            <CheckCircle className="w-5 h-5" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(notif.id)}
                                        className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                        title="Delete Log"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 sm:py-32 bg-gray-50/30 dark:bg-gray-800/30 border-4 border-dashed border-gray-100 dark:border-gray-800 rounded-[2.5rem] sm:rounded-[4rem] space-y-6 sm:space-y-8 animate-in zoom-in-95 duration-700">
                        <div className="relative">
                            <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-10 animate-pulse"></div>
                            <div className="relative bg-white dark:bg-gray-800 p-6 sm:p-10 rounded-2xl sm:rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-700">
                                <Bell className="w-12 h-12 sm:w-20 sm:h-20 text-gray-200 dark:text-gray-700" />
                            </div>
                        </div>
                        <div className="text-center space-y-2 sm:space-y-4 px-6">
                            <h4 className="text-xl sm:text-3xl font-black text-gray-800 dark:text-white uppercase tracking-tighter">Zero interference detected</h4>
                            <p className="text-[10px] sm:text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] sm:tracking-[0.4em] italic leading-relaxed">
                                System stream is currently clear <br className="hidden sm:block" /> of pending events.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
