import React, { useState } from 'react';
import { UserPlus, Save, ArrowLeft } from 'lucide-react';

export default function Customers() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: ''
    });
    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        const token = localStorage.getItem('auth_token');

        try {
            const response = await fetch('/api/customers', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                setSuccessMessage(data.message);

                // Add Notification
                if (window.addVclNotification) {
                    window.addVclNotification({
                        type: 'customer',
                        title: 'Registry Updated',
                        message: `Personnel "${formData.name}" has been successfully added to the directory.`
                    });
                }

                // Navigate to customer details page after a brief delay
                setTimeout(() => {
                    window.history.pushState({}, '', '/react/customer-details');
                    window.dispatchEvent(new Event('pushstate'));
                }, 1000);

            } else {
                setErrors(data.errors || {});
            }
        } catch (error) {
            console.error('Error saving customer:', error);
        }
    };

    const handleBack = () => {
        window.history.pushState({}, '', '/react/customer-details');
        window.dispatchEvent(new Event('pushstate'));
    };

    return (
        <main className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 gap-6">
                <div className="flex items-center gap-5">
                    <button
                        type="button"
                        onClick={handleBack}
                        className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-400 hover:text-blue-600 transition-all active:scale-95"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">New Customer</h2>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-0.5">Initialize personnel registration record</p>
                    </div>
                </div>
            </div>

            {successMessage && (
                <div className="p-4 bg-green-100 border-l-4 border-green-500 text-green-800 rounded-2xl shadow-sm font-bold animate-in slide-in-from-top-4">
                    {successMessage} Redirecting...
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden p-8 md:p-12">
                <form onSubmit={handleSubmit} className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Full Identity <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 rounded-xl font-semibold text-gray-700 dark:text-white transition-all outline-none"
                                placeholder="e.g. Michael Chen"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Primary Contact <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                required
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 rounded-xl font-semibold text-gray-700 dark:text-white transition-all outline-none"
                                placeholder="Phone number"
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Communications (Email)</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 rounded-xl font-semibold text-gray-700 dark:text-white transition-all outline-none"
                                placeholder="Email address"
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Physical/Billing Address</label>
                            <input
                                type="text"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 rounded-xl font-semibold text-gray-700 dark:text-white transition-all outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Urban Center / City</label>
                            <input
                                type="text"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 rounded-xl font-semibold text-gray-700 dark:text-white transition-all outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Jurisdiction / Country</label>
                            <input
                                type="text"
                                value={formData.country}
                                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 rounded-xl font-semibold text-gray-700 dark:text-white transition-all outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Market Classification</label>
                            <select
                                value={formData.type || 'B2C'}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 rounded-xl font-bold text-xs uppercase cursor-pointer dark:text-white"
                            >
                                <option value="B2C">Individual (B2C)</option>
                                <option value="B2B">Corporate (B2B)</option>
                                <option value="VIP">Executive/VIP</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Credit Limit Authorization</label>
                            <input
                                type="number"
                                value={formData.credit_limit || ''}
                                onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                                className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 rounded-xl font-semibold text-gray-700 dark:text-white transition-all outline-none"
                                placeholder="Max credit allowed"
                            />
                        </div>
                    </div>

                    <div className="pt-8 flex justify-end">
                        <button
                            type="submit"
                            className="flex items-center gap-3 bg-gradient-to-r from-[#FF7d1f] to-[#2b59ff] text-white px-12 py-5 rounded-2xl shadow-xl shadow-orange-500/20 hover:opacity-90 transition-all font-bold uppercase tracking-widest text-[11px] active:scale-95"
                        >
                            <Save className="w-5 h-5" />
                            Commit Registration
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}
