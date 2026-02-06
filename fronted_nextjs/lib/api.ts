// lib/api.ts
import axios from "axios";

export const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://proyectoia-production.up.railway.app/api";

export const resolveApiUrl = (path: string) => {
  if (!path) {
    return path;
  }
  // Si ya es una URL completa, retornarla tal cual
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  // Normalizar el path para que comience con /
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  // BASE_URL ya incluye /api, así que concatenamos directamente
  return `${BASE_URL}${normalizedPath}`;
};

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
