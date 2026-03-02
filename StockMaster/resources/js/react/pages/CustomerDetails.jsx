import React, { useState, useEffect } from 'react';
import { Search, Eye, Edit, Trash2 } from 'lucide-react';

export default function CustomerDetails() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        // Fetching all currently. If pagination is huge, you'd add sever side search
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const ts = Date.now(); // cache bust
            const response = await fetch(`/api/customers?per_page=1000&_ts=${ts}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                // Laravel paginate returns { data: [...] }, handle both forms
                const list = Array.isArray(data) ? data : (data.data ?? []);
                setCustomers(list);
            } else {
                console.error('Customers API error:', response.status, await response.text());
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this customer?')) return;

        const token = localStorage.getItem('auth_token');
        try {
            const response = await fetch(`/api/customers/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                // Add Notification
                if (window.addVclNotification) {
                    const custToDelete = customers.find(c => c.id === id);
                    window.addVclNotification({
                        type: 'customer',
                        title: 'Registry Purge',
                        message: `Personnel "${custToDelete?.name || id}" has been permanently removed from the records.`
                    });
                }
                fetchCustomers();
            }
        } catch (error) {
            console.error('Error deleting customer:', error);
        }
    };

    const handleViewProfile = (id) => {
        window.history.pushState({}, '', `/react/customers/${id}`);
        window.dispatchEvent(new Event('pushstate'));
    };

    const filteredCustomers = customers.filter(c => {
        const search = searchTerm.toLowerCase();
        return (c.name && c.name.toLowerCase().includes(search)) ||
            (c.phone && c.phone.toLowerCase().includes(search)) ||
            (c.email && c.email.toLowerCase().includes(search));
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <main className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-gray-800 p-8 lg:p-10 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="space-y-1">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Customer Directory</h2>
                    <p className="text-gray-500 font-medium text-sm">Manage your client base and loyalty records</p>
                </div>

                <div className="relative w-full md:w-1/3 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by name, phone or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-12 pr-6 py-3.5 bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-sm font-semibold transition-all dark:text-white"
                    />
                </div>
            </div>

            {/* Responsive List / Table Container */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
                            <tr>
                                <th className="px-8 py-5 text-xs font-bold uppercase text-gray-400 tracking-wider">Customer Info</th>
                                <th className="px-8 py-5 text-xs font-bold uppercase text-gray-400 tracking-wider">Contact Details</th>
                                <th className="px-8 py-5 text-xs font-bold uppercase text-gray-400 tracking-wider">Loyalty Tier</th>
                                <th className="px-8 py-5 text-xs font-bold uppercase text-gray-400 tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {filteredCustomers.map((customer) => (
                                <tr key={customer.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/40 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg">
                                                {customer.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-gray-900 dark:text-white truncate">{customer.name}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">ID: #CS-{customer.id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="space-y-1">
                                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{customer.phone}</p>
                                            <p className="text-xs text-gray-400 truncate">{customer.email || 'No email provided'}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${customer.total_spent > 1000 ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {customer.total_spent > 1000 ? 'VIP Member' : 'Regular'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex justify-end gap-3 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all">
                                            <button
                                                onClick={() => handleViewProfile(customer.id)}
                                                className="px-6 py-3 bg-gradient-to-r from-[#FF7d1f] to-[#2b59ff] text-white rounded-xl hover:opacity-90 transition-all text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-orange-500/20"
                                            >
                                                Intelligence Profile
                                            </button>
                                            <button
                                                onClick={() => handleDelete(customer.id)}
                                                className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View (Hidden on desktop) */}
                <div className="md:hidden divide-y divide-gray-50 dark:divide-gray-800">
                    {filteredCustomers.length > 0 ? (
                        filteredCustomers.map((customer) => (
                            <div key={customer.id} className="p-6 space-y-5 active:bg-gray-50 dark:active:bg-gray-900/50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-14 w-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20">
                                            {customer.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-gray-900 dark:text-white text-lg truncate">{customer.name}</h3>
                                            <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Customer ID: {customer.id}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(customer.id); }}
                                        className="p-2.5 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 gap-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-400 font-medium uppercase text-[10px] tracking-wider">Phone Number</span>
                                        <span className="font-bold text-gray-700 dark:text-gray-300">{customer.phone}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-400 font-medium uppercase text-[10px] tracking-wider">Email Address</span>
                                        <span className="font-bold text-gray-700 dark:text-gray-300 truncate max-w-[150px]">{customer.email || '—'}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleViewProfile(customer.id)}
                                    className="w-full py-4 bg-gradient-to-r from-[#FF7d1f] to-[#2b59ff] text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                >
                                    Open Intelligence Stream
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="p-20 text-center space-y-4">
                            <div className="inline-block p-6 bg-gray-50 rounded-full">
                                <Search className="w-10 h-10 text-gray-200" />
                            </div>
                            <p className="text-gray-400 font-black uppercase text-xs tracking-widest">No Intelligence Records Found</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
