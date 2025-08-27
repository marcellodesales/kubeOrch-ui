import axios from "axios";
import { toast } from "react-toastify";
import { useAuthStore } from "@/stores/AuthStore";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

api.interceptors.request.use(
  config => {
    const token = useAuthStore.getState().validateAndGetToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (
      config.url !== "/auth/login" &&
      config.url !== "/auth/register"
    ) {
      toast.error("Session expired. Please login again.");
      window.location.href = "/login";
      return Promise.reject(new Error("Token expired"));
    }

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
