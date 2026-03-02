import React, { useState, useEffect, useCallback } from 'react';
import { User, Phone, Mail, ShoppingCart, DollarSign, ArrowLeft, FileText, PlusCircle, Search, RefreshCw } from 'lucide-react';

export default function CustomerShow() {
    // Extract customer id from path — handles /react/customers/9 or /customers/9
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const customerId = pathParts[pathParts.length - 1];

    const [customer, setCustomer] = useState(null);
    const [sales, setSales] = useState([]);
    const [loadingCustomer, setLoadingCustomer] = useState(true);
    const [loadingSales, setLoadingSales] = useState(true);
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

    // Fetch all sales for this customer from the POS
    const fetchSales = useCallback(async () => {
        setLoadingSales(true);
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`/api/sales?customer_id=${customerId}&per_page=1000&_ts=${Date.now()}`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
            });
            if (res.ok) {
                const data = await res.json();
                // Build a flat list of individual sale records
                const rawSales = data.sales?.data ?? [];

                // Each sale = one row in the history table
                const history = rawSales.map(sale => ({
                    id: sale.id,
                    date: sale.date,
                    bill_no: `#${String(sale.id).padStart(6, '0')}`,
                    product: sale.items && sale.items.length > 0
                        ? sale.items.map(i => i.product_name).join(', ')
                        : 'Unknown Item',
                    amount: sale.total_amount,
                    paid_amount: sale.paid_amount,
                    type: sale.payment_method || 'Cash',
                    status: 'accept', // all POS sales start as accepted
                }));

                setSales(history);
            } else {
                console.error('Sales fetch failed:', res.status);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingSales(false);
        }
    }, [customerId]);

    useEffect(() => {
        fetchCustomer();
        fetchSales();
    }, [fetchCustomer, fetchSales]);

    // Local status override (frontend only, since there's no status update API)
    const [statusOverrides, setStatusOverrides] = useState({});

    const getStatus = (sale) => statusOverrides[sale.id] ?? sale.status;

    const updateStatus = (id, newStatus) => {
        setStatusOverrides(prev => ({ ...prev, [id]: newStatus }));
    };

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
    const acceptedSales = sales.filter(s => getStatus(s) === 'accept');
    const totalPurchases = acceptedSales.reduce((sum, s) => sum + s.amount, 0);
    const dueAmount = acceptedSales.reduce((sum, s) => sum + Math.max(0, s.amount - s.paid_amount), 0);

    const filteredHistory = sales.filter(record => {
        const s = productFilter.toLowerCase();
        return record.product.toLowerCase().includes(s) || record.bill_no.toLowerCase().includes(s);
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
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Customer Intelligence</h2>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-0.5">Profile & Activity Stream</p>
                    </div>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button
                        onClick={fetchSales}
                        disabled={loadingSales}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 px-5 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all font-bold text-xs"
                    >
                        <RefreshCw className={`w-4 h-4 ${loadingSales ? 'animate-spin' : ''}`} />
                        Refresh Logs
                    </button>
                    <button
                        onClick={handleGoToPOS}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-[#FF7d1f] to-[#2b59ff] text-white px-8 py-3 rounded-xl shadow-xl shadow-orange-500/20 hover:opacity-90 transition-all font-bold text-[10px] uppercase tracking-widest"
                    >
                        <PlusCircle className="w-4 h-4" />
                        Execute Transaction
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
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 md:p-10 text-white flex flex-col md:flex-row items-center justify-between shadow-xl shadow-blue-500/10 border border-white/10 gap-8">
                <div className="text-center md:text-left space-y-2">
                    <p className="uppercase text-[10px] font-bold tracking-[0.2em] opacity-60">Lifetime Engagement Value</p>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight">${totalPurchases.toLocaleString()}</h2>
                    <p className="text-xs font-medium opacity-60 uppercase tracking-widest">{acceptedSales.length} Verified Transactions Recorded</p>
                </div>
                <div className="h-16 w-16 md:h-20 md:w-20 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
                    <ShoppingCart className="h-8 w-8 md:h-10 md:w-10 text-white" />
                </div>
            </div>

            {/* Product / Sales History Container */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-[3rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 md:p-10 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row items-center justify-between gap-6 bg-gray-50/30 dark:bg-gray-900/10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">Transaction Stream</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Historical Purchase Intelligence Log</p>
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
                                <th className="px-8 py-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Intelligence Log</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Revenue</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Settlement</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Status</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Directives</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {filteredHistory.map((record) => {
                                const status = getStatus(record);
                                return (
                                    <tr key={record.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/40 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-black text-xs text-gray-900 dark:text-white uppercase tracking-tighter">{record.date}</span>
                                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">BILL-{record.bill_no}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 min-w-[300px]">
                                            <span className="font-black text-gray-800 dark:text-gray-200 text-sm uppercase tracking-tight line-clamp-1">{record.product}</span>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className={`font-black text-lg ${status === 'accept' ? 'text-gray-900 dark:text-white' : 'text-gray-300 dark:text-gray-600 line-through'}`}>
                                                ${record.amount.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className="px-4 py-2 rounded-xl text-[10px] font-black tracking-widest bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800 uppercase">
                                                {record.type}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-center text-[10px] font-black underline">
                                            <span className={`px-4 py-2 rounded-xl tracking-widest uppercase border ${status === 'accept' ? 'bg-green-600 text-white border-green-700 shadow-lg shadow-green-100' :
                                                status === 'refund' ? 'bg-orange-600 text-white border-orange-700 shadow-lg shadow-orange-100' :
                                                    'bg-rose-600 text-white border-rose-700 shadow-lg shadow-rose-100'
                                                }`}>
                                                {status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                {status !== 'accept' && (
                                                    <button onClick={() => updateStatus(record.id, 'accept')} className="px-4 py-2 bg-green-600 text-white rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-green-700 transition-all shadow-md active:scale-95">Accept</button>
                                                )}
                                                {status !== 'refund' && (
                                                    <button onClick={() => updateStatus(record.id, 'refund')} className="px-4 py-2 bg-orange-600 text-white rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-orange-700 transition-all shadow-md active:scale-95">Refund</button>
                                                )}
                                                {status !== 'reject' && (
                                                    <button onClick={() => updateStatus(record.id, 'reject')} className="px-4 py-2 bg-rose-600 text-white rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-rose-700 transition-all shadow-md active:scale-95">Reject</button>
                                                )}
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
                            const status = getStatus(record);
                            return (
                                <div key={record.id} className="p-6 md:p-8 space-y-6 active:bg-gray-50 dark:active:bg-gray-900/50 transition-colors">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">BILL NO: {record.bill_no}</p>
                                            <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-tighter text-lg leading-tight">{record.product}</h4>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{record.date}</p>
                                        </div>
                                        <div className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase border ${status === 'accept' ? 'bg-green-600 text-white border-green-700' :
                                            status === 'refund' ? 'bg-orange-600 text-white border-orange-700' :
                                                'bg-rose-600 text-white border-rose-700'
                                            }`}>
                                            {status}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6 bg-gray-50/50 dark:bg-gray-900/30 p-5 rounded-2xl border border-gray-100 dark:border-gray-700">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Amount</p>
                                            <p className={`text-xl font-black ${status === 'accept' ? 'text-gray-900 dark:text-white' : 'text-gray-300 dark:text-gray-600 line-through'}`}>${record.amount.toLocaleString()}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Type</p>
                                            <p className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">{record.type}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        {status !== 'accept' && (
                                            <button onClick={() => updateStatus(record.id, 'accept')} className="flex-1 py-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl text-[9px] font-black uppercase tracking-widest border border-green-100 dark:border-green-900 active:bg-green-600 active:text-white transition-all">Accept</button>
                                        )}
                                        {status !== 'refund' && (
                                            <button onClick={() => updateStatus(record.id, 'refund')} className="flex-1 py-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-xl text-[9px] font-black uppercase tracking-widest border border-orange-100 dark:border-orange-900 active:bg-orange-600 active:text-white transition-all">Refund</button>
                                        )}
                                        {status !== 'reject' && (
                                            <button onClick={() => updateStatus(record.id, 'reject')} className="flex-1 py-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl text-[9px] font-black uppercase tracking-widest border border-rose-100 dark:border-rose-900 active:bg-rose-600 active:text-white transition-all">Reject</button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="p-20 text-center font-black uppercase text-gray-400 tracking-widest text-xs">
                            {loadingSales ? 'Infiltrating Intelligent Database...' : 'Zero Transaction Records Detected'}
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
