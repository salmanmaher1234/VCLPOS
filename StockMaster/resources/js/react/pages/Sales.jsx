import React, { useState } from "react";
import "./Sales.css";

const salesData = [
    {
        id: 1,
        productName: "Apple iPhone 15",
        quantity: 2,
        price: 1200,
        total: 2400,
        date: "2025-12-20",
        status: "Completed",
    },
    {
        id: 2,
        productName: "Samsung Galaxy S24",
        quantity: 1,
        price: 1000,
        total: 1000,
        date: "2025-12-22",
        status: "Completed",
    },
    {
        id: 3,
        productName: "Wireless Mouse",
        quantity: 5,
        price: 20,
        total: 100,
        date: "2025-12-25",
        status: "Pending",
    },
    {
        id: 4,
        productName: "MacBook Pro M3",
        quantity: 1,
        price: 2000,
        total: 2000,
        date: "2025-12-28",
        status: "Completed",
    },
];

export default function Sales() {
    const [showModal, setShowModal] = useState(false);
    const [selectedSale, setSelectedSale] = useState(null);
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [displaySales, setDisplaySales] = useState(salesData);

    // --- Modal Logic ---
    const handleViewDetails = (sale) => {
        setSelectedSale(sale);
        setShowModal(true);
    };

    // --- Latest Sale Logic (Finds the newest item in the array) ---
    const handleLatestSale = () => {
        if (salesData.length === 0) return;
        const latest = salesData[salesData.length - 1];
        handleViewDetails(latest);
    };

    // --- Filter Logic (Triggered only on button click) ---
    const handleApplyFilter = () => {
        if (!fromDate && !toDate) {
            setDisplaySales(salesData);
            return;
        }
        const filtered = salesData.filter((sale) => {
            const saleDate = new Date(sale.date).getTime();
            const start = fromDate ? new Date(fromDate).getTime() : -Infinity;
            const end = toDate ? new Date(toDate).getTime() : Infinity;
            return saleDate >= start && saleDate <= end;
        });
        setDisplaySales(filtered);
    };

    const handleReset = () => {
        setFromDate("");
        setToDate("");
        setDisplaySales(salesData);
    };

    // --- Metrics Calculation ---
    const totalRevenue = displaySales.reduce(
        (acc, curr) => acc + curr.total,
        0
    );

    return (
        <div className="dashboard-wrapper">
            {/* TOP METRICS */}
            <section className="metrics-grid">
                <div className="metric-card">
                    <span className="metric-label">Total Revenue</span>
                    <h2 className="metric-value">
                        ${totalRevenue.toLocaleString()}
                    </h2>
                    <span className="metric-trend up">+12.5%</span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">Transactions</span>
                    <h2 className="metric-value">{displaySales.length}</h2>
                    <span className="metric-trend">Result of filters</span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">Avg. Order Value</span>
                    <h2 className="metric-value">
                        $
                        {displaySales.length
                            ? (totalRevenue / displaySales.length).toFixed(0)
                            : 0}
                    </h2>
                </div>
            </section>

            <div className="main-layout">
                {/* SIDEBAR FILTER */}
                <aside className="filter-sidebar">
                    <h3 className="sidebar-title">Search Filters</h3>
                    <div className="filter-group">
                        <label>From Date</label>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                        />
                    </div>
                    <div className="filter-group">
                        <label>To Date</label>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                        />
                    </div>
                    <button className="apply-btn" onClick={handleApplyFilter}>
                        Apply Filter
                    </button>
                    <button className="clear-link" onClick={handleReset}>
                        Reset All
                    </button>
                </aside>

                {/* CONTENT LIST */}
                <main className="content-area">
                    <div className="content-header">
                        <h1 className="sales-title">Transactions</h1>
                        <button
                            className="top-right-btn"
                            onClick={handleLatestSale}
                        >
                            Latest Sale
                        </button>
                    </div>

                    <div className="sales-list">
                        {displaySales.length > 0 ? (
                            displaySales.map((sale) => (
                                <div
                                    key={sale.id}
                                    className="sale-row-card"
                                    onClick={() => handleViewDetails(sale)}
                                >
                                    <div className="sale-main-info">
                                        <div className="sale-icon">
                                            {sale.productName.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="product-name">
                                                {sale.productName}
                                            </h4>
                                            <span className="sale-date">
                                                {sale.date}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="sale-stats">
                                        <div className="stat-item">
                                            <span className="stat-label">
                                                Qty
                                            </span>
                                            <span className="stat-value">
                                                {sale.quantity}
                                            </span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-label">
                                                Total
                                            </span>
                                            <span className="stat-value total">
                                                ${sale.total}
                                            </span>
                                        </div>
                                        <div
                                            className={`status-pill ${sale.status.toLowerCase()}`}
                                        >
                                            {sale.status}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-results">
                                <p>
                                    No transactions found for the selected
                                    period.
                                </p>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* CENTERED POPUP MODAL */}
            {showModal && selectedSale && (
                <div
                    className="modal-overlay"
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="modal-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <h2>Transaction Details</h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="close-x"
                            >
                                &times;
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="modal-row">
                                <span>Transaction ID</span>
                                <strong>#00{selectedSale.id}</strong>
                            </div>
                            <div className="modal-row">
                                <span>Product</span>
                                <strong>{selectedSale.productName}</strong>
                            </div>
                            <div className="modal-row">
                                <span>Date</span>
                                <strong>{selectedSale.date}</strong>
                            </div>
                            <div className="modal-row">
                                <span>Unit Price</span>
                                <strong>${selectedSale.price}</strong>
                            </div>
                            <div className="modal-row">
                                <span>Quantity</span>
                                <strong>{selectedSale.quantity}</strong>
                            </div>
                            <div className="modal-row">
                                <span>Status</span>
                                <strong
                                    style={{
                                        color:
                                            selectedSale.status === "Completed"
                                                ? "#10b981"
                                                : "#f59e0b",
                                    }}
                                >
                                    {selectedSale.status}
                                </strong>
                            </div>
                            <hr className="modal-divider" />
                            <div className="modal-row total">
                                <span>Total Amount</span>
                                <strong className="total-price">
                                    ${selectedSale.total}
                                </strong>
                            </div>
                        </div>
                        <button
                            className="apply-btn modal-close-btn"
                            onClick={() => setShowModal(false)}
                        >
                            Close Details
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
