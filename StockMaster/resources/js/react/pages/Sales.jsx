import React, { useState, useEffect } from "react";

export default function Sales() {
    const [sales, setSales] = useState([]);
    const [stats, setStats] = useState({
        total_revenue: 0,
        transaction_count: 0,
        avg_order_value: 0
    });
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedSale, setSelectedSale] = useState(null);
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    const fetchSales = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const params = new URLSearchParams();
            if (fromDate) params.append('start_date', fromDate);
            if (toDate) params.append('end_date', toDate);

            const response = await fetch(`/api/sales?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                }
            });

            if (response.ok) {
                const data = await response.json();
                setSales(data.sales.data); // data.sales is the paginator, .data is the array
                setStats(data.stats);
            } else {
                console.error("Failed to fetch sales");
            }
        } catch (error) {
            console.error("Error fetching sales:", error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch on mount and when filters change (debouncing could be added but explicit Apply button is requested pattern)
    useEffect(() => {
        fetchSales();
    }, []);

    // --- Modal Logic ---
    const handleViewDetails = (sale) => {
        setSelectedSale(sale);
        setShowModal(true);
    };

    // --- Latest Sale Logic ---
    const handleLatestSale = () => {
        if (sales.length === 0) return;
        const latest = sales[0]; // Ordered by desc in backend, so 0 is latest
        handleViewDetails(latest);
    };

    const handleApplyFilter = () => {
        fetchSales();
    };

    const handleReset = () => {
        setFromDate("");
        setToDate("");
        // We need to trigger fetch after state update, but state update is async.
        // A simple way is to reload window or just call fetch with empty params explicitly.
        // Using explicit call here:
        setLoading(true);
        const token = localStorage.getItem('auth_token');
        fetch(`/api/sales`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            }
        }).then(res => res.json()).then(data => {
            setSales(data.sales.data);
            setStats(data.stats);
            setLoading(false);
        });
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Sales List</h1>

            {/* TOP METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Total Revenue</span>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                        ${stats.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h2>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Transactions</span>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.transaction_count}</h2>
                    <span className="text-xs text-gray-400 mt-1 block">Based on filters</span>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Avg. Order Value</span>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                        ${stats.avg_order_value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </h2>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* SIDEBAR FILTER */}
                <aside className="w-full lg:w-72 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 sticky top-6">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-6">Search Filters</h3>

                    <div className="mb-4">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">From Date</label>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="w-full rounded-xl border-gray-200 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">To Date</label>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="w-full rounded-xl border-gray-200 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                    </div>

                    <button
                        onClick={handleApplyFilter}
                        className="w-full bg-gradient-to-r from-orange-500 to-blue-600 hover:from-orange-600 hover:to-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg mb-3"
                    >
                        Apply Filter
                    </button>

                    <button
                        onClick={handleReset}
                        className="w-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium text-sm transition-colors"
                    >
                        Reset All
                    </button>
                </aside>

                {/* CONTENT LIST */}
                <main className="flex-1 w-full">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Recent Transactions</h2>
                        <button
                            onClick={handleLatestSale}
                            className="bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-4 py-2 rounded-xl font-semibold transition-colors"
                        >
                            Latest Sale
                        </button>
                    </div>

                    <div className="space-y-3">
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : sales.length > 0 ? (
                            sales.map((sale) => (
                                <div
                                    key={sale.id}
                                    onClick={() => handleViewDetails(sale)}
                                    className="group bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md cursor-pointer transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg">
                                            {sale.first_product_name.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white">
                                                {sale.first_product_name}
                                                {sale.items_count > 1 && <span className="text-gray-400 font-normal text-sm ml-2">+{sale.items_count - 1} more</span>}
                                            </h4>
                                            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                                <span>{sale.date}</span>
                                                <span>&bull;</span>
                                                <span>{sale.customer_name}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 sm:gap-10 ml-16 sm:ml-0">
                                        <div className="text-right">
                                            <span className="block text-xs text-gray-500">Qty</span>
                                            <span className="font-semibold text-gray-900 dark:text-white">{sale.items_count}</span>
                                        </div>
                                        <div className="text-right w-24">
                                            <span className="block text-xs text-gray-500">Total</span>
                                            <span className="font-bold text-green-600 dark:text-green-400 text-lg">${sale.total_amount.toFixed(2)}</span>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold
                                            ${sale.status === 'Completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}
                                        `}>
                                            {sale.status}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-dashed border-gray-300 dark:border-gray-700">
                                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                <p className="text-gray-500 dark:text-gray-400 font-medium">No transactions found for the selected period.</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* DETAILS MODAL */}
            {showModal && selectedSale && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in" onClick={() => setShowModal(false)}>
                    <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-2xl p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Transaction Details</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Transaction ID</span>
                                <span className="font-bold text-gray-900 dark:text-white">#{selectedSale.sale_number || selectedSale.id}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Date & Time</span>
                                <span className="font-bold text-gray-900 dark:text-white">{selectedSale.date} at {selectedSale.time}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Customer</span>
                                <span className="font-bold text-gray-900 dark:text-white">{selectedSale.customer_name}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Status</span>
                                <span className={`font-bold px-2 py-0.5 rounded text-xs ${selectedSale.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {selectedSale.status}
                                </span>
                            </div>

                            <div className="border-t border-dashed border-gray-200 dark:border-gray-700 my-4 pt-4">
                                <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-3">Items</h4>
                                <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                                    {selectedSale.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                            <span className="text-gray-600 dark:text-gray-300">
                                                {item.quantity}x {item.product_name}
                                            </span>
                                            <span className="font-medium text-gray-900 dark:text-white">${item.total.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t border-gray-100 dark:border-gray-700 pt-4 flex justify-between items-center">
                                <span className="text-lg font-bold text-gray-700 dark:text-gray-300">Total Amount</span>
                                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">${selectedSale.total_amount.toFixed(2)}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowModal(false)}
                            className="w-full mt-6 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold py-3 rounded-xl transition-colors"
                        >
                            Close Details
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
