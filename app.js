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

// ================================
// Auth
// ================================
const handleLogin = async e => {
  e.preventDefault();

  try {
    const loginRes = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: loginEmail.value,
        password: loginPassword.value
      })
    });

    if (!loginRes.ok) throw new Error("Invalid credentials");

    const loginData = await loginRes.json();
    state.token = loginData.access_token;
    localStorage.setItem("token", state.token);

    state.user = await fetchMe();
    localStorage.setItem("user", JSON.stringify(state.user));

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
};

const handleLogout = () => {
  localStorage.clear();
  state.user = null;
  state.token = null;
  state.customers = [];
  customersLoaded = false;

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
// Analytics DOM bindings
// ================================
const expectedMrrLoss = document.getElementById("expectedMrrLoss");
const riskRatio = document.getElementById("riskRatio");
const riskMomentumTable = document.getElementById("riskMomentumTable");

// ================================
// Dashboard
// ================================
const calculateMetrics = () => {
  const total = state.customers.length;
  const highRisk = state.customers.filter(c => c.risk_level === "high").length;
  const atRiskMRR = state.customers
    .filter(c => c.risk_level === "high")
    .reduce((s, c) => s + c.mrr, 0);
  const avgScore = total
    ? Math.round(
        state.customers.reduce((s, c) => s + c.health_score, 0) / total
      )
    : 0;

  return { total, highRisk, atRiskMRR, avgScore };
};

const initializeDashboard = async () => {
  state.customers = await fetchCustomers();
  state.alerts = await fetchAlerts();

  const m = calculateMetrics();
  totalCustomers.textContent = m.total;
  highRiskCount.textContent = m.highRisk;
  atRiskMRR.textContent = formatCurrency(m.atRiskMRR);
  avgHealthScore.textContent = m.avgScore;

  renderRiskChart();
  renderUrgentActions();
  renderChurnTrendChart();
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
      datasets: [
        {
          data: [low, med, high],
          backgroundColor: ["#10b981", "#f59e0b", "#ef4444"]
        }
      ]
    }
  });
};

const renderChurnTrendChart = async () => {
  const ctx = document.getElementById("churnTrendChart");
  if (!ctx) return;

  const trend = await fetchChurnTrend();
  if (!trend.length) return;

  const labels = trend.map(r =>
    new Date(r.month).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric"
    })
  );

  if (state.charts.trend) state.charts.trend.destroy();

  state.charts.trend = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Low Risk",
          data: trend.map(r => r.low),
          borderColor: "#10b981",
          backgroundColor: "rgba(16,185,129,0.15)",
          tension: 0.4,
          fill: true
        },
        {
          label: "Medium Risk",
          data: trend.map(r => r.medium),
          borderColor: "#f59e0b",
          backgroundColor: "rgba(245,158,11,0.15)",
          tension: 0.4,
          fill: true
        },
        {
          label: "High Risk",
          data: trend.map(r => r.high),
          borderColor: "#ef4444",
          backgroundColor: "rgba(239,68,68,0.15)",
          tension: 0.4,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0 }
        }
      }
    }
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

  urgentActionsList.innerHTML = alerts
    .map(
      a => `
      <div class="action-item">
        <div class="action-priority ${a.priority}"></div>
        <div class="action-content">
          <div class="action-title">
            ${a.title}
            <span class="action-customer">• ${a.customer_name}</span>
          </div>
          <div class="action-description">
            ${a.description}
          </div>
        </div>
      </div>
    `
    )
    .join("");
};


// ================================
// Customers
// ================================
async function loadCustomers() {
  if (customersLoaded) return;

  state.customers = await fetchCustomers();

  if (!state.alerts.length) {
    state.alerts = await fetchAlerts();
  }

  renderCustomers(getFilteredCustomers());
  customersLoaded = true;
}


function renderCustomers(customers) {
  const tbody = document.getElementById("customersTableBody");
  tbody.innerHTML = "";

  customers.forEach(c => {
    const tr = document.createElement("tr");

    const contractExpired =
      c.contract_end_date && new Date(c.contract_end_date) < new Date();

    tr.innerHTML = `
      <td>
        <div class="customer-name">${c.name}</div>
        <div class="customer-email">${c.email}</div>
      </td>

      <td>
        <span class="health-pill">${c.health_score}</span>
      </td>

      <td>
        <span class="risk-badge ${c.risk_level}">
          ${c.risk_level.toUpperCase()}
        </span>
      </td>

      <td>${formatCurrency(c.mrr)}</td>

      <td class="${contractExpired ? "contract-expired" : ""}">
        ${c.contract_end_date || "—"}
      </td>

      <td>${getRiskReasonFromAlerts(c)}</td>
    `;

    tr.onclick = () => openCustomerDetail(c);
    tbody.appendChild(tr);
  });
}


function openCustomerDetail(customer) {
  state.currentCustomer = customer;

  customerDetailName.textContent = customer.name;
  customerDetailEmail.textContent = customer.email || "-";
  customerDetailMRR.textContent = formatCurrency(customer.mrr);
  customerDetailContract.textContent = customer.contract_end_date || "-";
  customerDetailStatus.textContent = customer.status || "-";
  customerHealthScore.textContent = customer.health_score;

  const badge = customerRiskBadge;
  badge.textContent = `${customer.risk_level.toUpperCase()} RISK`;
  badge.className = `risk-badge ${customer.risk_level}`;

  showPage("customerDetailPage");
}

// ================================
// Navigation
// ================================
document.querySelectorAll(".nav-item").forEach(item => {
  item.addEventListener("click", async e => {
    e.preventDefault();

    const page = item.dataset.page;
    setActiveNav(page);
    showPage(`${page}Page`);

    if (page === "customers") await loadCustomers();
    if (page === "dashboard") await initializeDashboard();
    if (page === "analytics") await initializeAnalytics();
  });
});

backToCustomers.addEventListener("click", () => {
  setActiveNav("customers");
  showPage("customersPage");
});

// ================================
// Init
// ================================
document.addEventListener("DOMContentLoaded", () => {
  loginForm.addEventListener("submit", handleLogin);
  logoutBtn.addEventListener("click", handleLogout);
  customerSearch.addEventListener("input", () => {
  const filtered = getFilteredCustomers();
  renderCustomers(filtered);
});

riskFilter.addEventListener("change", () => {
  const filtered = getFilteredCustomers();
  renderCustomers(filtered);
});

});

function getRiskReasonFromAlerts(customer) {
  const alertsByCustomer = getAlertsByCustomer();
  const alerts = alertsByCustomer[customer.id];

  if (!alerts || alerts.length === 0) {
    return "No active risks";
  }

  // highest priority first
  const priorityOrder = ["high", "medium", "low"];

  alerts.sort(
    (a, b) =>
      priorityOrder.indexOf(a.priority) -
      priorityOrder.indexOf(b.priority)
  );

  return alerts[0].title;
}
function getAlertsByCustomer() {
  const map = {};

  state.alerts.forEach(a => {
    if (!map[a.customer_id]) {
      map[a.customer_id] = [];
    }
    map[a.customer_id].push(a);
  });

  return map;
}

function getFilteredCustomers() {
  const search = customerSearch.value.toLowerCase().trim();
  const risk = riskFilter.value;

  return state.customers.filter(c => {
    const matchesSearch =
      !search ||
      c.name.toLowerCase().includes(search) ||
      c.email.toLowerCase().includes(search);

    const matchesRisk =
      risk === "all" || c.risk_level === risk;

    return matchesSearch && matchesRisk;
  });
}

// ================================
// Analytics
// ================================
async function initializeAnalytics() {
  await renderRevenueAtRisk();
  await renderRiskMomentum();
}

async function renderRevenueAtRisk() {
  if (!expectedMrrLoss || !riskRatio) return;

  const res = await fetch(`${API_BASE_URL}/analytics/revenue-at-risk`, {
    headers: authHeaders()
  });

  if (!res.ok) return;

  const data = await res.json();

  expectedMrrLoss.textContent = formatCurrency(data.expected_mrr_loss);
  riskRatio.textContent = `${Math.round(data.risk_ratio * 100)}%`;
}


async function renderRiskMomentum() {
  if (!riskMomentumTable) return;

  const res = await fetch(`${API_BASE_URL}/risk-momentum`, {
    headers: authHeaders()
  });

  if (!res.ok) return;

  const rows = await res.json();

  riskMomentumTable.innerHTML = rows
    .map(
      r => `
      <tr>
        <td>${r.customer}</td>
        <td class="${r.trend}">${r.trend}</td>
        <td>${r.delta}</td>
      </tr>
    `
    )
    .join("");
}


