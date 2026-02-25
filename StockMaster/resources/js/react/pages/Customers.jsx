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
        <main className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in">
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={handleBack}
                        className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-indigo-600 transition-all font-black"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="text-3xl font-black uppercase text-gray-800 tracking-tight flex items-center gap-3">
                            <UserPlus className="w-8 h-8 text-indigo-500" />
                            Add Customer
                        </h2>
                    </div>
                </div>
            </div>

            {successMessage && (
                <div className="p-4 bg-green-100 border-l-4 border-green-500 text-green-800 rounded-2xl shadow-sm font-bold animate-in slide-in-from-top-4">
                    {successMessage} Redirecting...
                </div>
            )}

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                        <div className="space-y-2">
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Full Name <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-gray-700 transition-all"
                                placeholder="e.g. John Doe"
                            />
                            {errors.name && <p className="text-red-500 text-xs font-bold mt-1">{errors.name[0]}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Phone <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                required
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-gray-700 transition-all"
                                placeholder="e.g. +1 555-0198"
                            />
                            {errors.phone && <p className="text-red-500 text-xs font-bold mt-1">{errors.phone[0]}</p>}
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Email Address</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-gray-700 transition-all"
                                placeholder="john@example.com"
                            />
                            {errors.email && <p className="text-red-500 text-xs font-bold mt-1">{errors.email[0]}</p>}
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Billing Address</label>
                            <input
                                type="text"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-gray-700 transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">City</label>
                            <input
                                type="text"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-gray-700 transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Country</label>
                            <input
                                type="text"
                                value={formData.country}
                                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-gray-700 transition-all"
                            />
                        </div>

                    </div>

                    <div className="pt-8 flex justify-end">
                        <button
                            type="submit"
                            className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl shadow-xl hover:bg-indigo-700 transition-all transform hover:-translate-y-1 font-black uppercase tracking-widest text-sm"
                        >
                            <Save className="w-5 h-5" />
                            Save Customer
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}
