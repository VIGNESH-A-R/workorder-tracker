import { request } from "../../shared/api/client.js";

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
