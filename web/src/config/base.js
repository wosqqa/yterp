import Vue from "vue";

function getApiBase() {
  try {
    if (typeof window !== "undefined" && window.location) {
      const host = window.location.hostname || "127.0.0.1";
      const protocol = window.location.protocol || "http:";
      return `${protocol}//${host}:3000/`;
    }
  } catch (e) {}
  return "http://127.0.0.1:3000/";
}

Vue.prototype.$base = {
  web: getApiBase() //后台接口地址
};
