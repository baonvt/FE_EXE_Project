import { jwtDecode } from "jwt-decode";

export const getToken = () => {
  return localStorage.getItem("authToken");
};

export const getRestaurantId = () => {
  // Ưu tiên decode từ token trước (vì token là nguồn đáng tin cậy nhất)
  const token = localStorage.getItem("authToken");
  if (token) {
    try {
      const decoded = jwtDecode(token);
      const restaurantIdFromToken = decoded.restaurant_id || null;
      
      if (restaurantIdFromToken) {
        // Sync với localStorage để tăng performance lần sau
        localStorage.setItem("restaurant_id", restaurantIdFromToken);
        return parseInt(restaurantIdFromToken);
      }
    } catch (e) {
      console.error("Token không hợp lệ:", e);
    }
  }
  
  // Fallback: lấy từ localStorage nếu token không có
  const storedId = localStorage.getItem("restaurant_id");
  if (storedId) {
    return parseInt(storedId);
  }
  
  return null;
};

export const getUserId = () => {
  const token = localStorage.getItem("authToken");
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);
    return decoded.user_id || decoded.id || null;
  } catch (e) {
    console.error("Token không hợp lệ:", e);
    return null;
  }
};

export default { getToken, getRestaurantId, getUserId };
