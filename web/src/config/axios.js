import Vue from "vue";
import axios from "axios";
import {Loading} from "element-ui";
import store from "@/config/store";

let load; //初始弹层状态
axios.defaults.baseURL = Vue.prototype.$base.web; //通用跨域配置

//请求开始配置
axios.interceptors.request.use(config => {
	config.headers.Token = store.state.token;
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
			}
		}catch(e){}
		return { state: "error", info };
	}
);
Vue.prototype.$axios = axios; //配置Vue
