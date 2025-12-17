// lib/api.ts
import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    // No enviar Authorization en endpoints de login/registro
    const url = config.url || "";
    if (url.startsWith("/auth/login") || url.startsWith("/auth/register")) {
      return config;
    }

    if (typeof window !== "undefined") {
      let token = localStorage.getItem("authToken");
      if (!token && process.env.NEXT_PUBLIC_DEV_TOKEN) {
        token = process.env.NEXT_PUBLIC_DEV_TOKEN;
        try {
          localStorage.setItem("authToken", token);
        } catch {}
      }
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Token ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (resp) => resp,
  (error) => {
    if (error?.response?.status === 401) {
      console.warn(
        "API request returned 401. Ensure an auth token is set in localStorage (authToken) or NEXT_PUBLIC_DEV_TOKEN."
      );
    }
    return Promise.reject(error);
  }
);

export default api;
