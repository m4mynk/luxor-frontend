import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  withCredentials: true, // ✅ cookies
});

// AUTH
export const handleRegister = async (userData) => {
  try {
    const res = await api.post("/api/auth/register", userData);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || "Registration failed";
  }
};

export const handleLogin = async (email, password) => {
  try {
    const res = await api.post("/api/auth/login", { email, password });
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || "Login failed";
  }
};

export const getCurrentUser = async () => {
  try {
    const res = await api.get("/api/auth/me");
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || "Not authenticated";
  }
};

export const logout = async () => {
  try {
    await api.post("/api/auth/logout");
  } catch (error) {
    console.error("Logout failed:", error);
  }
};

export default api;