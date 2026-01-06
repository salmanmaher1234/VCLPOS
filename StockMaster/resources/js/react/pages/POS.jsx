import React, { useState, useEffect } from "react";
import React, { useState, useEffect } from 'react';
import Receipt from '../components/Receipt';

export default function POS() {
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [cart, setCart] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);

    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [paidAmount, setPaidAmount] = useState("");
    const [taxRate, setTaxRate] = useState(0);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [notes, setNotes] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");

    // New states for additional features
    const [showCustomServiceModal, setShowCustomServiceModal] = useState(false);
    const [customServiceName, setCustomServiceName] = useState("");
    const [customServicePrice, setCustomServicePrice] = useState("");
    const [showReceiptPreview, setShowReceiptPreview] = useState(false);
    const [cashierName] = useState("Abdullah S.");
    const [orderId] = useState(
        `StockMaster-${Date.now().toString().slice(-6)}`
    );

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
            const token = localStorage.getItem("auth_token");
            const response = await fetch("/api/products?per_page=1000", {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });

            if (response.ok) {
                const data = await response.json();
                setProducts(data.data || []);
            }
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomers = async () => {
        try {
            const token = localStorage.getItem("auth_token");
            const response = await fetch("/api/customers?per_page=1000", {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });

            if (response.ok) {
                const data = await response.json();
                setCustomers(data.data || []);
            }
        } catch (error) {
            console.error("Error fetching customers:", error);
        }
    };

    const addToCart = (product) => {
        const existingItem = cart.find((item) => item.id === product.id);

        if (existingItem) {
            setCart(
                cart.map((item) =>
                    item.id === product.id
                        ? { ...item, qty: item.qty + 1 }
                        : item
                )
            );
        } else {
            setCart([
                ...cart,
                {
                    ...product,
                    qty: 1,
                    price: parseFloat(product.price),
                    type: "product",
                },
            ]);
        }
    };

    const addCustomService = () => {
        if (!customServiceName || !customServicePrice) {
            setAlertMessage("Please enter service name and price");
            setShowAlert(true);
            setTimeout(() => setShowAlert(false), 3000);
            return;
        }

        const newService = {
            id: `service-${Date.now()}`,
            name: customServiceName,
            price: parseFloat(customServicePrice),
            qty: 1,
            type: "service",
            code: "SERVICE",
        };

        setCart([...cart, newService]);
        setCustomServiceName("");
        setCustomServicePrice("");
        setShowCustomServiceModal(false);

        setSuccessMessage(
            `Custom service "${customServiceName}" added to cart`
        );
        setTimeout(() => setSuccessMessage(""), 3000);
    };

    const updateCartQty = (productId, qty) => {
        if (qty <= 0) {
            removeFromCart(productId);
        } else {
            setCart(
                cart.map((item) =>
                    item.id === productId
                        ? { ...item, qty: parseInt(qty) }
                        : item
                )
            );
        }
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter((item) => item.id !== productId));
    };

    const calculateSubtotal = () => {
        return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    };

    const calculateTax = () => {
        return (calculateSubtotal() * taxRate) / 100;
    };

    const calculateTotal = () => {
        return calculateSubtotal() + calculateTax() - discountAmount;
    };

    const initiateCheckout = () => {
        if (cart.length === 0) {
            setAlertMessage(
                "Cart is empty! Please add products before completing the sale."
            );
            setShowAlert(true);
            setTimeout(() => setShowAlert(false), 3000);
            return;
        }

        if (!paidAmount || parseFloat(paidAmount) < calculateTotal()) {
            setAlertMessage("Paid amount must be at least the total amount!");
            setShowAlert(true);
            setTimeout(() => setShowAlert(false), 3000);
            return;
        }

        const token = localStorage.getItem("auth_token");
        setShowConfirmModal(true);
    };

    const handleCheckout = async () => {
        setShowConfirmModal(false);
        const token = localStorage.getItem('auth_token');

        try {
            const response = await fetch("/api/pos", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    customer_id: selectedCustomer,
                    cart: cart.map((item) => ({
                        id: item.type === "service" ? null : item.id,
                        name: item.name,
                        qty: item.qty,
                        price: item.price,
                        type: item.type || "product",
                    })),
                    total_amount: calculateTotal(),
                    paid_amount: parseFloat(paidAmount),
                    payment_method: paymentMethod,
                    tax_rate: taxRate,
                    discount_amount: discountAmount,
                    notes: notes,
                    cashier_name: cashierName,
                    order_id: orderId,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccessMessage(
                    `Sale completed! Receipt #${data.receipt_number}`
                );
                setTimeout(() => setSuccessMessage(""), 5000);

                // Show receipt preview after successful checkout
                setTimeout(() => {
                    printReceipt();
                }, 1000);

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
                setPaidAmount("");
                setTaxRate(0);
                setDiscountAmount(0);
                setNotes("");
                setPaymentMethod("cash");
                setNotes('');
                setPaymentMethod('cash');

                setPaymentMethod('cash');

                // Removed setTimeout to keep success message open until manually closed

                // Refresh products to update stock

                // Refresh products to update stock
                fetchProducts();
            } else {
                alert(
                    "Error processing sale: " +
                        (data.message || "Unknown error")
                );
            }
        } catch (error) {
            console.error("Error processing sale:", error);
            alert("Error processing sale");
        }
    };

    const resetNewOrder = () => {
        if (
            cart.length > 0 &&
            !window.confirm(
                "Are you sure you want to start a new order? Current cart will be cleared."
            )
        ) {
            return;
        }
        setCart([]);
        setSelectedCustomer(null);
        setPaidAmount("");
        setTaxRate(0);
        setDiscountAmount(0);
        setNotes("");
        setPaymentMethod("cash");
        setSuccessMessage("New order started");
        setTimeout(() => setSuccessMessage(""), 3000);
    };

    const printReceipt = () => {
        const receiptWindow = window.open("", "_blank", "width=320,height=600");

        const selectedCustomerName = selectedCustomer
            ? customers.find(
                  (c) => c.id.toString() === selectedCustomer.toString()
              )?.name
            : "WALK-IN";

        const receiptContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>StockMaster Receipt</title>
        <style>
          @media print {
            @page { margin: 0; size: 80mm auto; }
            body { margin: 0; padding: 0; }
            * { box-sizing: border-box; }
          }
          
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            width: 80mm;
            margin: 0;
            padding: 8px;
            line-height: 1.2;
          }
          
          .receipt-header {
            text-align: center;
            border-bottom: 1px dashed #000;
            padding-bottom: 8px;
            margin-bottom: 8px;
          }
          
          .company-name {
            font-weight: bold;
            font-size: 14px;
          }
          
          .company-details {
            font-size: 10px;
          }
          
          .receipt-info {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            font-size: 11px;
          }
          
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 8px 0;
          }
          
          .items-table th {
            text-align: left;
            border-bottom: 1px dashed #000;
            padding: 4px 0;
            font-weight: bold;
          }
          
          .items-table td {
            padding: 4px 0;
            border-bottom: 1px dotted #ccc;
          }
          
          .items-table tr:last-child td {
            border-bottom: 1px dashed #000;
          }
          
          .qty { width: 15%; text-align: center; }
          .item { width: 50%; }
          .price { width: 35%; text-align: right; }
          
          .totals {
            margin-top: 12px;
            border-top: 1px dashed #000;
            padding-top: 8px;
          }
          
          .total-row {
            display: flex;
            justify-content: space-between;
            margin: 4px 0;
          }
          
          .grand-total {
            font-weight: bold;
            font-size: 14px;
            border-top: 2px solid #000;
            padding-top: 6px;
            margin-top: 6px;
          }
          
          .payment-info {
            margin-top: 12px;
            border-top: 1px dashed #000;
            padding-top: 8px;
            font-size: 11px;
          }
          
          .footer {
            text-align: center;
            margin-top: 12px;
            font-size: 10px;
            border-top: 1px dashed #000;
            padding-top: 8px;
          }
          
          .barcode {
            text-align: center;
            margin: 12px 0;
            font-family: 'Libre Barcode 39', monospace;
            font-size: 24px;
          }
          
          .service-badge {
            background: #f0f0f0;
            padding: 1px 4px;
            border-radius: 2px;
            font-size: 9px;
            margin-left: 4px;
          }
        </style>
      </head>
      <body>
        <div class="receipt-header">
          <div class="company-name">StockMaster CORPORATION LTD.</div>
          <div class="company-details">Streamlined Service Billing</div>
          <div class="company-details">GSTIN: 07AABCU9603R1ZV</div>
        </div>
        
        <div class="receipt-info">
          <div>
            <div>Order: ${orderId}</div>
            <div>Date: ${new Date().toLocaleDateString()}</div>
            <div>Time: ${new Date().toLocaleTimeString()}</div>
          </div>
          <div>
            <div>Cashier: ${cashierName}</div>
            <div>Customer: ${selectedCustomerName}</div>
          </div>
        </div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th class="qty">QTY</th>
              <th class="item">ITEM</th>
              <th class="price">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            ${cart
                .map(
                    (item) => `
              <tr>
                <td class="qty">${item.qty}</td>
                <td class="item">
                  ${item.name}
                  ${
                      item.type === "service"
                          ? '<span class="service-badge">SVC</span>'
                          : ""
                  }
                </td>
                <td class="price">$${(item.price * item.qty).toFixed(2)}</td>
              </tr>
            `
                )
                .join("")}
          </tbody>
        </table>
        
        <div class="totals">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>$${calculateSubtotal().toFixed(2)}</span>
          </div>
          ${
              taxRate > 0
                  ? `
          <div class="total-row">
            <span>Tax (${taxRate}%):</span>
            <span>$${calculateTax().toFixed(2)}</span>
          </div>
          `
                  : ""
          }
          ${
              discountAmount > 0
                  ? `
          <div class="total-row">
            <span>Discount:</span>
            <span>-$${discountAmount.toFixed(2)}</span>
          </div>
          `
                  : ""
          }
          <div class="total-row grand-total">
            <span>TOTAL:</span>
            <span>$${calculateTotal().toFixed(2)}</span>
          </div>
        </div>
        
        <div class="payment-info">
          <div class="total-row">
            <span>Payment Method:</span>
            <span>${paymentMethod.toUpperCase()}</span>
          </div>
          <div class="total-row">
            <span>Amount Paid:</span>
            <span>$${parseFloat(paidAmount || 0).toFixed(2)}</span>
          </div>
          ${
              paidAmount > 0 && parseFloat(paidAmount) > calculateTotal()
                  ? `
          <div class="total-row">
            <span>Change Due:</span>
            <span>$${(parseFloat(paidAmount) - calculateTotal()).toFixed(
                2
            )}</span>
          </div>
          `
                  : ""
          }
        </div>
        
        ${
            notes
                ? `
        <div class="footer">
          <strong>Notes:</strong><br>
          ${notes}
        </div>
        `
                : ""
        }
        
        <div class="barcode">
          *${orderId}*
        </div>
        
        <div class="footer">
          *** THANK YOU ***<br>
          Powered by StockMaster<br>

        </div>
        
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() {
              window.close();
            }, 1000);
          };
        </script>
      </body>
      </html>
    `;

        receiptWindow.document.write(receiptContent);
        receiptWindow.document.close();
    };

    // Filter products
    const filteredProducts = products.filter(
        (product) =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <main className="p-4 h-[calc(100vh-80px)] overflow-hidden">
                <div className="flex items-center justify-center h-full">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <div className="text-gray-500 font-medium">
                            Loading StockMaster POS System...
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    const customerName = selectedCustomer
        ? customers.find((c) => c.id.toString() === selectedCustomer.toString())
              ?.name
        : "Walk-in Customer";

    return (
        <main className="h-[calc(100vh-64px)] overflow-hidden p-2 sm:p-4 bg-gray-50 dark:bg-gray-900">
            {/* Hidden Receipt Component */}
            <Receipt data={lastSaleData} />


            {/* Success Toast */}
            {successMessage && (
                <div className="fixed top-20 right-4 z-50 animate-fade-in-down">
                    <div className="bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3">
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                        <span className="font-semibold">{successMessage}</span>
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
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        <span className="font-semibold">{alertMessage}</span>
                    </div>
                </div>
            )}

            {/* Custom Service Modal */}
            {showCustomServiceModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                                Add Custom Service
                            </h2>
                            <button
                                onClick={() => setShowCustomServiceModal(false)}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Service Name
                                </label>
                                <input
                                    type="text"
                                    value={customServiceName}
                                    onChange={(e) =>
                                        setCustomServiceName(e.target.value)
                                    }
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., Installation, Repair, Consultation"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Price ($)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={customServicePrice}
                                    onChange={(e) =>
                                        setCustomServicePrice(e.target.value)
                                    }
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    onClick={() =>
                                        setShowCustomServiceModal(false)
                                    }
                                    className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={addCustomService}
                                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 transition-colors"
                                >
                                    Add Service
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Receipt Preview Modal */}
            {showReceiptPreview && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                                Receipt Preview
                            </h2>
                            <button
                                onClick={() => setShowReceiptPreview(false)}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>

                        {/* Receipt Preview Content */}
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                            {/* Header */}
                            <div className="text-center border-b border-gray-300 dark:border-gray-600 pb-4 mb-4">
                                <div className="text-xl font-bold text-gray-800 dark:text-white">
                                    StockMaster CORPORATION LTD.
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    Streamlined Service Billing
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                    GSTIN: 07AABCU9603R1ZV
                                </div>
                            </div>

                            {/* Order Info */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Order ID
                                    </div>
                                    <div className="font-bold text-gray-800 dark:text-white">
                                        {orderId}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Cashier
                                    </div>
                                    <div className="font-bold text-gray-800 dark:text-white">
                                        {cashierName}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Date
                                    </div>
                                    <div className="text-gray-800 dark:text-white">
                                        {new Date().toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Time
                                    </div>
                                    <div className="text-gray-800 dark:text-white">
                                        {new Date().toLocaleTimeString()}
                                    </div>
                                </div>
                            </div>

                            {/* Customer Info */}
                            <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Customer
                                </div>
                                <div className="font-medium text-gray-800 dark:text-white">
                                    {customerName}
                                </div>
                            </div>

                            {/* Items Table */}
                            <div className="mb-6">
                                <div className="flex text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-300 dark:border-gray-600 pb-2 mb-2">
                                    <div className="w-1/6">QTY</div>
                                    <div className="w-2/3">DESCRIPTION</div>
                                    <div className="w-1/6 text-right">
                                        AMOUNT
                                    </div>
                                </div>
                                {cart.map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex py-2 border-b border-gray-200 dark:border-gray-700"
                                    >
                                        <div className="w-1/6 text-gray-800 dark:text-white">
                                            {item.qty}
                                        </div>
                                        <div className="w-2/3">
                                            <div className="text-gray-800 dark:text-white">
                                                {item.name}
                                            </div>
                                            {item.type === "service" && (
                                                <span className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded">
                                                    SERVICE
                                                </span>
                                            )}
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                ${item.price.toFixed(2)} each
                                            </div>
                                        </div>
                                        <div className="w-1/6 text-right font-medium text-gray-800 dark:text-white">
                                            $
                                            {(item.price * item.qty).toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Totals */}
                            <div className="space-y-2 mb-6">
                                <div className="flex justify-between">
                                    <span className="text-gray-700 dark:text-gray-300">
                                        Subtotal
                                    </span>
                                    <span className="font-medium">
                                        ${calculateSubtotal().toFixed(2)}
                                    </span>
                                </div>
                                {taxRate > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-700 dark:text-gray-300">
                                            Tax ({taxRate}%)
                                        </span>
                                        <span className="font-medium">
                                            ${calculateTax().toFixed(2)}
                                        </span>
                                    </div>
                                )}
                                {discountAmount > 0 && (
                                    <div className="flex justify-between text-red-600 dark:text-red-400">
                                        <span>Discount</span>
                                        <span>
                                            -${discountAmount.toFixed(2)}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between text-lg font-bold border-t border-gray-300 dark:border-gray-600 pt-3 mt-2">
                                    <span className="text-gray-800 dark:text-white">
                                        TOTAL
                                    </span>
                                    <span className="text-blue-600 dark:text-blue-400">
                                        ${calculateTotal().toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {/* Payment Info */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Payment Method
                                        </div>
                                        <div className="font-medium text-gray-800 dark:text-white">
                                            {paymentMethod.toUpperCase()}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Amount Paid
                                        </div>
                                        <div className="font-medium text-gray-800 dark:text-white">
                                            $
                                            {parseFloat(
                                                paidAmount || 0
                                            ).toFixed(2)}
                                        </div>
                                    </div>
                                    {paidAmount > 0 &&
                                        parseFloat(paidAmount) >
                                            calculateTotal() && (
                                            <div className="col-span-2">
                                                <div className="text-sm font-medium text-green-700 dark:text-green-400">
                                                    Change Due
                                                </div>
                                                <div className="font-bold text-green-600 dark:text-green-300">
                                                    $
                                                    {(
                                                        parseFloat(paidAmount) -
                                                        calculateTotal()
                                                    ).toFixed(2)}
                                                </div>
                                            </div>
                                        )}
                                </div>
                            </div>

                            {notes && (
                                <div className="mb-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Notes
                                    </div>
                                    <div className="text-gray-800 dark:text-white">
                                        {notes}
                                    </div>
                                </div>
                            )}

                            <div className="text-center text-sm text-gray-500 dark:text-gray-400 border-t border-gray-300 dark:border-gray-600 pt-4">
                                Thank you for your business!
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => setShowReceiptPreview(false)}
                                className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={printReceipt}
                                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-colors flex items-center gap-2"
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                                    />
                                </svg>
                                Print Receipt
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-4 h-full">
                {/* Left Side: Product Grid */}
                <div className="w-full lg:w-2/3 xl:w-3/4 flex flex-col h-full gap-4">
                    {/* Top Header with Buttons */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm flex-shrink-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                                    StockMaster POS System
                                </h2>
                                <div className="flex items-center gap-3 mt-1">
                                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                        <span className="text-blue-600 dark:text-blue-400">
                                            Cashier:
                                        </span>{" "}
                                        {cashierName}
                                    </div>
                                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                        <span className="text-green-600 dark:text-green-400">
                                            Order:
                                        </span>{" "}
                                        {orderId}
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={resetNewOrder}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium rounded-xl transition-all shadow-sm hover:shadow-md"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                        />
                                    </svg>
                                    New Order
                                </button>

                                <button
                                    onClick={() =>
                                        setShowCustomServiceModal(true)
                                    }
                                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium rounded-xl transition-all shadow-sm hover:shadow-md"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    Add Service
                                </button>

                                <button
                                    onClick={() => setShowReceiptPreview(true)}
                                    disabled={cart.length === 0}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all shadow-sm hover:shadow-md"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                        />
                                    </svg>
                                    Preview
                                </button>

                                <button
                                    onClick={printReceipt}
                                    disabled={cart.length === 0}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all shadow-sm hover:shadow-md"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                                        />
                                    </svg>
                                    Print
                                </button>
                            </div>
                        </div>

                        {/* Search Bar */}
                <div className="w-full lg:w-3/5 xl:w-[65%] flex flex-col h-full gap-4">
                    {/* Search Bar */}
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-sm flex-shrink-0">
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg
                                    className="h-5 w-5 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                </svg>
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
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
                            {filteredProducts.map((product) => (
                                <div
                                    key={product.id}
                                    onClick={() =>
                                        product.quantity > 0 &&
                                        addToCart(product)
                                    }
                                    className={`group relative bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-transparent hover:border-blue-500 ${
                                        product.quantity <= 0
                                            ? "opacity-60 grayscale"
                                            : ""
                                    }`}
                                >
                                    {/* Stock Badge */}
                                    <div
                                        className={`absolute top-3 right-3 px-2 py-1 rounded-lg text-[10px] font-bold z-10 ${
                                            product.quantity > 10
                                                ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400"
                                                : product.quantity > 0
                                                ? "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400"
                                                : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400"
                                        }`}
                                    >
                                        {product.quantity} left
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
                                            <svg
                                                className="w-12 h-12 text-gray-300 dark:text-gray-500"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={1}
                                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                />
                                            </svg>
                                            <svg className="w-8 h-8 text-gray-300 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        )}
                                        {/* Add Overlay */}
                                        {product.quantity > 0 && (
                                            <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <div className="bg-blue-600 text-white p-2 rounded-full shadow-lg transform scale-0 group-hover:scale-100 transition-transform">
                                                    <svg
                                                        className="w-6 h-6"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M12 4v16m8-8H4"
                                                        />
                                                    </svg>
                                                <div className="bg-blue-600 text-white p-1.5 rounded-full shadow-lg transform scale-0 group-hover:scale-100 transition-transform">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Product Info */}
                                    <div>
                                        <h3 className="font-bold text-gray-800 dark:text-white text-sm leading-tight mb-1 truncate">
                                            {product.name}
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                            {product.code}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                                $
                                                {parseFloat(
                                                    product.price
                                                ).toFixed(2)}
                                            </span>
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
                                        <svg
                                            className="w-8 h-8"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                            />
                                        </svg>
                                    </div>
                                    <p className="text-lg font-medium">
                                        No products found
                                    </p>
                                    <p className="text-sm">
                                        Try searching for something else
                                    </p>
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
                                <svg
                                    className="w-5 h-5 text-blue-500"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                                    />
                                </svg>
                                Current Sale
                            </h2>
                            <span className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs font-bold px-2 py-1 rounded-lg">
                                {cart.length} Items
                            </span>
                        </div>
                        <select
                            value={selectedCustomer || ""}
                            onChange={(e) =>
                                setSelectedCustomer(e.target.value || null)
                            }
                            className="w-full text-sm border-gray-200 dark:border-gray-600 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                            <option value="">Walk-in Customer</option>
                            {customers.map((customer) => (
                                <option key={customer.id} value={customer.id}>
                                    {customer.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Cart Items List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                                <svg
                                    className="w-16 h-16 mb-4 stroke-1"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                                    />
                                </svg>
                                <p className="font-medium">Cart is empty</p>
                                <p className="text-sm">
                                    Select products to begin
                                </p>
                            </div>
                        ) : (
                            cart.map((item) => (
                                <div
                                    key={item.id}
                                    className={`group flex flex-col gap-2 p-3 rounded-xl border ${
                                        item.type === "service"
                                            ? "border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/20"
                                            : "border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800"
                                    } hover:shadow-md transition-all`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-gray-800 dark:text-white text-sm line-clamp-1">
                                                    {item.name}
                                                </h4>
                                                {item.type === "service" && (
                                                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 rounded">
                                                        SERVICE
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-0.5">
                                                ${item.price.toFixed(2)} / unit
                                            </div>
                                        </div>
                                        <div className="font-bold text-gray-900 dark:text-white">
                                            $
                                            {(item.price * item.qty).toFixed(2)}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-lg p-1">
                                        <button
                                            onClick={() =>
                                                updateCartQty(
                                                    item.id,
                                                    item.qty - 1
                                                )
                                            }
                                            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-colors"
                                        >
                                            <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M20 12H4"
                                                />
                                            </svg>
                                        </button>
                                        <input
                                            type="number"
                                            value={item.qty}
                                            onChange={(e) =>
                                                updateCartQty(
                                                    item.id,
                                                    e.target.value
                                                )
                                            }
                                            className="w-12 text-center bg-transparent border-none p-0 text-sm font-bold text-gray-800 dark:text-white focus:ring-0"
                                        />
                                        <button
                                            onClick={() =>
                                                updateCartQty(
                                                    item.id,
                                                    item.qty + 1
                                                )
                                            }
                                            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-green-500 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-colors"
                                        >
                                            <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M12 4v16m8-8H4"
                                                />
                                            </svg>
                                        </button>
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
                                <label className="text-gray-500 border-b border-dashed border-gray-300 cursor-help">
                                    Tax (%)
                                </label>
                                <div className="flex items-center w-20">
                                    <input
                                        type="number"
                                        value={taxRate}
                                        onChange={(e) =>
                                            setTaxRate(
                                                parseFloat(e.target.value) || 0
                                            )
                                        }
                                        className="w-full text-right p-0 border-none bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700 text-sm focus:ring-0 text-gray-500"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between items-center group">
                                <label className="text-gray-500 border-b border-dashed border-gray-300 cursor-help">
                                    Discount ($)
                                </label>
                                <div className="flex items-center w-20">
                                    <input
                                        type="number"
                                        value={discountAmount}
                                        onChange={(e) =>
                                            setDiscountAmount(
                                                parseFloat(e.target.value) || 0
                                            )
                                        }
                                        className="w-full text-right p-0 border-none bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700 text-sm focus:ring-0 text-red-500"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between items-center pt-3 mt-2 border-t border-gray-100 dark:border-gray-700">
                                <span className="font-bold text-gray-800 dark:text-white text-lg">
                                    Total
                                </span>
                                <span className="font-bold text-2xl text-blue-600 dark:text-blue-400">
                                    ${calculateTotal().toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {/* Payment Inputs */}
                        <div className="grid grid-cols-3 gap-2 mb-3">
                            <div className="col-span-1">
                                <select
                                    value={paymentMethod}
                                    onChange={(e) =>
                                        setPaymentMethod(e.target.value)
                                    }
                                    className="w-full text-xs font-medium px-2 py-2.5 rounded-xl border-gray-200 dark:border-gray-600 focus:ring-blue-500 dark:bg-gray-700 bg-gray-50"
                                >
                                    <option value="cash">Cash</option>
                                    <option value="card">Card</option>
                                    <option value="mobile">Mobile</option>
                                </select>
                            </div>
                            <div className="col-span-2">
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                        $
                                    </span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={paidAmount}
                                        onChange={(e) =>
                                            setPaidAmount(e.target.value)
                                        }
                                        placeholder="Amount Paid"
                                        className="w-full pl-6 pr-3 py-2.5 text-sm font-bold rounded-xl border-gray-200 dark:border-gray-600 focus:ring-blue-500 dark:bg-gray-700"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Change Display */}
                        {paidAmount > 0 &&
                            parseFloat(paidAmount) >= calculateTotal() && (
                                <div className="mb-3 px-3 py-2 bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-800 rounded-lg flex justify-between items-center">
                                    <span className="text-xs font-bold text-green-700 dark:text-green-400 uppercase">
                                        Change Due
                                    </span>
                                    <span className="text-sm font-bold text-green-700 dark:text-green-300">
                                        $
                                        {(
                                            parseFloat(paidAmount) -
                                            calculateTotal()
                                        ).toFixed(2)}
                                    </span>
                                </div>
                            )}

                        {/* Notes */}
                        <div className="mb-3">
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add notes (optional)"
                                className="w-full text-xs p-2 rounded-lg border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 resize-none"
                                rows="2"
                            />
                        </div>


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
                            <span>Complete Sale</span>
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
