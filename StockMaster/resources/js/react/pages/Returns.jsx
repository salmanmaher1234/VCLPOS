import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-2xl p-6 animate-scale-in max-h-[85vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
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
    const [customerName, setCustomerName] = useState('');
    const [reason, setReason] = useState('');
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);

    // Custom Item State
    const [isCustomItem, setIsCustomItem] = useState(false);
    const [customProductName, setCustomProductName] = useState('');
    const [customPrice, setCustomPrice] = useState('');

    // Rejection Modal State
    const [showRejectionModal, setShowRejectionModal] = useState(false);
    const [returnToReject, setReturnToReject] = useState(null);
    const [rejectionReason, setRejectionReason] = useState("");

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
        if (!selectedProduct && !isCustomItem) {
            setErrors(prev => ({ ...prev, product: 'Please select a product' }));
            return;
        }
        if (isCustomItem && (!customProductName || !customPrice)) {
            setErrors(prev => ({ ...prev, custom: 'Please enter product name and price' }));
            return;
        }

        setProcessing(true);
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/returns', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    product_id: isCustomItem ? null : selectedProduct.id,
                    product_name: isCustomItem ? customProductName : null,
                    price: isCustomItem ? customPrice : null,
                    quantity: parseInt(quantity) || 1,
                    return_type: returnType,
                    customer_name: customerName,
                    reason
                })
            });

            const data = await res.json();
            if (res.ok) {
                setShowCreateModal(false);
                setSearchTerm('');
                setSelectedProduct(null);
                setIsCustomItem(false);
                setCustomProductName('');
                setCustomPrice('');
                setQuantity(1);
                setCustomerName('');
                setReason('');
                fetchReturns(); // Refresh list
                alert('Return submitted for approval!');
            } else {
                if (data.errors) setErrors(data.errors);
                else {
                    console.error("Server Error:", data);
                    alert(data.message || 'Failed to process return. Check console for details.');
                }
            }
        } catch (error) {
            console.error(error);
            alert(`An error occurred: ${error.message}`);
        } finally {
            setProcessing(false);
        }
    };

    const handleUpdateStatus = async (id, status, reason = null) => {
        if (status !== 'rejected') {
            if (!confirm(`Are you sure you want to mark this return as ${status}?`)) return;
        }

        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`/api/returns/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status, rejection_reason: reason })
            });

            if (res.ok) {
                fetchReturns();
                if (status === 'rejected') {
                    setShowRejectionModal(false);
                    setRejectionReason("");
                    setReturnToReject(null);
                }
            } else {
                alert('Failed to update status');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred');
        }
    };

    const initiateRejection = (ret) => {
        setReturnToReject(ret);
        setShowRejectionModal(true);
    };

    const getStatusBadge = (status) => {
        switch (status.toLowerCase()) {
            case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
            case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
            case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
            case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
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
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Qty</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center">
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
                                            {ret.customer_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                            {ret.product_name}
                                            {ret.reason && <p className="text-xs text-gray-500 truncate max-w-[150px]">{ret.reason}</p>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                            {ret.quantity}
                                            <span className="text-xs text-gray-400 ml-1">({ret.type})</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col items-start gap-1">
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${getStatusBadge(ret.status)}`}>
                                                    {ret.status}
                                                </span>
                                                {ret.status === 'Rejected' && ret.rejection_reason && (
                                                    <span className="text-[10px] text-red-500 max-w-[100px] truncate" title={ret.rejection_reason}>
                                                        Reason: {ret.rejection_reason}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                                            ${ret.amount.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            {ret.status === 'Pending' && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleUpdateStatus(ret.id, 'approved')}
                                                        className="text-green-600 hover:text-green-900 font-bold text-xs border border-green-200 bg-green-50 px-2 py-1 rounded"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => initiateRejection(ret)}
                                                        className="text-red-600 hover:text-red-900 font-bold text-xs border border-red-200 bg-red-50 px-2 py-1 rounded"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            )}
                                            {ret.status === 'Approved' && !ret.refund_paid && ret.type === 'Refund' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(ret.id, 'completed')}
                                                    className="text-blue-600 hover:text-blue-900 font-bold text-xs border border-blue-200 bg-blue-50 px-2 py-1 rounded"
                                                >
                                                    Mark Paid
                                                </button>
                                            )}
                                            {ret.status === 'Approved' && ret.type === 'Replace' && (
                                                <span className="text-xs text-gray-500">Replacement Done</span>
                                            )}
                                            {ret.status === 'Completed' && (
                                                <span className="text-xs text-green-600 font-bold flex items-center gap-1">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                    Paid
                                                </span>
                                            )}
                                            {ret.status === 'Rejected' && (
                                                <span className="text-xs text-red-500">Rejected</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
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
                    {/* Customer Name */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Customer Name</label>
                        <input
                            type="text"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="w-full rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Walk-in Customer"
                        />
                    </div>

                    {/* Product Selection Mode */}
                    <div className="flex items-center gap-2 mb-2">
                        <input
                            type="checkbox"
                            checked={isCustomItem}
                            onChange={(e) => {
                                setIsCustomItem(e.target.checked);
                                setSelectedProduct(null);
                                setSearchTerm('');
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Custom Item (Not in Catalog)</label>
                    </div>

                    {!isCustomItem ? (
                        <>
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
                        </>
                    ) : (
                        <div className="space-y-3 p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl border border-yellow-100 dark:border-yellow-800">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Product Name</label>
                                <input
                                    type="text"
                                    value={customProductName}
                                    onChange={(e) => setCustomProductName(e.target.value)}
                                    className="w-full rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    placeholder="Enter Item Name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Price per Unit ($)</label>
                                <input
                                    type="number"
                                    value={customPrice}
                                    onChange={(e) => setCustomPrice(e.target.value)}
                                    className="w-full rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    placeholder="0.00"
                                />
                            </div>
                            {errors.custom && <p className="text-red-500 text-xs mt-1">{errors.custom}</p>}
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
                                Refund
                                <span className="block text-[10px] font-normal mt-1 opacity-75">Req. Approval</span>
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
                                Replace
                                <span className="block text-[10px] font-normal mt-1 opacity-75">No Cash Refund</span>
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
                        {processing ? 'Processing...' : 'Submit Request for Approval'}
                    </button>
                </div>
            </Modal>

            {/* REJECTION MODAL */}
            <Modal isOpen={showRejectionModal} onClose={() => { setShowRejectionModal(false); setRejectionReason(""); }} title="Reject Return Request">
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-300">
                        Please provide a reason for rejecting this return request. This will be visible in the records.
                    </p>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Rejection Reason</label>
                        <textarea
                            rows="3"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="w-full rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-red-500 focus:border-red-500 text-sm"
                            placeholder="e.g. Product damaged by customer, Receipt missing..."
                        ></textarea>
                    </div>
                    <div className="flex gap-3 justify-end mt-4">
                        <button
                            onClick={() => { setShowRejectionModal(false); setRejectionReason(""); }}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => handleUpdateStatus(returnToReject.id, 'rejected', rejectionReason)}
                            disabled={!rejectionReason.trim()}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Confirm Rejection
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
