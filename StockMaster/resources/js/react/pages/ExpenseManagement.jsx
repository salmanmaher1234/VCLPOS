import React, { useState, useEffect, useRef } from "react";

const ExpenseManagement = () => {
    const [dark, setDark] = useState(false);
    const [expenses, setExpenses] = useState([
        { id: 1, title: "Electric Bill", amount: 5000, category: "Utilities", date: "2026-01-25" },
        { id: 2, title: "Office Rent", amount: 20000, category: "Rent", date: "2026-01-26" },
        { id: 3, title: "Lunch", amount: 1200, category: "Food", date: "2026-01-26" },
    ]);

    const [form, setForm] = useState({ title: "", amount: "", category: "", date: "" });
    const [editing, setEditing] = useState(null);
    const [filterText, setFilterText] = useState("");
    const [filterDate, setFilterDate] = useState("");
    const canvasRef = useRef(null);

    const filteredExpenses = expenses.filter(
        e =>
            e.title.toLowerCase().includes(filterText.toLowerCase()) &&
            (filterDate ? e.date === filterDate : true)
    );

    const totalExpense = filteredExpenses.reduce((s, e) => s + e.amount, 0);

    const categoryTotals = {};
    filteredExpenses.forEach(e => (categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount));
    const categories = Object.keys(categoryTotals);
    const amounts = Object.values(categoryTotals);
    const colors = ["#f43f5e", "#22c55e", "#2563eb", "#f59e0b", "#8b5cf6"];

    /* ------------------- PIE CHART WITH NAMES ------------------- */
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 80;

        let startAngle = -0.5 * Math.PI;

        categories.forEach((cat, i) => {
            const sliceAngle = (amounts[i] / totalExpense) * 2 * Math.PI;

            // Gradient for slice
            const grad = ctx.createLinearGradient(centerX, centerY - radius, centerX, centerY + radius);
            grad.addColorStop(0, colors[i % colors.length]);
            grad.addColorStop(1, "#ffffff88");

            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
            ctx.closePath();
            ctx.fillStyle = colors[i % colors.length];
            ctx.fill();

            // Draw slice name in the middle of slice
            const midAngle = startAngle + sliceAngle / 2;
            const labelX = centerX + Math.cos(midAngle) * (radius + 20);
            const labelY = centerY + Math.sin(midAngle) * (radius + 20);

            ctx.fillStyle = dark ? "#e5e7eb" : "#111";
            ctx.font = "12px Inter";
            ctx.textAlign = midAngle > Math.PI / 2 && midAngle < (3 * Math.PI) / 2 ? "right" : "left";
            ctx.fillText(`${cat} (${amounts[i]})`, labelX, labelY);

            startAngle += sliceAngle;
        });
    }, [filteredExpenses, dark]);

    /* ------------------- HANDLERS ------------------- */
    const saveExpense = () => {
        if (!form.title || !form.amount || !form.category || !form.date) return;
        if (editing) {
            setExpenses(expenses.map(e => (e.id === editing ? { ...form, id: editing, amount: +form.amount } : e)));
            setEditing(null);
        } else {
            setExpenses([...expenses, { ...form, id: Date.now(), amount: +form.amount }]);
        }
        setForm({ title: "", amount: "", category: "", date: "" });
    };

    const editExpense = e => {
        setEditing(e.id);
        setForm(e);
    };
    const deleteExpense = id => setExpenses(expenses.filter(e => e.id !== id));

    return (
        <div className={dark ? "app dark" : "app"}>
            <style>{`
        .app { font-family: 'Inter', sans-serif; min-height:100vh; padding:24px; background:#f4f6f8; transition:background 0.3s; }
        .dark { background:#0f172a; color:#e5e7eb; }
        h1,h2,h3,h4{margin:0;}
        button{padding:10px 14px;border:none;border-radius:10px;cursor:pointer;transition:0.3s;}
        input,select{padding:10px;border-radius:8px;border:1px solid #cbd5e1;}
        .container{max-width:1200px;margin:auto;}
        .header{display:flex;justify-content:space-between;margin-bottom:30px;align-items:center;}
        .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:20px;margin-bottom:32px;}
        .card{border-radius:16px;padding:20px;box-shadow:0 10px 25px rgba(0,0,0,.08);position:relative;color:#fff;transition:transform 0.2s;}
        .card:hover{transform:translateY(-5px);}
        .card.total{background:linear-gradient(135deg,#4f46e5,#3b82f6);}
        .card.transactions{background:linear-gradient(135deg,#f43f5e,#ec4899);}
        .card.status{background:linear-gradient(135deg,#16a34a,#22c55e);}
        .box{background:${dark ? "#020617" : "#fff"};border-radius:16px;padding:20px;margin-bottom:24px;box-shadow:0 10px 20px rgba(0,0,0,0.08);transition:background 0.3s;}
        table{width:100%;border-collapse:collapse;margin-top:12px;}
        th,td{padding:12px;border-bottom:1px solid #e5e7eb;}
        .dark th,.dark td{border-color:#334155;}
        .actions button{margin-right:6px;border-radius:6px;}
        canvas{display:block;margin-top:16px;}
        .legend { display:flex; flex-wrap:wrap; margin-top:16px; gap:12px; }
        .legend-item { display:flex; align-items:center; gap:6px; font-size:13px; }
        .color-box { width:12px; height:12px; border-radius:3px; }
      `}</style>

            <div className="container">
                {/* Header */}
                <div className="header">
                    <h1>Expense Dashboard</h1>
                    <button onClick={() => setDark(!dark)}>{dark ? "☀ Light" : "🌙 Dark"}</button>
                </div>

                {/* KPI Cards */}
                <div className="cards">
                    <div className="card total">
                        <h4>Total Expense</h4>
                        <h2>Rs {totalExpense}</h2>
                    </div>
                    <div className="card transactions">
                        <h4>Transactions</h4>
                        <h2>{filteredExpenses.length}</h2>
                    </div>
                    <div className="card status">
                        <h4>Status</h4>
                        <h2>Realtime</h2>
                    </div>
                </div>

                {/* Pie Chart with Legend */}
                <div className="box">
                    <h3>Expenses by Category</h3>
                    <canvas ref={canvasRef} width="300" height="200"></canvas>
                    <div className="legend">
                        {categories.map((cat, i) => (
                            <div key={cat} className="legend-item">
                                <div className="color-box" style={{ background: colors[i % colors.length] }}></div>
                                <span>{cat} ({categoryTotals[cat]})</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Filters */}
                <div className="box" style={{ display: "flex", gap: "12px" }}>
                    <input placeholder="Search by name" onChange={e => setFilterText(e.target.value)} />
                    <input type="date" onChange={e => setFilterDate(e.target.value)} />
                </div>

                {/* Add/Edit Expense */}
                <div className="box">
                    <h3>{editing ? "Edit Expense" : "Add Expense"}</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "12px" }}>
                        <input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                        <input type="number" placeholder="Amount" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                        <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                            <option value="">Category</option>
                            <option>Rent</option>
                            <option>Utilities</option>
                            <option>Food</option>
                        </select>
                        <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                    </div>
                    <button style={{ marginTop: "12px", background: "#2563eb", color: "#fff" }} onClick={saveExpense}>
                        {editing ? "Update" : "Add"}
                    </button>
                </div>

                {/* Expense Table */}
                <div className="box">
                    <h3>Expense List</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Category</th>
                                <th>Amount</th>
                                <th>Date</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredExpenses.map(e => (
                                <tr key={e.id}>
                                    <td>{e.title}</td>
                                    <td>{e.category}</td>
                                    <td style={{ color: "#ef4444" }}>Rs {e.amount}</td>
                                    <td>{e.date}</td>
                                    <td className="actions">
                                        <button onClick={() => editExpense(e)}>✏</button>
                                        <button onClick={() => deleteExpense(e.id)}>🗑</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
};

export default ExpenseManagement;
