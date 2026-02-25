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
        <main className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tight">Customer Directory</h2>

                <div className="relative w-full sm:w-1/2 md:w-1/3">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by name, phone, or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-2xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-medium transition-all"
                    />
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50/80">
                            <tr>
                                <th className="p-5 text-xs font-black uppercase text-gray-500 tracking-wider">Name</th>
                                <th className="p-5 text-xs font-black uppercase text-gray-500 tracking-wider">Phone</th>
                                <th className="p-5 text-xs font-black uppercase text-gray-500 tracking-wider">Email</th>
                                <th className="p-5 text-xs font-black uppercase text-gray-500 tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredCustomers.length > 0 ? (
                                filteredCustomers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="p-5">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold mr-4">
                                                    {customer.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-bold text-gray-800">{customer.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-5 font-semibold text-gray-600 border-l border-gray-100">{customer.phone}</td>
                                        <td className="p-5 font-semibold text-gray-600 border-l border-gray-100">{customer.email || '—'}</td>
                                        <td className="p-5 border-l border-gray-100">
                                            <div className="flex justify-end gap-3">
                                                <button
                                                    onClick={() => handleViewProfile(customer.id)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all text-xs font-black uppercase tracking-wider"
                                                >
                                                    <Eye className="w-4 h-4" /> Profile
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(customer.id)}
                                                    className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all text-xs font-black uppercase tracking-wider opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-4 h-4" /> Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="p-16 text-center text-gray-400 font-bold uppercase tracking-widest text-sm">
                                        No customers found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
}
