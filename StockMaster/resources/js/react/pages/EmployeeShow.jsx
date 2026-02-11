import React, { useState, useEffect } from 'react';
import {
    ChevronLeft, Mail, Phone, MapPin, Calendar, DollarSign,
    Shield, Clock, TrendingUp, Activity, CheckCircle, XCircle
} from 'lucide-react';
import Link from '../components/Link';

export default function EmployeeShow() {
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter employee ID from URL /react/employees/:id
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
            <div className="animate-pulse text-gray-400 font-black uppercase tracking-widest">Scanning Personnel...</div>
        </div>
    );

    if (error || !employee) return (
        <div className="p-8 text-center">
            <h1 className="text-4xl font-black text-gray-900 border-b-8 border-red-600 inline-block mb-4">PERSONNEL ERROR</h1>
            <p className="text-gray-500 font-bold">{error || 'Unable to retrieve employee data'}</p>
            <Link href="/react/employees" className="mt-8 inline-block px-8 py-4 bg-black text-white font-black uppercase rounded-2xl">Return to Center</Link>
        </div>
    );

    return (
        <main className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-50/30 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Navigation & Header */}
                <div className="flex items-center justify-between">
                    <Link href="/react/employees" className="flex items-center gap-2 text-gray-400 hover:text-black transition-colors font-black uppercase text-xs">
                        <ChevronLeft className="h-4 w-4" /> Personnel Directory
                    </Link>
                    <div className="flex gap-4">
                        <span className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${employee.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                            System Status: {employee.status}
                        </span>
                    </div>
                </div>

                {/* Profile Header Card */}
                <div className="bg-white rounded-[3rem] p-12 shadow-2xl border border-gray-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50 -mr-20 -mt-20 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity"></div>

                    <div className="flex flex-col md:flex-row items-center gap-12 relative">
                        <div className="h-40 w-40 rounded-[2.5rem] bg-orange-600 flex items-center justify-center text-white text-6xl font-black shadow-2xl shadow-orange-200">
                            {employee.name.charAt(0)}
                        </div>
                        <div className="text-center md:text-left flex-1">
                            <h1 className="text-5xl font-black text-gray-900 tracking-tighter mb-2">{employee.name}</h1>
                            <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                <span className="bg-black text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">{employee.position}</span>
                                <span className="bg-gray-100 text-gray-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">{employee.employee_code}</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-center md:items-end gap-2">
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Base Compensation</p>
                            <p className="text-4xl font-black text-orange-600 tracking-tighter">${Number(employee.salary).toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* Detailed Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Contact Card */}
                    <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-gray-100 space-y-8">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Mail className="h-3 w-3" /> Communication Channels
                        </h3>
                        <div className="space-y-6">
                            <InfoRow label="Official Email" value={employee.email} />
                            <InfoRow label="Mobile Line" value={employee.phone || 'NOT REGISTERED'} />
                            <InfoRow label="Primary Residence" value={employee.address || 'NOT REGISTERED'} />
                        </div>
                    </div>

                    {/* Employment Details */}
                    <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-gray-100 space-y-8">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Calendar className="h-3 w-3" /> Career Timeline
                        </h3>
                        <div className="space-y-6">
                            <InfoRow label="Enlistment Date" value={new Date(employee.hire_date).toLocaleDateString()} />
                            <InfoRow label="Department" value={employee.department || 'GENERAL OPERATIONS'} />
                            <InfoRow label="Authorization Role" value={employee.role} />
                        </div>
                    </div>

                    {/* Security & Access */}
                    <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-gray-100 space-y-8">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Shield className="h-3 w-3" /> Permission Matrix
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {employee.permissions?.map(p => (
                                <span key={p} className="px-4 py-2 bg-orange-50 text-orange-600 rounded-xl text-[10px] font-black uppercase border border-orange-100">
                                    {p}
                                </span>
                            )) || <span className="text-xs text-gray-400 font-bold uppercase italic">No Special Access Granted</span>}
                        </div>
                    </div>
                </div>

                {/* Performance Summary Placeholder */}
                <div className="bg-gray-900 rounded-[3rem] p-12 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 to-transparent"></div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="space-y-4">
                            <h2 className="text-3xl font-black uppercase tracking-tighter">Mission Readiness</h2>
                            <p className="text-gray-400 font-medium">Automatic performance analytics tracking is currently processing for this cycle.</p>
                        </div>
                        <div className="flex gap-8">
                            <StatCircle label="Attendance" value="98%" />
                            <StatCircle label="Efficiency" value="84" />
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
        <div className="text-center">
            <div className="h-20 w-20 rounded-full border-4 border-orange-600 flex items-center justify-center mb-2">
                <span className="text-xl font-black">{value}</span>
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
        </div>
    );
}
