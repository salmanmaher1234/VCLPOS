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
        <main className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                    <button onClick={handleBack} className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-all">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-3xl font-black uppercase text-gray-800 tracking-tight">Customer Profile</h2>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchSales}
                        disabled={loadingSales}
                        className="flex items-center gap-2 bg-gray-100 text-gray-600 px-4 py-3 rounded-2xl hover:bg-gray-200 transition-all uppercase font-black text-xs tracking-wider"
                    >
                        <RefreshCw className={`w-4 h-4 ${loadingSales ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                    <button
                        onClick={handleGoToPOS}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-lg hover:bg-indigo-700 transition-all uppercase font-black text-xs tracking-wider"
                    >
                        <PlusCircle className="w-5 h-5" />
                        New Sale (POS)
                    </button>
                </div>
            </div>

            {/* Profile Info Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/80">
                        <tr>
                            <th className="p-5 text-xs font-black uppercase text-gray-500 tracking-wider">
                                <User className="inline w-4 h-4 mr-2 text-blue-500" />Name
                            </th>
                            <th className="p-5 text-xs font-black uppercase text-gray-500 tracking-wider">
                                <Phone className="inline w-4 h-4 mr-2 text-green-500" />Phone
                            </th>
                            <th className="p-5 text-xs font-black uppercase text-gray-500 tracking-wider">
                                <Mail className="inline w-4 h-4 mr-2 text-purple-500" />Email
                            </th>
                            <th className="p-5 text-xs font-black uppercase text-gray-500 tracking-wider">
                                <DollarSign className="inline w-4 h-4 mr-2 text-orange-500" />Due Amount
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="p-6"><span className="font-black text-lg text-gray-800">{customer.name}</span></td>
                            <td className="p-6"><span className="font-bold text-gray-600">{customer.phone || 'N/A'}</span></td>
                            <td className="p-6"><span className="font-bold text-gray-600">{customer.email || 'N/A'}</span></td>
                            <td className="p-6">
                                <span className="font-black text-2xl text-red-500">${dueAmount.toLocaleString()}</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Total Purchases Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 text-white flex items-center justify-between shadow-xl">
                <div>
                    <p className="uppercase text-[10px] font-black tracking-widest opacity-80 mb-2">Total Lifetime Purchases</p>
                    <h2 className="text-4xl font-black">${totalPurchases.toLocaleString()}</h2>
                    <p className="text-sm opacity-70 mt-1">{acceptedSales.length} accepted sale(s)</p>
                </div>
                <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <ShoppingCart className="h-8 w-8 text-white" />
                </div>
            </div>

            {/* Product / Sales History */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-indigo-500" />
                        <h3 className="font-black uppercase text-gray-800 tracking-wider">Purchase History</h3>
                        {loadingSales && <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />}
                    </div>
                    <div className="relative w-full sm:w-1/3">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Filter by product or bill no..."
                            value={productFilter}
                            onChange={(e) => setProductFilter(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white">
                            <tr>
                                <th className="p-5 border-b text-[10px] font-black uppercase text-gray-400 tracking-widest">Date</th>
                                <th className="p-5 border-b text-[10px] font-black uppercase text-gray-400 tracking-widest">Bill No</th>
                                <th className="p-5 border-b text-[10px] font-black uppercase text-gray-400 tracking-widest">Product(s)</th>
                                <th className="p-5 border-b text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Amount</th>
                                <th className="p-5 border-b text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Payment</th>
                                <th className="p-5 border-b text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Status</th>
                                <th className="p-5 border-b text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredHistory.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-16 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                                        {loadingSales ? 'Loading sales...' : 'No purchases found for this customer'}
                                    </td>
                                </tr>
                            ) : filteredHistory.map((record) => {
                                const status = getStatus(record);
                                return (
                                    <tr key={record.id} className="hover:bg-gray-50/80 transition-colors">
                                        <td className="p-5">
                                            <span className="font-bold text-sm text-gray-500">{record.date}</span>
                                        </td>
                                        <td className="p-5">
                                            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-black tracking-wider">
                                                {record.bill_no}
                                            </span>
                                        </td>
                                        <td className="p-5">
                                            <span className="font-black text-gray-800 text-sm">{record.product}</span>
                                        </td>
                                        <td className="p-5 text-center">
                                            <span className={`font-black text-lg ${status === 'accept' ? 'text-gray-800' : 'text-gray-400 line-through'}`}>
                                                ${record.amount.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="p-5 text-center">
                                            <span className="px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest bg-blue-50 text-blue-600 border border-blue-100 uppercase">
                                                {record.type}
                                            </span>
                                        </td>
                                        <td className="p-5 text-center">
                                            <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase ${status === 'accept' ? 'bg-green-100 text-green-700 border border-green-200' :
                                                    status === 'refund' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                                                        'bg-red-100 text-red-700 border border-red-200'
                                                }`}>
                                                {status}
                                            </span>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex justify-end gap-2">
                                                {status !== 'accept' && (
                                                    <button onClick={() => updateStatus(record.id, 'accept')} className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors border border-green-200">
                                                        Accept
                                                    </button>
                                                )}
                                                {status !== 'refund' && (
                                                    <button onClick={() => updateStatus(record.id, 'refund')} className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors border border-orange-200">
                                                        Refund
                                                    </button>
                                                )}
                                                {status !== 'reject' && (
                                                    <button onClick={() => updateStatus(record.id, 'reject')} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors border border-red-200">
                                                        Reject
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
}
