import { useRef, useEffect, useState } from "react";
import { useNotification } from "../../context/useNotification";
import { useNavigate } from "react-router-dom";
import { confirmOrderPayment } from "../api/NotificationAPI";
import "./NotificationCenter.css";

const NotificationCenter = () => {
    const {
        notifications,
        unreadCount,
        loading,
        isOpen,
        toggleOpen,
        closeDropdown,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        fetchNotifications,
    } = useNotification();

    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const [confirmingOrderId, setConfirmingOrderId] = useState(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                closeDropdown();
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, closeDropdown]);

    // Get icon based on notification type
    const getNotificationIcon = (type) => {
        switch (type) {
            case "new_order":
                return "bi-cart-plus";
            case "payment_pending":
                return "bi-hourglass-split";
            case "payment_confirmed":
                return "bi-check-circle";
            case "order_cancelled":
                return "bi-x-circle";
            case "system_error":
                return "bi-exclamation-triangle";
            case "system_success":
                return "bi-check-circle";
            default:
                return "bi-bell";
        }
    };

    // Get color based on notification type
    const getNotificationColor = (type) => {
        switch (type) {
            case "new_order":
                return "text-primary";
            case "payment_pending":
                return "text-warning";
            case "payment_confirmed":
                return "text-success";
            case "order_cancelled":
                return "text-danger";
            case "system_error":
                return "text-danger";
            case "system_success":
                return "text-success";
            default:
                return "text-secondary";
        }
    };

    // Format time ago
    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);

        if (diff < 60) return "Vừa xong";
        if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
        return `${Math.floor(diff / 86400)} ngày trước`;
    };

    // Handle notification click
    const handleNotificationClick = (notification) => {
        if (!notification.is_read) {
            markAsRead(notification.id);
        }

        // Navigate based on notification type
        if (notification.data?.order_id) {
            navigate("/bussiness/orders");
        }

        closeDropdown();
    };

    // Handle confirm payment
    const handleConfirmPayment = async (e, notification) => {
        e.stopPropagation();
        const orderId = notification.data?.order_id;
        if (!orderId) return;

        setConfirmingOrderId(orderId);
        try {
            await confirmOrderPayment(orderId);
            alert("Đã xác nhận nhận tiền thành công! Đơn hàng sẽ được chuyển sang trạng thái đã thanh toán.");
            // Delete notification sau khi xác nhận thành công
            deleteNotification(notification.id);
        } catch (error) {
            alert("Lỗi: " + (error.message || "Không thể xác nhận thanh toán"));
            setConfirmingOrderId(null);
        }
    };

    return (
        <div className="notification-center" ref={dropdownRef}>
            {/* Bell Icon */}
            <button
                className="notification-bell"
                onClick={toggleOpen}
                aria-label="Thông báo"
            >
                <i className="bi bi-bell-fill"></i>
                {unreadCount > 0 && (
                    <span className="notification-badge">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="notification-dropdown">
                    {/* Header */}
                    <div className="notification-header">
                        <h6 className="mb-0">
                            Thông báo
                            {unreadCount > 0 && (
                                <span className="badge bg-primary ms-2">
                                    {unreadCount} mới
                                </span>
                            )}
                        </h6>
                        <div className="notification-actions">
                            {unreadCount > 0 && (
                                <button
                                    className="btn btn-sm btn-link"
                                    onClick={markAllAsRead}
                                    title="Đánh dấu tất cả đã đọc"
                                >
                                    <i className="bi bi-check2-all"></i>
                                </button>
                            )}
                            {notifications.length > 0 && (
                                <button
                                    className="btn btn-sm btn-link text-danger"
                                    onClick={clearAll}
                                    title="Xóa tất cả"
                                >
                                    <i className="bi bi-trash"></i>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Notification List */}
                    <div className="notification-list">
                        {loading ? (
                            <div className="notification-loading">
                                <div className="spinner-border spinner-border-sm" role="status">
                                    <span className="visually-hidden">Đang tải...</span>
                                </div>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="notification-empty">
                                <i className="bi bi-bell-slash"></i>
                                <p>Không có thông báo</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`notification-item ${!notification.is_read ? "unread" : ""}`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="notification-icon">
                                        <i
                                            className={`bi ${getNotificationIcon(notification.type)} ${getNotificationColor(notification.type)}`}
                                        ></i>
                                    </div>
                                    <div className="notification-content">
                                        <div className="notification-title">
                                            {notification.title}
                                        </div>
                                        <div className="notification-message">
                                            {notification.message}
                                        </div>
                                        <div className="notification-time">
                                            {formatTimeAgo(notification.created_at)}
                                        </div>
                                    </div>
                                    <button
                                        className="notification-delete"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteNotification(notification.id);
                                        }}
                                        title="Xóa"
                                    >
                                        <i className="bi bi-x"></i>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="notification-footer">
                            <button
                                className="btn btn-sm btn-link"
                                onClick={() => {
                                    navigate("/bussiness/orders");
                                    closeDropdown();
                                }}
                            >
                                Xem tất cả đơn hàng
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;
