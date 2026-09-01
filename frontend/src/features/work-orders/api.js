import { request } from "../../shared/api/client.js";

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
