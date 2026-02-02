import { jwtDecode } from "jwt-decode";

export const getRestaurantId = () => {
  const token = localStorage.getItem("authToken");
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);
    return decoded.restaurant_id || decoded.id || null;
  } catch (e) {
    console.error("Token không hợp lệ");
    return null;
  }
};
export default { getRestaurantId };
