import { getRestaurantId } from "../../utils/auth";

const BASE_URL = "https://apiqrcodeexe201-production.up.railway.app";

const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

// ======================
// TABLE ORDERS API
// ======================

export const getTableOrders = async () => {
  const restaurantId = getRestaurantId();
  if (!restaurantId) throw new Error("Missing restaurantId");

  const res = await fetch(
    `${BASE_URL}/api/v1/restaurants/${restaurantId}/tables`,
    { headers: getAuthHeaders() }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Lấy danh sách bàn thất bại");
  }

  return res.json();
};

export const createTableOrder = async (tableData) => {
  const restaurantId = getRestaurantId();
  if (!restaurantId) throw new Error("Missing restaurantId");

  const res = await fetch(
    `${BASE_URL}/api/v1/restaurants/${restaurantId}/tables`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(tableData),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Tạo bàn mới thất bại");
  }

  return res.json();
};

export const updateTableOrder = async (tableId, tableData) => {
  const res = await fetch(`${BASE_URL}/api/v1/tables/${tableId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(tableData),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Cập nhật bàn thất bại");
  }

  return res.json();
};

export const deleteTableOrder = async (tableId) => {
  const res = await fetch(`${BASE_URL}/api/v1/tables/${tableId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
    body: JSON.stringify({ is_active: false }), // soft delete
  });

  if (res.status === 404) {
    console.warn("Bàn không tồn tại, coi như đã xóa");
    return { success: true };
  }

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Xóa bàn thất bại");
  }

  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return res.json();
  }

  return { success: true };
};

