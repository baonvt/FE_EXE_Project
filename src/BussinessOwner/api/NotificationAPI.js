import { getToken, getRestaurantId } from "../../utils/auth";

const API_BASE_URL = "https://apiqrcodeexe201-production.up.railway.app/api/v1";

// Lấy headers với auth
const getAuthHeaders = () => {
    const token = getToken();
    return {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
    };
};

/**
 * Lấy danh sách thông báo
 * @param {Object} params - { unread_only, limit, offset }
 */
export const getNotifications = async (params = {}) => {
    const restaurantId = getRestaurantId();
    if (!restaurantId) throw new Error("Không tìm thấy restaurant ID");

    const queryParams = new URLSearchParams();
    if (params.unread_only) queryParams.append("unread_only", "true");
    if (params.limit) queryParams.append("limit", params.limit);
    if (params.offset) queryParams.append("offset", params.offset);

    const url = `${API_BASE_URL}/restaurants/${restaurantId}/notifications?${queryParams}`;
    const response = await fetch(url, {
        method: "GET",
        headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Lỗi lấy thông báo");
    }
    return data;
};

/**
 * Lấy số lượng thông báo chưa đọc
 */
export const getUnreadCount = async () => {
    const restaurantId = getRestaurantId();
    if (!restaurantId) throw new Error("Không tìm thấy restaurant ID");

    const url = `${API_BASE_URL}/restaurants/${restaurantId}/notifications/unread-count`;
    const response = await fetch(url, {
        method: "GET",
        headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Lỗi lấy số thông báo");
    }
    return data;
};

/**
 * Đánh dấu một thông báo đã đọc
 * @param {number} notificationId
 */
export const markAsRead = async (notificationId) => {
    const url = `${API_BASE_URL}/notifications/${notificationId}/read`;
    const response = await fetch(url, {
        method: "PUT",
        headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Lỗi đánh dấu đã đọc");
    }
    return data;
};

/**
 * Đánh dấu tất cả thông báo đã đọc
 */
export const markAllAsRead = async () => {
    const url = `${API_BASE_URL}/notifications/read-all`;
    const response = await fetch(url, {
        method: "PUT",
        headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Lỗi đánh dấu tất cả đã đọc");
    }
    return data;
};

/**
 * Xóa một thông báo
 * @param {number} notificationId
 */
export const deleteNotification = async (notificationId) => {
    const url = `${API_BASE_URL}/notifications/${notificationId}`;
    const response = await fetch(url, {
        method: "DELETE",
        headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Lỗi xóa thông báo");
    }
    return data;
};

/**
 * Xóa tất cả thông báo
 */
export const clearAllNotifications = async () => {
    const url = `${API_BASE_URL}/notifications/clear`;
    const response = await fetch(url, {
        method: "DELETE",
        headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Lỗi xóa tất cả thông báo");
    }
    return data;
};

/**
 * Xác nhận đã thanh toán đơn hàng
 * @param {number} orderId
 */
export const confirmOrderPayment = async (orderId) => {
    const url = `${API_BASE_URL}/orders/${orderId}/confirm-payment`;
    const response = await fetch(url, {
        method: "PUT",
        headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Lỗi xác nhận thanh toán");
    }
    return data;
};
