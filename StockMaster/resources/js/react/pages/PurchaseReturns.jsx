import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 w-full max-w-4xl rounded-2xl shadow-2xl p-6 animate-scale-in max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
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

export default function PurchaseReturns() {
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    // Create Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [suppliers, setSuppliers] = useState([]);
    const [selectedSupplier, setSelectedSupplier] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [reference, setReference] = useState('');
    const [note, setNote] = useState('');

    // Items State
    const [items, setItems] = useState([]); // { product_id, product_name, quantity, unit_cost, subtotal }
    const [productSearch, setProductSearch] = useState('');
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [itemQty, setItemQty] = useState(1);
    const [itemCost, setItemCost] = useState(0);

    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);

    const fetchReturns = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`/api/purchase-returns?page=${page}`, {
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

    const fetchSuppliers = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/suppliers', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) setSuppliers(data.data || data); // Handle paginate vs all
        } catch (error) {
            console.error(error);
        }
    };

    const fetchProducts = async (search) => {
        if (!search) {
            setProducts([]);
            return;
        }
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`/api/products?search=${search}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) setProducts(data.data || []);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchReturns();
        fetchSuppliers();
    }, [page]);

    // Search Debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (productSearch.length >= 2) fetchProducts(productSearch);
        }, 300);
        return () => clearTimeout(timer);
    }, [productSearch]);

    const addItem = () => {
        if (!selectedProduct) return;
        if (itemQty <= 0) return;

        const newItem = {
            product_id: selectedProduct.id,
            product_name: selectedProduct.name,
            quantity: parseInt(itemQty),
            unit_cost: parseFloat(itemCost),
            subtotal: parseInt(itemQty) * parseFloat(itemCost)
        };

        setItems([...items, newItem]);
        // Reset Item Inputs
        setSelectedProduct(null);
        setProductSearch('');
        setItemQty(1);
        setItemCost(0);
    };

    const removeItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        setErrors({});
        if (!selectedSupplier) {
            setErrors(prev => ({ ...prev, supplier_id: 'Select a supplier' }));
            return;
        }
        if (items.length === 0) {
            alert('Please add at least one item');
            return;
        }

        setProcessing(true);
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/purchase-returns', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    supplier_id: selectedSupplier,
                    date,
                    // reference, // Auto-generated by backend
                    note,
                    items
                })
            });

            const data = await res.json();
            if (res.ok) {
                setShowCreateModal(false);
                // Reset Form
                setNote('');
                setItems([]);
                setSelectedSupplier('');
                fetchReturns();
                alert('Purchase Return created successfully! Stock updated.');
            } else {
                if (data.errors) setErrors(data.errors);
                else alert(data.message || 'Error occurred');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setProcessing(false);
        }
    };

    // Calculate Grand Total
    const grandTotal = items.reduce((sum, item) => sum + item.subtotal, 0);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Purchase Returns</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Return items to suppliers & adjust stock</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-all"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    New Return
                </button>
            </div>

            {/* LIST TABLE */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ref</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Supplier</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Items</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr><td colSpan="6" className="text-center py-8">Loading...</td></tr>
                            ) : returns.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-8 text-gray-500">No returns found</td></tr>
                            ) : (
                                returns.map(ret => (
                                    <tr key={ret.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{ret.date}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{ret.reference}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{ret.supplier?.name || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{ret.items_count}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">${parseFloat(ret.total_amount).toFixed(2)}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                                {ret.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* CREATE MODAL */}
            <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Purchase Return">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* LEFT: HEADER INFO */}
                    <div className="md:col-span-1 space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Supplier</label>
                            <select
                                value={selectedSupplier}
                                onChange={e => setSelectedSupplier(e.target.value)}
                                className="w-full rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="">Select Supplier</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            {errors.supplier_id && <p className="text-red-500 text-xs">{errors.supplier_id}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Date</label>
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="w-full rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Reference</label>
                            <input
                                type="text"
                                className="w-full rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-100 dark:text-gray-400 bg-gray-100 text-gray-500 cursor-not-allowed"
                                value="Auto-generated (e.g. PR-00001)"
                                disabled
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Note</label>
                            <textarea
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                className="w-full rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                rows="3"
                            ></textarea>
                        </div>
                    </div>

                    {/* RIGHT: ITEMS */}
                    <div className="md:col-span-2 flex flex-col h-full">
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl mb-4">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Add Items</label>
                            <div className="flex gap-2 mb-2 relative">
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        placeholder="Search Product..."
                                        className="w-full rounded-lg border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        value={productSearch}
                                        onChange={e => setProductSearch(e.target.value)}
                                    />
                                    {products.length > 0 && !selectedProduct && productSearch && (
                                        <div className="absolute z-10 w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg mt-1 shadow-lg max-h-48 overflow-y-auto">
                                            {products.map(p => (
                                                <div
                                                    key={p.id}
                                                    onClick={() => {
                                                        setSelectedProduct(p);
                                                        setProductSearch(p.name);
                                                        setItemCost(p.cost); // Default to product cost
                                                        setProducts([]);
                                                    }}
                                                    className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer"
                                                >
                                                    <div className="font-bold text-gray-800 dark:text-white">{p.name}</div>
                                                    <div className="text-xs text-gray-500">Stock: {p.quantity} | Cost: ${p.cost}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="number"
                                    placeholder="Qty"
                                    className="w-20 rounded-lg border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    value={itemQty}
                                    onChange={e => setItemQty(e.target.value)}
                                />
                                <input
                                    type="number"
                                    placeholder="Cost"
                                    className="w-24 rounded-lg border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    value={itemCost}
                                    onChange={e => setItemCost(e.target.value)}
                                />
                                <button
                                    onClick={addItem}
                                    className="bg-blue-600 text-white px-4 rounded-lg font-bold hover:bg-blue-700"
                                >
                                    Add
                                </button>
                            </div>
                        </div>

                        {/* Items List */}
                        <div className="flex-1 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-xl">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 dark:text-gray-400">Product</th>
                                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 dark:text-gray-400">Qty</th>
                                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 dark:text-gray-400">Cost</th>
                                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 dark:text-gray-400">Subtotal</th>
                                        <th className="px-4 py-2"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                    {items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{item.product_name}</td>
                                            <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{item.quantity}</td>
                                            <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">${item.unit_cost.toFixed(2)}</td>
                                            <td className="px-4 py-2 text-sm font-bold text-gray-900 dark:text-white">${item.subtotal.toFixed(2)}</td>
                                            <td className="px-4 py-2 text-right">
                                                <button onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {items.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="text-center py-8 text-gray-400 font-medium">No items added yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4 flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-4 rounded-xl">
                            <span className="font-bold text-lg text-gray-700 dark:text-gray-200">Total Refund Amount:</span>
                            <span className="font-bold text-2xl text-blue-600 dark:text-blue-400">${grandTotal.toFixed(2)}</span>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={processing}
                            className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-500/30 transition-all disabled:opacity-50"
                        >
                            {processing ? 'Processing...' : 'Complete Return'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
