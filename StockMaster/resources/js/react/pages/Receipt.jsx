import React, { useState, useEffect, useRef } from "react";

const Receipt = () => {
    const [cashier] = useState("Abdullah S.");
    const [receiptNo] = useState("VCL-" + Math.floor(Math.random() * 900000));
    const [taxRate] = useState(8.5);
    const [discount, setDiscount] = useState(0);
    const [paymentType, setPaymentType] = useState("Credit Card");
    const [items, setItems] = useState([
        { id: 1, name: "Logistics Fee", qty: 1, price: 150.0 },
        { id: 2, name: "Documentation", qty: 1, price: 45.0 },
    ]);
    const [customName, setCustomName] = useState("");
    const [customPrice, setCustomPrice] = useState("");
    const [showReceiptPreview, setShowReceiptPreview] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState(null);
    const cartEndRef = useRef(null);

    // Calculations
    const subtotal = items.reduce(
        (acc, item) => acc + item.price * item.qty,
        0
    );
    const discountAmount = discount;
    const taxAmount = ((subtotal - discountAmount) * taxRate) / 100;
    const total = subtotal - discountAmount + taxAmount;

    // Scroll to bottom of cart when items are added
    useEffect(() => {
        if (cartEndRef.current && items.length > 2) {
            cartEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [items]);

    const updateItem = (id, field, value) => {
        setItems(
            items.map((item) =>
                item.id === id ? { ...item, [field]: value } : item
            )
        );
    };

    const addCustomItem = () => {
        if (customName.trim() && customPrice > 0) {
            setItems([
                ...items,
                {
                    id: Date.now(),
                    name: customName,
                    qty: 1,
                    price: parseFloat(customPrice),
                },
            ]);
            setCustomName("");
            setCustomPrice("");
        }
    };

    const addQuickItem = (name, price) => {
        const existingItem = items.find((item) => item.name === name);
        if (existingItem) {
            updateItem(existingItem.id, "qty", existingItem.qty + 1);
        } else {
            setItems([...items, { id: Date.now(), name, qty: 1, price }]);
        }
    };

    const removeItem = (id) => {
        setItems(items.filter((item) => item.id !== id));
    };

    const handleNewOrder = () => {
        setItems([]);
        setDiscount(0);
        setPaymentType("Credit Card");
        setPaymentStatus("new");
        setTimeout(() => {
            setPaymentStatus(null);
        }, 2000);
    };

    const applyPercentageDiscount = (percentage) => {
        setDiscount((subtotal * percentage) / 100);
    };

    // Print-specific handler
    const handlePrintReceipt = () => {
        // Close preview if open
        setShowReceiptPreview(false);

        // Use setTimeout to ensure state updates before printing
        setTimeout(() => {
            const printWindow = window.open("", "_blank");
            printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>VCL Receipt - ${receiptNo}</title>
              <style>
                @media print {
                  @page {
                    size: 80mm auto;
                    margin: 0;
                    padding: 0;
                  }
                  body {
                    margin: 0;
                    padding: 0;
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    color: #000;
                    width: 80mm;
                  }
                }
                * {
                  box-sizing: border-box;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                .receipt-container {
                  width: 80mm;
                  padding: 10px 8px;
                  margin: 0 auto;
                }
                .receipt-header {
                  text-align: center;
                  margin-bottom: 15px;
                }
                .receipt-title {
                  font-size: 18px;
                  font-weight: 900;
                  margin-bottom: 5px;
                }
                .receipt-address {
                  font-size: 9px;
                  margin-bottom: 8px;
                  line-height: 1.2;
                }
                .receipt-divider {
                  text-align: center;
                  border-top: 1px dashed #000;
                  margin: 8px 0;
                }
                .receipt-info {
                  font-size: 9px;
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 5px;
                }
                .receipt-items {
                  margin: 15px 0;
                }
                .item-row {
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 8px;
                }
                .item-name {
                  flex: 1;
                  font-weight: bold;
                }
                .item-price {
                  font-weight: bold;
                }
                .unit-price {
                  font-size: 8px;
                  color: #666;
                }
                .receipt-totals {
                  border-top: 1px dashed #000;
                  padding-top: 10px;
                  margin-top: 15px;
                }
                .total-row {
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 5px;
                }
                .grand-total {
                  font-size: 16px;
                  font-weight: 900;
                  margin-top: 8px;
                }
                .payment-info {
                  background: #f5f5f5;
                  padding: 8px;
                  margin: 15px 0;
                  border-radius: 4px;
                  font-size: 9px;
                }
                .receipt-footer {
                  text-align: center;
                  margin-top: 20px;
                  font-size: 8px;
                  color: #666;
                }
                .barcode {
                  text-align: center;
                  letter-spacing: 5px;
                  font-weight: bold;
                  margin: 10px 0;
                }
              </style>
            </head>
            <body>
              <div class="receipt-container">
                <div class="receipt-header">
                  <div class="receipt-title">VCL International</div>
                  <div class="receipt-address">
                    153A, C Block, Citi Housing Society<br/>
                    Sialkot, 51310, Pakistan<br/>
                    P: +92 300 000 0000
                  </div>
                  <div class="receipt-divider"></div>
                  <div class="receipt-info">
                    <span>DATE: ${new Date().toLocaleDateString()}</span>
                    <span>TIME: ${new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    })}</span>
                  </div>
                  <div class="receipt-info">
                    <span>CASHIER: ${cashier}</span>
                    <span>TRANS: ${receiptNo}</span>
                  </div>
                  <div class="receipt-divider"></div>
                </div>
                
                <div class="receipt-items">
                  ${items
                      .map(
                          (item) => `
                    <div class="item-row">
                      <div class="item-name">
                        ${item.qty} × ${item.name}
                        <div class="unit-price">Unit: $${item.price.toFixed(
                            2
                        )}</div>
                      </div>
                      <div class="item-price">$${(
                          item.price * item.qty
                      ).toFixed(2)}</div>
                    </div>
                  `
                      )
                      .join("")}
                </div>
                
                <div class="receipt-totals">
                  <div class="total-row">
                    <span>Subtotal:</span>
                    <span>$${subtotal.toFixed(2)}</span>
                  </div>
                  ${
                      discount > 0
                          ? `
                    <div class="total-row">
                      <span>Discount:</span>
                      <span style="color: red;">-$${discount.toFixed(2)}</span>
                    </div>
                  `
                          : ""
                  }
                  <div class="total-row">
                    <span>Tax (${taxRate}%):</span>
                    <span>$${taxAmount.toFixed(2)}</span>
                  </div>
                  <div class="total-row grand-total">
                    <span>TOTAL:</span>
                    <span>$${total.toFixed(2)}</span>
                  </div>
                </div>
                
                <div class="payment-info">
                  <div class="total-row">
                    <span>Payment Method:</span>
                    <span>${paymentType}</span>
                  </div>
                  <div class="total-row">
                    <span>Status:</span>
                    <span>AUTHORIZED</span>
                  </div>
                </div>
                
                <div class="barcode">
                  ${receiptNo}
                </div>
                
                <div class="receipt-footer">
                  *** Thank you for choosing VCL ***<br/>
                  Sialkot Logistics Export Center
                </div>
              </div>
              
              <script>
                window.onload = function() {
                  window.print();
                  setTimeout(function() {
                    window.close();
                  }, 100);
                };
              </script>
            </body>
          </html>
        `);
            printWindow.document.close();

            setPaymentStatus("completed");
            setTimeout(() => {
                setPaymentStatus(null);
            }, 3000);
        }, 100);
    };

    // Quick add items for POS
    const quickItems = [
        {
            name: "Logistics Fee",
            price: 150.0,
            color: "bg-blue-100",
            icon: "🚚",
        },
        {
            name: "Documentation",
            price: 45.0,
            color: "bg-green-100",
            icon: "📄",
        },
        { name: "Packaging", price: 25.0, color: "bg-yellow-100", icon: "📦" },
        { name: "Insurance", price: 75.0, color: "bg-red-100", icon: "🛡️" },
        {
            name: "Express Service",
            price: 120.0,
            color: "bg-purple-100",
            icon: "⚡",
        },
        { name: "Storage", price: 15.0, color: "bg-indigo-100", icon: "🏪" },
        { name: "Handling", price: 30.0, color: "bg-pink-100", icon: "👐" },
        {
            name: "Customs Clearance",
            price: 90.0,
            color: "bg-cyan-100",
            icon: "📋",
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col font-sans text-slate-900">
            {/* Notification Toast */}
            {paymentStatus === "completed" && (
                <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
                    ✅ Payment completed and receipt printed!
                </div>
            )}
            {paymentStatus === "new" && (
                <div className="fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
                    🆕 New order created!
                </div>
            )}

            {/* POS HEADER */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 shadow-xl print:hidden">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white text-lg font-black shadow-lg">
                            <span className="text-2xl">V</span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight">
                                VCL Logistics POS
                            </h1>
                            <p className="text-sm text-slate-300">
                                Streamlined Service Billing
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden md:block text-right">
                            <p className="text-sm text-slate-300">
                                <span className="font-medium">Cashier:</span>{" "}
                                <span className="font-bold">{cashier}</span>
                            </p>
                            <p className="text-xs text-slate-400">
                                Order ID: {receiptNo}
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleNewOrder}
                                className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg hover:shadow-xl"
                            >
                                <span>🆕</span> New Order
                            </button>
                            <button
                                onClick={() => setShowReceiptPreview(true)}
                                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg hover:shadow-xl"
                            >
                                <span>👁️</span> Preview
                            </button>
                            <button
                                onClick={handlePrintReceipt}
                                className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg hover:shadow-xl"
                            >
                                <span className="text-xl">🖨️</span> Print
                                Receipt
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN LAYOUT */}
            <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 max-w-7xl mx-auto w-full print:hidden">
                {/* LEFT PANEL: PRODUCTS */}
                <div className="lg:w-2/3">
                    <div className="bg-white rounded-2xl shadow-lg h-full flex flex-col overflow-hidden">
                        <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                            <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
                                <span className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <span className="text-2xl">📦</span>
                                </span>
                                Services & Products
                            </h2>
                            <p className="text-sm text-slate-600 mt-1">
                                Click to add items to cart
                            </p>
                        </div>

                        {/* SEARCH BAR */}
                        <div className="p-5 border-b border-slate-100">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="🔍 Search services..."
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm transition-all"
                                />
                                <button className="absolute right-3 top-1/2 transform -translate-y-1/2 px-4 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-sm font-medium transition-colors">
                                    Filter
                                </button>
                            </div>
                        </div>

                        {/* PRODUCT GRID */}
                        <div className="flex-1 overflow-y-auto p-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {quickItems.map((item, index) => (
                                    <button
                                        key={index}
                                        onClick={() =>
                                            addQuickItem(item.name, item.price)
                                        }
                                        className="group relative bg-white border-2 border-slate-200 hover:border-orange-500 rounded-2xl p-4 text-left transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
                                    >
                                        <div
                                            className={`w-14 h-14 ${item.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                                        >
                                            <span className="text-2xl">
                                                {item.icon}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-slate-800 mb-2 line-clamp-1">
                                            {item.name}
                                        </h3>
                                        <p className="text-sm text-slate-600 mb-3">
                                            Standard service fee
                                        </p>
                                        <div className="flex justify-between items-center">
                                            <span className="text-2xl font-black text-slate-900">
                                                ${item.price.toFixed(2)}
                                            </span>
                                            <span className="text-xs bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1.5 rounded-full font-bold shadow-md">
                                                + ADD
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* CUSTOM ITEM FORM */}
                        <div className="p-5 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                    ✏️
                                </span>
                                Add Custom Service
                            </h3>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        value={customName}
                                        onChange={(e) =>
                                            setCustomName(e.target.value)
                                        }
                                        placeholder="Service description"
                                        className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        onKeyPress={(e) =>
                                            e.key === "Enter" && addCustomItem()
                                        }
                                    />
                                </div>
                                <div className="w-full sm:w-32">
                                    <input
                                        type="number"
                                        value={customPrice}
                                        onChange={(e) =>
                                            setCustomPrice(e.target.value)
                                        }
                                        placeholder="Price"
                                        className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        onKeyPress={(e) =>
                                            e.key === "Enter" && addCustomItem()
                                        }
                                    />
                                </div>
                                <button
                                    onClick={addCustomItem}
                                    disabled={
                                        !customName.trim() || customPrice <= 0
                                    }
                                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl"
                                >
                                    + Add Custom
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL: CART */}
                <div className="lg:w-1/3">
                    <div className="bg-white rounded-2xl shadow-xl h-full flex flex-col overflow-hidden sticky top-4">
                        {/* CART HEADER */}
                        <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-black flex items-center gap-3">
                                        <span className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                                            🛒
                                        </span>
                                        Current Order
                                    </h2>
                                    <p className="text-sm text-slate-300 mt-1">
                                        {items.length} item
                                        {items.length !== 1 ? "s" : ""} in cart
                                    </p>
                                </div>
                                <button
                                    onClick={handleNewOrder}
                                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold transition-colors"
                                >
                                    Clear All
                                </button>
                            </div>
                        </div>

                        {/* CART ITEMS */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {items.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-6 opacity-10">
                                        🛒
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-600 mb-2">
                                        Your cart is empty
                                    </h3>
                                    <p className="text-sm text-slate-500">
                                        Add services from the left panel
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {items.map((item) => (
                                        <div
                                            key={item.id}
                                            className="group relative bg-gradient-to-r from-slate-50 to-white border border-slate-200 hover:border-orange-300 rounded-xl p-4 transition-all hover:shadow-md"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <h4 className="font-bold text-slate-800 truncate pr-8">
                                                    {item.name ||
                                                        "Unnamed Item"}
                                                </h4>
                                                <button
                                                    onClick={() =>
                                                        removeItem(item.id)
                                                    }
                                                    className="absolute right-3 top-3 w-7 h-7 flex items-center justify-center bg-white border border-slate-300 hover:border-red-400 text-slate-500 hover:text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                                                    title="Remove item"
                                                >
                                                    ×
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() =>
                                                            updateItem(
                                                                item.id,
                                                                "qty",
                                                                Math.max(
                                                                    1,
                                                                    item.qty - 1
                                                                )
                                                            )
                                                        }
                                                        className="w-8 h-8 flex items-center justify-center bg-white border border-slate-300 hover:border-orange-500 text-slate-600 hover:text-orange-600 rounded-lg font-bold transition-colors"
                                                        title="Decrease quantity"
                                                    >
                                                        −
                                                    </button>
                                                    <div className="w-16 px-3 py-2 bg-white border border-slate-300 rounded-lg text-center">
                                                        <span className="font-bold text-slate-900">
                                                            {item.qty}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() =>
                                                            updateItem(
                                                                item.id,
                                                                "qty",
                                                                item.qty + 1
                                                            )
                                                        }
                                                        className="w-8 h-8 flex items-center justify-center bg-white border border-slate-300 hover:border-orange-500 text-slate-600 hover:text-orange-600 rounded-lg font-bold transition-colors"
                                                        title="Increase quantity"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-2xl font-black text-slate-900">
                                                        $
                                                        {(
                                                            item.price *
                                                            item.qty
                                                        ).toFixed(2)}
                                                    </div>
                                                    <div className="text-xs text-slate-500">
                                                        ${item.price.toFixed(2)}{" "}
                                                        each
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={cartEndRef} />
                                </div>
                            )}
                        </div>

                        {/* QUICK DISCOUNTS */}
                        {items.length > 0 && (
                            <div className="px-4 pt-2 pb-4 border-t border-slate-200">
                                <div className="mb-3">
                                    <p className="text-sm font-medium text-slate-700 mb-2">
                                        Quick Discounts
                                    </p>
                                    <div className="flex gap-2">
                                        {[5, 10, 15, 20].map((percent) => (
                                            <button
                                                key={percent}
                                                onClick={() =>
                                                    applyPercentageDiscount(
                                                        percent
                                                    )
                                                }
                                                className="flex-1 py-2 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border border-blue-200 text-blue-700 rounded-lg text-sm font-bold transition-all hover:shadow"
                                            >
                                                {percent}%
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TOTALS */}
                        {items.length > 0 && (
                            <div className="border-t border-slate-200 p-4 space-y-3 bg-gradient-to-b from-slate-50 to-white">
                                <div className="flex justify-between text-slate-600">
                                    <span>Subtotal</span>
                                    <span className="font-bold">
                                        ${subtotal.toFixed(2)}
                                    </span>
                                </div>
                                {discount > 0 && (
                                    <div className="flex justify-between text-red-600">
                                        <span>Discount</span>
                                        <span className="font-bold">
                                            -${discount.toFixed(2)}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between text-slate-600">
                                    <span>Tax ({taxRate}%)</span>
                                    <span className="font-bold">
                                        ${taxAmount.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center pt-4 border-t border-slate-300">
                                    <span className="text-xl font-black text-slate-800">
                                        Total
                                    </span>
                                    <div className="text-right">
                                        <div className="text-4xl font-black text-slate-900">
                                            ${total.toFixed(2)}
                                        </div>
                                        {discount > 0 && (
                                            <div className="text-sm text-slate-500">
                                                Saved: ${discount.toFixed(2)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* PAYMENT SECTION */}
                        {items.length > 0 && (
                            <div className="p-4 border-t border-slate-200 space-y-4 bg-gradient-to-b from-slate-50 to-white">
                                <div className="space-y-3">
                                    <label className="block text-sm font-bold text-slate-700">
                                        Payment Method
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {["Cash", "Credit Card", "Wire"].map(
                                            (method) => (
                                                <button
                                                    key={method}
                                                    onClick={() =>
                                                        setPaymentType(method)
                                                    }
                                                    className={`py-3 text-sm font-bold rounded-xl border-2 transition-all ${
                                                        paymentType === method
                                                            ? "bg-gradient-to-r from-green-500 to-green-600 text-white border-green-600 shadow-lg"
                                                            : "bg-white text-slate-600 border-slate-300 hover:border-green-500 hover:shadow-md"
                                                    }`}
                                                >
                                                    {method === "Credit Card"
                                                        ? "💳"
                                                        : method === "Cash"
                                                        ? "💵"
                                                        : "🏦"}{" "}
                                                    {method}
                                                </button>
                                            )
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        Custom Discount ($)
                                    </label>
                                    <input
                                        type="number"
                                        value={discount}
                                        onChange={(e) =>
                                            setDiscount(
                                                Math.max(
                                                    0,
                                                    parseFloat(
                                                        e.target.value
                                                    ) || 0
                                                )
                                            )
                                        }
                                        className="w-full px-4 py-3 bg-white border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg font-bold"
                                        placeholder="0.00"
                                    />
                                </div>

                                <button
                                    onClick={handlePrintReceipt}
                                    className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-black rounded-xl text-lg transition-all shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <div className="flex items-center justify-center gap-3">
                                        <span className="text-2xl">💳</span>
                                        <div className="text-left">
                                            <div className="text-sm font-normal opacity-90">
                                                PROCESS PAYMENT
                                            </div>
                                            <div className="text-xl">
                                                ${total.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* RECEIPT PREVIEW MODAL */}
            {showReceiptPreview && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 print:hidden">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                            <h2 className="text-2xl font-black text-slate-900">
                                Receipt Preview
                            </h2>
                            <button
                                onClick={() => setShowReceiptPreview(false)}
                                className="text-2xl text-slate-500 hover:text-slate-700"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6">
                            <div
                                className="bg-white p-8 font-mono text-black border-2 border-dashed border-slate-300 mx-auto"
                                style={{ width: "80mm" }}
                            >
                                <div className="text-center space-y-1 mb-6 uppercase text-[12px]">
                                    <h1 className="font-black text-xl">
                                        VCL International
                                    </h1>
                                    <p className="normal-case text-[10px] text-slate-500">
                                        153A, C Block, Citi Housing Society
                                        <br />
                                        Sialkot, 51310, Pakistan
                                    </p>
                                    <div className="py-2 opacity-30">
                                        --------------------------------
                                    </div>
                                    <div className="text-left space-y-0.5 text-[10px]">
                                        <div className="flex justify-between">
                                            <span>
                                                DATE:{" "}
                                                {new Date().toLocaleDateString()}
                                            </span>
                                            <span>
                                                TIME:{" "}
                                                {new Date().toLocaleTimeString(
                                                    [],
                                                    {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    }
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>CASHIER: {cashier}</span>
                                            <span>TRANS: {receiptNo}</span>
                                        </div>
                                    </div>
                                    <div className="py-2 opacity-30">
                                        --------------------------------
                                    </div>
                                </div>

                                <div className="space-y-4 text-[11px] mb-8">
                                    {items.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex justify-between"
                                        >
                                            <div>
                                                {item.qty} {item.name}
                                                <span className="block text-[9px] text-slate-500">
                                                    unit: $
                                                    {item.price.toFixed(2)}
                                                </span>
                                            </div>
                                            <span className="font-bold">
                                                $
                                                {(
                                                    item.price * item.qty
                                                ).toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t border-dashed pt-4 space-y-1.5 text-[12px]">
                                    <div className="flex justify-between">
                                        <span>Subtotal</span>
                                        <span>${subtotal.toFixed(2)}</span>
                                    </div>
                                    {discount > 0 && (
                                        <div className="flex justify-between text-red-600">
                                            <span>Discount</span>
                                            <span>-${discount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span>Tax ({taxRate}%)</span>
                                        <span>${taxAmount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-end pt-4">
                                        <span className="text-lg font-black">
                                            TOTAL
                                        </span>
                                        <span className="text-2xl font-black">
                                            ${total.toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-8 text-[10px] text-center">
                                    <p>Payment: {paymentType}</p>
                                    <p className="mt-4 text-[8px] text-slate-400">
                                        Thank you for choosing VCL
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-200 flex gap-3">
                            <button
                                onClick={() => setShowReceiptPreview(false)}
                                className="flex-1 px-6 py-3 bg-slate-200 hover:bg-slate-300 rounded-xl font-bold transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={handlePrintReceipt}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
                            >
                                Print Receipt
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style
                dangerouslySetInnerHTML={{
                    __html: `
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fade-in 0.3s ease-out;
          }
          .line-clamp-1 {
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        `,
                }}
            />
        </div>
    );
};
export default Receipt;
