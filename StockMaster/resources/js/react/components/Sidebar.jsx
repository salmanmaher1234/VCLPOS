import React from 'react';
import Link from './Link';
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Users,
    UserCircle,
    Bell,
    Truck,
    BarChart3,
    Settings,
    LogOut,
    ChevronRight,
    Search,
    CreditCard,
    ArrowLeftRight,
    UserPlus,
    X
} from 'lucide-react';

export default function Sidebar({ activeItem = 'Dashboard', isOpen, setIsOpen }) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const navigation = [
        { name: 'Dashboard', icon: LayoutDashboard, href: '/react/dashboard' },
        {
            name: 'Inventory',
            items: [
                { name: 'Products', icon: Package, href: '/react/products' },
                { name: 'Purchases', icon: Truck, href: '/react/purchases' },
                { name: 'Purchase Returns', icon: ArrowLeftRight, href: '/react/purchase-returns' },
                { name: 'Adjustments', icon: Settings, href: '/react/adjustments' },
            ]
        },
        {
            name: 'Sales',
            items: [
                { name: 'POS System', icon: CreditCard, href: '/react/pos' },
                { name: 'Sales List', icon: ShoppingCart, href: '/react/sales' },
                { name: 'Sales Returns', icon: ArrowLeftRight, href: '/react/sales-returns' },
            ]
        },
        {
            name: 'People',
            items: [
                { name: 'Employees', icon: Users, href: '/react/employees' },
                { name: 'Customers', icon: UserCircle, href: '/react/customer-details' },
                { name: 'Suppliers', icon: Truck, href: '/react/suppliers' },
            ]
        },
        {
            name: 'Utility',
            items: [
                { name: 'Notifications', icon: Bell, href: '/react/notifications' },
                { name: 'Expenses', icon: BarChart3, href: '/react/expenses' },
            ]
        }
    ];

    const handleLogout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        window.location.href = '/react/login';
    };

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm md:hidden transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
                transform transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0
            `}>
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-800">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <Package className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-lg dark:text-white tracking-tight">StockMaster</span>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="md:hidden p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-8 custom-scrollbar">
                        {navigation.map((section, idx) => (
                            <div key={idx} className="space-y-1">
                                {section.items ? (
                                    <>
                                        <h3 className="px-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
                                            {section.name}
                                        </h3>
                                        <div className="space-y-1">
                                            {section.items.map((item) => (
                                                <NavItem
                                                    key={item.name}
                                                    item={item}
                                                    isActive={activeItem === item.name}
                                                />
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <NavItem
                                        item={section}
                                        isActive={activeItem === section.name}
                                    />
                                )}
                            </div>
                        ))}
                    </nav>

                    {/* Footer / User Profile */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                        <div className="flex items-center gap-3 mb-4 px-2">
                            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                                {user.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.name || 'User'}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email || 'Admin'}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}

function NavItem({ item, isActive }) {
    const Icon = item.icon;
    return (
        <Link
            href={item.href}
            className={`
                flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group
                ${isActive
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 shadow-sm shadow-blue-500/10'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                }
            `}
        >
            <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white'}`} />
            <span>{item.name}</span>
            {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
        </Link>
    );
}
