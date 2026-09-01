import { request } from "../../shared/api/client.js";

export function getCustomers() {
  return request("/customers");
}

export function getCustomer(id) {
  return request(`/customers/${id}`);
}

export function createCustomer(data) {
  return request("/customers", { method: "POST", body: JSON.stringify(data) });
}
