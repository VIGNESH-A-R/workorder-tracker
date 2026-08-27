const API_BASE_URL = "http://localhost:8000";
const TOKEN_KEY = "workorder_tracker_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = await response.json();
      detail = body.error || body.message || detail;
    } catch {
      // response had no JSON body
    }
    throw new ApiError(detail, response.status);
  }

  if (response.status === 204) return null;
  return response.json();
}

// Auth
export function login(username, password) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function getCurrentUser() {
  return request("/auth/me");
}

export function updateCurrentUser(data) {
  return request("/auth/me", { method: "PATCH", body: JSON.stringify(data) });
}

// Work orders
export function getWorkOrders() {
  return request("/work-orders");
}

export function getWorkOrder(id) {
  return request(`/work-orders/${id}`);
}

export function getStats() {
  return request("/work-orders/stats");
}

export function createWorkOrder(data) {
  return request("/work-orders", { method: "POST", body: JSON.stringify(data) });
}

export function updateWorkOrder(id, data) {
  return request(`/work-orders/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

// Technicians
export function getTechnicians() {
  return request("/technicians");
}

export function getTechnician(id) {
  return request(`/technicians/${id}`);
}

export function createTechnician(data) {
  return request("/technicians", { method: "POST", body: JSON.stringify(data) });
}

// Customers
export function getCustomers() {
  return request("/customers");
}

export function getCustomer(id) {
  return request(`/customers/${id}`);
}

export function createCustomer(data) {
  return request("/customers", { method: "POST", body: JSON.stringify(data) });
}
