import { getRestaurantId } from "../../utils/auth";

const BASE_URL = "https://apiqrcodeexe201-production.up.railway.app";
export const getBusinessOwnerProfile = async () => {
  const token = localStorage.getItem("authToken");

  console.log("TOKEN:", token);

  if (!token) {
    throw new Error("Chưa đăng nhập");
  }

  const response = await fetch(`${BASE_URL}/api/v1/restaurants/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("API ERROR:", response.status, text);
    throw new Error("Unauthorized");
  }

  return response.json();
};

export const updateBusinessOwnerProfile = async (profileData) => {
  try {
    const token = localStorage.getItem("authToken");
    if (!token) throw new Error("Chưa đăng nhập");

    const restaurantId = getRestaurantId();
    if (!restaurantId) {
      throw new Error("Không tìm thấy restaurantId trong token");
    }

    const response = await fetch(
      `${BASE_URL}/api/v1/restaurants/${restaurantId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      }
    );

    const responseData =
      response.status !== 204 ? await response.json() : null;

    if (!response.ok) {
      console.error("API Error Response:", responseData);
      throw new Error(responseData?.message || "Update profile failed");
    }

    return responseData;
  } catch (error) {
    console.error("fetch failed:", error);
    throw error;
  }
};