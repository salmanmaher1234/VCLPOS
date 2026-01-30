import { useState } from "react";

export default function Employee() {
  // 🔹 Dummy data (temporary – backend will replace this)
  const [expenses, setExpenses] = useState([
    {
      id: 1,
      employee: "Ali Raza",
      department: "Sales",
      category: "Salary",
      date: "2026-01-27",
      amount: 500,
      status: "Paid",
      employeeId: "EMP-001",
      contact: "aliraza@company.com",
      avatarColor: "bg-blue-500",
    },
    {
      id: 2,
      employee: "Zeeshan",
      department: "Operations",
      category: "Travel",
      date: "2026-01-26",
      amount: 120,
      status: "Pending",
      employeeId: "EMP-002",
      contact: "zeeshan@company.com",
      avatarColor: "bg-green-500",
    },
    {
      id: 3,
      employee: "Sana Khan",
      department: "Marketing",
      category: "Advertising",
      date: "2026-01-25",
      amount: 350,
      status: "Paid",
      employeeId: "EMP-003",
      contact: "sana@company.com",
      avatarColor: "bg-purple-500",
    },
    {
      id: 4,
      employee: "Ahmed Hassan",
      department: "IT",
      category: "Software",
      date: "2026-01-24",
      amount: 800,
      status: "Processing",
      employeeId: "EMP-004",
      contact: "ahmed@company.com",
      avatarColor: "bg-orange-500",
    },
    {
      id: 5,
      employee: "Fatima Ali",
      department: "HR",
      category: "Training",
      date: "2026-01-23",
      amount: 250,
      status: "Pending",
      employeeId: "EMP-005",
      contact: "fatima@company.com",
      avatarColor: "bg-pink-500",
    },
    {
      id: 6,
      employee: "Bilal Ahmed",
      department: "Finance",
      category: "Bonus",
      date: "2026-01-22",
      amount: 1000,
      status: "Paid",
      employeeId: "EMP-006",
      contact: "bilal@company.com",
      avatarColor: "bg-teal-500",
    },
  ]);
  //       {/* Backend Integration Note */}
//    {`useEffect(() => {
//   fetch('/api/employee-expenses')
//     .then(res => res.json())
//     .then(data => setExpenses(data));
// }, []);`}
  // 🔹 Form state for adding new expense
  const [showAddForm, setShowAddForm] = useState(false);
  const [newExpense, setNewExpense] = useState({
    employee: "",
    department: "",
    category: "",
    date: new Date().toISOString().split("T")[0],
    amount: "",
    status: "Pending",
  });

  // 🔹 Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedDept, setSelectedDept] = useState("All Departments");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedStatus, setSelectedStatus] = useState("All Status");

  // 🔹 Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // 🔹 Calculate statistics
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const paidExpenses = expenses
    .filter((exp) => exp.status === "Paid")
    .reduce((sum, exp) => sum + exp.amount, 0);
  const pendingExpenses = expenses
    .filter((exp) => exp.status === "Pending")
    .reduce((sum, exp) => sum + exp.amount, 0);
  const totalEmployees = [...new Set(expenses.map((exp) => exp.employee))]
    .length;

  // 🔹 Filter expenses
  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch =
      expense.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept =
      selectedDept === "All Departments" || expense.department === selectedDept;
    const matchesCategory =
      selectedCategory === "All Categories" ||
      expense.category === selectedCategory;
    const matchesStatus =
      selectedStatus === "All Status" || expense.status === selectedStatus;
    const matchesDateFrom =
      !dateFrom || new Date(expense.date) >= new Date(dateFrom);
    const matchesDateTo = !dateTo || new Date(expense.date) <= new Date(dateTo);

    return (
      matchesSearch &&
      matchesDept &&
      matchesCategory &&
      matchesStatus &&
      matchesDateFrom &&
      matchesDateTo
    );
  });

  // 🔹 Pagination calculations
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedExpenses = filteredExpenses.slice(startIndex, endIndex);

  // 🔹 Handle adding new expense
  const handleAddExpense = () => {
    if (!newExpense.employee || !newExpense.amount || !newExpense.category) {
      alert("Please fill in all required fields");
      return;
    }

    const newExpenseObj = {
      id: expenses.length + 1,
      ...newExpense,
      amount: Number(newExpense.amount),
      employeeId: `EMP-${String(expenses.length + 1).padStart(3, "0")}`,
      avatarColor: [
        "bg-blue-500",
        "bg-green-500",
        "bg-purple-500",
        "bg-orange-500",
        "bg-pink-500",
        "bg-teal-500",
      ][expenses.length % 6],
    };

    setExpenses([newExpenseObj, ...expenses]);
    setNewExpense({
      employee: "",
      department: "",
      category: "",
      date: new Date().toISOString().split("T")[0],
      amount: "",
      status: "Pending",
    });
    setShowAddForm(false);
  };

  // 🔹 Handle deleting expense
  const handleDeleteExpense = (id) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      setExpenses(expenses.filter((exp) => exp.id !== id));
    }
  };

  // 🔹 Handle editing expense
  const handleEditExpense = (id) => {
    const expenseToEdit = expenses.find((exp) => exp.id === id);
    if (expenseToEdit) {
      setNewExpense({
        employee: expenseToEdit.employee,
        department: expenseToEdit.department,
        category: expenseToEdit.category,
        date: expenseToEdit.date,
        amount: expenseToEdit.amount,
        status: expenseToEdit.status,
      });
      setShowAddForm(true);
    }
  };

  // 🔹 Handle pagination
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // 🔹 Handle Export Report
  const handleExportReport = () => {
    // Create CSV content
    const headers = [
      "Employee",
      "Department",
      "Category",
      "Date",
      "Amount",
      "Status",
    ];
    const csvContent = [
      headers.join(","),
      ...filteredExpenses.map((exp) =>
        [
          exp.employee,
          exp.department,
          exp.category,
          exp.date,
          `$${exp.amount}`,
          exp.status,
        ].join(","),
      ),
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `employee_expenses_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    alert("Report exported successfully!");
  };

  // 🔹 Handle View Details
  const handleViewDetails = (expense) => {
    alert(
      `Employee Details:\n\n` +
        `Name: ${expense.employee}\n` +
        `ID: ${expense.employeeId}\n` +
        `Department: ${expense.department}\n` +
        `Category: ${expense.category}\n` +
        `Amount: $${expense.amount}\n` +
        `Date: ${expense.date}\n` +
        `Status: ${expense.status}\n` +
        `Contact: ${expense.contact}`,
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 lg:p-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Employee Expense Management
            </h1>
            <p className="text-gray-600 mt-2">
              Track, manage, and analyze employee expenses efficiently
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 font-medium"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            {showAddForm ? "Cancel Adding" : "Add New Expense"}
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Expenses Card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 transform hover:scale-[1.02] transition-transform duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                Total
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">
              Total Expenses
            </h3>
            <div className="flex items-baseline">
              <span className="text-2xl md:text-3xl font-bold text-gray-900">
                ${totalExpenses.toLocaleString()}
              </span>
              <span className="text-green-600 text-sm font-medium ml-2">
                +12.5%
              </span>
            </div>
          </div>

          {/* Paid Card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 transform hover:scale-[1.02] transition-transform duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <svg
                  className="w-6 h-6 text-green-600"
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
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-700">
                Paid
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">
              Amount Paid
            </h3>
            <div className="flex items-baseline">
              <span className="text-2xl md:text-3xl font-bold text-green-700">
                ${paidExpenses.toLocaleString()}
              </span>
              <span className="text-green-600 text-sm font-medium ml-2">
                +8.2%
              </span>
            </div>
          </div>

          {/* Pending Card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 transform hover:scale-[1.02] transition-transform duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 rounded-xl">
                <svg
                  className="w-6 h-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-yellow-100 text-yellow-700">
                Pending
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">
              Pending Amount
            </h3>
            <div className="flex items-baseline">
              <span className="text-2xl md:text-3xl font-bold text-yellow-700">
                ${pendingExpenses.toLocaleString()}
              </span>
              <span className="text-red-600 text-sm font-medium ml-2">
                -3.1%
              </span>
            </div>
          </div>

          {/* Employees Card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 transform hover:scale-[1.02] transition-transform duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-100 text-purple-700">
                Employees
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">
              Active Employees
            </h3>
            <div className="flex items-baseline">
              <span className="text-2xl md:text-3xl font-bold text-gray-900">
                {totalEmployees}
              </span>
              <span className="text-green-600 text-sm font-medium ml-2">
                +2
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Expense Form */}
      {showAddForm && (
        <div className="mb-8 bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {newExpense.employee ? "Edit Expense" : "Add New Expense"}
            </h2>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewExpense({
                  employee: "",
                  department: "",
                  category: "",
                  date: new Date().toISOString().split("T")[0],
                  amount: "",
                  status: "Pending",
                });
              }}
              className="text-gray-500 hover:text-gray-700"
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee Name *
              </label>
              <input
                type="text"
                value={newExpense.employee}
                onChange={(e) =>
                  setNewExpense({ ...newExpense, employee: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Enter employee name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department *
              </label>
              <select
                value={newExpense.department}
                onChange={(e) =>
                  setNewExpense({ ...newExpense, department: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              >
                <option value="">Select Department</option>
                <option value="Sales">Sales</option>
                <option value="Operations">Operations</option>
                <option value="Marketing">Marketing</option>
                <option value="IT">IT</option>
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={newExpense.category}
                onChange={(e) =>
                  setNewExpense({ ...newExpense, category: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              >
                <option value="">Select Category</option>
                <option value="Salary">Salary</option>
                <option value="Travel">Travel</option>
                <option value="Bonus">Bonus</option>
                <option value="Training">Training</option>
                <option value="Software">Software</option>
                <option value="Advertising">Advertising</option>
                <option value="Equipment">Equipment</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount ($) *
              </label>
              <input
                type="number"
                value={newExpense.amount}
                onChange={(e) =>
                  setNewExpense({ ...newExpense, amount: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Enter amount"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                value={newExpense.date}
                onChange={(e) =>
                  setNewExpense({ ...newExpense, date: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={newExpense.status}
                onChange={(e) =>
                  setNewExpense({ ...newExpense, status: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              >
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Processing">Processing</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-8">
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewExpense({
                  employee: "",
                  department: "",
                  category: "",
                  date: new Date().toISOString().split("T")[0],
                  amount: "",
                  status: "Pending",
                });
              }}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleAddExpense}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-md"
            >
              {newExpense.employee ? "Update Expense" : "Save Expense"}
            </button>
          </div>
        </div>
      )}

      {/* Filters Section */}
      <div className="mb-8 bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Filter Expenses
            </h2>
            <p className="text-gray-600 text-sm">
              Refine your search with filters
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setSearchTerm("");
                setDateFrom("");
                setDateTo("");
                setSelectedDept("All Departments");
                setSelectedCategory("All Categories");
                setSelectedStatus("All Status");
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm"
            >
              Clear Filters
            </button>
            <button
              onClick={handleExportReport}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
            >
              Export Report
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Employee
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name or ID"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department
            </label>
            <select
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            >
              <option>All Departments</option>
              <option>Sales</option>
              <option>Operations</option>
              <option>Marketing</option>
              <option>IT</option>
              <option>HR</option>
              <option>Finance</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            >
              <option>All Categories</option>
              <option>Salary</option>
              <option>Travel</option>
              <option>Bonus</option>
              <option>Training</option>
              <option>Software</option>
              <option>Advertising</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            >
              <option>All Status</option>
              <option>Paid</option>
              <option>Pending</option>
              <option>Processing</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>

          <div className="lg:col-span-2">
            <div className="flex items-end h-full">
              <div className="text-sm text-gray-500">
                Showing{" "}
                <span className="font-semibold">{filteredExpenses.length}</span>{" "}
                of <span className="font-semibold">{expenses.length}</span>{" "}
                expenses
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Expense Records
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div
                        className={`flex-shrink-0 h-10 w-10 rounded-full ${exp.avatarColor} flex items-center justify-center text-white font-semibold mr-3`}
                      >
                        {exp.employee.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {exp.employee}
                        </div>
                        <div className="text-sm text-gray-500">
                          {exp.employeeId}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full">
                      {exp.department}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{exp.category}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{exp.date}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-lg font-semibold text-gray-900">
                      ${exp.amount.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        exp.status === "Paid"
                          ? "bg-green-100 text-green-800"
                          : exp.status === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {exp.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleEditExpense(exp.id)}
                        className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition"
                        title="Edit"
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
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition"
                        title="Delete"
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleViewDetails(exp)}
                        className="text-gray-600 hover:text-gray-900 p-2 hover:bg-gray-100 rounded-lg transition"
                        title="View Details"
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
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredExpenses.length === 0 && (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <svg
                className="mx-auto h-16 w-16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No expenses found
            </h3>
            <p className="text-gray-500">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}

        {/* Pagination */}
        {filteredExpenses.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-sm text-gray-700">

                Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                <span className="font-medium">
                  {Math.min(endIndex, filteredExpenses.length)}
                </span>{" "}
                of{" "}
                <span className="font-medium">{filteredExpenses.length}</span>{" "}
                results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 border border-gray-300 rounded-lg text-sm transition ${
                    currentPage === 1
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Previous
                </button>

                {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-4 py-2 rounded-lg text-sm transition ${
                        currentPage === pageNum
                          ? "bg-blue-600 text-white"
                          : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                {totalPages > 3 && (
                  <span className="px-4 py-2 text-gray-500">...</span>
                )}

                {totalPages > 3 && (
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    className={`px-4 py-2 rounded-lg text-sm transition ${
                      currentPage === totalPages
                        ? "bg-blue-600 text-white"
                        : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {totalPages}
                  </button>
                )}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 border border-gray-300 rounded-lg text-sm transition ${
                    currentPage === totalPages
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

   
    </div>
  );
}
