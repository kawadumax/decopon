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

export default instance;
