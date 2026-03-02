import React, { useState, useEffect } from 'react';
import { Users, Search, PlusCircle, CheckCircle, Clock, TrendingUp, XCircle, Calendar, DollarSign, Activity, ChevronRight, Edit3, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Link from '../components/Link';

export default function Employees() {
    const [activeTab, setActiveTab] = useState('employees');
    const [employees, setEmployees] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [editingShift, setEditingShift] = useState(null);
    const [filterRole, setFilterRole] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        fetchEmployees();
        fetchStats();
    }, [filterRole, searchTerm]);

    const fetchEmployees = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const params = new URLSearchParams();
            if (filterRole !== 'all') params.append('role', filterRole);
            if (searchTerm) params.append('search', searchTerm);

            const response = await fetch(`/api/employees?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            const data = await response.json();
            if (Array.isArray(data)) setEmployees(data);
        } catch (error) { console.error('Error:', error); }
        finally { setLoading(false); }
    };

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/employees-stats', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            const data = await response.json();
            setStats(data);
        } catch (error) { console.error('Error:', error); }
    };

    const handleAddEmployee = async (formData) => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/employees', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (response.ok) {
                fetchEmployees();
                fetchStats();
                setShowAddModal(false);

                // Add Notification with Fail-Safe
                const entry = {
                    type: 'staff',
                    title: 'New Staff Registered',
                    message: `Staff member "${formData.name}" has been successfully added to the system.`
                };

                if (window.addVclNotification) {
                    window.addVclNotification(entry);
                } else {
                    const saved = JSON.parse(localStorage.getItem('vcl_notifications') || '[]');
                    const fall = { id: Date.now(), time: new Date().toLocaleTimeString(), date: new Date().toISOString().split('T')[0], read: false, ...entry };
                    localStorage.setItem('vcl_notifications', JSON.stringify([fall, ...saved].slice(0, 100)));
                    window.dispatchEvent(new Event('vcl-notification-added'));
                }
            }
            else { throw data; }
        } catch (error) {
            console.error('Error:', error);
            if (error.errors) return error.errors;
            alert(error.message || 'Failed to add employee');
        }
    };

    const handleUpdateEmployee = async (formData) => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`/api/employees/${editingEmployee.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (response.ok) {
                // Add Notification Fail-Safe
                const entry = {
                    type: 'staff',
                    title: 'Staff Profile Updated',
                    message: `Employee "${formData.name}" profile has been updated.`
                };
                if (window.addVclNotification) {
                    window.addVclNotification(entry);
                } else {
                    const saved = JSON.parse(localStorage.getItem('vcl_notifications') || '[]');
                    const fall = { id: Date.now(), time: new Date().toLocaleTimeString(), date: new Date().toISOString().split('T')[0], read: false, ...entry };
                    localStorage.setItem('vcl_notifications', JSON.stringify([fall, ...saved].slice(0, 100)));
                    window.dispatchEvent(new Event('vcl-notification-added'));
                }
                fetchEmployees(); fetchStats(); setEditingEmployee(null);
            }
            else { throw data; }
        } catch (error) {
            console.error('Error:', error);
            if (error.errors) return error.errors;
            alert(error.message || 'Failed to update employee');
        }
    };

    const handleUpdateShift = async (formData) => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`/api/employee-shifts/${editingShift.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            if (response.ok) {
                setEditingShift(null);
                refreshGlobal();
            }
        } catch (error) { console.error('Error:', error); }
    };

    const handleDeleteEmployee = async (id) => {
        if (!confirm('Are you sure you want to delete this employee? This will permanently remove all related data (attendance, payroll, etc.).')) return;

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`/api/employees/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                // Add Notification Fail-Safe
                const empToDelete = employees.find(e => e.id === id);
                const entry = {
                    type: 'staff',
                    title: 'Employee Terminated',
                    message: `Employee "${empToDelete?.name || id}" has been removed/deleted from the system.`
                };
                if (window.addVclNotification) {
                    window.addVclNotification(entry);
                } else {
                    const saved = JSON.parse(localStorage.getItem('vcl_notifications') || '[]');
                    const fall = { id: Date.now(), time: new Date().toLocaleTimeString(), date: new Date().toISOString().split('T')[0], read: false, ...entry };
                    localStorage.setItem('vcl_notifications', JSON.stringify([fall, ...saved].slice(0, 100)));
                    window.dispatchEvent(new Event('vcl-notification-added'));
                }
                refreshGlobal();
            } else {
                alert('Failed to delete employee');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error deleting employee');
        }
    };

    const refreshGlobal = () => {
        fetchEmployees();
        fetchStats();
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <main className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-50/50 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-gray-800 p-8 lg:p-10 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800">
                    <div className="space-y-1">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Employee Directory</h1>
                        <p className="text-gray-500 font-medium text-sm">Manage staff records, attendance, and payroll</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="w-full md:w-auto flex items-center justify-center gap-3 bg-gradient-to-r from-[#FF7d1f] to-[#2b59ff] text-white px-10 py-4 rounded-xl font-bold hover:opacity-90 transition-all active:scale-95 shadow-xl shadow-orange-500/20 uppercase text-xs tracking-widest"
                    >
                        <PlusCircle className="h-5 w-5" />
                        <span>Board New Personnel</span>
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <StatCard icon={Users} label="Staff" value={stats.total_employees || 0} />
                    <StatCard icon={CheckCircle} label="Active" value={stats.active_employees || 0} />
                    <StatCard icon={Clock} label="Today" value={stats.today_present || 0} />
                    <StatCard icon={TrendingUp} label="Rating" value={stats.avg_performance || 0} />
                </div>

                {/* Main Navigation Tabs */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-800">
                    <nav className="flex overflow-x-auto px-4 sm:px-8 py-4 gap-1 sm:gap-2 border-b border-gray-100 dark:border-gray-800 scrollbar-hide">
                        <TabButton active={activeTab === 'employees'} onClick={() => setActiveTab('employees')}>Staff List</TabButton>
                        <TabButton active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')}>Attendance</TabButton>
                        <TabButton active={activeTab === 'payroll'} onClick={() => setActiveTab('payroll')}>Payroll</TabButton>
                        <TabButton active={activeTab === 'leaves'} onClick={() => setActiveTab('leaves')}>Leaves</TabButton>
                        <TabButton active={activeTab === 'performance'} onClick={() => setActiveTab('performance')}>Performance</TabButton>
                        <TabButton active={activeTab === 'shifts'} onClick={() => setActiveTab('shifts')}>Shifts</TabButton>
                    </nav>
                    <style>{` .custom-scrollbar-hide::-webkit-scrollbar { display: none; } .custom-scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; } `}</style>

                    <div className="p-4 sm:p-8">
                        {activeTab === 'employees' && (
                            <EmployeeList employees={employees} onEdit={(emp) => setEditingEmployee(emp)} onDelete={handleDeleteEmployee} filterRole={filterRole} setFilterRole={setFilterRole} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                        )}
                        {activeTab === 'attendance' && <AttendanceTab onUpdate={refreshGlobal} refreshTrigger={refreshTrigger} />}
                        {activeTab === 'performance' && <PerformanceTab employees={employees} refreshTrigger={refreshTrigger} />}
                        {activeTab === 'payroll' && <PayrollTab onUpdate={refreshGlobal} refreshTrigger={refreshTrigger} />}
                        {activeTab === 'leaves' && <LeaveTab employees={employees} onUpdate={refreshGlobal} refreshTrigger={refreshTrigger} />}
                        {activeTab === 'shifts' && <ShiftTab onEdit={setEditingShift} refreshTrigger={refreshTrigger} />}
                    </div>
                </div>
            </div>

            {showAddModal && <EmployeeModal onClose={() => setShowAddModal(false)} onSave={handleAddEmployee} />}
            {editingEmployee && <EmployeeModal employee={editingEmployee} onClose={() => setEditingEmployee(null)} onSave={handleUpdateEmployee} />}
            {editingShift && <ShiftSettingsModal shift={editingShift} onClose={() => setEditingShift(null)} onSave={handleUpdateShift} />}
        </main>
    );
}

function StatCard({ icon: Icon, label, value }) {
    return (
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-5 group hover:border-blue-500/30 transition-all">
            <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                <Icon className="h-6 w-6" />
            </div>
            <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{value}</p>
            </div>
        </div>
    );
}

function TabButton({ children, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`
                px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap
                ${active
                    ? 'bg-gradient-to-r from-[#FF7d1f] to-[#2b59ff] text-white shadow-lg shadow-orange-500/20'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                }
            `}
        >
            {children}
        </button>
    );
}

function EmployeeList({ employees, onEdit, onDelete, filterRole, setFilterRole, searchTerm, setSearchTerm }) {
    if (!Array.isArray(employees)) return null;
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500" />
                    <input
                        type="text"
                        placeholder="Search by name, code or position..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-6 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all font-medium text-sm dark:text-white"
                    />
                </div>
                <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-900 border-none font-bold text-xs uppercase cursor-pointer focus:ring-4 focus:ring-blue-500/10"
                >
                    <option value="all">All Roles</option>
                    <option value="admin">Administrators</option>
                    <option value="manager">Managers</option>
                    <option value="cashier">Cashiers</option>
                </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {employees.map((emp) => (
                    <Link key={emp.id} href={`/react/employees/${emp.id}`} className="block group">
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm relative hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/5 transition-all h-full">
                            <div className="flex items-center gap-5 mb-8">
                                <div className="h-16 w-16 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-2xl font-bold">
                                    {emp.name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate">{emp.name}</h3>
                                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">{emp.position}</p>
                                </div>
                            </div>

                            <div className="space-y-3 mb-8 text-xs font-semibold">
                                <div className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-gray-700">
                                    <span className="text-gray-400 uppercase tracking-wider">Staff ID</span>
                                    <span className="dark:text-white">{emp.employee_code}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-gray-700">
                                    <span className="text-gray-400 uppercase tracking-wider">Shift</span>
                                    <span className="text-blue-600 dark:text-blue-400 font-bold">{emp.shifts && emp.shifts.length > 0 ? emp.shifts.map(s => s.name).join(' & ') : (emp.shift?.name || 'Standard')}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-gray-400 uppercase tracking-wider">Status</span>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${emp.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                        emp.status === 'on_leave' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                        }`}>
                                        {emp.status}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onEdit(emp);
                                    }}
                                    className="flex-1 py-3 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                >
                                    Edit Profile
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onDelete(emp.id);
                                    }}
                                    className="px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

function AttendanceTab({ onUpdate, refreshTrigger }) {
    const [attendance, setAttendance] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [marking, setMarking] = useState(null);

    const fetchA = async () => {
        const token = localStorage.getItem('auth_token');
        const r = await fetch(`/api/employees-daily-attendance?date=${selectedDate}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        const d = await r.json();
        if (Array.isArray(d)) setAttendance(d);
    };

    useEffect(() => {
        fetchA();
    }, [selectedDate, refreshTrigger]);

    const handleMark = async (empId, status, timeIn = null, timeOut = null) => {
        setMarking(empId);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/employees-attendance/mark', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    employee_id: empId,
                    date: selectedDate,
                    status: status,
                    time_in: timeIn,
                    time_out: timeOut
                })
            });
            if (response.ok) {
                fetchA();
                if (onUpdate) onUpdate();

                // Add Notification
                if (window.addVclNotification) {
                    const emp = attendance.find(a => a.id === empId);
                    window.addVclNotification({
                        type: 'staff',
                        title: 'Attendance Recorded',
                        message: `Employee "${emp?.name || 'Staff'}" marked as ${status.replace('_', ' ')} for ${selectedDate}.`
                    });
                }
            }
        } catch (error) {
            console.error('Attendance Error:', error);
        } finally {
            setMarking(null);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'present': return 'bg-green-100 text-green-700';
            case 'absent': return 'bg-red-100 text-red-700';
            case 'late': return 'bg-yellow-100 text-yellow-700';
            case 'half_day': return 'bg-orange-100 text-orange-700';
            case 'on_leave': return 'bg-purple-100 text-purple-700';
            case 'upcoming': return 'bg-blue-100 text-blue-700';
            case 'weekend': return 'bg-gray-100 text-gray-500';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const formatHours = (minutes) => {
        if (!minutes) return '—';
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}h ${m}m`;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl md:rounded-3xl items-start sm:items-center justify-between border border-gray-100 dark:border-gray-800 gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="bg-transparent border-none font-bold text-sm w-full sm:w-auto focus:ring-0 dark:text-white"
                    />
                </div>
                <div className="hidden sm:block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Global Attendance Snapshot</div>
            </div>

            <div className="bg-white rounded-2xl sm:rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm overflow-x-auto custom-scrollbar">
                <table className="min-w-[800px] w-full text-left">
                    <thead className="bg-gray-50/50 text-[10px] font-black uppercase text-gray-400 border-b">
                        <tr>
                            <th className="p-4 sm:p-6">Staff Member</th>
                            <th className="p-4 sm:p-6">Status</th>
                            <th className="p-4 sm:p-6 text-center">Clock In / Out</th>
                            <th className="p-4 sm:p-6 text-center">Hours</th>
                            <th className="p-4 sm:p-6 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y text-xs font-bold">
                        {attendance.length === 0 ? (
                            <tr><td colSpan="5" className="p-12 text-center text-gray-400 font-black uppercase tracking-widest text-xs">No entries for this date</td></tr>
                        ) : attendance.map(r => (
                            <tr key={r.employee_id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="p-4 sm:p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 font-black shrink-0">{r.employee_name.charAt(0)}</div>
                                        <div>
                                            <p className="font-black text-sm leading-tight">{r.employee_name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <p className="text-[9px] text-gray-400 uppercase tracking-tighter">{r.employee_code}</p>
                                                <span className="px-1.5 py-0.5 bg-gray-50 text-gray-400 rounded text-[7px] font-black uppercase">{r.shift_name}</span>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 sm:p-6">
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(r.status)}`}>
                                        {r.status === 'half_day' ? 'Half Day' : r.status === 'on_leave' ? 'On Leave' : r.status}
                                    </span>
                                </td>
                                <td className="p-4 sm:p-6">
                                    <div className="flex items-center justify-center gap-2">
                                        <input
                                            type="time"
                                            defaultValue={r.time_in || ''}
                                            onBlur={(e) => {
                                                if (e.target.value !== (r.time_in || '')) {
                                                    handleMark(r.employee_id, ['absent', 'upcoming', 'weekend'].includes(r.status) ? 'present' : r.status, e.target.value, r.time_out);
                                                }
                                            }}
                                            className="bg-gray-50 border-none rounded-lg p-2 text-[10px] font-black w-24 focus:ring-1 focus:ring-orange-200"
                                        />
                                        <span className="text-gray-300">→</span>
                                        <input
                                            type="time"
                                            defaultValue={r.time_out || ''}
                                            onBlur={(e) => {
                                                if (e.target.value !== (r.time_out || '')) {
                                                    handleMark(r.employee_id, ['absent', 'upcoming', 'weekend'].includes(r.status) ? 'present' : r.status, r.time_in, e.target.value);
                                                }
                                            }}
                                            className="bg-gray-50 border-none rounded-lg p-2 text-[10px] font-black w-24 focus:ring-1 focus:ring-orange-200"
                                        />
                                    </div>
                                </td>
                                <td className="p-4 sm:p-6 text-center">
                                    <span className="text-[10px] font-black text-gray-500">{formatHours(r.total_hours)}</span>
                                </td>
                                <td className="p-4 sm:p-6 text-right">
                                    <select
                                        value={r.status}
                                        disabled={marking === r.employee_id}
                                        onChange={(e) => handleMark(r.employee_id, e.target.value, r.time_in, r.time_out)}
                                        className="bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 pr-10 pl-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider cursor-pointer hover:border-blue-500 transition-all focus:ring-4 focus:ring-blue-500/10 dark:text-white"
                                    >
                                        <option value="upcoming" disabled>Upcoming</option>
                                        <option value="weekend" disabled>Weekend</option>
                                        <option value="present">Present</option>
                                        <option value="absent">Absent</option>
                                        <option value="late">Late</option>
                                        <option value="half_day">Half Day</option>
                                        <option value="on_leave">On Leave</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function PerformanceTab({ employees, refreshTrigger }) {
    const [performance, setPerformance] = useState([]);
    const fetchP = async () => {
        const token = localStorage.getItem('auth_token');
        const r = await fetch('/api/employees-performance', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        const d = await r.json(); if (Array.isArray(d)) setPerformance(d);
    };

    useEffect(() => {
        fetchP();
    }, [refreshTrigger]);

    // Prepare chart data (Average per employee)
    const chartData = performance.reduce((acc, curr) => {
        const name = curr.employee?.name || 'Unknown';
        const existing = acc.find(item => item.name === name);
        if (existing) {
            existing.present += curr.attendance_days;
            existing.late += curr.late_days;
            existing.count += 1;
        } else {
            acc.push({ name, present: curr.attendance_days, late: curr.late_days, count: 1 });
        }
        return acc;
    }, []).map(item => ({
        name: item.name,
        'Attendance': (item.present / item.count).toFixed(1),
        'Late Days': (item.late / item.count).toFixed(1)
    }));

    // Aggregate performance data by employee for the cards
    // Start with all employees to ensure everyone shows up
    const aggregatedPerformance = employees.map(emp => {
        const records = performance.filter(p => p.employee_id === emp.id);
        if (records.length > 0) {
            const totalAttendance = records.reduce((s, r) => s + r.attendance_days, 0);
            const totalLate = records.reduce((s, r) => s + r.late_days, 0);
            const avgRating = (records.reduce((s, r) => s + Number(r.rating), 0) / records.length).toFixed(2);
            return {
                employee: emp,
                employee_id: emp.id,
                total_attendance: totalAttendance,
                total_late: totalLate,
                avg_rating: avgRating,
                count: records.length,
                avg_efficiency: ((totalAttendance - totalLate) / (22 * records.length) * 100).toFixed(0)
            };
        } else {
            return {
                employee: emp,
                employee_id: emp.id,
                total_attendance: 0,
                total_late: 0,
                avg_rating: '0.00',
                count: 0,
                avg_efficiency: '0',
                is_new: true
            };
        }
    });

    return (
        <div className="space-y-10">
            {/* Graph Section */}
            <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-6 sm:mb-10">
                    <div>
                        <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-gray-900">Attendance Analytics</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Average Attendance vs Late Days</p>
                    </div>
                </div>
                <div className="h-[250px] sm:h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 'bold', fill: '#9ca3af' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 'bold', fill: '#9ca3af' }} />
                            <Tooltip
                                cursor={{ fill: '#f9fafb' }}
                                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 'bold' }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '15px', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                            <Bar dataKey="Attendance" fill="#ea580c" radius={[4, 4, 0, 0]} barSize={25} />
                            <Bar dataKey="Late Days" fill="#fca5a5" radius={[4, 4, 0, 0]} barSize={25} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {aggregatedPerformance.map(p => (
                    <div key={p.employee_id} className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div>
                            <div className="flex justify-between items-start mb-4 sm:mb-6">
                                <div className="max-w-[70%]">
                                    <h4 className="font-black uppercase text-gray-900 leading-tight text-sm sm:text-base">{p.employee?.name}</h4>
                                    <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase mt-0.5">{p.is_new ? 'New Personnel' : 'Status Summary'}</p>
                                </div>
                                <div className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded-lg font-black text-[10px] sm:text-xs shrink-0">{p.avg_rating} ⭐</div>
                            </div>
                            <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                                <div className="flex justify-between items-center text-[10px] sm:text-xs">
                                    <span className="font-bold text-gray-400 uppercase tracking-widest">Attendance</span>
                                    <span className="font-black">{p.total_attendance} Days</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] sm:text-xs">
                                    <span className="font-bold text-gray-400 uppercase tracking-widest text-red-400">Late Days</span>
                                    <span className="font-black text-red-500">{p.total_late} Days</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] sm:text-xs">
                                    <span className="font-bold text-gray-400 uppercase tracking-widest">Tracking</span>
                                    <span className="font-black">{p.count} Months</span>
                                </div>
                                {p.is_new && (
                                    <p className="text-[8px] font-bold text-orange-400 bg-orange-50/50 p-2 rounded-lg text-center uppercase">Awaiting cycle...</p>
                                )}
                            </div>
                        </div>
                        <div className="bg-gray-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl flex justify-between items-center font-black text-[9px] sm:text-[10px]">
                            <span className="text-gray-400 uppercase tracking-widest">Efficiency</span>
                            <span className="text-orange-600">{p.avg_efficiency}%</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function PayrollTab({ onUpdate, refreshTrigger }) {
    const [payrolls, setPayrolls] = useState([]);
    const [month, setMonth] = useState(new Date().toISOString().substring(0, 7));
    const fetchPay = async () => {
        const token = localStorage.getItem('auth_token');
        const r = await fetch(`/api/employee-payrolls?month=${month}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        const d = await r.json(); if (Array.isArray(d)) setPayrolls(d);
    };
    useEffect(() => { fetchPay(); }, [month, refreshTrigger]);

    const [generating, setGenerating] = useState(false);
    const handlePay = async (id) => {
        if (!confirm('Mark this payroll as PAID?')) return;
        const token = localStorage.getItem('auth_token');
        try {
            await fetch(`/api/employee-payrolls/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ status: 'paid' })
            });
            fetchPay();
            if (onUpdate) onUpdate();

            // Add Notification
            if (window.addVclNotification) {
                const record = payrolls.find(p => p.id === id);
                window.addVclNotification({
                    type: 'finance',
                    title: 'Disbursement Executed',
                    message: `Payroll payment of $${Number(record?.net_salary).toLocaleString()} processed for "${record?.employee?.name}".`
                });
            }
        } catch (e) {
            alert('Payment update failed.');
        }
    };

    const handleGen = async () => {
        setGenerating(true);
        const token = localStorage.getItem('auth_token');
        try {
            await fetch('/api/employee-payrolls/generate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ month })
            });
            await fetchPay();
            if (onUpdate) onUpdate();
            alert('Payroll cycle initialized successfully!');
        } catch (e) {
            alert('Failed to initialize cycle.');
        } finally {
            setGenerating(false);
        }
    };

    const [deductionModal, setDeductionModal] = useState({ show: false, id: null, deduction: '', allowance: '', reason: '', late_deduction: '' });

    const handleUpdateDetails = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('auth_token');
        try {
            await fetch(`/api/employee-payrolls/${deductionModal.id}/details`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    custom_deduction: deductionModal.deduction,
                    custom_allowance: deductionModal.allowance,
                    custom_deduction_reason: deductionModal.reason,
                    late_deduction: deductionModal.late_deduction
                })
            });
            setDeductionModal({ show: false, id: null, deduction: '', allowance: '', reason: '', late_deduction: '' });
            fetchPay();
            if (onUpdate) onUpdate();
        } catch (e) {
            alert('Failed to update details.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row bg-blue-600 text-white p-6 sm:p-8 rounded-[2rem] items-start sm:items-center justify-between gap-6 shadow-xl shadow-blue-500/10">
                <div className="w-full sm:w-auto space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Selection Month</label>
                    <input
                        type="month"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        className="w-full bg-white/10 border-none rounded-xl px-4 py-2 font-bold text-white uppercase text-sm focus:ring-1 focus:ring-white/20"
                    />
                </div>
                <button
                    onClick={handleGen}
                    disabled={generating}
                    className="w-full sm:w-auto bg-gradient-to-r from-[#FF7d1f] to-[#2b59ff] text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:opacity-90 disabled:opacity-50 transition-all active:scale-95 shadow-xl shadow-orange-500/20"
                >
                    {generating ? 'Processing Cycle...' : 'Run Payroll Cycle'}
                </button>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden overflow-x-auto custom-scrollbar">
                <table className="min-w-[1000px] w-full text-left">
                    <thead className="bg-gray-50 text-[10px] uppercase font-black text-gray-400">
                        <tr>
                            <th className="p-4 sm:p-6">Staff</th>
                            <th className="p-4 sm:p-6">Base</th>
                            <th className="p-4 sm:p-6 text-center">Shift & Stats</th>
                            <th className="p-4 sm:p-6 text-right">Adj / Deductions</th>
                            <th className="p-4 sm:p-6 text-right">Net Pay</th>
                            <th className="p-4 sm:p-6 text-center">Status</th>
                            <th className="p-4 sm:p-6 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y text-[11px] sm:text-xs font-bold uppercase">
                        {payrolls.map(py => (
                            <tr key={py.id} className={`hover:bg-gray-50 ${py.is_live ? 'bg-orange-50/30' : ''}`}>
                                <td className="p-6">
                                    {py.employee?.name}
                                    {py.is_live && <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full text-[8px]">LIVE ACCRUAL</span>}
                                </td>
                                <td className="p-6 text-gray-400">$ {py.basic_salary}</td>
                                <td className="p-6 text-center">
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="flex gap-2 mb-1">
                                            <span className="text-white bg-orange-600 px-2 py-0.5 rounded text-[10px] font-black" title="Shift">
                                                {py.employee?.shifts && py.employee.shifts.length > 0
                                                    ? py.employee.shifts.map(s => s.name).join(' & ')
                                                    : (py.stats?.shift_name || 'N/A')}
                                            </span>
                                            {py.stats?.is_on_shift ? (
                                                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-[5px] text-[8px] font-black animate-pulse uppercase">
                                                    ON {py.stats?.active_shift_name || 'SHIFT'}
                                                </span>
                                            ) : (
                                                <span className="bg-red-50 text-red-400 px-2 py-0.5 rounded-[5px] text-[8px] font-black">OFF SHIFT</span>
                                            )}
                                            <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded text-[10px]" title="Present Days">P: {py.stats?.present_count || 0}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="text-orange-500 bg-orange-50 px-2 py-0.5 rounded" title="Late Days">L: {py.stats?.late_count || 0}</span>
                                            <span className="text-red-500 bg-red-50 px-2 py-0.5 rounded" title="Absent Days">A: {py.stats?.absent_count || 0}</span>
                                            <span className="text-blue-500 bg-blue-50 px-2 py-0.5 rounded" title="Approved Leaves">V: {py.stats?.leave_count || 0}</span>
                                        </div>
                                        {Number(py.stats?.half_day_count) > 0 && <span className="text-blue-500 text-[9px]">Half Days: {py.stats?.half_day_count}</span>}
                                    </div>
                                </td>
                                <td className="p-6 text-right space-y-1">
                                    {Number(py.late_deduction) > 0 && <div className="text-red-500">Absent: -${Number(py.late_deduction).toFixed(2)}</div>}
                                    {Number(py.custom_deduction) > 0 && <div className="text-red-600 font-black cursor-help" title={py.custom_deduction_reason}>Other: -${Number(py.custom_deduction).toFixed(2)}</div>}
                                    {Number(py.custom_allowance) > 0 && <div className="text-green-600 font-black">Bonus: +${Number(py.custom_allowance).toFixed(2)}</div>}
                                    {Number(py.overtime_pay) > 0 && <div className="text-blue-600 font-black">Overtime: +${Number(py.overtime_pay).toFixed(2)}</div>}
                                    {Number(py.late_deduction) === 0 && Number(py.custom_deduction) === 0 && Number(py.custom_allowance) === 0 && Number(py.overtime_pay) === 0 && <span className="text-gray-300">-</span>}
                                </td>
                                <td className="p-6 text-right text-lg font-black">$ {Number(py.net_salary).toLocaleString()}</td>
                                <td className="p-6 text-center">
                                    <span className={`px-3 py-1 rounded-lg ${py.is_live ? 'bg-blue-100 text-blue-600' : py.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        {py.is_live ? 'DRAFT' : py.status}
                                    </span>
                                </td>
                                <td className="p-6 text-right flex justify-end gap-2">
                                    {!py.is_live && py.status === 'unpaid' && (
                                        <>
                                            <button
                                                onClick={() => setDeductionModal({ show: true, id: py.id, deduction: py.custom_deduction, allowance: py.custom_allowance, reason: py.custom_deduction_reason, late_deduction: py.late_deduction, overtime_pay: py.overtime_pay })}
                                                className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200"
                                            >
                                                Adjust
                                            </button>
                                            <button
                                                onClick={() => handlePay(py.id)}
                                                className="bg-green-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 shadow-lg shadow-green-200"
                                            >
                                                Pay
                                            </button>
                                        </>
                                    )}
                                    {py.status === 'paid' && (
                                        <span className="text-gray-400 text-[10px]">PAID ON {py.payment_date}</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {deductionModal.show && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[120] p-4">
                    <div className="bg-white p-8 rounded-[2rem] w-full max-w-sm shadow-2xl space-y-4">
                        <h3 className="font-black text-xl uppercase mb-2">Adjust Payroll</h3>
                        <div>
                            <label className="text-[10px] font-bold uppercase text-gray-400">Attendance Deduction (Override)</label>
                            <input type="number" value={deductionModal.late_deduction} onChange={e => setDeductionModal({ ...deductionModal, late_deduction: e.target.value })} className="w-full p-3 bg-gray-50 rounded-xl font-bold border-none" placeholder="0.00" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold uppercase text-gray-400">Overtime / Night Shift Pay</label>
                            <input type="number" value={deductionModal.overtime_pay} onChange={e => setDeductionModal({ ...deductionModal, overtime_pay: e.target.value })} className="w-full p-3 bg-blue-50 text-blue-600 rounded-xl font-bold border-none" placeholder="0.00" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold uppercase text-gray-400">Custom Deduction (Amount)</label>
                            <input type="number" value={deductionModal.deduction} onChange={e => setDeductionModal({ ...deductionModal, deduction: e.target.value })} className="w-full p-3 bg-gray-50 rounded-xl font-bold border-none" placeholder="0.00" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold uppercase text-gray-400">Reason / Note</label>
                            <textarea value={deductionModal.reason} onChange={e => setDeductionModal({ ...deductionModal, reason: e.target.value })} className="w-full p-3 bg-gray-50 rounded-xl font-bold border-none h-20 resize-none text-xs" placeholder="Reason for deduction..." />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold uppercase text-gray-400">Custom Allowance / Bonus</label>
                            <input type="number" value={deductionModal.allowance} onChange={e => setDeductionModal({ ...deductionModal, allowance: e.target.value })} className="w-full p-3 bg-gray-50 rounded-xl font-bold border-none" placeholder="0.00" />
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button onClick={handleUpdateDetails} className="flex-1 bg-black text-white py-3 rounded-xl font-black uppercase text-[10px]">Save Changes</button>
                            <button onClick={() => setDeductionModal({ ...deductionModal, show: false })} className="flex-1 bg-gray-100 text-gray-500 py-3 rounded-xl font-black uppercase text-[10px]">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function LeaveTab({ employees, onUpdate, refreshTrigger }) {
    const [leaves, setLeaves] = useState([]);
    const [show, setShow] = useState(false);
    const [form, setForm] = useState({ employee_id: '', type: 'casual', start_date: '', end_date: '', reason: '' });
    const fetchL = async () => {
        const token = localStorage.getItem('auth_token');
        const r = await fetch('/api/employee-leaves', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        const d = await r.json(); if (Array.isArray(d)) setLeaves(d);
    };

    const handleStatus = async (id, status) => {
        const token = localStorage.getItem('auth_token');
        try {
            await fetch(`/api/employee-leaves/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ status })
            });
            fetchL();
            if (onUpdate) onUpdate();

            // Add Notification
            if (window.addVclNotification) {
                const leave = leaves.find(l => l.id === id);
                window.addVclNotification({
                    type: 'staff',
                    title: `Leave ${status.charAt(0).toUpperCase() + status.slice(1)}`,
                    message: `Leave request for "${leave?.employee?.name || 'Staff'}" has been ${status}.`
                });
            }
        } catch (e) { console.error(e); }
    };

    useEffect(() => { fetchL(); }, [refreshTrigger]);
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-blue-50 dark:bg-blue-900/10 p-6 rounded-[2rem] gap-6 border border-blue-100 dark:border-blue-900/30">
                <div className="space-y-1">
                    <h3 className="text-xl font-bold text-blue-900 dark:text-blue-400 tracking-tight">Time-Off Requests</h3>
                    <p className="text-sm text-blue-600/60 dark:text-blue-400/60 font-medium">Approve or manage employee leave applications</p>
                </div>
                <button
                    onClick={() => setShow(true)}
                    className="w-full sm:w-auto bg-blue-600 text-white px-8 py-3.5 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all"
                >
                    New Request
                </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {leaves.map(l => (
                    <div key={l.id} className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 relative group hover:shadow-md transition-shadow">
                        <div className={`absolute top-0 right-0 px-3 sm:px-4 py-1 rounded-bl-xl rounded-tr-2xl sm:rounded-tr-3xl text-[9px] sm:text-[10px] font-black uppercase ${l.status === 'approved' ? 'bg-green-500 text-white' : l.status === 'rejected' ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'}`}>{l.status}</div>
                        <h4 className="font-black uppercase mb-1 text-sm sm:text-base pr-12">{l.employee?.name}</h4>
                        <div className="flex gap-2 mb-3"><span className="px-2 py-0.5 bg-gray-50 text-gray-400 rounded text-[7px] font-bold uppercase">{l.type}</span></div>
                        <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-tighter mb-4">{l.start_date} &rarr; {l.end_date}</p>
                        {l.status === 'pending' && (
                            <div className="flex gap-2 border-t pt-4">
                                <button onClick={() => handleStatus(l.id, 'approved')} className="flex-1 bg-green-600 text-white py-2 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-green-700 transition-all">Approve</button>
                                <button onClick={() => handleStatus(l.id, 'rejected')} className="flex-1 bg-red-50 text-red-500 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-red-100 transition-all">Reject</button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {show && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[120] p-4">
                    <div className="bg-white p-12 rounded-[3.5rem] w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-10"><h2 className="text-2xl font-black uppercase">Leave Entry</h2><button onClick={() => setShow(false)} className="bg-gray-100 p-3 rounded-full"><XCircle /></button></div>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            const t = localStorage.getItem('auth_token');
                            await fetch('/api/employee-leaves', {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${t}`,
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json'
                                },
                                body: JSON.stringify(form)
                            });
                            setShow(false);
                            fetchL();
                            if (onUpdate) onUpdate();
                        }} className="space-y-6">
                            <select value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold uppercase text-xs" required><option value="">Staff Select</option>{employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select>
                            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold uppercase text-xs" required>
                                <option value="casual">Casual Leave</option>
                                <option value="sick">Sick Leave</option>
                                <option value="paid">Paid Leave</option>
                                <option value="unpaid">Unpaid Leave</option>
                            </select>
                            <div className="grid grid-cols-2 gap-4">
                                <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" required />
                                <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" required />
                            </div>
                            <textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="Reason for leave..." className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-xs h-24 resize-none" />
                            <button type="submit" className="w-full py-5 bg-orange-600 text-white font-black uppercase tracking-widest rounded-3xl shadow-lg">Submit Request</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function ShiftTab({ onEdit, refreshTrigger }) {
    const [shifts, setShifts] = useState([]);
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('en-GB', { hour12: false }));

    const fetchShifts = async () => {
        const t = localStorage.getItem('auth_token');
        const r = await fetch('/api/employee-shifts', {
            headers: { 'Authorization': `Bearer ${t}`, 'Accept': 'application/json' }
        });
        const d = await r.json(); if (Array.isArray(d)) setShifts(d);
    };

    useEffect(() => {
        fetchShifts();
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString('en-GB', { hour12: false }));
        }, 60000);
        return () => clearInterval(timer);
    }, [refreshTrigger]);

    const isNow = (start, end) => {
        if (!start || !end) return false;
        if (start > end) return currentTime >= start || currentTime <= end;
        return currentTime >= start && currentTime <= end;
    };
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {shifts.map(s => (
                <div key={s.id} onClick={() => onEdit(s)} className={`bg-gray-900 text-white p-8 rounded-[2rem] flex flex-col items-center border border-gray-800 shadow-xl group hover:border-orange-600 transition-all cursor-pointer ${isNow(s.start_time, s.end_time) ? 'ring-2 ring-orange-600 ring-offset-4 ring-offset-gray-900 border-orange-600' : ''}`}>
                    <Clock className={`h-12 w-12 mb-6 group-hover:scale-110 transition-transform ${isNow(s.start_time, s.end_time) ? 'text-orange-500 animate-pulse' : 'text-orange-600'}`} />
                    <h4 className="text-xl font-black uppercase tracking-tight">{s.name}</h4>
                    <p className="text-xs font-bold text-gray-500 mt-4 uppercase tracking-[0.2em]">{s.start_time.substring(0, 5)} - {s.end_time.substring(0, 5)}</p>

                    <div className="mt-8 w-full border-t border-gray-800 pt-6">
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-4">Assigned Staff</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {s.employees?.length > 0 ? (
                                s.employees.map(emp => (
                                    <span key={emp.id} className="px-3 py-1 bg-gray-800 text-[10px] font-bold rounded-lg text-gray-300">{emp.name}</span>
                                ))
                            ) : (
                                <span className="text-[10px] text-gray-600 italic">No staff assigned</span>
                            )}
                        </div>
                    </div>

                    <div className={`mt-8 px-6 py-2 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all ${isNow(s.start_time, s.end_time) ? 'bg-orange-600 text-white border-orange-600 shadow-lg shadow-orange-900/40' : 'bg-gray-800 text-orange-500 border-orange-500/20'}`}>
                        {isNow(s.start_time, s.end_time) ? 'Active Now' : 'Shift Active'}
                    </div>
                </div>
            ))}
        </div>
    );
}



function EmployeeModal({ onClose, onSave, employee = null }) {
    const [shifts, setShifts] = useState([]);
    useEffect(() => {
        const fetchS = async () => {
            const t = localStorage.getItem('auth_token');
            const r = await fetch('/api/employee-shifts', {
                headers: { 'Authorization': `Bearer ${t}`, 'Accept': 'application/json' }
            });
            const d = await r.json(); if (Array.isArray(d)) setShifts(d);
        };
        fetchS();
    }, []);

    const [form, setForm] = useState({
        name: employee?.name || '',
        email: employee?.email || '',
        phone: employee?.phone || '',
        position: employee?.position || '',
        salary: employee?.salary || '',
        commission_rate: employee?.commission_rate || '0',
        hire_date: employee?.hire_date ? employee.hire_date.substring(0, 10) : '',
        role: employee?.role || 'cashier',
        status: employee?.status || 'active',
        gender: employee?.gender || 'male',
        address: employee?.address || '',
        emergency_contact: employee?.emergency_contact || '',
        permissions: employee?.permissions || [],
        shift_ids: employee?.shifts?.map(s => s.id) || (employee?.shift_id ? [employee.shift_id] : [])
    });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const mods = [{ id: 'dashboard', name: 'Dashboard' }, { id: 'inventory', name: 'Inventory' }, { id: 'sales', name: 'POS' }, { id: 'reports', name: 'Reports' }];
    const toggle = (id) => { const p = [...form.permissions]; if (p.includes(id)) setForm({ ...form, permissions: p.filter(x => x !== id) }); else setForm({ ...form, permissions: [...p, id] }); };
    const toggleShift = (id) => { const s = [...form.shift_ids]; if (s.includes(id)) setForm({ ...form, shift_ids: s.filter(x => x !== id) }); else setForm({ ...form, shift_ids: [...s, id] }); };
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[130] p-4 sm:p-6">
            <div className="bg-white rounded-[2rem] sm:rounded-[4rem] w-full max-w-4xl p-6 sm:p-12 overflow-y-auto max-h-[90vh] shadow-2xl">
                <div className="flex justify-between items-center mb-8 sm:mb-12">
                    <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tighter shrink-0">{employee ? 'Update Profile' : 'New Personnel'}</h2>
                    <button onClick={onClose} className="bg-gray-100 p-2 sm:p-4 rounded-full"><XCircle /></button>
                </div>
                <form onSubmit={async e => { e.preventDefault(); setSubmitting(true); const errs = await onSave(form); if (errs) setErrors(errs); setSubmitting(false); }} className="space-y-6 sm:space-y-10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                        <div>
                            <FormInput label="Staff Name" value={form.name} onChange={v => setForm({ ...form, name: v })} required />
                            {errors.name && <p className="text-red-500 text-[10px] font-bold mt-2 px-4 uppercase">{errors.name[0]}</p>}
                        </div>
                        <div>
                            <FormInput label="Official Email" type="email" value={form.email} onChange={v => setForm({ ...form, email: v })} required />
                            {errors.email && <p className="text-red-500 text-[10px] font-bold mt-2 px-4 uppercase">{errors.email[0]}</p>}
                        </div>
                        <div>
                            <FormInput label="Designation" value={form.position} onChange={v => setForm({ ...form, position: v })} required />
                            {errors.position && <p className="text-red-500 text-[10px] font-bold mt-2 px-4 uppercase">{errors.position[0]}</p>}
                        </div>
                        <div>
                            <FormInput label="Phone Number" type="tel" value={form.phone} onChange={v => setForm({ ...form, phone: v })} />
                            {errors.phone && <p className="text-red-500 text-[10px] font-bold mt-2 px-4 uppercase">{errors.phone[0]}</p>}
                        </div>
                        <div className="col-span-2">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Work Shift Assignment</label>
                                <div className="flex flex-wrap gap-4">
                                    {shifts.map(s => (
                                        <button key={s.id} type="button" onClick={() => toggleShift(s.id)} className={`flex-1 min-w-[150px] p-6 rounded-3xl text-left border-2 transition-all ${form.shift_ids.includes(s.id) ? 'bg-orange-50 border-orange-600 text-orange-950 shadow-md' : 'bg-gray-50 border-transparent text-gray-400 opacity-60 hover:opacity-100'}`}>
                                            <div className="flex justify-between items-start">
                                                <div className="text-[10px] font-black uppercase tracking-widest">{s.name}</div>
                                                {form.shift_ids.includes(s.id) && <CheckCircle className="h-4 w-4 text-orange-600" />}
                                            </div>
                                            <div className="text-[9px] font-bold mt-2 opacity-60 tracking-wider font-mono">{s.start_time.substring(0, 5)} - {s.end_time.substring(0, 5)}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Gender Identification</label>
                            <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-3xl p-6 font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 transition-all uppercase text-xs">
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <FormInput label="Emergency Response Contact" value={form.emergency_contact} onChange={v => setForm({ ...form, emergency_contact: v })} placeholder="Contact Name & Phone" />
                        </div>
                        <div className="col-span-2">
                            <FormInput label="Residential/Permanent Address" value={form.address} onChange={v => setForm({ ...form, address: v })} placeholder="Complete street address, city, state" />
                        </div>
                        <div>
                            <FormInput label="Base Salary" type="number" value={form.salary} onChange={v => setForm({ ...form, salary: v })} />
                            {errors.salary && <p className="text-red-500 text-[10px] font-bold mt-2 px-4 uppercase">{errors.salary[0]}</p>}
                        </div>
                        <div>
                            <FormInput label="Commission %" type="number" step="0.01" value={form.commission_rate} onChange={v => setForm({ ...form, commission_rate: v })} />
                            {errors.commission_rate && <p className="text-red-500 text-[10px] font-bold mt-2 px-4 uppercase">{errors.commission_rate[0]}</p>}
                        </div>
                        <div>
                            <FormInput label="Joining Date" type="date" value={form.hire_date} onChange={v => setForm({ ...form, hire_date: v })} required />
                            {errors.hire_date && <p className="text-red-500 text-[10px] font-bold mt-2 px-4 uppercase">{errors.hire_date[0]}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Job Role Hierarchy</label>
                            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-3xl p-6 font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 transition-all uppercase text-xs" required>
                                <option value="cashier">Cashier</option>
                                <option value="manager">Manager</option>
                                <option value="admin">Administrator</option>
                                <option value="inventory_manager">Warehouse Lead</option>
                                <option value="sales_person">Sales Executive</option>
                            </select>
                            {errors.role && <p className="text-red-500 text-[10px] font-bold mt-2 px-4 uppercase">{errors.role[0]}</p>}
                        </div>
                    </div>
                    <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 sm:mb-6">Operational Permissions Matrix</p><div className="flex flex-wrap gap-2 sm:gap-4">{mods.map(m => <button key={m.id} type="button" onClick={() => toggle(m.id)} className={`flex-1 sm:flex-none px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider border-2 transition-all ${form.permissions.includes(m.id) ? 'bg-gradient-to-r from-[#FF7d1f] to-[#2b59ff] border-transparent text-white shadow-xl' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-800 text-gray-400 opacity-60'}`}>{m.name}</button>)}</div></div>
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <button type="submit" disabled={submitting} className="flex-1 order-1 sm:order-2 py-4 sm:py-6 bg-gradient-to-r from-[#FF7d1f] to-[#2b59ff] text-white font-black uppercase text-xs tracking-widest rounded-2xl sm:rounded-[2.5rem] hover:opacity-90 transition-all shadow-2xl disabled:opacity-50">
                            {submitting ? 'PROCESSING...' : (employee ? 'COMMIT UPDATES' : 'FINALIZE REGISTRATION')}
                        </button>
                        <button type="button" onClick={onClose} className="flex-1 order-2 sm:order-1 py-4 sm:py-6 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 font-black uppercase text-xs tracking-widest rounded-2xl sm:rounded-[2.5rem] hover:bg-gray-100 dark:hover:bg-gray-700">EXIT</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function ShiftSettingsModal({ shift, onClose, onSave }) {
    const [form, setForm] = useState({
        name: shift.name,
        start_time: shift.start_time,
        end_time: shift.end_time,
        late_threshold: shift.late_threshold
    });
    const [submitting, setSubmitting] = useState(false);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[130] p-4">
            <div className="bg-white rounded-[3rem] w-full max-w-lg p-12 shadow-2xl relative">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-black uppercase tracking-tight">Shift Settings</h2>
                    <button onClick={onClose} className="bg-gray-100 p-2 rounded-full hover:bg-red-50 hover:text-red-600 transition-all"><XCircle /></button>
                </div>
                <form onSubmit={async e => { e.preventDefault(); setSubmitting(true); await onSave(form); setSubmitting(false); }} className="space-y-6">
                    <FormInput label="Shift Name" value={form.name} onChange={v => setForm({ ...form, name: v })} required />
                    <div className="grid grid-cols-2 gap-4">
                        <FormInput label="Start Time" type="time" value={form.start_time} onChange={v => setForm({ ...form, start_time: v })} required />
                        <FormInput label="End Time" type="time" value={form.end_time} onChange={v => setForm({ ...form, end_time: v })} required />
                    </div>
                    <FormInput label="Late Grace (Mins)" type="number" value={form.late_threshold} onChange={v => setForm({ ...form, late_threshold: v })} required />

                    <div className="pt-4">
                        <button type="submit" disabled={submitting} className="w-full py-5 bg-gradient-to-r from-[#FF7d1f] to-[#2b59ff] text-white font-black uppercase text-xs tracking-widest rounded-[2rem] hover:opacity-90 transition-all shadow-xl disabled:opacity-50">
                            {submitting ? 'SAVING CHANGES...' : 'COMMIT SETTINGS'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function FormInput({ label, type = "text", value, onChange, ...props }) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">{label}</label>
            <input type={type} value={value} onChange={e => onChange(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-[2rem] p-6 font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 transition-all" {...props} />
        </div>
    );
}
