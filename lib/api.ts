import axios from "axios";
import { toast } from "react-toastify";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

api.interceptors.request.use(
  config => {
    // TODO(naman): Add some type of authorization after setup
    return config;
  },
  error => {
    toast.error("Failed: " + error.message);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    toast.error("Failed: " + error.message);
    return Promise.reject(error);
  }
);

export default api;
