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
  alerts: [],
  charts: {}
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
async function fetchMe() {
  const res = await fetch(`${API_BASE_URL}/me`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch user");
  return res.json();
}

async function fetchCustomers() {
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
    risk_level: c.risk_level || "low"
  }));
}

async function fetchAlerts() {
  const res = await fetch(`${API_BASE_URL}/alerts`, {
    headers: authHeaders()
  });
  if (!res.ok) return [];
  return res.json();
}

async function fetchChurnTrend() {
  const res = await fetch(`${API_BASE_URL}/dashboard/trends`, {
    headers: authHeaders()
  });
  if (!res.ok) return [];
  return res.json();
}

// ================================
// App Init
// ================================
document.addEventListener("DOMContentLoaded", () => {
  // ----------------
  // DOM bindings
  // ----------------
  const loginPage = document.getElementById("loginPage");
  const app = document.getElementById("app");

  const loginForm = document.getElementById("loginForm");
  const loginEmail = document.getElementById("loginEmail");
  const loginPassword = document.getElementById("loginPassword");

  const logoutBtn = document.getElementById("logoutBtn");
  const userName = document.getElementById("userName");
  const userEmail = document.getElementById("userEmail");

  const customerSearch = document.getElementById("customerSearch");
  const riskFilter = document.getElementById("riskFilter");
  const urgentActionsList = document.getElementById("urgentActionsList");

  const expectedMrrLoss = document.getElementById("expectedMrrLoss");
  const riskRatio = document.getElementById("riskRatio");
  const riskMomentumTable = document.getElementById("riskMomentumTable");

  // ----------------
  // Navigation
  // ----------------
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

  document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", async e => {
      e.preventDefault();
      const page = item.dataset.page;

      setActiveNav(page);
      showPage(`${page}Page`);

      if (page === "dashboard") await initializeDashboard();
      if (page === "customers") await loadCustomers();
      if (page === "analytics") await initializeAnalytics();
    });
  });

  // ----------------
  // Auth
  // ----------------
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

      loginPage.style.display = "none";
      app.style.display = "flex";

      userName.textContent = state.user.full_name;
      userEmail.textContent = state.user.email;

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
    location.reload();
  });

  // ----------------
  // Auto-login
  // ----------------
  const savedToken = localStorage.getItem("token");
  const savedUser = localStorage.getItem("user");

  if (savedToken && savedUser) {
    state.token = savedToken;
    state.user = JSON.parse(savedUser);

    loginPage.style.display = "none";
    app.style.display = "flex";

    userName.textContent = state.user.full_name;
    userEmail.textContent = state.user.email;

    setActiveNav("dashboard");
    showPage("dashboardPage");
    initializeDashboard();
  }

  // ----------------
  // Dashboard
  // ----------------
  async function initializeDashboard() {
    state.customers = await fetchCustomers();
    state.alerts = await fetchAlerts();

    document.getElementById("totalCustomers").textContent = state.customers.length;
    document.getElementById("highRiskCount").textContent =
      state.customers.filter(c => c.risk_level === "high").length;

    renderChurnTrendChart();
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
            label: "High Risk",
            data: trend.map(r => r.high),
            borderColor: "#ef4444",
            tension: 0.4
          }
        ]
      }
    });
  }

  // ----------------
  // Customers
  // ----------------
  async function loadCustomers() {
    if (customersLoaded) return;
    state.customers = await fetchCustomers();
    customersLoaded = true;
  }

  // ----------------
  // Analytics
  // ----------------
  async function initializeAnalytics() {
    await renderRevenueAtRisk();
    await renderRiskMomentum();
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
          <td class="${r.trend}">${r.trend}</td>
          <td>${r.delta}</td>
        </tr>
      `
      )
      .join("");
  }
});



