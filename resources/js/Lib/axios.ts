import SecuredAxios from "@/bootstrap";

const instance = SecuredAxios.create({
    baseURL: "",
    headers: {
        "X-Requested-With": "XMLHttpRequest",
        Accept: "application/json",
    },
});

export default instance;
