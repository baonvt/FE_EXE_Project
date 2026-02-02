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

export const getRestaurantBySlug = async (slug) => {
  try {
    const data = await api(`/api/v1/restaurants/by-slug/${encodeURIComponent(slug)}`);
    return data?.data ?? data;
  } catch (e) {
    throw e;
  }
};

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

export const createOrder = async (payload) => {
  const data = await api("/api/v1/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data?.data ?? data;
};

export const getPublicMenu = async (restaurantId) => {
  const data = await api(`/api/v1/restaurants/${restaurantId}/menu`);
  const list = data?.data ?? data;
  return Array.isArray(list) ? list : [];
};

export const getPublicCategories = async (restaurantId) => {
  const data = await api(`/api/v1/restaurants/${restaurantId}/categories`);
  const list = data?.data ?? data;
  return Array.isArray(list) ? list : [];
};
