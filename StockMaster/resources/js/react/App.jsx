import React from 'react';
// Manual routing setup for simplicity
// import { BrowserRouter, Routes, Route } from 'react-router-dom';
// I'll stick to a simple placeholder implementation that allows switching "pages" manually for now to avoid installing more deps without asking, OR just lay out the components.

// Let's create the components first, then assemble App.jsx properly.
// For now, I'll make App.jsx a simple container.

import Welcome from './pages/Welcome';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Returns from './pages/Returns';
import POS from './pages/POS';
import Adjustments from './pages/Adjustments';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import ProfilePage from './pages/ProfilePage';

import Sidebar from './components/Sidebar';
import Header from './components/Header';

export default function App() {
    const [path, setPath] = React.useState(window.location.pathname);
    const [sidebarOpen, setSidebarOpen] = React.useState(false); // Persistent Sidebar State

    React.useEffect(() => {
        const onLocationChange = () => {
            let p = window.location.pathname;
            if (p.startsWith('/react')) p = p.replace('/react', '');
            if (p === '') p = '/';
            setPath(p);
            // Close sidebar on mobile (small screens only) when navigating
            if (window.innerWidth < 768) setSidebarOpen(false);
        };

        window.addEventListener('popstate', onLocationChange);
        window.addEventListener('pushstate', onLocationChange);
        return () => {
            window.removeEventListener('popstate', onLocationChange);
            window.removeEventListener('pushstate', onLocationChange);
        };
    }, []);

    // Helper to extract clean path for internal logic
    const getCleanPath = () => {
        let p = path;
        if (p.startsWith('/react')) p = p.replace('/react', '');
        if (p === '') p = '/';
        return p;
    };

    const currentPath = getCleanPath();

    // Page Helper to determine Title and Sidebar Active Item
    const getPageDetails = (path) => {
        switch (path) {
            case '/dashboard': return { title: 'Dashboard', activeItem: 'Dashboard' };
            case '/products': return { title: 'Products', activeItem: 'Products' };
            case '/sales': return { title: 'Sales List', activeItem: 'Sales List' };
            case '/returns': return { title: 'Returns', activeItem: 'Returns' };
            case '/pos': return { title: 'POS System', activeItem: 'POS System' };
            case '/adjustments': return { title: 'Adjustments', activeItem: 'Adjustments' };
            case '/customers': return { title: 'Customers', activeItem: 'Customers' };
            case '/suppliers': return { title: 'Suppliers', activeItem: 'Suppliers' };
            case '/profile': return { title: 'Profile', activeItem: '' };
            default: return { title: 'StockMaster', activeItem: '' };rrr
        }
    };

    const { title, activeItem } = getPageDetails(currentPath);

    let Component;
    let isFullPage = false; // Pages that don't need Sidebar (Login, etc)

    switch (currentPath) {
        case '/dashboard': Component = Dashboard; break;
        case '/login': Component = Login; isFullPage = true; break;
        case '/register': Component = Register; isFullPage = true; break;
        case '/forgot-password': Component = ForgotPassword; isFullPage = true; break;
        case '/products': Component = Products; break;
        case '/sales': Component = Sales; break;
        case '/returns': Component = Returns; break;
        case '/pos': Component = POS; break;
        case '/adjustments': Component = Adjustments; break;
        case '/customers': Component = Customers; break;
        case '/suppliers': Component = Suppliers; break;
        case '/profile': Component = ProfilePage; break; // Use ProfilePage
        default: Component = Welcome; isFullPage = true;
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
            <div className="md:pl-64">
                <Header isOpen={sidebarOpen} setIsOpen={setSidebarOpen} title={title} />
                <Component />
            </div>
        </div>
    );
}
