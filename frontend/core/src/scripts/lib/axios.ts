import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const instance = axios.create({
  baseURL,
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    "X-Requested-With": "XMLHttpRequest",
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

instance.interceptors.request.use(
  async (config) => {
    if (
      ["post", "put", "delete", "patch"].includes(
        config.method?.toLowerCase() || "",
      )
    ) {
      if (!document.cookie.includes("XSRF-TOKEN")) {
        // 同じインスタンスを使用してCSRFトークンを取得
        // Get 以外を行うと無限ループなので注意
        await instance.get("/sanctum/csrf-cookie");
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export default instance;
