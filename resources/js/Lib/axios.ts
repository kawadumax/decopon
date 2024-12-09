import axios from "axios";

const instance = axios.create({
    baseURL: "",
    headers: {
        "X-Requested-With": "XMLHttpRequest",
        Accept: "application/json",
    },
    withCredentials: true,
});

export default instance;
