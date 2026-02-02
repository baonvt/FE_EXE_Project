const BASE_URL = "https://apiqrcodeexe201-production.up.railway.app";
const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};
export const getOrderDetail = async (tableId) => {
  const res = await fetch(`${BASE_URL}/api/v1/tables/${tableId}/detail`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Lấy chi tiết đơn hàng thất bại");
  }

  const json = await res.json();

  return json.data; // ⬅️ trả về full data
};

export const updateOrderStatus = async (tableId, status) => {
  const res = await fetch(`${BASE_URL}/api/v1/tables/${tableId}/detail`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Cập nhật trạng thái đơn hàng thất bại");
  }
  return res.json();;
};