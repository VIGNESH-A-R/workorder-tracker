import { request } from "../../shared/api/client.js";

export function getTechnicians() {
  return request("/technicians");
}

export function getTechnician(id) {
  return request(`/technicians/${id}`);
}

export function createTechnician(data) {
  return request("/technicians", { method: "POST", body: JSON.stringify(data) });
}
