const BASE_URL = "https://apiqrcodeexe201-production.up.railway.app";
const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};
export const getOrderDetail = async (tableId) => {
  const res = await fetch(`${BASE_URL}/api/v1/orders/${tableId}`, {
    headers: getAuthHeaders(),
  });
    if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Lấy chi tiết đơn hàng thất bại");
    }
    return res.json();
};