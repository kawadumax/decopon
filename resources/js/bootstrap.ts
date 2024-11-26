import axios from "axios";

const SecuredAxios = axios;

SecuredAxios.defaults.withCredentials = true;
SecuredAxios.defaults.withXSRFToken = true;

export default SecuredAxios;