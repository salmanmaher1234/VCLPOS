import React, { useState, useEffect } from 'react';
import {
    ChevronLeft, Mail, Calendar, Shield
} from 'lucide-react';
import Link from '../components/Link';

export default function EmployeeShow() {
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const id = window.location.pathname.split('/').pop();

    useEffect(() => {
        fetchEmployee();
    }, [id]);

    const fetchEmployee = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`/api/employees/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            if (!response.ok) throw new Error('Employee not found');
            const data = await response.json();
            setEmployee(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-pulse text-gray-400 font-black uppercase tracking-widest">Loading Staff Profile...</div>
        </div>
    );

    if (error || !employee) return (
        <div className="p-8 text-center">
            <h1 className="text-4xl font-black text-gray-900 border-b-8 border-red-600 inline-block mb-4">NOT FOUND</h1>
            <p className="text-gray-500 font-bold">{error || 'Unable to retrieve employee data'}</p>
            <Link href="/react/employees" className="mt-8 inline-block px-8 py-4 bg-black text-white font-black uppercase rounded-2xl">Back to Staff</Link>
        </div>
    );

    const shiftDisplay = employee.shifts && employee.shifts.length > 0
        ? employee.shifts.map(s => s.name).join(' & ')
        : (employee.shift?.name || 'Not Assigned');

    return (
        <main className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-50/30 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Navigation & Header */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <Link href="/react/employees" className="flex items-center gap-2 text-gray-400 hover:text-blue-600 transition-colors font-bold uppercase text-[10px] tracking-widest bg-white dark:bg-gray-800 px-4 py-2 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                        <ChevronLeft className="h-4 w-4" /> Staff Directory
                    </Link>
                    <div className="flex gap-4">
                        <span className={`px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${employee.status === 'active' ? 'bg-green-100 text-green-700' : employee.status === 'on_leave' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                            }`}>
                            {employee.status}
                        </span>
                    </div>
                </div>

                {/* Profile Header Card */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 dark:bg-blue-900/10 -mr-20 -mt-20 rounded-full blur-3xl opacity-50"></div>

                    <div className="flex flex-col md:flex-row items-center gap-10 relative">
                        <div className="h-32 w-32 md:h-44 md:w-44 rounded-3xl bg-blue-600 flex items-center justify-center text-white text-5xl md:text-7xl font-bold shadow-xl shadow-blue-500/20">
                            {employee.name.charAt(0)}
                        </div>
                        <div className="text-center md:text-left flex-1 space-y-4">
                            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white tracking-tight">{employee.name}</h1>
                            <div className="flex flex-wrap justify-center md:justify-start gap-3">
                                <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-blue-100 dark:border-blue-900/50">{employee.position}</span>
                                <span className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-gray-100 dark:border-gray-800">{employee.employee_code}</span>
                                <span className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-emerald-100 dark:border-emerald-900/50">{shiftDisplay}</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-center md:items-end gap-1">
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Monthly Liquidity</p>
                            <p className="text-3xl md:text-5xl font-bold text-blue-600 tracking-tight">${Number(employee.salary).toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* Detailed Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    {/* Contact Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 md:p-10 shadow-sm border border-gray-100 dark:border-gray-800 space-y-8">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5" /> Communications
                        </h3>
                        <div className="space-y-6">
                            <InfoRow label="Email Gateway" value={employee.email} />
                            <InfoRow label="Voice Access" value={employee.phone || 'Not Registered'} />
                        </div>
                    </div>

                    {/* Employment Details */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 md:p-10 shadow-sm border border-gray-100 dark:border-gray-800 space-y-8">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5" /> Core Tenure
                        </h3>
                        <div className="space-y-6">
                            <InfoRow label="Onboarding Date" value={new Date(employee.hire_date).toLocaleDateString()} />
                            <InfoRow label="Operational Unit" value={employee.department || 'General Operations'} />
                            <InfoRow label="Hierarchy Role" value={employee.role} />
                        </div>
                    </div>

                    {/* Permissions */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 md:p-10 shadow-sm border border-gray-100 dark:border-gray-800 space-y-8">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Shield className="h-3.5 w-3.5" /> Access Privileges
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {employee.permissions?.map(p => (
                                <span key={p} className="px-3.5 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-bold uppercase border border-blue-100 dark:border-blue-900/50">
                                    {p}
                                </span>
                            )) || <span className="text-xs text-gray-400 font-medium italic">Standard Read-Only</span>}
                        </div>
                    </div>
                </div>

                {/* Performance Summary */}
                <div className="bg-blue-600 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden shadow-xl shadow-blue-500/10">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 -mr-20 -mt-20 rounded-full blur-3xl"></div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                        <div className="space-y-2 text-center md:text-left">
                            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Performance Intelligence</h2>
                            <p className="text-white/60 font-medium text-sm">Real-time engagement metrics for the current operational cycle.</p>
                        </div>
                        <div className="flex gap-12">
                            <StatCircle label="Engagements" value={employee.attendance_count || '0'} />
                            <StatCircle label="Reliability" value={'98%'} />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

function InfoRow({ label, value }) {
    return (
        <div className="space-y-1">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
            <p className="font-bold text-gray-900">{value}</p>
        </div>
    );
}

function StatCircle({ label, value }) {
    return (
        <div className="text-center group">
            <div className="h-20 w-20 md:h-24 md:w-24 rounded-full border-4 border-white/20 flex items-center justify-center mb-3 group-hover:border-white transition-colors">
                <span className="text-xl md:text-3xl font-bold">{value}</span>
            </div>
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{label}</p>
        </div>
    );
}
