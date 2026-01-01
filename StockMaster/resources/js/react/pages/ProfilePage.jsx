import React, { useState, useEffect } from 'react';

export default function ProfilePage() {
    const [user, setUser] = useState({
        name: '',
        email: '',
        role: 'Administrator', // Hardcoded for now, or fetch from API if available
        initials: 'U'
    });
    const [passwords, setPasswords] = useState({
        current_password: '',
        new_password: '',
        new_password_confirmation: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [activeTab, setActiveTab] = useState('personal'); // 'personal' or 'security'

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const name = storedUser.name || '';
        setUser({
            name: name,
            email: storedUser.email || '',
            role: 'Administrator',
            initials: name ? name.charAt(0).toUpperCase() : 'U'
        });
    }, []);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    name: user.name,
                    email: user.email,
                })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
                localStorage.setItem('user', JSON.stringify({ ...storedUser, name: user.name, email: user.email }));
                // Update initials
                setUser(prev => ({ ...prev, initials: user.name.charAt(0).toUpperCase() }));
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to update profile.' });
            }
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'An unexpected error occurred.' });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        if (passwords.new_password !== passwords.new_password_confirmation) {
            setMessage({ type: 'error', text: 'New passwords do not match.' });
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/profile/password', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(passwords)
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: 'Password updated successfully!' });
                setPasswords({ current_password: '', new_password: '', new_password_confirmation: '' });
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to update password.' });
            }
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'An unexpected error occurred.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="p-6 max-w-6xl mx-auto">

            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Manage your personal information and security settings.</p>
            </div>

            {/* Notification Toast */}
            {message.text && (
                <div className={`fixed top-4 right-4 z-50 animate-fade-in-down px-6 py-4 rounded-xl shadow-2xl border flex items-center gap-3 ${message.type === 'success'
                    ? 'bg-green-500 text-white border-green-600'
                    : 'bg-red-500 text-white border-red-600'
                    }`}>
                    {message.type === 'success' ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    )}
                    <span className="font-semibold">{message.text}</span>
                    <button onClick={() => setMessage({ type: '', text: '' })} className="ml-4 hover:opacity-80">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-8">

                {/* Left Column: Profile Card */}
                <div className="w-full lg:w-1/3">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden sticky top-6">
                        {/* Banner Background */}
                        <div className="h-32 bg-gradient-to-r from-orange-400 to-blue-500"></div>

                        <div className="px-6 pb-6 relative">
                            {/* Avatar */}
                            <div className="absolute -top-12 left-6">
                                <div className="h-24 w-24 rounded-2xl bg-white dark:bg-gray-800 p-1 shadow-lg">
                                    <div className="h-full w-full bg-orange-100 dark:bg-orange-900/50 rounded-xl flex items-center justify-center text-4xl font-bold text-orange-600 dark:text-orange-400">
                                        {user.initials}
                                    </div>
                                </div>
                            </div>

                            {/* User Info */}
                            <div className="pt-28">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user.name || 'User'}</h2>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{user.email}</p>

                                <div className="mt-4 flex items-center gap-2">
                                    <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-bold rounded-full">
                                        ● Active
                                    </span>
                                    <span className="px-3 py-1 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 text-xs font-bold rounded-full border border-gray-200 dark:border-gray-600">
                                        {user.role}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                                <div className="space-y-3">
                                    <button
                                        onClick={() => setActiveTab('personal')}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'personal' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-semibold ring-1 ring-blue-200 dark:ring-blue-800' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                        Personal Details
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('security')}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'security' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-semibold ring-1 ring-blue-200 dark:ring-blue-800' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                        Security
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Settings Panel */}
                <div className="w-full lg:w-2/3">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 min-h-[500px]">

                        {activeTab === 'personal' && (
                            <div className="animate-fade-in">
                                <div className="mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Personal Information</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Update your personal details below.</p>
                                </div>

                                <form onSubmit={handleProfileUpdate} className="space-y-6 max-w-lg">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Full Name</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                            </div>
                                            <input
                                                type="text"
                                                value={user.name}
                                                onChange={(e) => setUser({ ...user, name: e.target.value })}
                                                className="block w-full pl-12 pr-3 py-3 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-shadow"
                                                placeholder="Enter your name"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Email Address</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                            </div>
                                            <input
                                                type="email"
                                                value={user.email}
                                                onChange={(e) => setUser({ ...user, email: e.target.value })}
                                                className="block w-full pl-12 pr-3 py-3 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-shadow"
                                                placeholder="Enter your email"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-8 py-3 bg-gradient-to-r from-orange-500 to-blue-600 hover:from-orange-600 hover:to-blue-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                                        >
                                            {loading ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="animate-fade-in">
                                <div className="mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Security Settings</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Ensure your account is secure by using a strong password.</p>
                                </div>

                                <form onSubmit={handlePasswordUpdate} className="space-y-6 max-w-lg">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Current Password</label>
                                        <input
                                            type="password"
                                            value={passwords.current_password}
                                            onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })}
                                            className="block w-full px-4 py-3 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-shadow"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">New Password</label>
                                            <input
                                                type="password"
                                                value={passwords.new_password}
                                                onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
                                                className="block w-full px-4 py-3 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-shadow"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Confirm New Password</label>
                                            <input
                                                type="password"
                                                value={passwords.new_password_confirmation}
                                                onChange={(e) => setPasswords({ ...passwords, new_password_confirmation: e.target.value })}
                                                className="block w-full px-4 py-3 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-shadow"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-8 py-3 bg-gray-800 hover:bg-gray-900 border border-gray-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                                        >
                                            {loading ? 'Updating...' : 'Update Password'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
