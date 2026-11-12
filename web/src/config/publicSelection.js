import { getApiBase } from "./base";

export function getSelectionApiBase() {
  // 仅此新页面在本地开发时连接本地 PHP，不改变其他页面的接口基址。
  if (!process.env.VUE_APP_API_BASE && process.env.NODE_ENV === "development") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return `${window.location.protocol}//${host}:8000/`;
    }
  }
  return getApiBase();
}

export async function queryPublicProducts(params, signal) {
  const url = getSelectionApiBase() + "publicSelection/catalog";
  const controller = new AbortController();
  const cancel = () => controller.abort();
  if (signal) signal.addEventListener("abort", cancel);
  const timeout = setTimeout(cancel, 15000);
  try {
    if (signal && signal.aborted) controller.abort();
    if (process.env.NODE_ENV === "development") {
      console.debug("[public-selection] request", url, params);
    }
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "omit",
      body: JSON.stringify(params),
      signal: controller.signal
    });
    const result = await response.json();
    if (!response.ok || result.state !== "success" || !Array.isArray(result.info)) {
      throw new Error("Products could not be loaded. Please try again.");
    }
    if (process.env.NODE_ENV === "development") {
      console.debug("[public-selection] response", result);
    }
    return result;
  } catch (error) {
    if (signal && signal.aborted) throw error;
    const message = "Unable to load products. Please check your connection and retry.";
    if (process.env.NODE_ENV === "development") {
      console.warn("[public-selection]", { url, page: window.location.href, error: error.message });
      throw new Error(`${message}\nAPI: ${url}`);
    }
    throw new Error(message);
  } finally {
    clearTimeout(timeout);
    if (signal) signal.removeEventListener("abort", cancel);
  }
}

export async function submitPublicSelection(payload) {
  const response = await fetch(getSelectionApiBase() + "publicSelection/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "omit",
    body: JSON.stringify(payload)
  });
  const result = await response.json();
  if (!response.ok || result.state !== "success") {
    throw new Error(result.info || "Order could not be submitted. Please retry.");
  }
  return result.info;
}
