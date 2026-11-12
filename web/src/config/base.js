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
      const hostname = (window.location.hostname || "").toLowerCase();
      const protocol = window.location.protocol || "http:";
      const port = window.location.port || "";
      const portNum = port ? Number(port) : 0;
      const isLocalHost = hostname === "127.0.0.1" || hostname === "localhost" || hostname === "localhost.localdomain";
      const isFrontendDevPort = portNum >= 8080 && portNum <= 8099;
      if (portNum === 8084 || (isLocalHost && isFrontendDevPort)) {
        return "http://erp.51ppy.com/";
      }
      return `${protocol}//${host}/`;
    }
  } catch (e) {}
  return "http://127.0.0.1:8000/";
}

Vue.prototype.$base = {
  web: getApiBase(),
  getApiBase
};
