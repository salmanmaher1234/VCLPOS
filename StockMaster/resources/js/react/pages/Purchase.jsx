import React, { useState } from "react";

const Icons = {
    Plus: () => (
        <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
    ),
    Eye: () => (
        <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path strokeWidth={2} d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
        </svg>
    ),
    Trash: () => (
        <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path strokeWidth={2} d="M6 7h12M9 7V4h6v3m-8 0l1 13h8l1-13" />
        </svg>
    ),
    X: () => (
        <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    ),
    Search: () => (
        <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    ),
};


const Purchase = () => {
    const [activeTab, setActiveTab] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showAddModal, setShowAddModal] = useState(false);
    const [viewReturn, setViewReturn] = useState(null);

    const [returns, setReturns] = useState([
        {
            id: 1,
            productImage:
                "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=100&q=80",
            productName: "Smart Watch Series 7",
            date: "24 Dec 2024",
            supplier: "Electro Mart",
            reference: "PT001",
            status: "Received",
            total: 1000,
            paid: 1000,
            due: 0,
            payment: "Paid",
        },
        {
            id: 2,
            productImage:
                "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=100&q=80",
            productName: "Wireless Headphones",
            date: "10 Dec 2024",
            supplier: "Quantum Gadgets",
            reference: "PT002",
            status: "Pending",
            total: 1500,
            paid: 0,
            due: 1500,
            payment: "Unpaid",
        },
        {
            id: 3,
            productImage:
                "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=100&q=80",
            productName: "Polaroid Camera",
            date: "27 Nov 2024",
            supplier: "Prime Bazaar",
            reference: "PT003",
            status: "Received",
            total: 1500,
            paid: 1500,
            due: 0,
            payment: "Paid",
        },
    ]);

    const [newSupplier, setNewSupplier] = useState("");
    const [selectedProducts, setSelectedProducts] = useState([]);

    const mockProducts = [
        { id: 1, name: "Keyboard", price: 500 },
        { id: 2, name: "Mouse", price: 300 },
        { id: 3, name: "Monitor", price: 2000 },
    ];

    const totalAmount = selectedProducts.reduce((sum, p) => sum + p.price, 0);


    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to delete this return?")) {
            setReturns(returns.filter((item) => item.id !== id));
        }
    };

    const handleAddReturn = () => {
        if (!newSupplier || selectedProducts.length === 0) return;

        const newReturn = {
            id: Date.now(),
            productImage:
                selectedProducts[0].image ||
                "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=100&q=80",
            productName: `${selectedProducts.length} Products`,
            date: new Date().toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }),
            supplier: newSupplier,
            reference: `PT${Math.floor(Math.random() * 1000)}`,
            status: "Pending",
            total: totalAmount,
            paid: 0,
            due: totalAmount,
            payment: "Unpaid",
        };
        setReturns([newReturn, ...returns]);
        setNewSupplier("");
        setSelectedProducts([]);
        setShowAddModal(false);
    };

    const filteredData = returns.filter((item) => {
        if (activeTab === "received" && item.status !== "Received") return false;
        if (activeTab === "pending" && item.status !== "Pending") return false;
        if (
            statusFilter !== "all" &&
            item.status.toLowerCase() !== statusFilter.toLowerCase()
        )
            return false;
        return true;
    });

    const formatCurrency = (val) =>
        new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(val);

    /* ===========================
       JSX
    =========================== */
    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Purchase Returns</h1>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-xl"
                >
                    <Icons.Plus />
                    <span>Add Return</span>
                </button>
            </div>

            {/* Tabs */}
            <div className="flex space-x-2 mb-4">
                {["all", "received", "pending"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-lg ${activeTab === tab ? "bg-indigo-600 text-white" : "bg-gray-200"
                            }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="ml-auto border rounded-lg px-2 py-1"
                >
                    <option value="all">All Status</option>
                    <option value="received">Received</option>
                    <option value="pending">Pending</option>
                </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto bg-white rounded-xl shadow border">
                <table className="w-full text-left">
                    <thead className="bg-gray-100">
                        <tr>
                            {[
                                "Product",
                                "Date",
                                "Supplier",
                                "Reference",
                                "Status",
                                "Total",
                                "Due",
                                "Payment",
                                "Actions",
                            ].map((header) => (
                                <th
                                    key={header}
                                    className="px-4 py-2 text-sm font-medium text-gray-600"
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.length > 0 ? (
                            filteredData.map((item) => (
                                <tr key={item.id} className="border-b hover:bg-gray-50">
                                    <td className="px-4 py-2 flex items-center space-x-2">
                                        <img
                                            src={item.productImage}
                                            alt={item.productName}
                                            className="w-10 h-10 object-cover rounded-lg"
                                        />
                                        <span>{item.productName}</span>
                                    </td>
                                    <td className="px-4 py-2">{item.date}</td>
                                    <td className="px-4 py-2">{item.supplier}</td>
                                    <td className="px-4 py-2">{item.reference}</td>
                                    <td className="px-4 py-2">{item.status}</td>
                                    <td className="px-4 py-2">{formatCurrency(item.total)}</td>
                                    <td className="px-4 py-2">
                                        {item.due > 0 ? formatCurrency(item.due) : "-"}
                                    </td>
                                    <td className="px-4 py-2">{item.payment}</td>
                                    <td className="px-4 py-2 flex space-x-2">
                                        <button onClick={() => setViewReturn(item)}>
                                            <Icons.Eye />
                                        </button>
                                        <button onClick={() => handleDelete(item.id)}>
                                            <Icons.Trash />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan="9"
                                    className="px-4 py-10 text-center text-gray-400"
                                >
                                    No returns found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Return Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg">
                        <h3 className="font-bold text-lg mb-4">New Purchase Return</h3>
                        <input
                            type="text"
                            placeholder="Supplier Name"
                            className="w-full border rounded-lg px-3 py-2 mb-4"
                            value={newSupplier}
                            onChange={(e) => setNewSupplier(e.target.value)}
                        />
                        <div className="space-y-2 mb-4">
                            {mockProducts.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => setSelectedProducts([...selectedProducts, p])}
                                    className="w-full text-left px-4 py-2 rounded-lg border hover:bg-indigo-50"
                                >
                                    {p.name} - ${p.price}
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Total: {formatCurrency(totalAmount)}</span>
                            <div className="space-x-2">
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 border rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddReturn}
                                    disabled={!newSupplier || selectedProducts.length === 0}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50"
                                >
                                    Create
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* View Return Modal */}
            {viewReturn && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <div className="flex justify-between mb-4">
                            <h3 className="font-bold text-lg">Return Details</h3>
                            <button onClick={() => setViewReturn(null)}>
                                <Icons.X />
                            </button>
                        </div>
                        <div className="flex items-center space-x-3 mb-3">
                            <img
                                src={viewReturn.productImage}
                                alt={viewReturn.productName}
                                className="w-12 h-12 rounded-lg object-cover"
                            />
                            <span className="font-medium">{viewReturn.productName}</span>
                        </div>
                        <div className="space-y-2 text-sm">
                            <p>
                                <b>Supplier:</b> {viewReturn.supplier}
                            </p>
                            <p>
                                <b>Status:</b> {viewReturn.status}
                            </p>
                            <p>
                                <b>Total:</b> {formatCurrency(viewReturn.total)}
                            </p>
                            <p>
                                <b>Paid:</b> {formatCurrency(viewReturn.paid)}
                            </p>
                            <p>
                                <b>Due:</b> {formatCurrency(viewReturn.due)}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Purchase;
