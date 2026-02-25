const axios = require('axios');

// Base URL
const BASE_URL = 'http://127.0.0.1:8000/api';

// Test data for employees
const testEmployees = [
    {
        name: "John Smith",
        email: "john.smith@company.com",
        phone: "1234567890",
        position: "Sales Manager",
        department: "Sales",
        role: "manager",
        salary: 50000,
        hire_date: "2026-02-01",
        permissions: ["manage_sales", "view_reports", "manage_team"]
    },
    {
        name: "Sarah Johnson",
        email: "sarah.johnson@company.com",
        phone: "0987654321",
        position: "Cashier",
        department: "Sales",
        role: "cashier",
        salary: 30000,
        hire_date: "2026-02-05",
        permissions: ["pos_access", "process_sales"]
    },
    {
        name: "Michael Chen",
        email: "michael.chen@company.com",
        phone: "5551234567",
        position: "Inventory Manager",
        department: "Warehouse",
        role: "inventory_manager",
        salary: 45000,
        hire_date: "2026-01-15",
        permissions: ["manage_inventory", "view_stock", "create_adjustments"]
    },
    {
        name: "Emily Rodriguez",
        email: "emily.rodriguez@company.com",
        phone: "5559876543",
        position: "Sales Person",
        department: "Sales",
        role: "sales_person",
        salary: 35000,
        hire_date: "2026-02-10",
        permissions: ["create_sales", "view_products"]
    },
    {
        name: "David Wilson",
        email: "david.wilson@company.com",
        phone: "5555555555",
        position: "System Administrator",
        department: "IT",
        role: "admin",
        salary: 60000,
        hire_date: "2025-12-01",
        permissions: ["full_access", "manage_users", "system_settings", "view_all_reports"]
    }
];

async function testEmployeeManagement() {
    console.log('🚀 Starting Employee Management System Test...\n');

    // Note: You'll need to replace 'YOUR_AUTH_TOKEN' with an actual token from localStorage
    // For testing, you can get this by logging into the system and checking localStorage
    const AUTH_TOKEN = 'YOUR_AUTH_TOKEN'; // Replace this with actual token

    const headers = {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
    };

    try {
        // 1. Create test employees
        console.log('📝 Creating test employees...');
        for (const employee of testEmployees) {
            try {
                const response = await axios.post(`${BASE_URL}/employees`, employee, { headers });
                console.log(`✅ Created: ${employee.name} (${employee.role}) - Code: ${response.data.employee_code}`);
            } catch (error) {
                console.log(`❌ Failed to create ${employee.name}: ${error.response?.data?.message || error.message}`);
            }
        }

        console.log('\n📊 Fetching employee statistics...');
        // 2. Get statistics
        const statsResponse = await axios.get(`${BASE_URL}/employees-stats`, { headers });
        console.log('Stats:', statsResponse.data);

        console.log('\n📋 Fetching all employees...');
        // 3. Get all employees
        const employeesResponse = await axios.get(`${BASE_URL}/employees`, { headers });
        console.log(`Total employees found: ${employeesResponse.data.length}`);

        console.log('\n👥 Employee List:');
        employeesResponse.data.forEach(emp => {
            console.log(`  - ${emp.employee_code}: ${emp.name} (${emp.role}) - ${emp.email}`);
        });

        // 4. Test attendance clock-in for first employee
        if (employeesResponse.data.length > 0) {
            const firstEmployee = employeesResponse.data[0];
            console.log(`\n⏰ Testing clock-in for ${firstEmployee.name}...`);

            try {
                const clockInResponse = await axios.post(`${BASE_URL}/employees/clock-in-out`, {
                    employee_id: firstEmployee.id,
                    type: 'in'
                }, { headers });
                console.log(`✅ Clock-in successful at ${clockInResponse.data.time_in}`);
            } catch (error) {
                console.log(`❌ Clock-in failed: ${error.response?.data?.message || error.message}`);
            }
        }

        // 5. Test performance update
        if (employeesResponse.data.length > 0) {
            const firstEmployee = employeesResponse.data[0];
            console.log(`\n📈 Testing performance update for ${firstEmployee.name}...`);

            try {
                const perfResponse = await axios.post(`${BASE_URL}/employees-performance`, {
                    employee_id: firstEmployee.id,
                    month: '2026-02',
                    sales_count: 50,
                    sales_amount: 25000,
                    attendance_days: 20,
                    late_days: 2,
                    rating: 4.5,
                    feedback: 'Excellent performance this month!'
                }, { headers });
                console.log(`✅ Performance updated - Score: ${perfResponse.data.performance_score.toFixed(2)}`);
            } catch (error) {
                console.log(`❌ Performance update failed: ${error.response?.data?.message || error.message}`);
            }
        }

        console.log('\n✨ Test completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

// Run the test
testEmployeeManagement();
