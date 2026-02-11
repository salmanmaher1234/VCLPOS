import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Clock, TrendingUp, Search, Filter, Calendar, DollarSign, Shield, FileText, Activity, Trash2, Edit2, CheckCircle, XCircle, Printer, Plus } from 'lucide-react';
import Link from '../components/Link';

export default function Employees() {
    const [activeTab, setActiveTab] = useState('employees');
    const [employees, setEmployees] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [filterRole, setFilterRole] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

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
            if (response.ok) { fetchEmployees(); fetchStats(); setShowAddModal(false); }
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
            if (response.ok) { fetchEmployees(); fetchStats(); setEditingEmployee(null); }
            else { throw data; }
        } catch (error) {
            console.error('Error:', error);
            if (error.errors) return error.errors;
            alert(error.message || 'Failed to update employee');
        }
    };

    return (
        <main className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-50/50 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight uppercase">Workforce Center</h1>
                        <p className="text-gray-500 font-medium tracking-tight">Enterprise POS Management Suite</p>
                    </div>
                    <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-orange-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl">
                        RECRUIT STAFF
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <StatCard icon={Users} label="Total Staff" value={stats.total_employees || 0} color="blue" />
                    <StatCard icon={CheckCircle} label="Active" value={stats.active_employees || 0} color="green" />
                    <StatCard icon={Clock} label="Today" value={stats.today_present || 0} color="orange" />
                    <StatCard icon={TrendingUp} label="Rating" value={stats.avg_performance || 0} color="purple" />
                </div>

                {/* Main Navigation Tabs */}
                <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100">
                    <nav className="flex overflow-x-auto px-8 py-4 gap-2 border-b">
                        <TabButton active={activeTab === 'employees'} onClick={() => setActiveTab('employees')}>Staff</TabButton>
                        <TabButton active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')}>Attendance</TabButton>
                        <TabButton active={activeTab === 'payroll'} onClick={() => setActiveTab('payroll')}>Payroll</TabButton>
                        <TabButton active={activeTab === 'leaves'} onClick={() => setActiveTab('leaves')}>Leaves</TabButton>
                        <TabButton active={activeTab === 'performance'} onClick={() => setActiveTab('performance')}>Performance</TabButton>
                        <TabButton active={activeTab === 'shifts'} onClick={() => setActiveTab('shifts')}>Shifts</TabButton>
                        <TabButton active={activeTab === 'activity'} onClick={() => setActiveTab('activity')}>Activity Logs</TabButton>
                    </nav>

                    <div className="p-8">
                        {activeTab === 'employees' && (
                            <EmployeeList employees={employees} onEdit={(emp) => setEditingEmployee(emp)} filterRole={filterRole} setFilterRole={setFilterRole} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                        )}
                        {activeTab === 'attendance' && <AttendanceTab />}
                        {activeTab === 'performance' && <PerformanceTab />}
                        {activeTab === 'payroll' && <PayrollTab />}
                        {activeTab === 'leaves' && <LeaveTab employees={employees} />}
                        {activeTab === 'shifts' && <ShiftTab />}
                        {activeTab === 'activity' && <ActivityTab />}
                    </div>
                </div>
            </div>

            {showAddModal && <EmployeeModal onClose={() => setShowAddModal(false)} onSave={handleAddEmployee} />}
            {editingEmployee && <EmployeeModal employee={editingEmployee} onClose={() => setEditingEmployee(null)} onSave={handleUpdateEmployee} />}
        </main>
    );
}

function StatCard({ icon: Icon, label, value, color }) {
    return (
        <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-sm flex items-center gap-6">
            <div className="p-4 rounded-2xl bg-gray-50 uppercase shadow-sm">
                <Icon className="h-8 w-8 text-orange-600" />
            </div>
            <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
                <p className="text-3xl font-black">{value}</p>
            </div>
        </div>
    );
}

function TabButton({ children, active, onClick }) {
    return (
        <button onClick={onClick} className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${active ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-gray-600'}`}>
            {children}
        </button>
    );
}

function EmployeeList({ employees, onEdit, filterRole, setFilterRole, searchTerm, setSearchTerm }) {
    if (!Array.isArray(employees)) return null;
    return (
        <div className="space-y-6">
            <div className="flex gap-4 items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-6 py-4 rounded-2xl bg-gray-50 border-none font-bold" />
                </div>
                <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="px-6 py-4 rounded-2xl bg-gray-50 border-none font-bold text-xs uppercase cursor-pointer">
                    <option value="all">Every Role</option>
                    <option value="admin">Admins</option>
                    <option value="manager">Managers</option>
                    <option value="cashier">Cashiers</option>
                </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {employees.map((emp) => (
                    <Link key={emp.id} href={`/react/employees/${emp.id}`} className="block">
                        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm relative group hover:-translate-y-1 transition-all h-full">
                            <div className="flex items-center gap-6 mb-8">
                                <div className="h-16 w-16 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 text-2xl font-black">{emp.name.charAt(0)}</div>
                                <div>
                                    <h3 className="text-xl font-black leading-none mb-1">{emp.name}</h3>
                                    <p className="text-xs font-bold text-orange-600 uppercase tracking-widest">{emp.position}</p>
                                </div>
                            </div>
                            <div className="space-y-2 mb-8 text-xs font-bold uppercase tracking-tighter">
                                <div className="flex justify-between"><span className="text-gray-400">ID</span><span>{emp.employee_code}</span></div>
                                <div className="flex justify-between"><span className="text-gray-400">Status</span><span className="text-green-600">{emp.status}</span></div>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onEdit(emp);
                                }}
                                className="w-full py-4 bg-gray-50 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-orange-600 hover:text-white transition-all"
                            >
                                Edit Profile
                            </button>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

function AttendanceTab() {
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
    }, [selectedDate]);

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
            }
        } catch (error) {
            console.error('Attendance Error:', error);
        } finally {
            setMarking(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex bg-gray-50 p-6 rounded-[2rem] items-center justify-between border border-gray-100">
                <div className="flex items-center gap-4">
                    <Calendar className="h-6 w-6 text-orange-600" />
                    <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent border-none font-black uppercase text-xs" />
                </div>
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Manual Override System</div>
            </div>

            <div className="bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/50 text-[10px] font-black uppercase text-gray-400 border-b">
                        <tr>
                            <th className="p-8">Staff Member</th>
                            <th className="p-8">Current Status</th>
                            <th className="p-8 text-center">Clock In/Out</th>
                            <th className="p-8 text-right">Physical Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y text-xs font-bold">
                        {attendance.map(r => (
                            <tr key={r.employee_id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="p-8">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 font-black">{r.employee_name.charAt(0)}</div>
                                        <div>
                                            <p className="font-black text-sm">{r.employee_name}</p>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-tighter">{r.employee_code}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-8">
                                    <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${r.status === 'present' ? 'bg-green-100 text-green-700' :
                                            r.status === 'absent' ? 'bg-red-100 text-red-700' :
                                                'bg-orange-100 text-orange-700'
                                        }`}>
                                        {r.status}
                                    </span>
                                </td>
                                <td className="p-8">
                                    <div className="flex items-center justify-center gap-2">
                                        <input
                                            type="time"
                                            value={r.time_in || ''}
                                            onChange={(e) => handleMark(r.employee_id, r.status, e.target.value, r.time_out)}
                                            className="bg-gray-50 border-none rounded-lg p-2 text-[10px] font-black"
                                        />
                                        <span className="text-gray-300">→</span>
                                        <input
                                            type="time"
                                            value={r.time_out || ''}
                                            onChange={(e) => handleMark(r.employee_id, r.status, r.time_in, e.target.value)}
                                            className="bg-gray-50 border-none rounded-lg p-2 text-[10px] font-black"
                                        />
                                    </div>
                                </td>
                                <td className="p-8 text-right">
                                    <select
                                        value={r.status}
                                        disabled={marking === r.employee_id}
                                        onChange={(e) => handleMark(r.employee_id, e.target.value, r.time_in, r.time_out)}
                                        className="bg-black text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-gray-800 transition-all border-none"
                                    >
                                        <option value="present">Mark Present</option>
                                        <option value="absent">Mark Absent</option>
                                        <option value="late">Mark Late</option>
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

function PerformanceTab() {
    const [performance, setPerformance] = useState([]);
    useEffect(() => {
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
        fetchP();
    }, []);
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {performance.map(p => (
                <div key={p.id} className="bg-white p-8 rounded-3xl border shadow-sm">
                    <div className="flex justify-between items-start mb-6">
                        <h4 className="font-black uppercase">{p.employee?.name}</h4>
                        <div className="px-3 py-1 bg-orange-50 text-orange-600 rounded-lg font-black">{p.rating}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl flex justify-between font-black text-xs">
                        <span className="text-gray-400 uppercase">SALES VOL.</span><span>$ {Number(p.sales_amount).toLocaleString()}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}

function PayrollTab() {
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
    useEffect(() => { fetchPay(); }, [month]);

    const handleGen = async () => {
        const token = localStorage.getItem('auth_token');
        await fetch('/api/employee-payrolls/generate', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ month })
        });
        fetchPay();
    };

    return (
        <div className="space-y-6">
            <div className="flex bg-gray-900 text-white p-8 rounded-[2rem] items-center justify-between">
                <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="bg-gray-800 border-none rounded-xl px-6 py-3 font-bold text-white uppercase text-xs" />
                <button onClick={handleGen} className="bg-orange-600 px-8 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-orange-500">Initialize Cycle</button>
            </div>
            <div className="bg-white rounded-2xl border overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-[10px] uppercase font-black text-gray-400"><tr><th className="p-6">Staff</th><th className="p-6">Base</th><th className="p-6 text-right">Net Disbursement</th><th className="p-6">Status</th></tr></thead>
                    <tbody className="divide-y text-xs font-bold uppercase">
                        {payrolls.map(py => (
                            <tr key={py.id} className="hover:bg-gray-50"><td className="p-6">{py.employee?.name}</td><td className="p-6 text-gray-400">$ {py.basic_salary}</td><td className="p-6 text-right text-lg font-black">$ {Number(py.net_salary).toLocaleString()}</td><td className="p-6">{py.status}</td></tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function LeaveTab({ employees }) {
    const [leaves, setLeaves] = useState([]);
    const [show, setShow] = useState(false);
    const [form, setForm] = useState({ employee_id: '', start_date: '', end_date: '', reason: '' });
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
    useEffect(() => { fetchL(); }, []);
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-blue-50 p-6 rounded-3xl"><h3 className="text-xl font-black uppercase text-blue-900">Vacation Master</h3><button onClick={() => setShow(true)} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-black uppercase text-[10px]">New Request</button></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {leaves.map(l => (
                    <div key={l.id} className="bg-white p-6 rounded-3xl border border-dashed relative">
                        <div className={`absolute top-0 right-0 px-4 py-1 bg-orange-500 text-white rounded-bl-xl text-[10px] font-black uppercase`}>{l.status}</div>
                        <h4 className="font-black uppercase mb-2">{l.employee?.name}</h4><p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">{l.start_date}</p>
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
                        }} className="space-y-6">
                            <select value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold uppercase text-xs" required><option value="">Staff Select</option>{employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select>
                            <div className="grid grid-cols-2 gap-4"><input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" required /><input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" required /></div>
                            <button type="submit" className="w-full py-5 bg-orange-600 text-white font-black uppercase tracking-widest rounded-3xl shadow-lg">Submit Request</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function ShiftTab() {
    const [shifts, setShifts] = useState([]);
    useEffect(() => {
        const f = async () => {
            const t = localStorage.getItem('auth_token');
            const r = await fetch('/api/employee-shifts', {
                headers: {
                    'Authorization': `Bearer ${t}`,
                    'Accept': 'application/json'
                }
            });
            const d = await r.json(); if (Array.isArray(d)) setShifts(d);
        };
        f();
    }, []);
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {shifts.map(s => (
                <div key={s.id} className="bg-gray-900 text-white p-8 rounded-[2rem] flex flex-col items-center border border-gray-800 shadow-xl">
                    <Clock className="h-12 w-12 text-orange-600 mb-6" />
                    <h4 className="text-xl font-black uppercase tracking-tight">{s.name}</h4><p className="text-xs font-bold text-gray-500 mt-4 uppercase tracking-[0.2em]">{s.start_time.substring(0, 5)} - {s.end_time.substring(0, 5)}</p>
                </div>
            ))}
        </div>
    );
}

function ActivityTab() {
    const [logs, setLogs] = useState([]);
    useEffect(() => {
        const fetchL = async () => {
            const token = localStorage.getItem('auth_token');
            const r = await fetch('/api/employee-activity-logs', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            const d = await r.json(); if (Array.isArray(d)) setLogs(d);
        };
        fetchL();
    }, []);

    return (
        <div className="space-y-6">
            <div className="bg-gray-900 rounded-3xl p-8 text-white flex justify-between items-center">
                <h3 className="text-xl font-black uppercase">Security & Audit Rail</h3>
                <Activity className="h-8 w-8 text-orange-600 animate-pulse" />
            </div>
            <div className="space-y-4">
                {logs.map(log => (
                    <div key={log.id} className="bg-white p-6 rounded-2xl border flex items-center gap-6 group hover:border-orange-200 transition-all">
                        <div className="h-12 w-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-orange-600">
                            <Shield className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-sm tracking-tight"><span className="text-orange-600">{log.employee?.name}</span> executed <span className="uppercase text-orange-600">{log.action}</span></p>
                            <p className="text-[10px] font-black text-gray-400 uppercase mt-1">{new Date(log.created_at).toLocaleString()}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function EmployeeModal({ onClose, onSave, employee = null }) {
    const [form, setForm] = useState({ name: employee?.name || '', email: employee?.email || '', position: employee?.position || '', salary: employee?.salary || '', hire_date: employee?.hire_date || '', role: employee?.role || 'cashier', status: employee?.status || 'active', permissions: employee?.permissions || [] });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const mods = [{ id: 'dashboard', name: 'Dashboard' }, { id: 'inventory', name: 'Inventory' }, { id: 'sales', name: 'POS' }, { id: 'reports', name: 'Reports' }];
    const toggle = (id) => { const p = [...form.permissions]; if (p.includes(id)) setForm({ ...form, permissions: p.filter(x => x !== id) }); else setForm({ ...form, permissions: [...p, id] }); };
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[130] p-4">
            <div className="bg-white rounded-[4rem] w-full max-w-4xl p-12 overflow-y-auto max-h-[90vh] shadow-2xl">
                <div className="flex justify-between items-center mb-12"><h2 className="text-4xl font-black uppercase tracking-tighter">Personnel Master</h2><button onClick={onClose} className="bg-gray-100 p-4 rounded-full"><XCircle /></button></div>
                <form onSubmit={async e => { e.preventDefault(); setSubmitting(true); const errs = await onSave(form); if (errs) setErrors(errs); setSubmitting(false); }} className="space-y-10">
                    <div className="grid grid-cols-2 gap-8">
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
                            <FormInput label="Base Salary" type="number" value={form.salary} onChange={v => setForm({ ...form, salary: v })} />
                            {errors.salary && <p className="text-red-500 text-[10px] font-bold mt-2 px-4 uppercase">{errors.salary[0]}</p>}
                        </div>
                        <div>
                            <FormInput label="Hire Date" type="date" value={form.hire_date} onChange={v => setForm({ ...form, hire_date: v })} required />
                            {errors.hire_date && <p className="text-red-500 text-[10px] font-bold mt-2 px-4 uppercase">{errors.hire_date[0]}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Job Role</label>
                            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full bg-gray-50 border-none rounded-3xl p-6 font-bold text-gray-900 focus:ring-4 focus:ring-orange-100 transition-all uppercase text-xs" required>
                                <option value="cashier">Cashier</option>
                                <option value="manager">Manager</option>
                                <option value="admin">Administrator</option>
                                <option value="inventory_manager">Warehouse Lead</option>
                                <option value="sales_person">Sales Executive</option>
                            </select>
                            {errors.role && <p className="text-red-500 text-[10px] font-bold mt-2 px-4 uppercase">{errors.role[0]}</p>}
                        </div>
                    </div>
                    <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Functional Permissions Matrix</p><div className="flex flex-wrap gap-4">{mods.map(m => <button key={m.id} type="button" onClick={() => toggle(m.id)} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider border-2 transition-all ${form.permissions.includes(m.id) ? 'bg-orange-600 border-orange-600 text-white shadow-xl' : 'bg-white border-gray-100 text-gray-400 opacity-60'}`}>{m.name}</button>)}</div></div>
                    <div className="flex gap-4 pt-4"><button type="submit" disabled={submitting} className="flex-1 py-6 bg-black text-white font-black uppercase text-xs tracking-widest rounded-3xl hover:bg-gray-900 transition-all shadow-2xl disabled:opacity-50">{submitting ? 'PROCESSING...' : 'COMMIT DATA'}</button><button type="button" onClick={onClose} className="flex-1 py-6 bg-gray-50 font-black uppercase text-xs tracking-widest rounded-3xl">EXIT</button></div>
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
                className="w-full bg-gray-50 border-none rounded-3xl p-6 font-bold text-gray-900 focus:ring-4 focus:ring-orange-100 transition-all" {...props} />
        </div>
    );
}
