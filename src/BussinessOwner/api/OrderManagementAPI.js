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
  if (!restaurantId) throw new Error("Không tìm thấy Restaurant ID. Vui lòng đăng nhập lại.");

  const res = await fetch(
    `${BASE_URL}/api/v1/restaurants/${restaurantId}/tables`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(tableData),
    }
  );

  if (!res.ok) {
    // Thử parse JSON trước, nếu không được thì lấy text
    let errorMessage = "Tạo bàn mới thất bại";
    try {
      const errorData = await res.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      const errText = await res.text();
      if (errText) errorMessage = errText;
    }
    throw new Error(errorMessage);
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

// Soft delete (vô hiệu hóa bàn)
export const deleteTableOrder = async (tableId) => {
  const res = await fetch(`${BASE_URL}/api/v1/tables/${tableId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
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

// Hard delete (xóa hoàn toàn bàn khỏi database)
export const hardDeleteTable = async (tableId) => {
  const res = await fetch(`${BASE_URL}/api/v1/tables/${tableId}?hard=true`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (res.status === 404) {
    console.warn("Bàn không tồn tại");
    return { success: true };
  }

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Xóa hoàn toàn bàn thất bại");
  }

  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return res.json();
  }

  return { success: true };
};

// Toggle active/inactive
export const toggleTableActive = async (tableId, isActive) => {
  const res = await fetch(`${BASE_URL}/api/v1/tables/${tableId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ is_active: isActive }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Cập nhật trạng thái bàn thất bại");
  }

  return res.json();
};

// Xác nhận đã nhận tiền từ khách (order_payment_status = paid)
export const confirmOrderPayment = async (orderId) => {
  const res = await fetch(
    `${BASE_URL}/api/v1/orders/${orderId}/confirm-payment`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Xác nhận thanh toán thất bại");
  }

  return res.json();
};
