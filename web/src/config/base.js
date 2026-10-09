import Vue from "vue";

export function getApiBase() {
  const envBase = (typeof process !== "undefined" && process.env && process.env.VUE_APP_API_BASE) || "";
  if (envBase) {
    const s = String(envBase).trim();
    return s.endsWith("/") ? s : s + "/";
  }
  try {
    if (typeof window !== "undefined" && window.location) {
      const host = window.location.host;
      const protocol = window.location.protocol || "http:";
      const port = window.location.port || "";
      if (String(port) === "8084") return "http://erp.51ppy.com/";
      return `${protocol}//${host}/`;
    }
  } catch (e) {}
  return "http://127.0.0.1:8000/";
}

Vue.prototype.$base = {
  web: getApiBase(),
  getApiBase
};
