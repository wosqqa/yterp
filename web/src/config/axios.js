import Vue from "vue";
import axios from "axios";
import {Loading} from "element-ui";
import store from "@/config/store";
import {getApiBase} from "@/config/base";

let load; //初始弹层状态

function buildDebugUrl(config) {
	let base = "";
	let path = "";
	try { base = (config && (config.baseURL || axios.defaults.baseURL)) || ""; } catch(e){}
	try { path = (config && config.url) || ""; } catch(e){}
	base = String(base || "");
	path = String(path || "");
	if (base && !base.endsWith("/") && path) base = base + "/";
	if (path.startsWith("/")) path = path.slice(1);
	return base + path;
}

function appendDebugInfo(rawInfo, errorOrConfig, debugUrl) {
	try {
		const loc = (typeof window !== "undefined" && window.location && window.location.href) ? window.location.href : "";
		const base = (typeof getApiBase === "function") ? (getApiBase() || "") : "";
		const reqUrl = debugUrl || buildDebugUrl(errorOrConfig && errorOrConfig.config ? errorOrConfig.config : errorOrConfig);
		return rawInfo + "\n\n[ DEBUG ]\n当前页面：" + loc + "\nAPI 基址：" + base + "\n实际请求：" + reqUrl;
	} catch(e) {
		return rawInfo;
	}
}

axios.defaults.timeout = 30000;
axios.defaults.baseURL = getApiBase();

//请求开始配置
axios.interceptors.request.use(config => {
	config.headers.Token = store.state.token;
	try {
		const apiBase = getApiBase();
		if (apiBase) config.baseURL = apiBase;
	} catch (e) {}
	if (!config.timeout) config.timeout = 30000;
	if (typeof config.url === "string") {
		config.url = config.url.replace(/^\/+/, "");
	}
	//请求开始|展示Load
	load = Loading.service({
		lock: true,
		text: "数据加载中...",
		background: "rgba(0, 0, 0, 0.3)"
	});
	return config;
});

//请求返回配置
axios.interceptors.response.use(
	response => {
		load.close(); //请求成功|关闭Load
		return response.data; //返回对象data
	},
	error => {
		load.close(); //请求失败|关闭Load
		(error.response!=undefined&&error.response.status == 401) && (window.location.href = "/"); //登录失效|跳转首页
		let info = "[ ERROR ] 服务器响应超时!";
		try{
			if(error && error.response){
				const status = error.response.status;
				const data = error.response.data;
				const msg =
					typeof data === "string"
						? data
						: data && typeof data === "object"
						? (data.info || data.message || data.error || "")
						: "";
				info = "[HTTP " + status + "] " + (msg || info);
			}else if(error){
				const code = error.code;
				const msg = (error.message || "").toString();
				const isTimeout = code === "ECONNABORTED" || /timeout/i.test(msg);
				const isNetworkError = code === "NETWORK_ERROR" || /Network Error/i.test(msg);
				if (isTimeout) {
					info = "[ TIMEOUT ] 请求超时(30s),请检查手机和电脑是否同一Wi-Fi/热点,然后重试";
				} else if (isNetworkError) {
					info = "[ NETWORK ERROR ] 无法连接服务器,请确认服务器地址是否正确(" + (getApiBase && getApiBase() || "") + ")";
				} else {
					info = "[ NETWORK ERROR ] " + (msg || info);
				}
				info = appendDebugInfo(info, error);
			}
		}catch(e){}
		if (info.indexOf('[ DEBUG ]') < 0) {
			try { info = appendDebugInfo(info, error); } catch(e){}
		}
		return { state: "error", info };
	}
);
Vue.prototype.$axios = axios; //配置Vue
