// ================================
// Configuration
// ================================
const API_BASE_URL = 'https://churnguard-backend.onrender.com/api';

// ================================
// State
// ================================
const state = {
    user: null,
    token: null,
    customers: [],
    charts: {},
    currentCustomer: null
};

// ================================
// Utilities
// ================================
const formatCurrency = (amount = 0) =>
    new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);

const authHeaders = () => ({
    "Authorization": `Bearer ${state.token}`,
    "Content-Type": "application/json"
});

// ================================
// API Calls
// ================================
const fetchMe = async () => {
    const res = await fetch(`${API_BASE_URL}/me`, { headers: authHeaders() });
    if (!res.ok) throw new Error("Failed to fetch user");
    return res.json();
};

const fetchCustomers = async () => {
    const res = await fetch(`${API_BASE_URL}/customers/dashboard`, {
        headers: authHeaders()
    });
    if (!res.ok) return [];

    const data = await res.json();

    return data.map(c => ({
        id: String(c.id),
        name: c.name,
        email: c.email,
        mrr: Number(c.mrr || 0),
        contract_end_date: c.contract_end_date,
        status: c.status,

        health_score: c.health_score || 0,
        risk_level: c.risk_level || "low",

        last_login: c.last_login_at
            ? new Date(c.last_login_at).toLocaleDateString()
            : "Never",

        support_tickets: c.support_tickets_count || 0,
        features_used: c.features_used || 0,
        payment_status: c.payment_status || "unknown"
    }));
};

const fetchAlerts = async () => {
    const res = await fetch(`${API_BASE_URL}/alerts`, {
        headers: authHeaders()
    });
    if (!res.ok) return [];
    return res.json();
};

// ================================
// Auth
// ================================
const handleLogin = async (e) => {
    e.preventDefault();

    const email = loginEmail.value;
    const password = loginPassword.value;

    try {
        const loginRes = await fetch(`${API_BASE_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        if (!loginRes.ok) throw new Error("Invalid credentials");

        const loginData = await loginRes.json();
        state.token = loginData.access_token;
        localStorage.setItem("token", state.token);

        state.user = await fetchMe();
        localStorage.setItem("user", JSON.stringify(state.user));

        state.customers = await fetchCustomers();

        loginPage.style.display = "none";
        app.style.display = "flex";

        updateUserInfo();
        initializeDashboard();

    } catch (err) {
        alert("Login failed");
        console.error(err);
    }
};

const handleLogout = () => {
    localStorage.clear();
    state.user = null;
    state.token = null;
    state.customers = [];
    app.style.display = "none";
    loginPage.style.display = "block";
};

// ================================
// User UI
// ================================
const updateUserInfo = () => {
    const initials = state.user.full_name
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase();

    document.querySelector(".user-avatar").textContent = initials;
    userName.textContent = state.user.full_name;
    userEmail.textContent = state.user.email;
};

// ================================
// Dashboard Metrics
// ================================
const calculateMetrics = () => {
    const total = state.customers.length;
    const highRisk = state.customers.filter(c => c.risk_level === "high").length;
    const atRiskMRR = state.customers
        .filter(c => c.risk_level === "high")
        .reduce((s, c) => s + c.mrr, 0);
    const avgScore = total
        ? Math.round(state.customers.reduce((s, c) => s + c.health_score, 0) / total)
        : 0;

    return { total, highRisk, atRiskMRR, avgScore };
};

const initializeDashboard = () => {
    const m = calculateMetrics();
    totalCustomers.textContent = m.total;
    highRiskCount.textContent = m.highRisk;
    atRiskMRR.textContent = formatCurrency(m.atRiskMRR);
    avgHealthScore.textContent = m.avgScore;

    renderRiskChart();
    renderUrgentActions();
    renderCustomersTable();
};

// ================================
// Charts
// ================================
const renderRiskChart = () => {
    const ctx = document.getElementById("riskDistributionChart");
    if (!ctx) return;

    if (state.charts.risk) state.charts.risk.destroy();

    const low = state.customers.filter(c => c.risk_level === "low").length;
    const med = state.customers.filter(c => c.risk_level === "medium").length;
    const high = state.customers.filter(c => c.risk_level === "high").length;

    state.charts.risk = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Low", "Medium", "High"],
            datasets: [{
                data: [low, med, high],
                backgroundColor: ["#10b981", "#f59e0b", "#ef4444"]
            }]
        },
        options: { responsive: true }
    });
};

// ================================
// Alerts
// ================================
const renderUrgentActions = async () => {
    const alerts = await fetchAlerts();

    if (!alerts.length) {
        urgentActionsList.innerHTML = "<p>No urgent actions</p>";
        return;
    }

    urgentActionsList.innerHTML = alerts.map(a => `
        <div class="action-item">
            <div class="action-priority ${a.priority}"></div>
            <div class="action-content">
                <div class="action-title">${a.title}</div>
                <div class="action-description">${a.description}</div>
            </div>
        </div>
    `).join("");
};

// ================================
// Customers
// ================================
const renderCustomersTable = () => {
    customersTableBody.innerHTML = state.customers.map(c => `
        <tr>
            <td>
                <div class="customer-name">${c.name}</div>
                <div class="customer-email">${c.email}</div>
            </td>
            <td>${c.health_score}</td>
            <td>
                <span class="risk-badge ${c.risk_level}">
                    ${c.risk_level.toUpperCase()}
                </span>
            </td>
            <td>${formatCurrency(c.mrr)}</td>
            <td>${c.last_login}</td>
        </tr>
    `).join("");
};

// ================================
// Events
// ================================
document.addEventListener("DOMContentLoaded", () => {
    loginForm.addEventListener("submit", handleLogin);
    logoutBtn.addEventListener("click", handleLogout);
});


