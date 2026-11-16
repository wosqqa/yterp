import Vue from "vue";

export function getApiBase() {
  const envBase = (typeof process !== "undefined" && process.env && process.env.VUE_APP_API_BASE) || "";
  if (envBase) {
    const s = String(envBase).trim();
    return s.endsWith("/") ? s : s + "/";
  }
  if (process.env.NODE_ENV === "development") {
    return "http://127.0.0.1:8000/";
  }
  return "/";
}

Vue.prototype.$base = {
  web: getApiBase(),
  getApiBase
};
