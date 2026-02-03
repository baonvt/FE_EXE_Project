const BASE_URL = "https://apiqrcodeexe201-production.up.railway.app";

const api = (path, options = {}) =>
  fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || data.error || res.statusText);
    return data;
  });

// Lấy nhà hàng theo slug (Public API)
export const getRestaurantBySlug = async (slug) => {
  try {
    const data = await api(`/api/v1/public/restaurants/${encodeURIComponent(slug)}`);
    return data?.data ?? data;
  } catch (e) {
    throw e;
  }
};

// Lấy thông tin bàn theo slug nhà hàng và số bàn (Public API)
export const getTableBySlugAndNumber = async (slug, tableNumber) => {
  try {
    const data = await api(`/api/v1/public/restaurants/${encodeURIComponent(slug)}/tables/${tableNumber}`);
    return data?.data ?? data;
  } catch (e) {
    throw e;
  }
};

// [Legacy] Lấy bàn theo restaurant ID và number - fallback
export const getTableByNumber = async (restaurantId, tableNumber) => {
  const params = new URLSearchParams({ restaurantId: String(restaurantId), number: String(tableNumber) });
  const data = await api(`/api/v1/tables/by-number?${params}`);
  return data?.data ?? data;
};

export const getCategories = async (restaurantId) => {
  const params = new URLSearchParams({ restaurantId: String(restaurantId), status: "active" });
  const data = await api(`/api/v1/categories?${params}`);
  const list = data?.data ?? data;
  return Array.isArray(list) ? list : [];
};

export const getMenuItems = async (restaurantId) => {
  const params = new URLSearchParams({ restaurantId: String(restaurantId), available: "true" });
  const data = await api(`/api/v1/menu-items?${params}`);
  const list = data?.data ?? data;
  return Array.isArray(list) ? list : [];
};

export const getMenuItemById = async (id) => {
  const data = await api(`/api/v1/menu-items/${id}`);
  return data?.data ?? data;
};

// Tạo đơn hàng theo slug nhà hàng (Public API)
export const createOrderBySlug = async (slug, payload) => {
  const data = await api(`/api/v1/public/restaurants/${encodeURIComponent(slug)}/orders`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data?.data ?? data;
};

// [Legacy] Tạo đơn hàng - fallback
export const createOrder = async (payload) => {
  const data = await api("/api/v1/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data?.data ?? data;
};

// Lấy menu đầy đủ theo slug (Public API) - bao gồm categories + items
export const getMenuBySlug = async (slug) => {
  const data = await api(`/api/v1/public/restaurants/${encodeURIComponent(slug)}/menu`);
  return data?.data ?? data;
};

// [Legacy] Lấy menu public theo ID
export const getPublicMenu = async (restaurantId) => {
  const data = await api(`/api/v1/restaurants/${restaurantId}/menu`);
  const list = data?.data ?? data;
  return Array.isArray(list) ? list : [];
};

// [Legacy] Lấy categories public theo ID
export const getPublicCategories = async (restaurantId) => {
  const data = await api(`/api/v1/restaurants/${restaurantId}/categories`);
  const list = data?.data ?? data;
  return Array.isArray(list) ? list : [];
};

// Theo dõi đơn hàng qua order number (Public API)
export const trackOrder = async (orderNumber) => {
  const data = await api(`/api/v1/public/orders/${encodeURIComponent(orderNumber)}/track`);
  return data?.data ?? data;
};

// Lấy VietQR thanh toán cho đơn hàng (Public API)
export const getOrderPaymentQR = async (orderId) => {
  const data = await api(`/api/v1/orders/${orderId}/payment-qr`);
  return data?.data ?? data;
};
