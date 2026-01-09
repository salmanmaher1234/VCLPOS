import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-2xl p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                {children}
            </div>
        </div>,
        document.body
    );
};

export default function Returns() {
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    // Create Return Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [returnType, setReturnType] = useState('refund'); // 'refund' | 'replace'
    const [reason, setReason] = useState('');
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);

    const fetchReturns = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`/api/returns?page=${page}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setReturns(data.data);
                setLastPage(data.last_page);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async (search) => {
        if (!search) {
            setProducts([]);
            return;
        }
        try {
            const token = localStorage.getItem('auth_token');
            // Assuming existing product search endpoint or we use the main product list endpoint with search param
            // Note: The existing products API likely supports ?search=... or we might fetch all if list is small.
            // Let's assume standard index?search=
            const res = await fetch(`/api/products?search=${search}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            // Adjust based on existing ProductController response structure. 
            // Typically it returns data.data or just array if not paginated? 
            // Based on routes, it uses apiResource ProductController. 
            // Let's assume standard Laravel pagination response
            if (res.ok) {
                setProducts(data.data || []);
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchReturns();
    }, [page]);

    // Debounce product search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm.length >= 2) {
                fetchProducts(searchTerm);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleCreateReturn = async () => {
        setErrors({});
        if (!selectedProduct) {
            setErrors(prev => ({ ...prev, product: 'Please select a product' }));
            return;
        }

        setProcessing(true);
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/returns', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    product_id: selectedProduct.id,
                    quantity: parseInt(quantity),
                    return_type: returnType,
                    reason
                })
            });

            const data = await res.json();
            if (res.ok) {
                setShowCreateModal(false);
                setSearchTerm('');
                setSelectedProduct(null);
                setQuantity(1);
                setReason('');
                fetchReturns(); // Refresh list
            } else {
                if (data.errors) setErrors(data.errors);
                else alert(data.message || 'Failed to process return');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Returns & Replacements</h1>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-all"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    New Return
                </button>
            </div>

            {/* LIST */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Qty</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reason</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center">
                                        <div className="flex justify-center">
                                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : returns.length > 0 ? (
                                returns.map((ret) => (
                                    <tr key={ret.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {ret.date} <span className="text-xs ml-1 opacity-75">{ret.time}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                            {ret.product_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                            {ret.quantity}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${ret.type === 'Refund'
                                                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                                }`}>
                                                {ret.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                                            ${ret.amount.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                            {ret.reason}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        No returns found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Pagination - Simple */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Page {page} of {lastPage}</span>
                    <button
                        disabled={page === lastPage}
                        onClick={() => setPage(p => p + 1)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200"
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* CREATE MODAL */}
            <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Process New Return">
                <div className="space-y-4">
                    {/* Product Search */}
                    <div className="relative">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Search Product</label>
                        <input
                            type="text"
                            className="w-full rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Type product name..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                if (!e.target.value) setSelectedProduct(null);
                            }}
                        />
                        {products.length > 0 && !selectedProduct && (
                            <div className="absolute z-10 w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl mt-1 shadow-lg max-h-48 overflow-y-auto">
                                {products.map(prod => (
                                    <div
                                        key={prod.id}
                                        onClick={() => {
                                            setSelectedProduct(prod);
                                            setSearchTerm(prod.name);
                                            setProducts([]);
                                        }}
                                        className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer text-sm text-gray-800 dark:text-gray-200"
                                    >
                                        <div className="font-bold">{prod.name}</div>
                                        <div className="text-xs text-gray-500">Stock: {prod.quantity} | ${prod.price}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {errors.product && <p className="text-red-500 text-xs mt-1">{errors.product}</p>}
                    </div>

                    {selectedProduct && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 flex justify-between items-center">
                            <div>
                                <h4 className="font-bold text-blue-900 dark:text-blue-100">{selectedProduct.name}</h4>
                                <p className="text-xs text-blue-700 dark:text-blue-300">Price: ${parseFloat(selectedProduct.price).toFixed(2)}</p>
                            </div>
                            <button onClick={() => { setSelectedProduct(null); setSearchTerm(''); }} className="text-blue-500 hover:text-blue-700 text-xs underline">Change</button>
                        </div>
                    )}

                    {/* Quantity */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
                        <input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className="w-full rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
                    </div>

                    {/* Return Type Selection */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Action Type</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setReturnType('refund')}
                                className={`py-3 px-4 rounded-xl border font-bold text-sm transition-all text-center
                                    ${returnType === 'refund'
                                        ? 'bg-red-50 border-red-200 text-red-700 ring-2 ring-red-500/20'
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                Refund (Money Back)
                                <span className="block text-[10px] font-normal mt-1 opacity-75">Stock Increases (+{quantity})</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setReturnType('replace')}
                                className={`py-3 px-4 rounded-xl border font-bold text-sm transition-all text-center
                                    ${returnType === 'replace'
                                        ? 'bg-blue-50 border-blue-200 text-blue-700 ring-2 ring-blue-500/20'
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                Replace (Swap)
                                <span className="block text-[10px] font-normal mt-1 opacity-75">No Stock Change</span>
                            </button>
                        </div>
                    </div>

                    {/* Reason */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Reason (Optional)</label>
                        <textarea
                            rows="2"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder="e.g. Damaged, Wrong Size..."
                        ></textarea>
                    </div>
                </div>

                <div className="mt-6">
                    <button
                        onClick={handleCreateReturn}
                        disabled={processing}
                        className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all
                            ${returnType === 'refund'
                                ? 'bg-red-600 hover:bg-red-700 shadow-red-500/30'
                                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'
                            } ${processing ? 'opacity-75 cursor-wait' : ''}`}
                    >
                        {processing ? 'Processing...' : (returnType === 'refund' ? `Confirm Refund ($${(selectedProduct ? selectedProduct.price * quantity : 0).toFixed(2)})` : 'Confirm Replacement')}
                    </button>
                </div>
            </Modal>
        </div>
    );
}

