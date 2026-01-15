// PurchaseReturnSystem.jsx - Complete All-in-One Component
import React, { useState, useEffect, useRef, useCallback } from 'react';

// Icons (using emojis for simplicity - in real project use lucide-react or similar)
const Icons = {
    Search: () => <span>🔍</span>,
    Filter: () => <span>⚡</span>,
    Close: () => <span>✕</span>,
    Check: () => <span>✓</span>,
    Alert: () => <span>⚠️</span>,
    Refresh: () => <span>🔄</span>,
    Print: () => <span>🖨️</span>,
    Download: () => <span>📥</span>,
    Plus: () => <span>➕</span>,
    Minus: () => <span>➖</span>,
    Package: () => <span>📦</span>,
    User: () => <span>👤</span>,
    Calendar: () => <span>📅</span>,
    Warehouse: () => <span>🏭</span>,
    Truck: () => <span>🚚</span>,
    Dollar: () => <span>💲</span>,
    Clock: () => <span>⏰</span>,
    Bell: () => <span>🔔</span>,
    Settings: () => <span>⚙️</span>,
    Eye: () => <span>👁️</span>,
    Edit: () => <span>✏️</span>,
    Delete: () => <span>🗑️</span>,
    Send: () => <span>📤</span>,
    Save: () => <span>💾</span>,
    Calculator: () => <span>🧮</span>,
    Barcode: () => <span>📊</span>,
    Chart: () => <span>📈</span>,
    Warning: () => <span>🚨</span>,
    Success: () => <span>✅</span>,
    Error: () => <span>❌</span>,
    Loading: () => <span>⏳</span>,
};

// ========== MOCK DATA ==========
const mockSuppliers = [
    { id: 'SUP001', name: 'Tech Suppliers Ltd.', contact: '+1 (555) 123-4567', email: 'sales@techsuppliers.com' },
    { id: 'SUP002', name: 'Global Electronics', contact: '+1 (555) 987-6543', email: 'orders@globalelec.com' },
    { id: 'SUP003', name: 'Quality Goods Inc.', contact: '+1 (555) 456-7890', email: 'support@qualitygoods.com' },
    { id: 'SUP004', name: 'Premium Supplies Co.', contact: '+1 (555) 234-5678', email: 'info@premiumsupplies.com' },
    { id: 'SUP005', name: 'Reliable Distributors', contact: '+1 (555) 876-5432', email: 'contact@reliable.com' },
];

const mockProductsData = [
    { id: 'P001', name: 'Laptop Pro M1', sku: 'LP-M1-001', category: 'Electronics', price: 1299.99, stock: 50, minStock: 5, location: 'A1-01' },
    { id: 'P002', name: 'Mechanical Keyboard', sku: 'MK-RGB-002', category: 'Electronics', price: 89.99, stock: 120, minStock: 10, location: 'B2-05' },
    { id: 'P003', name: '4K Monitor 27"', sku: '4K-M27-003', category: 'Electronics', price: 349.99, stock: 75, minStock: 8, location: 'C3-12' },
    { id: 'P004', name: 'Wireless Mouse', sku: 'WM-BT-004', category: 'Electronics', price: 24.99, stock: 200, minStock: 20, location: 'D4-08' },
    { id: 'P005', name: 'USB-C Hub', sku: 'UCH-7P-005', category: 'Accessories', price: 39.99, stock: 150, minStock: 15, location: 'E5-03' },
    { id: 'P006', name: 'Webcam HD', sku: 'WC-HD-006', category: 'Electronics', price: 59.99, stock: 80, minStock: 8, location: 'F6-09' },
    { id: 'P007', name: 'Gaming Headset', sku: 'GH-7.1-007', category: 'Audio', price: 79.99, stock: 60, minStock: 6, location: 'G7-11' },
    { id: 'P008', name: 'SSD 1TB', sku: 'SSD-1TB-008', category: 'Storage', price: 89.99, stock: 100, minStock: 10, location: 'H8-04' },
];

const returnReasons = [
    'Damaged Goods',
    'Wrong Item Delivered',
    'Quality Issues',
    'Overstocked',
    'Expired Product',
    'Customer Return',
    'Defective',
    'Wrong Specification',
    'Late Delivery',
    'Cancelled Order'
];

const warehouses = [
    'Main Warehouse',
    'West Warehouse',
    'East Warehouse',
    'North Storage',
    'South Distribution'
];

const Purchase = () => {
    // ========== STATE MANAGEMENT ==========
    const [returnData, setReturnData] = useState({
        id: `PR${Date.now().toString().slice(-8)}`,
        invoiceNo: '',
        supplierId: '',
        supplierName: '',
        returnDate: new Date().toISOString().split('T')[0],
        expectedDate: '',
        reason: 'Damaged',
        notes: '',
        status: 'draft',
        priority: 'normal',
        warehouse: 'Main Warehouse',
        paymentMethod: 'credit',
        rmaNumber: '',
        reference: '',
        tags: [],
    });

    const [selectedItems, setSelectedItems] = useState([]);
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('products');
    const [loading, setLoading] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [realTimeData, setRealTimeData] = useState({
        onlineUsers: 0,
        pendingReturns: 0,
        totalValue: 0,
        lastUpdated: new Date(),
    });

    // Use refs for intervals instead of WebSocket
    const intervalsRef = useRef([]);
    const productsRef = useRef(products);
    const returnDataRef = useRef(returnData);

    // Update refs when state changes
    useEffect(() => {
        productsRef.current = products;
    }, [products]);

    useEffect(() => {
        returnDataRef.current = returnData;
    }, [returnData]);

    // ========== HELPER FUNCTIONS ==========
    const addNotification = useCallback((message, type = 'info') => {
        const id = Date.now();
        const notification = {
            id,
            message,
            type,
            timestamp: new Date(),
            read: false,
        };

        setNotifications(prev => [notification, ...prev.slice(0, 4)]);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    }, []);

    const addActivity = useCallback((activity) => {
        const activityItem = {
            id: Date.now(),
            text: activity,
            timestamp: new Date(),
            user: 'System',
        };

        setRecentActivity(prev => [activityItem, ...prev.slice(0, 5)]);
    }, []);

    // ========== CORE FUNCTIONS ==========
    const updateProductStock = useCallback((productId, newStock) => {
        setProducts(prevProducts =>
            prevProducts.map(product =>
                product.id === productId ? { ...product, stock: newStock } : product
            )
        );

        // Update selected items if they contain this product
        setSelectedItems(prevItems =>
            prevItems.map(item =>
                item.id === productId ? { ...item, stock: newStock } : item
            )
        );

        addNotification(`Stock updated for product ID: ${productId}`, 'info');
    }, [addNotification]);

    const updateReturnStatus = useCallback((returnId, status) => {
        if (returnId === returnData.id) {
            setReturnData(prev => ({ ...prev, status }));
            addNotification(`Return status updated to: ${status}`, 'success');
        }
    }, [returnData.id, addNotification]);

    // ========== REAL-TIME FUNCTIONS ==========
    const updateRealTimeStats = useCallback(() => {
        setRealTimeData(prev => ({
            ...prev,
            onlineUsers: Math.floor(Math.random() * 50) + 10,
            pendingReturns: Math.floor(Math.random() * 20) + 5,
            totalValue: Math.floor(Math.random() * 50000) + 10000,
            lastUpdated: new Date(),
        }));
    }, []);

    const simulateStockUpdate = useCallback(() => {
        if (Math.random() > 0.5 && productsRef.current.length > 0) {
            const productIndex = Math.floor(Math.random() * productsRef.current.length);
            const product = productsRef.current[productIndex];
            const change = Math.floor(Math.random() * 10) - 3;
            const newStock = Math.max(0, product.stock + change);

            // Update product stock
            updateProductStock(product.id, newStock);

            if (change < 0) {
                addNotification(`${product.name} stock decreased by ${Math.abs(change)}`, 'warning');
            } else if (change > 0) {
                addNotification(`${product.name} stock increased by ${change}`, 'success');
            }
        }
    }, [updateProductStock, addNotification]);

    const simulateReturnStatusUpdate = useCallback(() => {
        if (Math.random() > 0.7 && returnDataRef.current.status !== 'draft') {
            const statuses = ['submitted', 'approved', 'processing', 'completed', 'rejected'];
            const currentStatus = returnDataRef.current.status;
            const currentIndex = statuses.indexOf(currentStatus);

            if (currentIndex !== -1) {
                let nextIndex = currentIndex + 1;
                if (nextIndex >= statuses.length) nextIndex = statuses.length - 1;

                const newStatus = statuses[nextIndex];
                updateReturnStatus(returnDataRef.current.id, newStatus);
            }
        }
    }, [updateReturnStatus]);

    const simulateNewNotification = useCallback(() => {
        const notificationsData = [
            'New return request from supplier',
            'Return #PR001234 approved',
            'Stock alert: Laptop Pro M1 running low',
            'System maintenance scheduled',
            'New supplier added to database',
            'Return shipment received at warehouse',
            'Quality inspection completed',
            'Refund processed for return #PR001235',
        ];

        if (Math.random() > 0.7) {
            const randomNotif = notificationsData[Math.floor(Math.random() * notificationsData.length)];
            addNotification(randomNotif, 'info');
        }
    }, [addNotification]);

    const updateActivityLog = useCallback(() => {
        const activities = [
            'System backup completed',
            'Inventory synced with warehouse',
            'Supplier data updated',
            'Return analytics generated',
            'Quality check performed',
            'Database optimized',
            'Security scan completed',
            'Performance metrics updated',
        ];

        if (Math.random() > 0.6) {
            const randomActivity = activities[Math.floor(Math.random() * activities.length)];
            addActivity(randomActivity);
        }
    }, [addActivity]);

    const startRealTimeUpdates = useCallback(() => {
        // Clear any existing intervals
        intervalsRef.current.forEach(intervalId => clearInterval(intervalId));
        intervalsRef.current = [];

        // Simulate real-time data updates using intervals - Faster for demo purposes
        const interval1 = setInterval(() => updateRealTimeStats(), 2000); // 2 seconds
        const interval2 = setInterval(() => simulateStockUpdate(), 5000); // 5 seconds
        const interval3 = setInterval(() => simulateNewNotification(), 8000); // 8 seconds
        const interval4 = setInterval(() => updateActivityLog(), 10000); // 10 seconds
        const interval5 = setInterval(() => simulateReturnStatusUpdate(), 15000); // 15 seconds

        // Store interval IDs for cleanup
        intervalsRef.current = [interval1, interval2, interval3, interval4, interval5];

        // Initial updates
        updateRealTimeStats();
    }, [updateRealTimeStats, simulateStockUpdate, simulateNewNotification, updateActivityLog, simulateReturnStatusUpdate]);

    const initializeData = useCallback(() => {
        setProducts(mockProductsData);
        setFilteredProducts(mockProductsData);
        setSuppliers(mockSuppliers);

        // Generate RMA number
        const rma = `RMA-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
        setReturnData(prev => ({ ...prev, rmaNumber: rma }));

        // Set expected date (7 days from now)
        const expected = new Date();
        expected.setDate(expected.getDate() + 7);
        setReturnData(prev => ({ ...prev, expectedDate: expected.toISOString().split('T')[0] }));

        addNotification('System initialized. Real-time updates active.', 'success');
    }, [addNotification]);

    // ========== PRODUCT MANAGEMENT ==========
    const filterProducts = useCallback(() => {
        if (!searchTerm.trim()) {
            setFilteredProducts(products);
            return;
        }

        const filtered = products.filter(product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.category.toLowerCase().includes(searchTerm.toLowerCase())
        );

        setFilteredProducts(filtered);
    }, [searchTerm, products]);

    const addProductToReturn = (product) => {
        const existingItem = selectedItems.find(item => item.id === product.id);

        if (existingItem) {
            updateItemQuantity(product.id, existingItem.quantity + 1);
            return;
        }

        const newItem = {
            ...product,
            quantity: 1,
            returnReason: returnData.reason,
            unitPrice: product.price,
            total: product.price,
            condition: 'Used',
            inspectionNotes: '',
            replacementNeeded: false,
        };

        setSelectedItems(prev => [...prev, newItem]);
        addNotification(`${product.name} added to return list`, 'success');
    };

    const updateItemQuantity = (id, quantity) => {
        if (quantity < 0) return;

        const product = products.find(p => p.id === id);
        const maxQty = product ? product.stock : 0;
        const newQty = Math.min(quantity, maxQty);

        setSelectedItems(prev => prev.map(item =>
            item.id === id ? {
                ...item,
                quantity: newQty,
                total: newQty * item.unitPrice,
            } : item
        ));
    };

    const updateItemField = (id, field, value) => {
        setSelectedItems(prev => prev.map(item => {
            if (item.id === id) {
                const updatedItem = { ...item, [field]: value };

                // Recalculate total if price or quantity changed
                if (field === 'quantity' || field === 'unitPrice') {
                    updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
                }

                return updatedItem;
            }
            return item;
        }));
    };

    const removeItem = (id) => {
        setSelectedItems(prev => prev.filter(item => item.id !== id));
        addNotification('Item removed from return', 'warning');
    };

    // ========== RETURN OPERATIONS ==========
    const calculateTotals = () => {
        const subtotal = selectedItems.reduce((sum, item) => sum + item.total, 0);
        const tax = subtotal * 0.1;
        const shipping = 15;
        const restockingFee = subtotal * 0.05;
        const discount = 0;
        const total = subtotal + tax + shipping - restockingFee - discount;

        return { subtotal, tax, shipping, restockingFee, discount, total };
    };

    const validateReturn = () => {
        const errors = [];

        if (!returnData.invoiceNo) errors.push('Invoice number is required');
        if (!returnData.supplierId) errors.push('Supplier selection is required');
        if (selectedItems.length === 0) errors.push('At least one item must be selected');
        if (!returnData.reason) errors.push('Return reason is required');

        return errors;
    };

    const submitReturn = async () => {
        const errors = validateReturn();

        if (errors.length > 0) {
            errors.forEach(error => addNotification(error, 'error'));
            return;
        }

        setLoading(true);
        addNotification('Submitting return request...', 'info');

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));

        const returnId = `RET${Date.now().toString().slice(-6)}`;
        const totals = calculateTotals();

        const returnSubmission = {
            ...returnData,
            id: returnId,
            items: selectedItems,
            totals,
            submittedAt: new Date().toISOString(),
            submittedBy: 'Current User',
        };

        console.log('Return Submitted:', returnSubmission);

        addNotification(`Return ${returnId} submitted successfully!`, 'success');
        addActivity(`Return ${returnId} created for ${returnData.supplierName}`);

        // Reset form
        setSelectedItems([]);
        setReturnData(prev => ({
            ...prev,
            id: `PR${Date.now().toString().slice(-8)}`,
            invoiceNo: '',
            notes: '',
            status: 'submitted',
        }));

        setLoading(false);
    };

    const saveAsDraft = () => {
        addNotification('Return saved as draft', 'success');
        addActivity('Draft return saved');
    };

    const simulateBarcodeScan = () => {
        const randomProduct = products[Math.floor(Math.random() * products.length)];
        addProductToReturn(randomProduct);
        addNotification(`Scanned: ${randomProduct.name} (${randomProduct.sku})`, 'info');
    };

    const refreshRealTimeData = () => {
        // Clear existing intervals
        intervalsRef.current.forEach(intervalId => clearInterval(intervalId));
        intervalsRef.current = [];

        // Restart real-time updates
        startRealTimeUpdates();
        addNotification('Real-time data refreshed', 'success');
    };

    // ========== INITIALIZATION ==========
    useEffect(() => {
        initializeData();
        startRealTimeUpdates();

        // Cleanup function
        return () => {
            // Clear all intervals
            intervalsRef.current.forEach(intervalId => clearInterval(intervalId));
            intervalsRef.current = [];
        };
    }, [initializeData, startRealTimeUpdates]);

    useEffect(() => {
        filterProducts();
    }, [filterProducts]);

    // ========== UI COMPONENTS ==========
    const StatusBadge = ({ status }) => {
        const colors = {
            draft: 'bg-gray-100 text-gray-800',
            submitted: 'bg-blue-100 text-blue-800',
            approved: 'bg-green-100 text-green-800',
            processing: 'bg-yellow-100 text-yellow-800',
            completed: 'bg-purple-100 text-purple-800',
            rejected: 'bg-red-100 text-red-800',
            cancelled: 'bg-gray-100 text-gray-800',
        };

        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors[status] || colors.draft}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const NotificationItem = ({ notification }) => {
        const bgColors = {
            info: 'bg-blue-50 border-blue-200',
            success: 'bg-green-50 border-green-200',
            warning: 'bg-yellow-50 border-yellow-200',
            error: 'bg-red-50 border-red-200',
        };

        const textColors = {
            info: 'text-blue-800',
            success: 'text-green-800',
            warning: 'text-yellow-800',
            error: 'text-red-800',
        };

        return (
            <div className={`p-3 border-l-4 ${bgColors[notification.type]} ${textColors[notification.type]}`}>
                <div className="flex items-start">
                    <Icons.Alert />
                    <div className="ml-2 flex-1">
                        <p className="text-sm font-medium">{notification.message}</p>
                        <p className="text-xs opacity-75">
                            {notification.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                    <button
                        onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                        className="ml-2 text-gray-500 hover:text-gray-700"
                    >
                        <Icons.Close />
                    </button>
                </div>
            </div>
        );
    };

    // ========== RENDER ==========
    const totals = calculateTotals();

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Purchase Return System</h1>
                        <p className="text-gray-600">Manage purchase returns in real-time</p>
                    </div>

                    <div className="flex items-center space-x-4 mt-4 md:mt-0">
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-sm text-gray-600">Live</span>
                        </div>
                        <button
                            onClick={refreshRealTimeData}
                            className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
                            title="Refresh real-time data"
                        >
                            <Icons.Refresh />
                        </button>
                        <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center">
                            <Icons.Print /> <span className="ml-2">Print</span>
                        </button>
                        <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center">
                            <Icons.Download /> <span className="ml-2">Export</span>
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
                            <Icons.Settings /> <span className="ml-2">Settings</span>
                        </button>
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                        <div className="text-2xl font-bold text-gray-800">{selectedItems.length}</div>
                        <div className="text-sm text-gray-600">Items Selected</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                        <div className="text-2xl font-bold text-green-600">${totals.total.toFixed(2)}</div>
                        <div className="text-sm text-gray-600">Total Value</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                        <div className="text-2xl font-bold text-blue-600">{realTimeData.onlineUsers}</div>
                        <div className="text-sm text-gray-600">Online Users</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                        <div className="text-2xl font-bold text-purple-600">{realTimeData.pendingReturns}</div>
                        <div className="text-sm text-gray-600">Pending Returns</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Main Form */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Return Details Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                                <Icons.Edit /> <span className="ml-2">Return Details</span>
                            </h2>
                            <div className="flex items-center space-x-3">
                                <StatusBadge status={returnData.status} />
                                <div className="flex items-center text-sm text-gray-500">
                                    <Icons.Clock /> <span className="ml-1">Last updated: {realTimeData.lastUpdated.toLocaleTimeString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Form Fields */}
                            {[
                                { label: 'Return ID', value: returnData.id, readOnly: true },
                                { label: 'RMA Number', value: returnData.rmaNumber, readOnly: true },
                                {
                                    label: 'Original Invoice #',
                                    value: returnData.invoiceNo,
                                    onChange: (e) => setReturnData({ ...returnData, invoiceNo: e.target.value }),
                                    placeholder: 'INV-2024-001'
                                },
                                {
                                    label: 'Reference',
                                    value: returnData.reference,
                                    onChange: (e) => setReturnData({ ...returnData, reference: e.target.value }),
                                    placeholder: 'Optional reference'
                                },
                            ].map((field, index) => (
                                <div key={index}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                                    <input
                                        type="text"
                                        value={field.value}
                                        onChange={field.onChange}
                                        readOnly={field.readOnly}
                                        placeholder={field.placeholder}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                                    />
                                </div>
                            ))}

                            {/* Supplier Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                                <select
                                    value={returnData.supplierId}
                                    onChange={(e) => {
                                        const supplier = suppliers.find(s => s.id === e.target.value);
                                        setReturnData({
                                            ...returnData,
                                            supplierId: e.target.value,
                                            supplierName: supplier?.name || ''
                                        });
                                    }}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Select Supplier</option>
                                    {suppliers.map(supplier => (
                                        <option key={supplier.id} value={supplier.id}>
                                            {supplier.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Return Reason */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Return Reason</label>
                                <select
                                    value={returnData.reason}
                                    onChange={(e) => setReturnData({ ...returnData, reason: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {returnReasons.map(reason => (
                                        <option key={reason} value={reason}>{reason}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Dates */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Return Date</label>
                                <div className="flex items-center">
                                    <Icons.Calendar />
                                    <input
                                        type="date"
                                        value={returnData.returnDate}
                                        onChange={(e) => setReturnData({ ...returnData, returnDate: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ml-2"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Date</label>
                                <div className="flex items-center">
                                    <Icons.Calendar />
                                    <input
                                        type="date"
                                        value={returnData.expectedDate}
                                        onChange={(e) => setReturnData({ ...returnData, expectedDate: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ml-2"
                                    />
                                </div>
                            </div>

                            {/* Warehouse & Priority */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse</label>
                                <div className="flex items-center">
                                    <Icons.Warehouse />
                                    <select
                                        value={returnData.warehouse}
                                        onChange={(e) => setReturnData({ ...returnData, warehouse: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ml-2"
                                    >
                                        {warehouses.map(wh => (
                                            <option key={wh} value={wh}>{wh}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                <select
                                    value={returnData.priority}
                                    onChange={(e) => setReturnData({ ...returnData, priority: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="low">Low</option>
                                    <option value="normal">Normal</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>

                            {/* Notes */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <textarea
                                    value={returnData.notes}
                                    onChange={(e) => setReturnData({ ...returnData, notes: e.target.value })}
                                    rows="3"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Additional notes about this return..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Items Management Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                                    <Icons.Package /> <span className="ml-2">Return Items</span>
                                </h2>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={simulateBarcodeScan}
                                        className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 flex items-center"
                                    >
                                        <Icons.Barcode /> <span className="ml-2">Scan Barcode</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab(activeTab === 'products' ? 'selected' : 'products')}
                                        className="px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100"
                                    >
                                        {activeTab === 'products' ? 'View Selected' : 'Browse Products'}
                                    </button>
                                </div>
                            </div>

                            {/* Search */}
                            <div className="relative mb-6">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Icons.Search />
                                </div>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search products by name, SKU, or category..."
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            {/* Tabs */}
                            <div className="border-b border-gray-200 mb-6">
                                <div className="flex space-x-4">
                                    <button
                                        onClick={() => setActiveTab('products')}
                                        className={`py-2 px-4 font-medium ${activeTab === 'products'
                                            ? 'text-blue-600 border-b-2 border-blue-600'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        Available Products ({filteredProducts.length})
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('selected')}
                                        className={`py-2 px-4 font-medium ${activeTab === 'selected'
                                            ? 'text-blue-600 border-b-2 border-blue-600'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        Selected Items ({selectedItems.length})
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Products Grid */}
                        {activeTab === 'products' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredProducts.map(product => (
                                    <div
                                        key={product.id}
                                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-medium text-gray-800">{product.name}</h4>
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                                        {product.stock} in stock
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1">SKU: {product.sku}</p>
                                                <p className="text-sm text-gray-600">Category: {product.category}</p>
                                                <p className="text-sm text-gray-600">Location: {product.location}</p>
                                                <div className="flex items-center justify-between mt-3">
                                                    <span className="text-lg font-semibold text-green-600">
                                                        ${product.price.toFixed(2)}
                                                    </span>
                                                    <button
                                                        onClick={() => addProductToReturn(product)}
                                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                                    >
                                                        Add to Return
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Selected Items Table */}
                        {activeTab === 'selected' && selectedItems.length > 0 && (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Product</th>
                                            <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Price</th>
                                            <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Quantity</th>
                                            <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Total</th>
                                            <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedItems.map((item, index) => (
                                            <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                <td className="py-4 px-4">
                                                    <div>
                                                        <div className="font-medium text-gray-800">{item.name}</div>
                                                        <div className="text-sm text-gray-600">{item.sku}</div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <input
                                                        type="number"
                                                        value={item.unitPrice}
                                                        onChange={(e) => updateItemField(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                        className="w-24 px-3 py-1 border border-gray-300 rounded text-center"
                                                        step="0.01"
                                                        min="0"
                                                    />
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center space-x-2">
                                                        <button
                                                            onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                                                            className="p-1 rounded-full hover:bg-gray-100"
                                                        >
                                                            <Icons.Minus />
                                                        </button>
                                                        <input
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 0)}
                                                            className="w-20 px-3 py-1 border border-gray-300 rounded text-center"
                                                            min="0"
                                                            max={item.stock}
                                                        />
                                                        <button
                                                            onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                                                            className="p-1 rounded-full hover:bg-gray-100"
                                                        >
                                                            <Icons.Plus />
                                                        </button>
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">Max: {item.stock}</div>
                                                </td>
                                                <td className="py-4 px-4 font-medium text-gray-800">
                                                    ${item.total.toFixed(2)}
                                                </td>
                                                <td className="py-4 px-4">
                                                    <button
                                                        onClick={() => removeItem(item.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                    >
                                                        <Icons.Delete />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {selectedItems.length === 0 && activeTab === 'selected' && (
                            <div className="text-center py-12">
                                <Icons.Package />
                                <p className="text-gray-500 mt-2">No items selected</p>
                                <button
                                    onClick={() => setActiveTab('products')}
                                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Browse Products
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column - Summary & Actions */}
                <div className="space-y-6">
                    {/* Summary Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <Icons.Calculator /> <span className="ml-2">Return Summary</span>
                        </h2>

                        <div className="space-y-3 mb-6">
                            {[
                                { label: 'Subtotal', value: totals.subtotal.toFixed(2), color: 'text-gray-600' },
                                { label: 'Tax (10%)', value: totals.tax.toFixed(2), color: 'text-gray-600' },
                                { label: 'Shipping', value: totals.shipping.toFixed(2), color: 'text-gray-600' },
                                { label: 'Restocking Fee (5%)', value: `-${totals.restockingFee.toFixed(2)}`, color: 'text-red-600' },
                                { label: 'Discount', value: `-${totals.discount.toFixed(2)}`, color: 'text-green-600' },
                            ].map((item, index) => (
                                <div key={index} className="flex justify-between">
                                    <span className={item.color}>{item.label}</span>
                                    <span className={`font-medium ${item.color}`}>${item.value}</span>
                                </div>
                            ))}

                            <div className="border-t pt-3 mt-3">
                                <div className="flex justify-between text-lg font-bold text-gray-800">
                                    <span>Total Refund</span>
                                    <span>${totals.total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <button
                                onClick={submitReturn}
                                disabled={loading || selectedItems.length === 0}
                                className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center ${loading || selectedItems.length === 0
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-green-600 text-white hover:bg-green-700'
                                    }`}
                            >
                                {loading ? (
                                    <>
                                        <Icons.Loading /> <span className="ml-2">Processing...</span>
                                    </>
                                ) : (
                                    <>
                                        <Icons.Send /> <span className="ml-2">Submit Return</span>
                                    </>
                                )}
                            </button>

                            <button
                                onClick={saveAsDraft}
                                className="w-full py-3 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center"
                            >
                                <Icons.Save /> <span className="ml-2">Save as Draft</span>
                            </button>

                            <button className="w-full py-3 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50">
                                Preview Return
                            </button>
                        </div>
                    </div>

                    {/* Notifications Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                                <Icons.Bell /> <span className="ml-2">Notifications</span>
                            </h2>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                                {notifications.length} new
                            </span>
                        </div>

                        <div className="space-y-3">
                            {notifications.slice(0, 3).map(notification => (
                                <NotificationItem key={notification.id} notification={notification} />
                            ))}

                            {notifications.length === 0 && (
                                <p className="text-center text-gray-500 py-4">No new notifications</p>
                            )}
                        </div>
                    </div>

                    {/* Recent Activity Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <Icons.Clock /> <span className="ml-2">Recent Activity</span>
                        </h2>

                        <div className="space-y-4">
                            {recentActivity.map(activity => (
                                <div key={activity.id} className="flex items-start">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></div>
                                    <div>
                                        <p className="text-sm text-gray-800">{activity.text}</p>
                                        <p className="text-xs text-gray-500">
                                            {activity.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {activity.user}
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {recentActivity.length === 0 && (
                                <p className="text-center text-gray-500 py-4">No recent activity</p>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>

                        <div className="grid grid-cols-2 gap-3">
                            <button className="p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 flex flex-col items-center">
                                <Icons.Eye />
                                <span className="mt-1 text-sm">View History</span>
                            </button>
                            <button className="p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 flex flex-col items-center">
                                <Icons.Filter />
                                <span className="mt-1 text-sm">Filter Returns</span>
                            </button>
                            <button className="p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 flex flex-col items-center">
                                <Icons.Chart />
                                <span className="mt-1 text-sm">Analytics</span>
                            </button>
                            <button className="p-3 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 flex flex-col items-center">
                                <Icons.User />
                                <span className="mt-1 text-sm">Suppliers</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Status Bar */}
            <div className="mt-8 pt-4 border-t border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            <span>System Status: Operational</span>
                        </div>
                        <div className="flex items-center">
                            <Icons.Clock />
                            <span className="ml-1">Updated: {realTimeData.lastUpdated.toLocaleTimeString()}</span>
                        </div>
                    </div>
                    <div className="mt-2 md:mt-0">
                        <span>Return ID: {returnData.id} • Items: {selectedItems.length} • Total: ${totals.total.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Purchase;