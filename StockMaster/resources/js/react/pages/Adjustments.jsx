import React, { useState, useEffect } from 'react';

export default function Adjustments() {
    const [adjustments, setAdjustments] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        reference: '',
        note: '',
        products: []
    });
    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState('');
    const [pagination, setPagination] = useState({});

    useEffect(() => {
        fetchAdjustments();
        fetchProducts();
    }, []);

    const fetchAdjustments = async (page = 1) => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`/api/adjustments?page=${page}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setAdjustments(data.data);
                setPagination({
                    current_page: data.current_page,
                    last_page: data.last_page,
                    total: data.total
                });
            }
        } catch (error) {
            console.error('Error fetching adjustments:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/products?per_page=1000', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setProducts(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        const token = localStorage.getItem('auth_token');

        try {
            const response = await fetch('/api/adjustments', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                setSuccessMessage(data.message);

                // Add Notification
                if (window.addVclNotification) {
                    window.addVclNotification({
                        type: 'low_stock',
                        title: 'Stock Adjusted',
                        message: `Stock level manually adjusted for ${formData.products.length} items.`,
                        invoice: formData.reference
                    });
                }

                setShowModal(false);
                resetForm();
                fetchAdjustments();
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                setErrors(data.errors || {});
            }
        } catch (error) {
            console.error('Error saving adjustment:', error);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure? This will reverse the stock changes.')) return;

        const token = localStorage.getItem('auth_token');
        try {
            const response = await fetch(`/api/adjustments/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setSuccessMessage(data.message);
                fetchAdjustments();
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (error) {
            console.error('Error deleting adjustment:', error);
        }
    };

    const addProductRow = () => {
        setFormData({
            ...formData,
            products: [...formData.products, { product_id: '', quantity: '', type: 'add' }]
        });
    };

    const removeProductRow = (index) => {
        const newProducts = formData.products.filter((_, i) => i !== index);
        setFormData({ ...formData, products: newProducts });
    };

    const updateProductRow = (index, field, value) => {
        const newProducts = [...formData.products];
        newProducts[index][field] = value;
        setFormData({ ...formData, products: newProducts });
    };

    const resetForm = () => {
        setFormData({
            date: new Date().toISOString().split('T')[0],
            reference: '',
            note: '',
            products: []
        });
        setErrors({});
    };

    if (loading) {
        return (
            <main className="py-6 px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500 animate-pulse">Loading Adjustments...</div>
                </div>
            </main>
        );
    }

    return (
        <>
            <main className="py-6 px-4 sm:px-6 lg:px-8">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="p-6">
                        {/* Header with Add Button */}
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Adjustments List</h2>
                            <button
                                onClick={() => { resetForm(); setShowModal(true); }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Create Adjustment
                            </button>
                        </div>

                        {/* Success Message */}
                        {successMessage && (
                            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                                {successMessage}
                            </div>
                        )}

                        {/* Adjustments Table */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Reference</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Note</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Items</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {adjustments.length > 0 ? (
                                        adjustments.map((adjustment) => (
                                            <tr key={adjustment.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {adjustment.date}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                    {adjustment.reference}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {adjustment.note ? adjustment.note.substring(0, 30) + (adjustment.note.length > 30 ? '...' : '') : 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {adjustment.details?.length || 0}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <button
                                                        onClick={() => handleDelete(adjustment.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                                                No adjustments found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {pagination.last_page > 1 && (
                            <div className="mt-4 flex justify-between items-center">
                                <div className="text-sm text-gray-700 dark:text-gray-300">
                                    Showing page {pagination.current_page} of {pagination.last_page}
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => fetchAdjustments(pagination.current_page - 1)}
                                        disabled={pagination.current_page === 1}
                                        className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => fetchAdjustments(pagination.current_page + 1)}
                                        disabled={pagination.current_page === pagination.last_page}
                                        className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Create Adjustment Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowModal(false)}></div>

                        <div className="relative bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                Create Stock Adjustment
                            </h3>

                            <form onSubmit={handleSubmit}>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date *</label>
                                        <input
                                            type="date"
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        />
                                        {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date[0]}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reference *</label>
                                        <input
                                            type="text"
                                            value={formData.reference}
                                            onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            placeholder="ADJ-001"
                                        />
                                        {errors.reference && <p className="text-red-500 text-xs mt-1">{errors.reference[0]}</p>}
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Note</label>
                                        <textarea
                                            value={formData.note}
                                            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                            rows="2"
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        ></textarea>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Products *</label>
                                        <button
                                            type="button"
                                            onClick={addProductRow}
                                            className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                                        >
                                            Add Product
                                        </button>
                                    </div>

                                    {formData.products.map((product, index) => (
                                        <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                                            <div className="col-span-5">
                                                <select
                                                    value={product.product_id}
                                                    onChange={(e) => updateProductRow(index, 'product_id', e.target.value)}
                                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                                                >
                                                    <option value="">Select Product</option>
                                                    {products.map(p => (
                                                        <option key={p.id} value={p.id}>{p.name} (Stock: {p.quantity})</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-span-3">
                                                <input
                                                    type="number"
                                                    value={product.quantity}
                                                    onChange={(e) => updateProductRow(index, 'quantity', e.target.value)}
                                                    placeholder="Quantity"
                                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                                                />
                                            </div>
                                            <div className="col-span-3">
                                                <select
                                                    value={product.type}
                                                    onChange={(e) => updateProductRow(index, 'type', e.target.value)}
                                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                                                >
                                                    <option value="add">Add</option>
                                                    <option value="subtract">Subtract</option>
                                                </select>
                                            </div>
                                            <div className="col-span-1">
                                                <button
                                                    type="button"
                                                    onClick={() => removeProductRow(index)}
                                                    className="w-full px-2 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {errors.products && <p className="text-red-500 text-xs mt-1">{errors.products[0]}</p>}
                                </div>

                                <div className="mt-6 flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                    >
                                        Create Adjustment
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
