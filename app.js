// ================================
// Configuration
// ================================
const API_BASE_URL = "https://churnguard-backend.onrender.com/api";

// ================================
// State
// ================================
const state = {
  user: null,
  token: null,
  customers: [],
  charts: {},
  currentCustomer: null,
  alerts: []
};

let customersLoaded = false;

// ================================
// Utilities
// ================================
const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(amount);

const authHeaders = () => ({
  Authorization: `Bearer ${state.token}`,
  "Content-Type": "application/json"
});

// ================================
// DOM Bindings (GLOBAL)
// ================================
const loginForm = document.getElementById("loginForm");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginPage = document.getElementById("loginPage");
const app = document.getElementById("app");

const userName = document.getElementById("userName");
const userEmail = document.getElementById("userEmail");
const logoutBtn = document.getElementById("logoutBtn");

const customerSearch = document.getElementById("customerSearch");
const riskFilter = document.getElementById("riskFilter");
const urgentActionsList = document.getElementById("urgentActionsList");

const totalCustomers = document.getElementById("totalCustomers");
const highRiskCount = document.getElementById("highRiskCount");
const atRiskMRR = document.getElementById("atRiskMRR");
const avgHealthScore = document.getElementById("avgHealthScore");

const expectedMrrLoss = document.getElementById("expectedMrrLoss");
const riskRatio = document.getElementById("riskRatio");
const riskMomentumTable = document.getElementById("riskMomentumTable");

const backToCustomers = document.getElementById("backToCustomers");
const customerRiskBadge = document.getElementById("customerRiskBadge");

// ================================
// Restore auth
// ================================
const savedToken = localStorage.getItem("token");
const savedUser = localStorage.getItem("user");

if (savedToken && savedUser) {
  state.token = savedToken;
  state.user = JSON.parse(savedUser);
}

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
      : "Never"
  }));
};

const fetchAlerts = async () => {
  const res = await fetch(`${API_BASE_URL}/alerts`, {
    headers: authHeaders()
  });
  if (!res.ok) return [];
  return res.json();
};

const fetchChurnTrend = async () => {
  const res = await fetch(`${API_BASE_URL}/dashboard/trends`, {
    headers: authHeaders()
  });
  if (!res.ok) return [];
  return res.json();
};

const fetchRevenueAtRiskHistory = async () => {
  const res = await fetch(
    `${API_BASE_URL}/analytics/revenue-at-risk-history`,
    { headers: authHeaders() }
  );
  if (!res.ok) return [];
  return res.json();
};


// ================================
// Auth
// ================================
loginForm.addEventListener("submit", async e => {
  e.preventDefault();

  try {
    const res = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: loginEmail.value,
        password: loginPassword.value
      })
    });

    if (!res.ok) throw new Error("Invalid credentials");

    const data = await res.json();
    state.token = data.access_token;
    localStorage.setItem("token", state.token);

    state.user = await fetchMe();
    localStorage.setItem("user", JSON.stringify(state.user));

    customersLoaded = false;

    loginPage.style.display = "none";
    app.style.display = "flex";

    updateUserInfo();
    setActiveNav("dashboard");
    showPage("dashboardPage");
    initializeDashboard();
  } catch (err) {
    alert("Login failed");
    console.error(err);
  }
});

logoutBtn.addEventListener("click", () => {
  localStorage.clear();
  state.user = null;
  state.token = null;
  state.customers = [];
  customersLoaded = false;

  app.style.display = "none";
  loginPage.style.display = "block";
});

// ================================
// User UI
// ================================
function updateUserInfo() {
  const initials = state.user.full_name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase();

  document.querySelector(".user-avatar").textContent = initials;
  userName.textContent = state.user.full_name;
  userEmail.textContent = state.user.email;
}

// ================================
// Navigation Helpers
// ================================
function setActiveNav(page) {
  document.querySelectorAll(".nav-item").forEach(item => {
    item.classList.toggle("active", item.dataset.page === page);
  });
}

function showPage(pageId) {
  document.querySelectorAll(".page").forEach(p => {
    p.style.display = "none";
  });
  document.getElementById(pageId).style.display = "block";
}

// ================================
// Dashboard
// ================================
function calculateMetrics() {
  const total = state.customers.length;
  const highRisk = state.customers.filter(c => c.risk_level === "high").length;
  const atRiskMRRVal = state.customers
    .filter(c => c.risk_level === "high")
    .reduce((s, c) => s + c.mrr, 0);
  const avgScore = total
    ? Math.round(
        state.customers.reduce((s, c) => s + c.health_score, 0) / total
      )
    : 0;

  return { total, highRisk, atRiskMRRVal, avgScore };
}

async function initializeDashboard() {
  state.customers = await fetchCustomers();
  state.alerts = await fetchAlerts();

  const m = calculateMetrics();
  totalCustomers.textContent = m.total;
  highRiskCount.textContent = m.highRisk;
  atRiskMRR.textContent = formatCurrency(m.atRiskMRRVal);
  avgHealthScore.textContent = m.avgScore;

  renderRiskChart();
  renderUrgentActions();
  renderChurnTrendChart();
}

// ================================
// Charts
// ================================
function renderRiskChart() {
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
      datasets: [
  {
    data: [low, med, high],
    backgroundColor: [
      "#10b981", // Low - green
      "#f59e0b", // Medium - orange
      "#ef4444"  // High - red
    ]
  }
]

    }
  });
}

async function renderChurnTrendChart() {
  const ctx = document.getElementById("churnTrendChart");
  if (!ctx) return;

  const trend = await fetchChurnTrend();
  if (!trend.length) return;

  if (state.charts.trend) state.charts.trend.destroy();

  state.charts.trend = new Chart(ctx, {
    type: "line",
    data: {
      labels: trend.map(r => r.month),
      datasets: [
  {
    label: "Low",
    data: trend.map(r => r.low),
    borderColor: "#10b981",
    backgroundColor: "rgba(16,185,129,0.15)",
    tension: 0.4,
    fill: true
  },
  {
    label: "Medium",
    data: trend.map(r => r.medium),
    borderColor: "#f59e0b",
    backgroundColor: "rgba(245,158,11,0.15)",
    tension: 0.4,
    fill: true
  },
  {
    label: "High",
    data: trend.map(r => r.high),
    borderColor: "#ef4444",
    backgroundColor: "rgba(239,68,68,0.15)",
    tension: 0.4,
    fill: true
  }
]

    }
  });
}

async function renderRevenueAtRiskChart() {
  const canvas = document.getElementById("revenueRiskChart");
  if (!canvas) return;

  const data = await fetchRevenueAtRiskHistory();
  if (!data.length) return;

  if (state.charts.revenueRisk) {
    state.charts.revenueRisk.destroy();
  }

  state.charts.revenueRisk = new Chart(canvas.getContext("2d"), {
    type: "line",
    data: {
      labels: data.map(d =>
        new Date(d.month).toLocaleDateString("en-US", {
          month: "short",
          year: "numeric"
        })
      ),
      datasets: [
        {
          label: "Revenue at Risk",
          data: data.map(d => d.value),
          borderColor: "#ef4444",
          backgroundColor: "rgba(239,68,68,0.15)",
          tension: 0.4,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom" }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: v => formatCurrency(v)
          }
        }
      }
    }
  });
}


// ================================
// Alerts
// ================================
async function renderUrgentActions() {
  const alerts = await fetchAlerts();

  if (!alerts.length) {
    urgentActionsList.innerHTML = "<p>No urgent actions</p>";
    return;
  }

  urgentActionsList.innerHTML = alerts
    .map(
      a => `
      <div class="action-item">
        <div class="action-content">
          <div class="action-title">${a.title}</div>
          <div class="action-description">${a.description}</div>
        </div>
      </div>
    `
    )
    .join("");
}

// ================================
// Customers
// ================================
async function loadCustomers() {
  if (customersLoaded) return;
  state.customers = await fetchCustomers();
  state.alerts = await fetchAlerts();
  renderCustomers(getFilteredCustomers());
  customersLoaded = true;
}

function renderCustomers(customers) {
  const tbody = document.getElementById("customersTableBody");
  tbody.innerHTML = "";

  customers.forEach(c => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${c.name}<div>${c.email}</div></td>
      <td>${c.health_score}</td>
      <td>${c.risk_level}</td>
      <td>${formatCurrency(c.mrr)}</td>
      <td>${c.contract_end_date || "—"}</td>
      <td>${getRiskReasonFromAlerts(c)}</td>
    `;
    tr.onclick = () => openCustomerDetail(c);
    tbody.appendChild(tr);
  });
}

function openCustomerDetail(customer) {
  state.currentCustomer = customer;
  showPage("customerDetailPage");
}

// ================================
// Filters
// ================================
function getFilteredCustomers() {
  const search = customerSearch.value.toLowerCase().trim();
  const risk = riskFilter.value;

  return state.customers.filter(c => {
    const matchesSearch =
      !search ||
      c.name.toLowerCase().includes(search) ||
      c.email.toLowerCase().includes(search);

    const matchesRisk = risk === "all" || c.risk_level === risk;
    return matchesSearch && matchesRisk;
  });
}

// ================================
// Analytics
// ================================
async function initializeAnalytics() {
  await renderRevenueAtRisk();
  await renderRiskMomentum();

  requestAnimationFrame(() => {
    renderRevenueAtRiskChart();
  });
}



async function renderRevenueAtRisk() {
  const res = await fetch(`${API_BASE_URL}/analytics/revenue-at-risk`, {
    headers: authHeaders()
  });
  if (!res.ok) return;

  const data = await res.json();
  expectedMrrLoss.textContent = formatCurrency(data.expected_mrr_loss);
  riskRatio.textContent = `${Math.round(data.risk_ratio * 100)}%`;
}

async function renderRiskMomentum() {
  const res = await fetch(`${API_BASE_URL}/analytics/risk-momentum`, {
    headers: authHeaders()
  });
  if (!res.ok) return;

  const rows = await res.json();
  riskMomentumTable.innerHTML = rows
    .map(
      r => `
      <tr>
        <td>${r.customer}</td>
        <td>${r.trend}</td>
        <td>${r.delta}</td>
      </tr>
    `
    )
    .join("");
}

// ================================
// Navigation Events
// ================================
document.querySelectorAll(".nav-item").forEach(item => {
  item.addEventListener("click", async e => {
    e.preventDefault();
    const page = item.dataset.page;
    setActiveNav(page);
    showPage(`${page}Page`);

    if (page === "dashboard") initializeDashboard();
    if (page === "customers") loadCustomers();
    if (page === "analytics") initializeAnalytics();
  });
});

backToCustomers.addEventListener("click", () => {
  setActiveNav("customers");
  showPage("customersPage");
});

// ================================
// Auto-login
// ================================
if (state.token && state.user) {
  loginPage.style.display = "none";
  app.style.display = "flex";
  updateUserInfo();
  setActiveNav("dashboard");
  showPage("dashboardPage");
  initializeDashboard();
}

// ================================
// Alerts Helpers
// ================================
function getAlertsByCustomer() {
  const map = {};
  state.alerts.forEach(a => {
    if (!map[a.customer_id]) map[a.customer_id] = [];
    map[a.customer_id].push(a);
  });
  return map;
}

function getRiskReasonFromAlerts(customer) {
  const alerts = getAlertsByCustomer()[customer.id];
  return alerts?.[0]?.title || "No active risks";
}
