// lib/api.ts
import axios from "axios";

export const BASE_URL = "http://127.0.0.1:8000/api";

const api = axios.create({
  baseURL: BASE_URL,
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
      const token = localStorage.getItem("authToken");
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
        "API request returned 401. Ensure an auth token is set in localStorage (authToken)."
      );
    }
    return Promise.reject(error);
  }
);

export const getCourseMaterials = async (courseId: string) => {
  const response = await api.get(`/course-materials/by-course/${courseId}/`);
  return response.data;
};

export default api;
