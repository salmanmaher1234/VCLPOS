import React, { useState, useEffect } from "react";
import Receipt from "../components/Receipt";

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
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");

    // New states for additional features
    const [showCustomServiceModal, setShowCustomServiceModal] = useState(false);
    const [customServiceName, setCustomServiceName] = useState("");
    const [customServicePrice, setCustomServicePrice] = useState("");
    const [showReceiptPreview, setShowReceiptPreview] = useState(false);
    const [cashierName, setCashierName] = useState("Staff");
    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                const user = JSON.parse(userData);
                if (user.name) setCashierName(user.name);
            } catch (e) { console.error("Error parsing user data", e); }
        }
    }, []);

    const [orderId] = useState(
        `POS-${Date.now().toString().slice(-6)}`
    );

    const [lastSaleData, setLastSaleData] = useState(null);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [parkedOrders, setParkedOrders] = useState(() => {
        try {
            const saved = localStorage.getItem('pos_parked_orders');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Failed to parse parked orders:", e);
            return [];
        }
    });
    const [showHoldModal, setShowHoldModal] = useState(false);
    const [showPendingListModal, setShowPendingListModal] = useState(false);
    const [holdReference, setHoldReference] = useState("");
    const [isAutomating, setIsAutomating] = useState(false);

    const handlePrint = () => {
        window.print();
    };



    useEffect(() => {
        fetchProducts();
        fetchCustomers();
        // Load parked orders
        const storedParkedOrders = localStorage.getItem("pos_parked_orders");
        if (storedParkedOrders) {
            setParkedOrders(JSON.parse(storedParkedOrders));
        }
    }, []);

    const fetchProducts = async () => {
        try {
            const token = localStorage.getItem("auth_token");
            const response = await fetch(
                "/api/products?per_page=1000",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                }
            );

            if (response.ok) {
                const data = await response.json();
                setProducts(data.data || []); // Handle pagination structure
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
            const response = await fetch(
                "/api/customers?per_page=1000",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                }
            );

            if (response.ok) {
                const data = await response.json();
                setCustomers(data.data || []); // Handle pagination structure
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

        setToastMessage(
            `Custom service "${customServiceName}" added to cart`
        );
        setTimeout(() => setToastMessage(""), 3000);
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

    const handleCheckout = async () => {
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
        initiateCheckout();
    };

    const initiateCheckout = () => {

        // Prepare data for preview/editing state
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const customerName = customers.find(c => c.id == selectedCustomer)?.name || 'Walk-in Customer';

        setLastSaleData({
            receiptNumber: "PENDING",
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

        // Show "Ready to Finalize" modal
        setShowCheckoutModal(true);
    };

    const processSale = async (shouldPrint) => {
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

                // Add Notification
                if (window.addVclNotification) {
                    window.addVclNotification({
                        type: 'sale',
                        title: 'New Sale Completed',
                        message: `Sale processed for ${lastSaleData.customer}. Total: $${lastSaleData.total.toFixed(2)}`,
                        invoice: data.receipt_number
                    });
                }

                setTimeout(() => setSuccessMessage(""), 5000);

                // Show receipt preview after successful checkout
                setTimeout(() => {
                    printReceipt();
                }, 1000);
                setShowCheckoutModal(false); // Close modal

                // Reset form
                setCart([]);
                setSelectedCustomer(null);
                setPaidAmount("");
                setTaxRate(0);
                setDiscountAmount(0);
                setNotes("");
                setPaymentMethod("cash");

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

    const generateRandomOrder = () => {
        // Dummy data fallbacks in case store is empty
        const dummyProducts = [
            { id: 9991, name: "Test Product A", price: 10.5 },
            { id: 9992, name: "Test Product B", price: 25.0 },
            { id: 9993, name: "Test Product C", price: 5.99 },
            { id: 9994, name: "Test Product D", price: 100.0 },
            { id: 9995, name: "Test Service X", price: 50.0, type: "service" },
        ];

        const sourceProducts = products.length > 0 ? products : dummyProducts;

        // Pick a random customer or null
        const randomCustomer =
            Math.random() > 0.3 && customers.length > 0
                ? customers[Math.floor(Math.random() * customers.length)]
                : null;

        const numItems = Math.floor(Math.random() * 5) + 1;
        const orderCart = [];
        const usedIndices = new Set();

        for (let i = 0; i < numItems; i++) {
            let attempts = 0;
            let randomIndex;
            do {
                randomIndex = Math.floor(Math.random() * sourceProducts.length);
                attempts++;
            } while (usedIndices.has(randomIndex) && attempts < 10);

            if (usedIndices.has(randomIndex)) continue;
            usedIndices.add(randomIndex);

            const product = sourceProducts[randomIndex];
            // Ensure price is a number
            const price = parseFloat(product.price);
            const qty = Math.floor(Math.random() * 5) + 1;

            orderCart.push({
                id: product.id,
                name: product.name,
                qty: qty,
                price: price,
                type: product.type || "product",
            });
        }

        if (orderCart.length === 0) return null;

        const subtotal = orderCart.reduce(
            (sum, item) => sum + item.price * item.qty,
            0
        );

        // Randomize entries for "Test All Fields"
        const randomTaxRate = Math.random() > 0.5 ? 5 : 0; // 50% chance of 5% tax
        const randomDiscount =
            Math.random() > 0.7 ? Math.floor(Math.random() * 10) + 1 : 0; // 30% chance of discount

        const taxAmount = (subtotal * randomTaxRate) / 100;
        const total = subtotal + taxAmount - randomDiscount;
        const finalTotal = Math.max(0, total); // Ensure no negative total

        const paymentMethods = ["cash", "card", "mobile"];

        return {
            customer_id: randomCustomer ? randomCustomer.id : null,
            cart: orderCart,
            total_amount: parseFloat(finalTotal.toFixed(2)),
            paid_amount: parseFloat(finalTotal.toFixed(2)), // paid in full
            payment_method:
                paymentMethods[
                Math.floor(Math.random() * paymentMethods.length)
                ],
            tax_rate: randomTaxRate,
            discount_amount: randomDiscount,
            notes: `Auto-Test: ${new Date().toLocaleTimeString()} (Tax: ${randomTaxRate}%, Disc: $${randomDiscount})`,
            cashier_name: cashierName,
            order_id: `Auto-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        };
    };

    const runAutomation = async () => {
        // No confirmation dialog - direct action
        if (isAutomating) return;

        setIsAutomating(true);
        let success = 0;
        const count = 10;
        const token = localStorage.getItem("auth_token");

        try {
            setSuccessMessage(`Starting Test: Generating ${count} orders...`);

            for (let i = 0; i < count; i++) {
                const orderData = generateRandomOrder();

                if (!orderData) continue;

                try {
                    const response = await fetch(
                        "/api/pos",
                        {
                            method: "POST",
                            headers: {
                                Authorization: `Bearer ${token}`,
                                Accept: "application/json",
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify(orderData),
                        }
                    );

                    if (response.ok) {
                        success++;
                        setSuccessMessage(
                            `Sent order ${i + 1}/${count} (ID: ${orderData.order_id
                            })`
                        );
                    } else {
                        console.error("Failed to submit test order", i);
                    }
                } catch (err) {
                    console.error("Error submitting test order", err);
                }
                // Delay to simulate realistic activity
                await new Promise((r) => setTimeout(r, 500));
            }
            setSuccessMessage(
                `Test Complete: ${success}/${count} orders processed.`
            );
            setTimeout(() => setSuccessMessage(""), 5000);

            // Refresh to show any stock changes
            fetchProducts();
        } catch (e) {
            console.error(e);
            setAlertMessage("Automation failed due to an error.");
            setShowAlert(true);
        } finally {
            setIsAutomating(false);
        }
    };

    const handleHoldOrder = () => {
        if (cart.length === 0) {
            setAlertMessage("Cart is empty! Cannot hold an empty order.");
            setShowAlert(true);
            setTimeout(() => setShowAlert(false), 3000);
            return;
        }
        setShowHoldModal(true);
    };

    const holdSale = (reference) => {
        if (cart.length === 0) return;
        const newOrder = {
            id: Date.now().toString(),
            reference: reference || `Order #${Date.now().toString().slice(-4)}`,
            cart: [...cart],
            selectedCustomer,
            taxRate,
            discountAmount,
            total: calculateTotal(),
            itemCount: cart.reduce((sum, item) => sum + item.qty, 0),
            timestamp: new Date().toISOString()
        };
        const updatedOrders = [...parkedOrders, newOrder];
        setParkedOrders(updatedOrders);
        localStorage.setItem('pos_parked_orders', JSON.stringify(updatedOrders));

        // Reset POS after parking
        setCart([]);
        setSelectedCustomer(null);
        setPaidAmount("");
        setTaxRate(0);
        setDiscountAmount(0);
        setNotes("");
        setPaymentMethod("cash");

        setShowHoldModal(false);
        setHoldReference("");

        setToastMessage("Sale added to pending bills");
        setTimeout(() => setToastMessage(""), 3000);
    };

    const confirmHoldOrder = () => {
        holdSale(holdReference);
    };

    const deleteParkedOrder = (orderId) => {
        if (!window.confirm("Are you sure you want to delete this held order?")) return;
        const updatedParkedOrders = parkedOrders.filter(
            (o) => o.id !== orderId
        );
        setParkedOrders(updatedParkedOrders);
        localStorage.setItem(
            "pos_parked_orders",
            JSON.stringify(updatedParkedOrders)
        );
        setToastMessage("Pending bill deleted");
        setTimeout(() => setToastMessage(""), 3000);
    };

    const restoreOrder = (order) => {
        setCart(order.cart);
        setSelectedCustomer(order.selectedCustomer);
        setTaxRate(order.taxRate || 0);
        setDiscountAmount(order.discountAmount || 0);

        const remaining = parkedOrders.filter(o => o.id !== order.id);
        setParkedOrders(remaining);
        localStorage.setItem('pos_parked_orders', JSON.stringify(remaining));
        setShowPendingListModal(false);

        setToastMessage("Sale retrieved");
        setTimeout(() => setToastMessage(""), 3000);
    };

    const printReceipt = () => {
        const selectedCustomerName = selectedCustomer
            ? customers.find(
                (c) => c.id.toString() === selectedCustomer.toString()
            )?.name
            : "WALK-IN";

        // Create a hidden iframe for printing
        let printFrame = document.getElementById("receipt-print-frame");
        if (!printFrame) {
            printFrame = document.createElement("iframe");
            printFrame.id = "receipt-print-frame";
            printFrame.style.display = "none";
            document.body.appendChild(printFrame);
        }

        const receiptContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>VCL Receipt</title>
        <style>
          @page { margin: 0; size: 80mm auto; }
          body { 
            margin: 0; 
            padding: 5mm; 
            font-family: 'Inter', -apple-system, sans-serif;
            font-size: 11pt; 
            line-height: 1.4;
            color: #000;
          }
          .receipt-header {
            text-align: center;
            border-bottom: 2pt solid #000;
            padding-bottom: 4mm;
            margin-bottom: 4mm;
          }
          .company-name {
            font-weight: 800;
            font-size: 16pt;
            letter-spacing: -0.5pt;
            margin-bottom: 1mm;
          }
          .company-details {
            font-size: 9pt;
            text-transform: uppercase;
            font-weight: 600;
            color: #444;
          }
          .receipt-info {
            display: flex;
            justify-content: space-between;
            margin: 4mm 0;
            font-size: 10pt;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 4mm 0;
          }
          .items-table th {
            text-align: left;
            border-bottom: 1.5pt solid #000;
            padding: 2mm 0;
            font-size: 9pt;
            font-weight: 800;
          }
          .items-table td {
            padding: 3mm 0;
            border-bottom: 0.5pt solid #eee;
            vertical-align: top;
          }
          .qty { width: 15%; font-weight: bold; }
          .item { width: 50%; font-weight: 500; }
          .price { width: 35%; text-align: right; font-weight: bold; }
          
          .totals {
            margin-top: 5mm;
            border-top: 2pt solid #000;
            padding-top: 3mm;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin: 1.5mm 0;
            font-size: 10pt;
          }
          .grand-total {
            font-weight: 900;
            font-size: 15pt;
            border-top: 1pt solid #000;
            padding-top: 2mm;
            margin-top: 2mm;
          }
          .payment-info {
            margin-top: 6mm;
            padding: 3mm;
            background: #f9f9f9;
            border-radius: 2mm;
            font-size: 10pt;
          }
          .footer {
            text-align: center;
            margin-top: 8mm;
            font-size: 9pt;
            border-top: 1pt dashed #ccc;
            padding-top: 5mm;
          }
          .brand-footer {
            font-weight: 800;
            font-size: 10pt;
            margin-top: 3mm;
            text-transform: uppercase;
            letter-spacing: 1pt;
          }
          .barcode {
            text-align: center;
            margin: 6mm 0;
            font-weight: bold;
            letter-spacing: 4pt;
          }
        </style>
      </head>
      <body>
        <div class="receipt-header">
          <div class="company-name">VCL INTERNATIONAL</div>
          <div class="company-details">Streamlined POS Solutions</div>
          <div class="company-details">GSTIN: 07AABCU9603R1ZV</div>
        </div>
        
        <div class="receipt-info">
          <div>
            <strong>ORDER: ${orderId}</strong><br>
            Date: ${new Date().toLocaleDateString()}<br>
            Time: ${new Date().toLocaleTimeString()}
          </div>
          <div style="text-align: right">
            Cashier: ${cashierName}<br>
            Customer: ${selectedCustomerName}
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
            ${cart.map((item) => `
              <tr>
                <td class="qty">${item.qty}</td>
                <td class="item">
                  ${item.name}
                  ${item.type === "service" ? '<div style="font-size: 8pt; color: #666;">(SERVICE)</div>' : ""}
                </td>
                <td class="price">$${(item.price * item.qty).toFixed(2)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        
        <div class="totals">
          <div class="total-row">
            <span>Subtotal</span>
            <span>$${calculateSubtotal().toFixed(2)}</span>
          </div>
          ${taxRate > 0 ? `
          <div class="total-row">
            <span>Tax (${taxRate}%)</span>
            <span>$${calculateTax().toFixed(2)}</span>
          </div>` : ""}
          ${discountAmount > 0 ? `
          <div class="total-row" style="color: #d32f2f">
            <span>Discount</span>
            <span>-$${discountAmount.toFixed(2)}</span>
          </div>` : ""}
          <div class="total-row grand-total">
            <span>TOTAL</span>
            <span>$${calculateTotal().toFixed(2)}</span>
          </div>
        </div>
        
        <div class="payment-info">
          <div class="total-row">
            <span>Payment Method</span>
            <span style="font-weight: bold">${paymentMethod.toUpperCase()}</span>
          </div>
          <div class="total-row">
            <span>Amount Paid</span>
            <span style="font-weight: bold">$${parseFloat(paidAmount || 0).toFixed(2)}</span>
          </div>
          ${paidAmount > 0 && parseFloat(paidAmount) > calculateTotal() ? `
          <div class="total-row" style="color: #2e7d32; font-weight: bold;">
            <span>Change Due</span>
            <span>$${(parseFloat(paidAmount) - calculateTotal()).toFixed(2)}</span>
          </div>` : ""}
        </div>
        
        ${notes ? `<div class="footer"><strong>Notes:</strong><br>${notes}</div>` : ""}
        
        <div class="barcode">
          *${orderId}*
        </div>
        
        <div class="footer">
          *** THANK YOU FOR VISITING ***
          <div class="brand-footer">Powered by VCL INTERNATIONAL</div>
        </div>

        <script>
          window.onload = function() {
            window.focus();
            window.print();
          };
        </script>
      </body>
      </html>
    `;

        const frameDoc = printFrame.contentWindow.document;
        frameDoc.open();
        frameDoc.write(receiptContent);
        frameDoc.close();
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
                            Loading VCL POS System...
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
                    </div>
                </div>
            )}
            {/* Hidden Receipt Component */}
            <Receipt data={lastSaleData} />


            {/* Success/Finalize Modal */}
            {showCheckoutModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 transform transition-all scale-100">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Ready to Finalize?</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">Review the bill or print to complete the sale.</p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => processSale(true)}
                                    className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-800 flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                    Print Receipt & Save
                                </button>
                                <button
                                    onClick={() => processSale(false)}
                                    className="w-full bg-gradient-to-r from-[#FF7d1f] to-[#2b59ff] text-white font-bold py-3.5 rounded-xl hover:opacity-90 shadow-lg shadow-orange-500/20 uppercase tracking-widest text-[11px] transition-all"
                                >
                                    Complete (No Print)
                                </button>
                                <button
                                    onClick={() => setShowCheckoutModal(false)}
                                    className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold py-3 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                    Edit Bill
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Feedback */}
            {toastMessage && (
                <div className="fixed top-20 right-4 z-50 animate-bounce-in">
                    <div className="bg-gradient-to-r from-[#FF7d1f] to-[#2b59ff] text-white px-6 py-4 rounded-xl shadow-2xl shadow-orange-500/20 flex items-center gap-3">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span className="font-semibold">{toastMessage}</span>
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
                                <div className="text-xl font-bold text-gray-800 dark:text-white uppercase tracking-tight">
                                    VCL INTERNATIONAL
                                </div>
                                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                                    Streamlined POS Solutions
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

                            <div className="text-center text-[10px] font-bold text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-4 uppercase tracking-widest">
                                Powered by VCL INTERNATIONAL
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

            <div className="flex flex-col lg:flex-row gap-2 h-full">
                {/* Left Side: Product Grid Area */}
                <div className="w-full lg:w-[68%] xl:w-[72%] flex flex-col h-full gap-2">
                    {/* Top Header with Buttons */}
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-4 rounded-2xl shadow-sm flex-shrink-0 border border-white dark:border-gray-700/50">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-1.5 w-full md:w-auto">
                                <div className="flex items-center gap-6 px-5 py-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider leading-none mb-1.5">Cashier</span>
                                        <span className="font-bold text-gray-800 dark:text-gray-100 text-sm truncate max-w-[120px]">
                                            {cashierName}
                                        </span>
                                    </div>
                                    <div className="h-8 w-px bg-gray-200 dark:bg-gray-600"></div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider leading-none mb-1.5">Order ID</span>
                                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">#{orderId.split('-')[1]}</span>
                                    </div>
                                    <div className="h-8 w-px bg-gray-200 dark:bg-gray-600"></div>
                                    <div className="flex flex-col text-right">
                                        <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider leading-none mb-1.5">
                                            {currentTime.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}
                                        </span>
                                        <span className="font-mono font-black text-gray-800 dark:text-gray-100 text-sm">
                                            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 w-full md:w-auto flex-wrap sm:flex-nowrap justify-end">
                                <button
                                    onClick={() => setShowCustomServiceModal(true)}
                                    title="Add Custom Item"
                                    className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-purple-50 dark:bg-purple-900/10 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition-all font-bold text-xs h-10"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                    <span>Custom Item</span>
                                </button>

                                <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>

                                <button
                                    onClick={() => setShowReceiptPreview(true)}
                                    disabled={cart.length === 0}
                                    className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 transition-all duration-200 text-xs font-bold disabled:opacity-50 h-10 shadow-sm"
                                >
                                    Preview
                                </button>

                                <button
                                    onClick={handleHoldOrder}
                                    disabled={cart.length === 0}
                                    className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FF7d1f] to-[#2b59ff] text-white hover:opacity-90 active:scale-95 transition-all duration-200 text-[10px] uppercase tracking-widest font-bold shadow-lg shadow-orange-500/20"
                                >
                                    Hold
                                </button>

                                <button
                                    onClick={() => setShowPendingListModal(true)}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 transition-all duration-200 font-bold text-xs h-10 shadow-lg shadow-indigo-500/20"
                                >
                                    Retrieve
                                    {parkedOrders.length > 0 && (
                                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 rounded-full border border-white ml-1 animate-pulse">
                                            {parkedOrders.length}
                                        </span>
                                    )}
                                </button>

                                <button
                                    onClick={printReceipt}
                                    disabled={cart.length === 0}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 active:scale-95 transition-all duration-200 text-xs font-bold h-10 shadow-lg shadow-orange-500/20"
                                >
                                    Print
                                </button>
                            </div>
                        </div>

                        {/* Search Bar Area */}
                        <div className="relative mb-4">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </span>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-4 py-3.5 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white/50 dark:bg-gray-800/50 dark:text-white placeholder-gray-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 transition-all duration-300 text-sm shadow-sm outline-none"
                                placeholder="Search products by name or code..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Products Grid Area */}
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 pb-20">
                                {filteredProducts.map((product) => (
                                    <div
                                        key={product.id}
                                        onClick={() => product.quantity > 0 && addToCart(product)}
                                        className={`group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-2 shadow-sm hover:shadow-2xl hover:-translate-y-1 active:scale-95 transition-all duration-300 cursor-pointer border border-white dark:border-gray-700/50 hover:border-blue-500/50 ${product.quantity <= 0 ? "opacity-50 grayscale" : ""}`}
                                    >
                                        {/* Stock Badge */}
                                        <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[8px] font-black z-10 shadow-sm ${product.quantity > 10 ? "bg-green-500 text-white" : "bg-red-500 text-white animate-pulse"}`}>
                                            {product.quantity}
                                        </div>

                                        {/* Product Image */}
                                        <div className="aspect-square mb-1.5 bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden flex items-center justify-center relative">
                                            {product.image ? (
                                                <img
                                                    src={`/storage/${product.image}`}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            )}
                                        </div>

                                        {/* Product Info */}
                                        <div className="overflow-hidden">
                                            <h3 className="font-bold text-gray-800 dark:text-white text-[11px] leading-tight mb-0.5 truncate">
                                                {product.name}
                                            </h3>
                                            <p className="text-[9px] text-gray-500 dark:text-gray-400 mb-1 font-mono">
                                                {product.code}
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[11px] font-black text-blue-600 dark:text-blue-400">
                                                    ${parseFloat(product.price).toFixed(2)}
                                                </span>
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
                </div>

                {/* Right Side: Billing Section */}
                <div className="w-full lg:w-[32%] xl:w-[28%] h-full flex flex-col bg-white/90 dark:bg-gray-800/90 backdrop-blur-2xl rounded-xl shadow-2xl border border-white dark:border-gray-700/50 overflow-hidden">
                    {/* Customer Header */}
                    <div className="p-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 text-sm uppercase tracking-tight">
                                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                                Current Sale
                            </h2>
                            <span className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                                {cart.length} ITEMS
                            </span>
                        </div>
                        <select
                            value={selectedCustomer || ""}
                            onChange={(e) =>
                                setSelectedCustomer(e.target.value || null)
                            }
                            className="w-full text-xs border-gray-200 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white py-1.5"
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
                    <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                                <div className="w-20 h-20 mb-4 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700">
                                    <svg
                                        className="w-10 h-10 text-gray-300 dark:text-gray-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1.5}
                                            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                                        />
                                    </svg>
                                </div>
                                <p className="font-bold text-gray-400 dark:text-gray-500 text-sm uppercase tracking-widest">Cart is empty</p>
                                <p className="text-[10px] text-gray-400 mt-1">Select products to start a sale</p>
                            </div>
                        ) : (
                            cart.map((item) => (
                                <div
                                    key={item.id}
                                    className={`group flex flex-col gap-1 p-1.5 rounded-xl border ${item.type === "service"
                                        ? "border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10"
                                        : "border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800"
                                        } hover:shadow-sm transition-all`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-1.5">
                                                <h4 className="font-bold text-gray-800 dark:text-white text-xs line-clamp-1">
                                                    {item.name}
                                                </h4>
                                                {item.type === "service" && (
                                                    <span className="px-1.5 py-0.5 text-[8px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 rounded">
                                                        SVC
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[9px] text-gray-500 mt-0.5">
                                                ${item.price.toFixed(2)} / unit
                                            </div>
                                        </div>
                                        <div className="font-bold text-gray-900 dark:text-white text-xs">
                                            $
                                            {(item.price * item.qty).toFixed(2)}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-lg p-0.5">
                                        <button
                                            onClick={() =>
                                                updateCartQty(
                                                    item.id,
                                                    item.qty - 1
                                                )
                                            }
                                            className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-white dark:hover:bg-gray-600 rounded-md active:scale-90 transition-all"
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
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
                                            className="w-10 text-center bg-transparent border-none p-0 text-[12px] font-bold text-gray-800 dark:text-white focus:ring-0"
                                        />
                                        <button
                                            onClick={() =>
                                                updateCartQty(
                                                    item.id,
                                                    item.qty + 1
                                                )
                                            }
                                            className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-green-500 hover:bg-white dark:hover:bg-gray-600 rounded-md active:scale-90 transition-all"
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Checkout Section - Fixed Bottom */}
                    <div className="border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
                        {/* Summary Calculations */}
                        <div className="space-y-1.5 mb-3">
                            <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/30 px-2 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                        Tax
                                    </label>
                                    <div className="flex items-center">
                                        <input
                                            type="number"
                                            value={taxRate}
                                            onChange={(e) =>
                                                setTaxRate(
                                                    parseFloat(e.target.value) || 0
                                                )
                                            }
                                            className="w-10 text-right p-0 border-none bg-transparent font-bold text-xs focus:ring-0 text-gray-700 dark:text-gray-200"
                                        />
                                        <span className="text-gray-400 text-[10px] ml-0.5 font-bold">%</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between bg-red-50/30 dark:bg-red-900/10 px-2 py-1.5 rounded-lg border border-red-100/50 dark:border-red-900/20">
                                    <label className="text-[9px] font-black text-red-400 uppercase tracking-widest">
                                        Disc
                                    </label>
                                    <div className="flex items-center shrink-0">
                                        <span className="text-red-400 text-[10px] mr-0.5 font-bold">$</span>
                                        <input
                                            type="number"
                                            value={discountAmount}
                                            onChange={(e) =>
                                                setDiscountAmount(
                                                    parseFloat(e.target.value) || 0
                                                )
                                            }
                                            className="w-12 text-right p-0 border-none bg-transparent font-bold text-xs focus:ring-0 text-red-600 dark:text-red-400"
                                        />
                                    </div>
                                </div>
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


                        {/* Complete Button */}
                        <button
                            onClick={handleCheckout}
                            disabled={cart.length === 0}
                            className="w-full bg-gradient-to-r from-orange-500 to-blue-600 hover:from-orange-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl shadow-xl shadow-orange-500/30 active:scale-[0.97] transition-all duration-300 flex items-center justify-center gap-3 border border-white/20"
                        >
                            <span className="text-sm tracking-tight">Complete Sale (${calculateTotal().toFixed(2)})</span>
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
            {/* Hold Order Reference Modal */}
            {showHoldModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full transform transition-all scale-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                                Hold Sale
                            </h3>
                            <button onClick={() => setShowHoldModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 font-sans">Enter a reference name to identify this bill later (e.g. Table 4, Customer Name).</p>
                        <input
                            type="text"
                            value={holdReference}
                            onChange={(e) => setHoldReference(e.target.value)}
                            placeholder="Enter Reference/Name..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all mb-6 font-sans outline-none"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && holdSale(holdReference)}
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowHoldModal(false)}
                                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-sans"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => holdSale(holdReference)}
                                className="flex-1 px-4 py-3 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-700 transition-all shadow-lg shadow-orange-200 dark:shadow-none font-sans"
                            >
                                Hold Now
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Pending Bills List Modal */}
            {showPendingListModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-2xl w-full transform transition-all scale-100 max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                    Pending Bills
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-sans mt-0.5">{parkedOrders.length} bills currently on hold</p>
                            </div>
                            <button onClick={() => setShowPendingListModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {parkedOrders.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-gray-300 dark:border-gray-600">
                                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                                    </div>
                                    <h4 className="text-gray-800 dark:text-gray-200 font-bold mb-1 font-sans">No pending bills</h4>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm font-sans">Any bills you put on hold will appear here.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {parkedOrders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map((order) => (
                                        <div key={order.id} className="group p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-orange-500 dark:hover:border-orange-500 transition-all">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-800 dark:text-white font-sans truncate max-w-[200px]">{order.reference}</span>
                                                    <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold">
                                                        {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {order.cart.length} Items
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400 font-sans">${order.total.toFixed(2)}</div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 mt-auto">
                                                <button
                                                    onClick={() => restoreOrder(order)}
                                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-600 text-white font-bold text-sm hover:bg-orange-700 transition-all shadow-md shadow-orange-100 dark:shadow-none"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" /></svg>
                                                    Restore Bill
                                                </button>
                                                <button
                                                    onClick={() => deleteParkedOrder(order.id)}
                                                    className="w-12 h-10 flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all"
                                                    title="Delete"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <button
                                onClick={() => setShowPendingListModal(false)}
                                className="w-full py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all font-sans"
                            >
                                Close List
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
