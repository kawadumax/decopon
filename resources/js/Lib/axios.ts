import axios from "axios";

const instance = axios.create({
    baseURL: "",
    headers: {
        "X-Requested-With": "XMLHttpRequest",
    },
});

export default instance;
