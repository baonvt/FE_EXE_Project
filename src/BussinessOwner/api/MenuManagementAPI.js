import { getRestaurantId } from "../../utils/auth";

const BASE_URL = "https://apiqrcodeexe201-production.up.railway.app";

const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};
export const getCategoriesAll = async () => {
  const restaurantId = getRestaurantId();
  if (!restaurantId) throw new Error("Missing restaurantId");

  const res = await fetch(
    `${BASE_URL}/api/v1/restaurants/${restaurantId}/categories`,
    { headers: getAuthHeaders() }
  );
  return res.json();
};
export const createCategory = async (data) => {
  const restaurantId = getRestaurantId();

  const res = await fetch(
    `${BASE_URL}/api/v1/restaurants/${restaurantId}/categories`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }
  );
  return res.json();
};
export const updateCategory = async (id, data) => {
  const res = await fetch(
    `${BASE_URL}/api/v1/categories/${id}`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }
  );
  return res.json();
};
export const deleteCategory = async (id) => {
  const res = await fetch(
    `${BASE_URL}/api/v1/categories/${id}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    }
  );
  return { success: res.ok };
};
export const getMenuAll = async () => {
  const restaurantId = getRestaurantId();

  const res = await fetch(
    `${BASE_URL}/api/v1/restaurants/${restaurantId}/menu`,
    { headers: getAuthHeaders() }
  );
  return res.json();
};
export const createMenuItem = async (data) => {
  const restaurantId = getRestaurantId();

  const res = await fetch(
    `${BASE_URL}/api/v1/restaurants/${restaurantId}/menu`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }
  );
  return res.json();
};
export const updateMenuItem = async (id, data) => {
  const res = await fetch(
    `${BASE_URL}/api/v1/menu/${id}`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }
  );
  return res.json();
};
export const deleteMenuItem = async (id) => {
  const res = await fetch(
    `${BASE_URL}/api/v1/menu/${id}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    }
  );
  return { success: res.ok };
};
export const uploadMenuImage = async (imageFile) => {
  const token = localStorage.getItem("authToken");

  const formData = new FormData();
  formData.append("file", imageFile);   // ✅ ĐÚNG TÊN
  formData.append("folder", "menu");    // ✅ BẮT BUỘC

  const res = await fetch(
    `${BASE_URL}/api/v1/upload/image`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        // ❌ KHÔNG set Content-Type
      },
      body: formData,
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Upload ảnh thất bại");
  }

  return res.json();
}