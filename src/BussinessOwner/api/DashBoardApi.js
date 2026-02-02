import { getRestaurantId } from "../../utils/auth";

const BASE_URL = "https://apiqrcodeexe201-production.up.railway.app";

const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};
export const overallStatistics = async () => {
  const restaurantId = getRestaurantId();
  const res = await fetch(
    `${BASE_URL}/api/v1/restaurants/${restaurantId}/stats/overview`,
    { headers: getAuthHeaders() }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch overview");
  }

  return res.json();
};
export const chartStatistics = async (year) => {
  const restaurantId = getRestaurantId();

  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  const res = await fetch(
    `${BASE_URL}/api/v1/restaurants/${restaurantId}/stats/revenue?period=month&start_date=${startDate}&end_date=${endDate}`,
    { headers: getAuthHeaders() }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch chart data");
  }

  return res.json();
};
export const orderBestSeller = async () => {
  const restaurantId = getRestaurantId();
    const res = await fetch(
    `${BASE_URL}/api/v1/restaurants/${restaurantId}/stats/menu`,
    { headers: getAuthHeaders() }
  );
    if (!res.ok) {
    throw new Error("Failed to fetch best sellers");
    }
    return res.json();
};