import Vue from "vue";

function getApiBase() {
  const envBase = (typeof process !== "undefined" && process.env && process.env.VUE_APP_API_BASE) || "";
  if (envBase) {
    const s = String(envBase).trim();
    return s.endsWith("/") ? s : s + "/";
  }
  try {
    if (typeof window !== "undefined" && window.location) {
      const host = window.location.hostname || "127.0.0.1";
      const protocol = window.location.protocol || "http:";
      const port = window.location.port || "";
      if (String(port) === "8083") return `${protocol}//${host}:3000/`;
      return `${protocol}//${host}:8000/`;
    }
  } catch (e) {}
  return "http://127.0.0.1:8000/";
}

Vue.prototype.$base = {
  web: getApiBase() //后台接口地址
};
