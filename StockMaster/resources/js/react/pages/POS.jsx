import React, { useState, useEffect } from 'react';
import Receipt from '../components/Receipt';

export default function POS() {
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [cart, setCart] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [paidAmount, setPaidAmount] = useState('');
    const [taxRate, setTaxRate] = useState(0);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [notes, setNotes] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    const [lastSaleData, setLastSaleData] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const handlePrint = () => {
        window.print();
    };



    useEffect(() => {
        fetchProducts();
        fetchCustomers();
    }, []);

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
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomers = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/customers?per_page=1000', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setCustomers(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
        }
    };

    const addToCart = (product) => {
        const existingItem = cart.find(item => item.id === product.id);

        if (existingItem) {
            setCart(cart.map(item =>
                item.id === product.id
                    ? { ...item, qty: item.qty + 1 }
                    : item
            ));
        } else {
            setCart([...cart, { ...product, qty: 1, price: parseFloat(product.price) }]);
        }
    };

    const updateCartQty = (productId, qty) => {
        if (qty <= 0) {
            removeFromCart(productId);
        } else {
            setCart(cart.map(item =>
                item.id === productId ? { ...item, qty: parseInt(qty) } : item
            ));
        }
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.id !== productId));
    };

    const calculateSubtotal = () => {
        return cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    };

    const calculateTax = () => {
        return (calculateSubtotal() * taxRate) / 100;
    };

    const calculateTotal = () => {
        return calculateSubtotal() + calculateTax() - discountAmount;
    };

    const initiateCheckout = () => {
        if (cart.length === 0) {
            setAlertMessage('Cart is empty! Please add products before completing the sale.');
            setShowAlert(true);
            setTimeout(() => setShowAlert(false), 3000);
            return;
        }

        if (!paidAmount || parseFloat(paidAmount) < calculateTotal()) {
            setAlertMessage('Paid amount must be at least the total amount!');
            setShowAlert(true);
            setTimeout(() => setShowAlert(false), 3000);
            return;
        }

        setShowConfirmModal(true);
    };

    const handleCheckout = async () => {
        setShowConfirmModal(false);
        const token = localStorage.getItem('auth_token');

        try {
            const response = await fetch('/api/pos', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    customer_id: selectedCustomer,
                    cart: cart.map(item => ({
                        id: item.id,
                        qty: item.qty,
                        price: item.price
                    })),
                    total_amount: calculateTotal(),
                    paid_amount: parseFloat(paidAmount),
                    payment_method: paymentMethod,
                    tax_rate: taxRate,
                    discount_amount: discountAmount,
                    notes: notes
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Prepare print data FIRST before clearing cart
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                const customerName = customers.find(c => c.id == selectedCustomer)?.name || 'Walk-in Customer';

                setLastSaleData({
                    receiptNumber: data.receipt_number,
                    date: new Date().toLocaleDateString(),
                    items: [...cart],
                    subtotal: calculateSubtotal(),
                    tax: calculateTax(),
                    discount: discountAmount,
                    total: calculateTotal(),
                    amountPaid: parseFloat(paidAmount),
                    change: parseFloat(paidAmount) - calculateTotal(),
                    cashier: user.name || 'Staff',
                    customer: customerName
                });

                setSuccessMessage(`Sale completed! Receipt #${data.receipt_number}`);
                // Reset form
                setCart([]);
                setSelectedCustomer(null);
                setPaidAmount('');
                setTaxRate(0);
                setDiscountAmount(0);
                setNotes('');
                setPaymentMethod('cash');

                setPaymentMethod('cash');

                // Removed setTimeout to keep success message open until manually closed

                // Refresh products to update stock

                // Refresh products to update stock
                fetchProducts();
            } else {
                alert('Error processing sale: ' + (data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error processing sale:', error);
            alert('Error processing sale');
        }
    };

    // Filter products
    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <main className="p-4 h-[calc(100vh-80px)] overflow-hidden">
                <div className="flex items-center justify-center h-full">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <div className="text-gray-500 font-medium">Loading POS System...</div>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="h-[calc(100vh-64px)] overflow-hidden p-2 sm:p-4 bg-gray-50 dark:bg-gray-900">
            {/* Hidden Receipt Component */}
            <Receipt data={lastSaleData} />


            {/* Success Toast */}
            {successMessage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 transform transition-all scale-100">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Sale Completed!</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">{successMessage}</p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handlePrint}
                                    className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-800 flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                    Print Receipt
                                </button>
                                <button
                                    onClick={() => setSuccessMessage('')}
                                    className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold py-3 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600"
                                >
                                    Start New Sale
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Alert Popup */}
            {showAlert && (
                <div className="fixed top-20 right-4 z-50 animate-bounce-in">
                    <div className="bg-red-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="font-semibold">{alertMessage}</span>
                    </div>
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-4 h-full">
                {/* Left Side: Product Grid */}
                <div className="w-full lg:w-3/5 xl:w-[65%] flex flex-col h-full gap-4">
                    {/* Search Bar */}
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-sm flex-shrink-0">
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </span>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-2.5 border-none ring-1 ring-gray-200 dark:ring-gray-700 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
                                placeholder="Scan barcode or search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Products Grid Area */}
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 pb-20">
                            {filteredProducts.map(product => (
                                <div
                                    key={product.id}
                                    onClick={() => product.quantity > 0 && addToCart(product)}
                                    className={`group relative bg-white dark:bg-gray-800 rounded-xl p-2 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border border-transparent hover:border-blue-500 ${product.quantity <= 0 ? 'opacity-60 grayscale' : ''}`}
                                >
                                    {/* Stock Badge */}
                                    <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-bold z-10 ${product.quantity > 10 ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' :
                                        product.quantity > 0 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400' :
                                            'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'
                                        }`}>
                                        {product.quantity}
                                    </div>

                                    {/* Product Image */}
                                    <div className="aspect-square mb-2 bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden flex items-center justify-center relative group-hover:bg-gray-100 dark:group-hover:bg-gray-600 transition-colors">
                                        {product.image ? (
                                            <img
                                                src={`/storage/${product.image}`}
                                                alt={product.name}
                                                className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal"
                                            />
                                        ) : (
                                            <svg className="w-8 h-8 text-gray-300 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        )}
                                        {/* Add Overlay */}
                                        {product.quantity > 0 && (
                                            <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <div className="bg-blue-600 text-white p-1.5 rounded-full shadow-lg transform scale-0 group-hover:scale-100 transition-transform">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Product Info */}
                                    <div>
                                        <h3 className="font-bold text-gray-800 dark:text-white text-xs leading-tight mb-0.5 truncate">{product.name}</h3>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">{product.code}</p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">${parseFloat(product.price).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {filteredProducts.length === 0 && (
                                <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-400">
                                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    </div>
                                    <p className="text-lg font-medium">No products found</p>
                                    <p className="text-sm">Try searching for something else</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Side: Cart Panel */}
                <div className="w-full lg:w-2/5 xl:w-[35%] h-full flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                    {/* Customer Header */}
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                                Current Sale
                            </h2>
                            <span className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs font-bold px-2 py-1 rounded-lg">
                                {cart.length} Items
                            </span>
                        </div>
                        <select
                            value={selectedCustomer || ''}
                            onChange={(e) => setSelectedCustomer(e.target.value || null)}
                            className="w-full text-sm border-gray-200 dark:border-gray-600 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                            <option value="">Walk-in Customer</option>
                            {customers.map(customer => (
                                <option key={customer.id} value={customer.id}>{customer.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Cart Items List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                                <svg className="w-16 h-16 mb-4 stroke-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                <p className="font-medium">Cart is empty</p>
                                <p className="text-sm">Select products to begin</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {cart.map(item => (
                                    <div key={item.id} className="group py-3 first:pt-0 last:pb-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-4 px-4 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1 pr-2">
                                                <h4 className="font-semibold text-gray-800 dark:text-white text-sm line-clamp-2 leading-tight">{item.name}</h4>
                                                <div className="text-[10px] text-gray-400 mt-0.5 font-mono">{item.code}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-gray-900 dark:text-white text-sm">${(item.price * item.qty).toFixed(2)}</div>
                                                <div className="text-[10px] text-gray-500">${item.price.toFixed(2)}/ea</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            {/* Qty Control */}
                                            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg h-7">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); updateCartQty(item.id, item.qty - 1); }}
                                                    className="w-7 h-full flex items-center justify-center text-gray-500 hover:text-red-600 active:bg-gray-200 dark:active:bg-gray-600 rounded-l-lg transition-colors"
                                                >
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18 12H6" /></svg>
                                                </button>
                                                <input
                                                    type="number"
                                                    value={item.qty}
                                                    onChange={(e) => updateCartQty(item.id, e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-10 h-full text-center bg-transparent border-none p-0 text-sm font-bold text-gray-800 dark:text-white focus:ring-0 appearance-none selection:bg-blue-100"
                                                />
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); updateCartQty(item.id, item.qty + 1); }}
                                                    className="w-7 h-full flex items-center justify-center text-gray-500 hover:text-green-600 active:bg-gray-200 dark:active:bg-gray-600 rounded-r-lg transition-colors"
                                                >
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v12m6-6H6" /></svg>
                                                </button>
                                            </div>

                                            {/* Delete Action (visible on hover or always accessible) */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }}
                                                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                                title="Remove Item"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Checkout Section - Fixed Bottom */}
                    <div className="border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
                        {/* Summary Calculations */}
                        <div className="space-y-1 mb-4 text-sm">
                            <div className="flex justify-between text-gray-500">
                                <span>Subtotal</span>
                                <span>${calculateSubtotal().toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center group">
                                <label className="text-gray-500 border-b border-dashed border-gray-300 cursor-help">Tax (%)</label>
                                <div className="flex items-center w-20">
                                    <input
                                        type="number"
                                        value={taxRate}
                                        onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                                        className="w-full text-right p-0 border-none bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700 text-sm focus:ring-0 text-gray-500"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between items-center group">
                                <label className="text-gray-500 border-b border-dashed border-gray-300 cursor-help">Discount ($)</label>
                                <div className="flex items-center w-20">
                                    <input
                                        type="number"
                                        value={discountAmount}
                                        onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                                        className="w-full text-right p-0 border-none bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700 text-sm focus:ring-0 text-red-500"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between items-center pt-3 mt-2 border-t border-gray-100 dark:border-gray-700">
                                <span className="font-bold text-gray-800 dark:text-white text-lg">Total</span>
                                <span className="font-bold text-2xl text-blue-600 dark:text-blue-400">${calculateTotal().toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Payment Inputs */}
                        <div className="grid grid-cols-3 gap-2 mb-3">
                            <div className="col-span-1">
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-full text-xs font-medium px-2 py-2.5 rounded-xl border-gray-200 dark:border-gray-600 focus:ring-blue-500 dark:bg-gray-700 bg-gray-50"
                                >
                                    <option value="cash">Cash</option>
                                    <option value="card">Card</option>
                                    <option value="mobile">Mobile</option>
                                </select>
                            </div>
                            <div className="col-span-2">
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">$</span>
                                    <input
                                        type="number"
                                        value={paidAmount}
                                        onChange={(e) => setPaidAmount(e.target.value)}
                                        placeholder="Amount Paid"
                                        className="w-full pl-6 pr-3 py-2.5 text-sm font-bold rounded-xl border-gray-200 dark:border-gray-600 focus:ring-blue-500 dark:bg-gray-700"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Change Display */}
                        {paidAmount > 0 && parseFloat(paidAmount) >= calculateTotal() && (
                            <div className="mb-3 px-3 py-2 bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-800 rounded-lg flex justify-between items-center">
                                <span className="text-xs font-bold text-green-700 dark:text-green-400 uppercase">Change Due</span>
                                <span className="text-sm font-bold text-green-700 dark:text-green-300">${(parseFloat(paidAmount) - calculateTotal()).toFixed(2)}</span>
                            </div>
                        )}


                        {/* Confirmation Modal */}
                        {showConfirmModal && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
                                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Confirm Payment</h3>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                            <span>Total Amount:</span>
                                            <span className="font-bold text-gray-900 dark:text-white">${calculateTotal().toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                            <span>Paid Amount:</span>
                                            <span className="font-bold text-gray-900 dark:text-white">${parseFloat(paidAmount).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-green-600 dark:text-green-400 border-t pt-2 border-dashed border-gray-200 dark:border-gray-700">
                                            <span>Change Due:</span>
                                            <span className="font-bold">${(parseFloat(paidAmount) - calculateTotal()).toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowConfirmModal(false)}
                                            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleCheckout}
                                            className="flex-1 px-4 py-2 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-500/30"
                                        >
                                            Confirm & Save
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Complete Button */}
                        <button
                            onClick={initiateCheckout}
                            disabled={cart.length === 0}
                            className="w-full bg-gradient-to-r from-orange-500 to-blue-600 hover:from-orange-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            <span>Pay Now</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
