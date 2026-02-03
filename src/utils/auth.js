import { jwtDecode } from "jwt-decode";

export const getToken = () => {
  return localStorage.getItem("authToken");
};

export const getRestaurantId = () => {
  // Đầu tiên thử lấy từ localStorage
  const storedId = localStorage.getItem("restaurant_id");
  if (storedId) {
    return parseInt(storedId);
  }
  
  // Nếu không có, thử decode từ token
  const token = localStorage.getItem("authToken");
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);
    const restaurantId = decoded.restaurant_id || null;
    
    // Lưu lại vào localStorage để dùng sau
    if (restaurantId) {
      localStorage.setItem("restaurant_id", restaurantId);
    }
    
    return restaurantId;
  } catch (e) {
    console.error("Token không hợp lệ:", e);
    return null;
  }
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
