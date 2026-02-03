import { createContext, useState, useCallback, useEffect, useRef } from "react";
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
} from "../BussinessOwner/api/NotificationAPI";
import { getToken, getRestaurantId } from "../utils/auth";

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const pollingRef = useRef(null);

    // Fetch notifications
    const fetchNotifications = useCallback(async (limit = 20) => {
        try {
            setLoading(true);
            const response = await getNotifications({ limit });
            if (response.success && response.data) {
                setNotifications(response.data.notifications || []);
                setUnreadCount(response.data.unread_count || 0);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch only unread count (lighter API call for polling)
    const fetchUnreadCount = useCallback(async () => {
        try {
            const token = getToken();
            const restaurantId = getRestaurantId();
            if (!token || !restaurantId) return;

            const response = await getUnreadCount();
            if (response.success && response.data) {
                setUnreadCount(response.data.unread_count || 0);
            }
        } catch (error) {
            console.error("Error fetching unread count:", error);
        }
    }, []);

    // Mark one as read
    const handleMarkAsRead = useCallback(async (notificationId) => {
        try {
            await markAsRead(notificationId);
            setNotifications((prev) =>
                prev.map((n) =>
                    n.id === notificationId ? { ...n, is_read: true } : n
                )
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    }, []);

    // Mark all as read
    const handleMarkAllAsRead = useCallback(async () => {
        try {
            await markAllAsRead();
            setNotifications((prev) =>
                prev.map((n) => ({ ...n, is_read: true }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error("Error marking all notifications as read:", error);
        }
    }, []);

    // Delete one notification
    const handleDeleteNotification = useCallback(async (notificationId) => {
        try {
            await deleteNotification(notificationId);
            setNotifications((prev) =>
                prev.filter((n) => n.id !== notificationId)
            );
            // Refetch unread count
            fetchUnreadCount();
        } catch (error) {
            console.error("Error deleting notification:", error);
        }
    }, [fetchUnreadCount]);

    // Clear all notifications
    const handleClearAll = useCallback(async () => {
        try {
            await clearAllNotifications();
            setNotifications([]);
            setUnreadCount(0);
        } catch (error) {
            console.error("Error clearing notifications:", error);
        }
    }, []);

    // Toggle dropdown
    const toggleOpen = useCallback(() => {
        setIsOpen((prev) => !prev);
    }, []);

    const closeDropdown = useCallback(() => {
        setIsOpen(false);
    }, []);

    // Start polling for unread count (every 30 seconds)
    const startPolling = useCallback(() => {
        if (pollingRef.current) return;

        pollingRef.current = setInterval(() => {
            fetchUnreadCount();
        }, 30000); // 30 seconds
    }, [fetchUnreadCount]);

    // Stop polling
    const stopPolling = useCallback(() => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    }, []);

    // Initial fetch and start polling when component mounts
    useEffect(() => {
        const token = getToken();
        const restaurantId = getRestaurantId();

        if (token && restaurantId) {
            fetchNotifications();
            startPolling();
        }

        return () => {
            stopPolling();
        };
    }, [fetchNotifications, startPolling, stopPolling]);

    // Refresh notifications when dropdown opens
    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen, fetchNotifications]);

    const value = {
        notifications,
        unreadCount,
        loading,
        isOpen,
        toggleOpen,
        closeDropdown,
        fetchNotifications,
        fetchUnreadCount,
        markAsRead: handleMarkAsRead,
        markAllAsRead: handleMarkAllAsRead,
        deleteNotification: handleDeleteNotification,
        clearAll: handleClearAll,
        startPolling,
        stopPolling,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};
