import React, { useState, useEffect, useCallback } from 'react';
import { User, Phone, Mail, ShoppingCart, DollarSign, ArrowLeft, FileText, PlusCircle, Search, RefreshCw } from 'lucide-react';

export default function CustomerShow() {
    // Extract customer id from path — handles /react/customers/9 or /customers/9
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const customerId = pathParts[pathParts.length - 1];

    const [customer, setCustomer] = useState(null);
    const [activity, setActivity] = useState([]);
    const [loadingCustomer, setLoadingCustomer] = useState(true);
    const [loadingActivity, setLoadingActivity] = useState(true);
    const [productFilter, setProductFilter] = useState('');

    // Fetch customer info
    const fetchCustomer = useCallback(async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`/api/customers/${customerId}`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
            });
            if (res.ok) {
                setCustomer(await res.json());
            } else {
                console.error('Customer fetch failed:', res.status);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingCustomer(false);
        }
    }, [customerId]);

    // Fetch unified activity (sales & returns)
    const fetchActivity = useCallback(async () => {
        setLoadingActivity(true);
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`/api/customers/${customerId}/activity?_ts=${Date.now()}`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
            });
            if (res.ok) {
                const data = await res.json();
                setActivity(data.activity || []);
            } else {
                console.error('Activity fetch failed:', res.status);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingActivity(false);
        }
    }, [customerId]);

    useEffect(() => {
        fetchCustomer();
        fetchActivity();
    }, [fetchCustomer, fetchActivity]);

    const handleBack = () => {
        window.history.pushState({}, '', '/react/customer-details');
        window.dispatchEvent(new Event('pushstate'));
    };

    const handleGoToPOS = () => {
        window.history.pushState({}, '', '/react/pos');
        window.dispatchEvent(new Event('pushstate'));
    };

    if (loadingCustomer) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                <p className="text-gray-500 font-bold uppercase tracking-widest">Customer not found</p>
                <button onClick={handleBack} className="text-indigo-600 underline font-bold">Go Back</button>
            </div>
        );
    }

    // Derived stats
    const acceptedSales = activity.filter(s => s.source === 'sale');
    const totalPurchases = acceptedSales.reduce((sum, s) => sum + s.amount, 0);
    const dueAmount = 0; // Removed due amount calculation since we don't have paid_amount in the unified activity stream

    const filteredHistory = activity.filter(record => {
        const s = productFilter.toLowerCase();
        return record.product.toLowerCase().includes(s) || (record.bill_no && record.bill_no.toLowerCase().includes(s));
    });

    return (
        <main className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 gap-6">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <button onClick={handleBack} className="p-2.5 bg-gray-50 dark:bg-gray-900 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-400 hover:text-blue-600 transition-all">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Customer Profile</h2>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-0.5">Profile & Transaction History</p>
                    </div>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button
                        onClick={fetchActivity}
                        disabled={loadingActivity}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-[#FF7d1f] to-[#2b59ff] text-white px-6 py-3.5 rounded-xl hover:opacity-90 transition-all font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-orange-500/20 active:scale-95 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loadingActivity ? 'animate-spin' : ''}`} />
                        Refresh Data
                    </button>
                    <button
                        onClick={handleGoToPOS}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-[#FF7d1f] to-[#2b59ff] text-white px-8 py-3 rounded-xl shadow-xl shadow-orange-500/20 hover:opacity-90 transition-all font-bold text-[10px] uppercase tracking-widest"
                    >
                        <PlusCircle className="w-4 h-4" />
                        New Transaction
                    </button>
                </div>
            </div>

            {/* Profile Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                <InfoCard icon={<User className="w-5 h-5 text-blue-500" />} label="Name" value={customer.name} isPrimary />
                <InfoCard icon={<Phone className="w-5 h-5 text-green-500" />} label="Phone" value={customer.phone || 'N/A'} />
                <InfoCard icon={<Mail className="w-5 h-5 text-purple-500" />} label="Email" value={customer.email || 'N/A'} />
                <InfoCard icon={<DollarSign className="w-5 h-5 text-orange-500" />} label="Due Amount" value={`$${dueAmount.toLocaleString()}`} isHighlight />
            </div>

            {/* Total Purchases Banner */}
            <div className="bg-gradient-to-r from-[#FF7d1f] to-[#2b59ff] rounded-3xl p-8 md:p-10 text-white flex flex-col md:flex-row items-center justify-between shadow-xl shadow-orange-500/20 border border-white/10 gap-8">
                <div className="text-center md:text-left space-y-2">
                    <p className="uppercase text-[10px] font-bold tracking-[0.2em] opacity-60">Lifetime Value</p>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight">${totalPurchases.toLocaleString()}</h2>
                    <p className="text-xs font-medium opacity-60 uppercase tracking-widest">{acceptedSales.length} Transactions Recorded</p>
                </div>
                <div className="h-16 w-16 md:h-20 md:w-20 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
                    <ShoppingCart className="h-8 w-8 md:h-10 md:w-10 text-white" />
                </div>
            </div>

            {/* Product / Sales History Container */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-[3rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 md:p-10 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row items-center justify-between gap-6 bg-gray-50/30 dark:bg-gray-900/10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-[#FF7d1f] to-[#2b59ff] rounded-xl shadow-lg shadow-orange-500/20">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">Transaction History</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Recent Activity</p>
                        </div>
                    </div>
                    <div className="relative w-full md:w-1/3 group">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by product or bill no..."
                            value={productFilter}
                            onChange={(e) => setProductFilter(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 sm:py-5 bg-white dark:bg-gray-800 border-none rounded-[1.5rem] shadow-2xl shadow-gray-100 dark:shadow-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-xs font-black uppercase tracking-widest"
                        />
                    </div>
                </div>

                {/* Desktop View (Table) */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 dark:bg-gray-900/50">
                            <tr>
                                <th className="px-8 py-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Date & Voucher</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Product Details</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Revenue</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Settlement</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Status</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Type</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {filteredHistory.map((record) => {
                                const status = record.status;
                                return (
                                    <tr key={record.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/40 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-black text-xs text-gray-900 dark:text-white uppercase tracking-tighter">{record.date}</span>
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${record.source === 'return' ? 'text-red-500' : 'text-indigo-500'}`}>{record.bill_no}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 min-w-[300px]">
                                            <span className="font-black text-gray-800 dark:text-gray-200 text-sm uppercase tracking-tight line-clamp-1">{record.product}</span>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className={`font-black text-lg ${record.source === 'return' ? 'text-rose-500' : 'text-gray-900 dark:text-white'}`}>
                                                {record.source === 'return' ? '-' : ''}${record.amount.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest uppercase ${record.source === 'return' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>
                                                {record.type}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest uppercase ${status === 'accept' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' :
                                                status === 'refund' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30' :
                                                    'bg-rose-100 text-rose-700 dark:bg-rose-900/30'
                                                }`}>
                                                {status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-end">
                                                {record.source === 'return' ? <span className="text-[9px] uppercase font-black tracking-widest text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-3 py-1.5 rounded-md">Return</span> : <span className="text-[9px] uppercase font-black tracking-widest text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-md">Sale</span>}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View (Cards) */}
                <div className="lg:hidden divide-y divide-gray-100 dark:divide-gray-700">
                    {filteredHistory.length > 0 ? (
                        filteredHistory.map((record) => {
                            const status = record.status;
                            return (
                                <div key={record.id} className="p-6 md:p-8 space-y-6 flex flex-col active:bg-gray-50 dark:active:bg-gray-900/50 transition-colors">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="space-y-1">
                                            <p className={`text-[10px] font-black uppercase tracking-widest ${record.source === 'return' ? 'text-red-600' : 'text-indigo-600'}`}>{record.bill_no}</p>
                                            <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-tighter text-lg leading-tight">{record.product}</h4>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{record.date}</p>
                                        </div>
                                        <div className={`px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest uppercase ${status === 'accept' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' :
                                            status === 'refund' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30' :
                                                'bg-rose-100 text-rose-700 dark:bg-rose-900/30'
                                            }`}>
                                            {status}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6 bg-gray-50/50 dark:bg-gray-900/30 p-5 rounded-2xl border border-gray-100 dark:border-gray-700">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Amount</p>
                                            <p className={`text-xl font-black ${record.source === 'return' ? 'text-rose-500' : 'text-gray-900 dark:text-white'}`}>{record.source === 'return' ? '-' : ''}${record.amount.toLocaleString()}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Type</p>
                                            <p className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">{record.type}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="p-20 text-center font-black uppercase text-gray-400 tracking-widest text-xs">
                            {loadingActivity ? 'Loading Data...' : 'No Transactions Found'}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

function InfoCard({ icon, label, value, isPrimary = false, isHighlight = false }) {
    return (
        <div className={`bg-white dark:bg-gray-800 p-6 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4 ${isPrimary ? 'ring-2 ring-indigo-500/10 border-indigo-100 dark:border-indigo-900/50' : ''}`}>
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                <p className={`font-black uppercase tracking-tight truncate ${isHighlight ? 'text-xl sm:text-2xl text-red-500' : 'text-sm sm:text-base text-gray-800 dark:text-gray-200'}`}>
                    {value}
                </p>
            </div>
        </div>
    );
}
