import axios from "axios";

const SecuredAxios = axios;

SecuredAxios.defaults.withCredentials = true;
SecuredAxios.defaults.withXSRFToken = true;

const instance = SecuredAxios.create({
  baseURL: "http://localhost:8000",
  headers: {
    "X-Requested-With": "XMLHttpRequest",
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

instance.interceptors.request.use(
  async (config) => {
    // POST や PUT、DELETE など、状態変更系のリクエストの場合のみ
    if (["post", "put", "delete", "patch"].includes(config.method?.toLowerCase() || "")) {
      // 例として、クッキーに "XSRF-TOKEN" が含まれているかをチェック
      if (!document.cookie.includes("XSRF-TOKEN")) {
        await axios.get("http://localhost:8000/sanctum/csrf-cookie");
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default instance;
