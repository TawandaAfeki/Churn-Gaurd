// Configuration
const API_BASE_URL = 'https://churnguard-backend.onrender.com/api';

// State Management
const state = {
    user: null,
    token: null,
    customers: [],
    currentCustomer: null,
    charts: {}
};

// Sample Data for Demo
const generateSampleData = () => {
    const customers = [
        {
            id: '1',
            name: 'Acme Corp',
            email: 'contact@acme.com',
            mrr: 2500,
            contract_end_date: '2025-06-15',
            status: 'active',
            health_score: 85,
            risk_level: 'low',
            last_login: '2 hours ago',
            support_tickets: 1,
            features_used: 8,
            payment_status: 'current'
        },
        {
            id: '2',
            name: 'TechStart Inc',
            email: 'hello@techstart.io',
            mrr: 1200,
            contract_end_date: '2025-01-20',
            status: 'active',
            health_score: 32,
            risk_level: 'high',
            last_login: '14 days ago',
            support_tickets: 5,
            features_used: 3,
            payment_status: 'current'
        },
        {
            id: '3',
            name: 'DataFlow Solutions',
            email: 'team@dataflow.com',
            mrr: 4500,
            contract_end_date: '2025-09-30',
            status: 'active',
            health_score: 92,
            risk_level: 'low',
            last_login: '1 day ago',
            support_tickets: 0,
            features_used: 12,
            payment_status: 'current'
        },
        {
            id: '4',
            name: 'CloudNine Systems',
            email: 'ops@cloudnine.io',
            mrr: 3200,
            contract_end_date: '2025-04-15',
            status: 'active',
            health_score: 58,
            risk_level: 'medium',
            last_login: '5 days ago',
            support_tickets: 3,
            features_used: 6,
            payment_status: 'late'
        },
        {
            id: '5',
            name: 'InnovateLabs',
            email: 'hello@innovatelabs.com',
            mrr: 1800,
            contract_end_date: '2025-03-10',
            status: 'active',
            health_score: 45,
            risk_level: 'medium',
            last_login: '8 days ago',
            support_tickets: 4,
            features_used: 4,
            payment_status: 'current'
        },
        {
            id: '6',
            name: 'Quantum Analytics',
            email: 'support@quantum.ai',
            mrr: 5600,
            contract_end_date: '2025-12-01',
            status: 'active',
            health_score: 88,
            risk_level: 'low',
            last_login: '3 hours ago',
            support_tickets: 1,
            features_used: 10,
            payment_status: 'current'
        },
        {
            id: '7',
            name: 'FastTrack Digital',
            email: 'info@fasttrack.co',
            mrr: 2100,
            contract_end_date: '2025-02-28',
            status: 'active',
            health_score: 28,
            risk_level: 'high',
            last_login: '21 days ago',
            support_tickets: 7,
            features_used: 2,
            payment_status: 'failed'
        },
        {
            id: '8',
            name: 'GrowthHub Inc',
            email: 'admin@growthhub.com',
            mrr: 3800,
            contract_end_date: '2025-07-20',
            status: 'active',
            health_score: 76,
            risk_level: 'low',
            last_login: '1 day ago',
            support_tickets: 2,
            features_used: 9,
            payment_status: 'current'
        },
        {
            id: '9',
            name: 'Synergy Partners',
            email: 'contact@synergyp.com',
            mrr: 2900,
            contract_end_date: '2025-05-15',
            status: 'active',
            health_score: 62,
            risk_level: 'medium',
            last_login: '4 days ago',
            support_tickets: 2,
            features_used: 7,
            payment_status: 'current'
        },
        {
            id: '10',
            name: 'NextGen Tech',
            email: 'hello@nextgentech.io',
            mrr: 4200,
            contract_end_date: '2025-08-30',
            status: 'active',
            health_score: 81,
            risk_level: 'low',
            last_login: '12 hours ago',
            support_tickets: 1,
            features_used: 11,
            payment_status: 'current'
        },
        {
            id: '11',
            name: 'Velocity Software',
            email: 'team@velocity.com',
            mrr: 1500,
            contract_end_date: '2025-03-01',
            status: 'active',
            health_score: 38,
            risk_level: 'high',
            last_login: '16 days ago',
            support_tickets: 6,
            features_used: 3,
            payment_status: 'late'
        },
        {
            id: '12',
            name: 'Pinnacle Solutions',
            email: 'info@pinnacle.com',
            mrr: 6200,
            contract_end_date: '2025-11-15',
            status: 'active',
            health_score: 94,
            risk_level: 'low',
            last_login: '2 hours ago',
            support_tickets: 0,
            features_used: 13,
            payment_status: 'current'
        }
    ];

    state.customers = customers;
    return customers;
};

// Utility Functions
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
};

const calculateDashboardMetrics = () => {
    const customers = state.customers;
    const total = customers.length;
    const highRisk = customers.filter(c => c.risk_level === 'high').length;
    const atRiskMRR = customers
        .filter(c => c.risk_level === 'high')
        .reduce((sum, c) => sum + c.mrr, 0);
    const avgScore = Math.round(
        customers.reduce((sum, c) => sum + c.health_score, 0) / total
    );

    return { total, highRisk, atRiskMRR, avgScore };
};

// Authentication Functions
const showRegisterPage = () => {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('registerPage').style.display = 'block';
};

const showLoginPage = () => {
    document.getElementById('registerPage').style.display = 'none';
    document.getElementById('loginPage').style.display = 'block';
};

const handleLogin = async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // AFTER successful login
state.token = data.access_token;
localStorage.setItem("token", data.access_token);

// TEMP demo user (until /me endpoint exists)
state.user = {
    email: email,
    full_name: email.split("@")[0], // better than "Admin"
    company_name: "ChoandCo"
};

// 👇 THIS WAS MISSING
generateSampleData();

    updateUserInfo();
    initializeDashboard();

    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('app').style.display = 'flex';

    // Load sample data and initialize
    generateSampleData();
    updateUserInfo();
    initializeDashboard();
};

const handleRegister = async (e) => {
    e.preventDefault();
    const fullName = document.getElementById('registerFullName').value;
    const company = document.getElementById('registerCompany').value;
    const email = document.getElementById('registerEmail').value;

    const handleLogin = async (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const res = await fetch(`${API_BASE_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        if (!res.ok) {
            throw new Error("Invalid credentials");
        }

        // ✅ THIS WAS MISSING
        const data = await res.json();

        state.token = data.access_token;
        localStorage.setItem("token", data.access_token);

        state.user = {
            email: email,
            full_name: email.split("@")[0],
            company_name: "ChoandCo"
        };
        localStorage.setItem("user", JSON.stringify(state.user));

        // Show app BEFORE updating UI
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('app').style.display = 'flex';

        generateSampleData();   // demo customers
        updateUserInfo();
        initializeDashboard();

    } catch (err) {
        console.error(err);
        alert("Login failed. Check email or password.");
    }
};



    document.getElementById('registerPage').style.display = 'none';
    document.getElementById('app').style.display = 'flex';

    // Load sample data and initialize
    generateSampleData();
    updateUserInfo();
    initializeDashboard();
};

const handleLogout = () => {
    state.user = null;
    state.token = null;
    state.customers = [];
    document.getElementById('app').style.display = 'none';
    document.getElementById('loginPage').style.display = 'block';
    document.getElementById('loginForm').reset();
};

const updateUserInfo = () => {
    if (state.user) {
        const initials = state.user.full_name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase();
        document.querySelector('.user-avatar').textContent = initials;
        document.getElementById('userName').textContent = state.user.full_name;
        document.getElementById('userEmail').textContent = state.user.email;
    }
};

// Navigation
const navigateToPage = (pageName) => {
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-page="${pageName}"]`).classList.add('active');

    // Update pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(`${pageName}Page`).classList.add('active');

    // Initialize page-specific content
    if (pageName === 'dashboard') {
        initializeDashboard();
    } else if (pageName === 'customers') {
        renderCustomersTable();
    } else if (pageName === 'analytics') {
        initializeAnalytics();
    }
};

// Dashboard Functions
const initializeDashboard = () => {
    updateDashboardMetrics();
    renderChurnTrendChart();
    renderRiskDistributionChart();
    renderUrgentActions();
};

const updateDashboardMetrics = () => {
    const metrics = calculateDashboardMetrics();
    document.getElementById('totalCustomers').textContent = metrics.total;
    document.getElementById('highRiskCount').textContent = metrics.highRisk;
    document.getElementById('atRiskMRR').textContent = formatCurrency(metrics.atRiskMRR);
    document.getElementById('avgHealthScore').textContent = metrics.avgScore;
};

const renderChurnTrendChart = () => {
    const ctx = document.getElementById('churnTrendChart');
    if (!ctx) return;

    // Destroy existing chart
    if (state.charts.churnTrend) {
        state.charts.churnTrend.destroy();
    }

    state.charts.churnTrend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'High Risk Customers',
                data: [2, 3, 2, 4, 3, 2, 3, 2, 2, 3, 2, 2],
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                tension: 0.4,
                fill: true
            }, {
                label: 'Medium Risk Customers',
                data: [3, 4, 3, 3, 4, 3, 4, 3, 3, 3, 3, 3],
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
};

const renderRiskDistributionChart = () => {
    const ctx = document.getElementById('riskDistributionChart');
    if (!ctx) return;

    // Destroy existing chart
    if (state.charts.riskDistribution) {
        state.charts.riskDistribution.destroy();
    }

    const lowRisk = state.customers.filter(c => c.risk_level === 'low').length;
    const mediumRisk = state.customers.filter(c => c.risk_level === 'medium').length;
    const highRisk = state.customers.filter(c => c.risk_level === 'high').length;

    state.charts.riskDistribution = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Low Risk', 'Medium Risk', 'High Risk'],
            datasets: [{
                data: [lowRisk, mediumRisk, highRisk],
                backgroundColor: ['#10b981', '#f59e0b', '#ef4444']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
};

const renderUrgentActions = () => {
    const highRiskCustomers = state.customers
        .filter(c => c.risk_level === 'high')
        .slice(0, 5);

    const html = highRiskCustomers.map(customer => `
        <div class="action-item">
            <div class="action-priority high"></div>
            <div class="action-content">
                <div class="action-title">Critical: ${customer.name}</div>
                <div class="action-description">
                    Health score: ${customer.health_score} | Last login: ${customer.last_login} | ${customer.support_tickets} open tickets
                </div>
            </div>
            <button class="btn-view" onclick="viewCustomerDetail('${customer.id}')">View</button>
        </div>
    `).join('');

    document.getElementById('urgentActionsList').innerHTML = html || '<p>No urgent actions at this time.</p>';
};

// Customers Functions
const renderCustomersTable = (filter = 'all', search = '') => {
    let customers = [...state.customers];

    // Apply risk filter
    if (filter !== 'all') {
        customers = customers.filter(c => c.risk_level === filter);
    }

    // Apply search
    if (search) {
        customers = customers.filter(c =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.email.toLowerCase().includes(search.toLowerCase())
        );
    }

    const html = customers.map(customer => `
        <tr>
            <td>
                <div class="customer-name">${customer.name}</div>
                <div class="customer-email">${customer.email}</div>
            </td>
            <td>
                <div class="health-score-badge ${customer.risk_level}">
                    ${customer.health_score}
                </div>
            </td>
            <td>
                <span class="risk-badge ${customer.risk_level}">
                    ${customer.risk_level.charAt(0).toUpperCase() + customer.risk_level.slice(1)} Risk
                </span>
            </td>
            <td>${formatCurrency(customer.mrr)}</td>
            <td>${customer.last_login}</td>
            <td>
                <button class="btn-view" onclick="viewCustomerDetail('${customer.id}')">View</button>
            </td>
        </tr>
    `).join('');

    document.getElementById('customersTableBody').innerHTML = html || '<tr><td colspan="6" style="text-align: center;">No customers found</td></tr>';
};

const viewCustomerDetail = (customerId) => {
    const customer = state.customers.find(c => c.id === customerId);
    if (!customer) return;

    state.currentCustomer = customer;

    // Update customer detail page
    document.getElementById('customerDetailName').textContent = customer.name;
    document.getElementById('customerDetailEmail').textContent = customer.email;
    document.getElementById('customerDetailMRR').textContent = formatCurrency(customer.mrr);
    document.getElementById('customerDetailContract').textContent = customer.contract_end_date;
    document.getElementById('customerDetailStatus').textContent = customer.status;
    document.getElementById('customerHealthScore').textContent = customer.health_score;

    const riskBadge = document.getElementById('customerRiskBadge');
    riskBadge.textContent = `${customer.risk_level.charAt(0).toUpperCase() + customer.risk_level.slice(1)} Risk`;
    riskBadge.className = `risk-badge ${customer.risk_level}`;

    // Render health gauge
    renderHealthGauge(customer.health_score, customer.risk_level);

    // Render score breakdown
    renderScoreBreakdown(customer);

    // Render recommended actions
    renderRecommendedActions(customer);

    // Navigate to detail page
    navigateToPage('customerDetail');
};

const renderHealthGauge = (score, riskLevel) => {
    const ctx = document.getElementById('healthGauge');
    if (!ctx) return;

    // Destroy existing chart
    if (state.charts.healthGauge) {
        state.charts.healthGauge.destroy();
    }

    const color = riskLevel === 'low' ? '#10b981' : riskLevel === 'medium' ? '#f59e0b' : '#ef4444';

    state.charts.healthGauge = new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [score, 100 - score],
                backgroundColor: [color, '#e2e8f0'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false
                }
            }
        }
    });
};

const renderScoreBreakdown = (customer) => {
    const factors = [
        { label: 'Login Activity', score: customer.health_score >= 70 ? 30 : customer.health_score >= 40 ? 20 : -20, max: 30 },
        { label: 'Support Activity', score: customer.support_tickets <= 2 ? 20 : -15, max: 20 },
        { label: 'Payment Status', score: customer.payment_status === 'current' ? 25 : -20, max: 25 },
        { label: 'Feature Adoption', score: customer.features_used >= 8 ? 15 : 5, max: 15 },
        { label: 'Contract Status', score: 10, max: 10 }
    ];

    const html = factors.map(factor => {
        const percentage = Math.abs(factor.score / factor.max * 100);
        const isPositive = factor.score >= 0;
        return `
            <div class="score-factor">
                <div class="factor-label">${factor.label}</div>
                <div class="factor-bar">
                    <div class="factor-fill ${isPositive ? 'positive' : 'negative'}" style="width: ${percentage}%"></div>
                </div>
                <div class="factor-score">${factor.score > 0 ? '+' : ''}${factor.score}</div>
            </div>
        `;
    }).join('');

    document.getElementById('scoreBreakdown').innerHTML = html;
};

const renderRecommendedActions = (customer) => {
    const actions = [];

    if (customer.health_score < 50) {
        actions.push({
            priority: 'high',
            title: 'Schedule urgent check-in call',
            description: `Customer health is critical (score: ${customer.health_score}). Book executive sponsor call within 48 hours.`
        });
    }

    if (customer.support_tickets > 3) {
        actions.push({
            priority: 'high',
            title: 'Review support ticket history',
            description: `${customer.support_tickets} tickets indicate frustration. Assign dedicated support rep.`
        });
    }

    if (customer.features_used < 5) {
        actions.push({
            priority: 'medium',
            title: 'Offer product training session',
            description: `Only ${customer.features_used}/15 features used. Schedule demo of unused features.`
        });
    }

    if (customer.payment_status !== 'current') {
        actions.push({
            priority: 'high',
            title: 'Address payment issue',
            description: `Payment is ${customer.payment_status}. Contact billing immediately.`
        });
    }

    const html = actions.map(action => `
        <div class="action-item">
            <div class="action-priority ${action.priority}"></div>
            <div class="action-content">
                <div class="action-title">${action.title}</div>
                <div class="action-description">${action.description}</div>
            </div>
            <div class="action-buttons">
                <button class="btn-action btn-complete">Complete</button>
                <button class="btn-action btn-dismiss">Dismiss</button>
            </div>
        </div>
    `).join('');

    document.getElementById('customerActions').innerHTML = html || '<p>No recommended actions at this time.</p>';
};

// Analytics Functions
const initializeAnalytics = () => {
    renderRevenueRiskChart();
};

const renderRevenueRiskChart = () => {
    const ctx = document.getElementById('revenueRiskChart');
    if (!ctx) return;

    if (state.charts.revenueRisk) {
        state.charts.revenueRisk.destroy();
    }

    state.charts.revenueRisk = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Revenue at Risk',
                data: [12000, 15000, 13000, 18000, 14000, 12000, 15000, 13000, 12000, 15000, 11000, 10000],
                backgroundColor: 'rgba(239, 68, 68, 0.7)',
                borderColor: '#ef4444',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value) => '$' + (value / 1000) + 'K'
                    }
                }
            }
        }
    });
};

// Modal Functions
const showModal = (modalId) => {
    document.getElementById(modalId).classList.add('active');
};

const hideModal = (modalId) => {
    document.getElementById(modalId).classList.remove('active');
};

const handleAddCustomer = (e) => {
    e.preventDefault();
    const newCustomer = {
        id: String(state.customers.length + 1),
        name: document.getElementById('newCustomerName').value,
        email: document.getElementById('newCustomerEmail').value,
        mrr: parseFloat(document.getElementById('newCustomerMRR').value),
        contract_end_date: document.getElementById('newCustomerContractEnd').value,
        status: 'active',
        health_score: 70,
        risk_level: 'low',
        last_login: '1 day ago',
        support_tickets: 0,
        features_used: 5,
        payment_status: 'current'
    };

    state.customers.push(newCustomer);
    hideModal('addCustomerModal');
    document.getElementById('addCustomerForm').reset();
    renderCustomersTable();
    updateDashboardMetrics();
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Auth event listeners
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('showRegister').addEventListener('click', (e) => {
        e.preventDefault();
        showRegisterPage();
    });
    document.getElementById('showLogin').addEventListener('click', (e) => {
        e.preventDefault();
        showLoginPage();
    });
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // Navigation event listeners
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.getAttribute('data-page');
            navigateToPage(page);
        });
    });

    // Customer filters
    document.getElementById('customerSearch').addEventListener('input', (e) => {
        const filter = document.getElementById('riskFilter').value;
        renderCustomersTable(filter, e.target.value);
    });

    document.getElementById('riskFilter').addEventListener('change', (e) => {
        const search = document.getElementById('customerSearch').value;
        renderCustomersTable(e.target.value, search);
    });

    // Back button
    document.getElementById('backToCustomers').addEventListener('click', () => {
        navigateToPage('customers');
    });

    // Add customer modal
    document.getElementById('addCustomerBtn').addEventListener('click', () => {
        showModal('addCustomerModal');
    });

    document.getElementById('addCustomerForm').addEventListener('submit', handleAddCustomer);

    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            hideModal('addCustomerModal');
        });
    });

    // Sync data button
    document.getElementById('syncDataBtn').addEventListener('click', () => {
        alert('Data sync initiated! In production, this would sync with your Stripe account.');
    });

    // Connect Stripe button
    document.getElementById('connectStripeBtn').addEventListener('click', () => {
        alert('Stripe OAuth flow would launch here. In production, this redirects to Stripe authorization.');
    });

    // Profile form
    document.getElementById('profileForm').addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Profile updated successfully!');
    });
});

// Make viewCustomerDetail available globally
window.viewCustomerDetail = viewCustomerDetail;
