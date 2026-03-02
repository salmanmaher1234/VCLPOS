import React from "react";
// Manual routing setup for simplicity
// import { BrowserRouter, Routes, Route } from 'react-router-dom';
// I'll stick to a simple placeholder implementation that allows switching "pages" manually for now to avoid installing more deps without asking, OR just lay out the components.

// Let's create the components first, then assemble App.jsx properly.
// For now, I'll make App.jsx a simple container.

import Welcome from "./pages/Welcome";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Notifications from "./pages/Notifications";
import Products from "./pages/Products";
import SalesList from "./pages/Sales";
import SalesReturns from "./pages/SalesReturns"; // Renamed from Returns
import POS from "./pages/POS";
import Adjustments from "./pages/Adjustments";
import Customers from "./pages/Customers";
import Suppliers from "./pages/Suppliers";
import ProfilePage from "./pages/ProfilePage";
import PurchaseReturns from "./pages/PurchaseReturns";
import Purchases from "./pages/Purchases"; // NEW
import Expenses from "./pages/Expenses";
import Employees from "./pages/Employees";
import EmployeeShow from "./pages/EmployeeShow";
import CustomerDetails from "./pages/CustomerDetails";
import CustomerShow from "./pages/CustomerShow";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";


// Global Notification Helper (Final Robust version)
window.addVclNotification = (notification) => {
    try {
        const saved = JSON.parse(localStorage.getItem('vcl_notifications') || '[]');
        const now = new Date();
        const newNotification = {
            id: Date.now(),
            timestamp: now.toISOString(), // Standard timestamp for sorting/filtering
            time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: now.toISOString().split('T')[0],
            read: false,
            ...notification
        };
        const updated = [newNotification, ...saved].slice(0, 100);
        localStorage.setItem('vcl_notifications', JSON.stringify(updated));

        console.warn("🔔 SYSTEM NOTIFICATION:", newNotification.title, newNotification.message);

        // Dispatch both standard and detail events for maximum compatibility
        window.dispatchEvent(new Event('vcl-notification-added'));
        window.dispatchEvent(new CustomEvent('vcl-notification-event', { detail: newNotification }));
    } catch (e) {
        console.error("❌ Notification Engine Error:", e);
    }
};

export default function App() {
    const [path, setPath] = React.useState(window.location.pathname);
    const [sidebarOpen, setSidebarOpen] = React.useState(false); // Persistent Sidebar State

    React.useEffect(() => {
        const onLocationChange = () => {
            let p = window.location.pathname;
            if (p.startsWith("/react")) p = p.replace("/react", "");
            if (p === "") p = "/";
            setPath(p);
            // Close sidebar on mobile (small screens only) when navigating
            if (window.innerWidth < 768) setSidebarOpen(false);
        };

        window.addEventListener("popstate", onLocationChange);
        window.addEventListener("pushstate", onLocationChange);
        return () => {
            window.removeEventListener("popstate", onLocationChange);
            window.removeEventListener("pushstate", onLocationChange);
        };
    }, []);

    // Helper to extract clean path for internal logic
    const getCleanPath = () => {
        let p = path;
        if (p.startsWith("/react")) p = p.replace("/react", "");
        if (p === "") p = "/";
        return p;
    };

    const currentPath = getCleanPath();

    // Page Helper to determine Title and Sidebar Active Item
    const getPageDetails = (path) => {
        switch (path) {

            case "/dashboard":
                return { title: "Dashboard", activeItem: "Dashboard" };
            case "/products":
                return { title: "Products", activeItem: "Products" };
            case "/sales":
                return { title: "Sales List", activeItem: "Sales List" };
            case "/sales-returns": // Renamed route
                return { title: "Sales Returns", activeItem: "Sales Returns" };
            case "/purchase-returns":
                return { title: "Purchase Returns", activeItem: "Purchase Returns" };
            case "/purchases":
                return { title: "Purchase Orders", activeItem: "Purchases" };
            case "/expenses":
                return { title: "Expenses", activeItem: "Expenses" };
            case "/pos":
                return { title: "POS System", activeItem: "POS System" };
            case "/adjustments":
                return { title: "Adjustments", activeItem: "Adjustments" };
            case "/customers":
                return { title: "Add Customer", activeItem: "Customers" };
            case "/customer-details":
                return { title: "Customer Details", activeItem: "Customer Details" };
            case (path.match(/\/customers\/\d+/) || {}).input:
                return { title: "Customer Profile", activeItem: "Customer Details" };
            case "/suppliers":
                return { title: "Suppliers", activeItem: "Suppliers" };
            case "/employees":
                return { title: "Employees", activeItem: "Employees" };
            case (path.match(/\/employees\/\d+/) || {}).input:
                return { title: "Staff Profile", activeItem: "Employees" };
            case "/profile":
                return { title: "Profile", activeItem: "" };
            default:
                return { title: "StockMaster", activeItem: "" };
        }
    };

    const { title, activeItem } = getPageDetails(currentPath);

    let Component;
    let isFullPage = false; // Pages that don't need Sidebar (Login, etc)

    switch (currentPath) {
        case "/dashboard":
            Component = Dashboard;
            break;
        case "/login":
            Component = Login;
            isFullPage = true;
            break;
        case "/register":
            Component = Register;
            isFullPage = true;
            break;
        case "/forgot-password":
            Component = ForgotPassword;
            isFullPage = true;
            break;
        case "/products":
            Component = Products;
            break;
        case "/sales":
            Component = SalesList;
            break;
        case "/sales-returns":
            Component = SalesReturns;
            break;
        case "/purchase-returns":
            Component = PurchaseReturns;
            break;
        case "/purchases":
            Component = Purchases;
            break;
        case "/expenses":
            Component = Expenses;
            break;
        case "/pos":
            Component = POS;
            break;
        case "/adjustments":
            Component = Adjustments;
            break;
        case "/customers":
            Component = Customers;
            break;
        case "/customer-details":
            Component = CustomerDetails;
            break;
        case "/notifications":
            Component = Notifications;
            break;
        case (currentPath.match(/\/customers\/\d+/) || {}).input:
            Component = CustomerShow;
            break;
        case "/suppliers":
            Component = Suppliers;
            break;
        case "/employees":
            Component = Employees;
            break;
        case (currentPath.match(/\/employees\/\d+/) || {}).input:
            Component = EmployeeShow;
            break;
        case "/profile":
            Component = ProfilePage;
            break; // Use ProfilePage
        default:
            Component = Welcome;
            isFullPage = true;
    }

    if (isFullPage) {
        return (
            <div className="react-app-container">
                <Component />
            </div>
        );
    }

    // Authenticated Layout
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <Sidebar activeItem={activeItem} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
            <div className="md:pl-60">
                <Header isOpen={sidebarOpen} setIsOpen={setSidebarOpen} title={title} />
                <Component />
            </div>
        </div>
    );
}
