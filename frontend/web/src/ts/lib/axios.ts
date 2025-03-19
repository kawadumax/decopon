import SecuredAxios from "@/bootstrap";

const instance = SecuredAxios.create({
  baseURL: "http://localhost:8000",
  headers: {
    "X-Requested-With": "XMLHttpRequest",
    Accept: "application/json",
  },
});

export default instance;
