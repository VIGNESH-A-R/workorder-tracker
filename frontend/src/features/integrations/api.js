import { request } from "../../shared/api/client.js";

export function getActiveProvider() {
  return request("/integrations/active");
}

export function setActiveProvider(activeProvider) {
  return request("/integrations/active", {
    method: "PUT",
    body: JSON.stringify({ activeProvider }),
  });
}
