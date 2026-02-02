import React, { createContext, useContext, useState, useCallback } from "react";

const CustomerContext = createContext();

export function CustomerProvider({ children }) {
  const [restaurantId, setRestaurantId] = useState(null);
  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantSlug, setRestaurantSlug] = useState("");
  const [tableId, setTableId] = useState(null);
  const [tableNumber, setTableNumber] = useState("");
  const [cart, setCart] = useState([]);

  const initSession = useCallback((restaurant, table) => {
    if (restaurant) {
      setRestaurantId(restaurant.id ?? restaurant.restaurant_id);
      setRestaurantName(restaurant.name ?? "");
      setRestaurantSlug(restaurant.slug ?? "");
    }
    if (table) {
      setTableId(table.id ?? table.table_id);
      setTableNumber(String(table.number ?? table.table_number ?? table.name ?? ""));
    }
  }, []);

  const addToCart = useCallback((item, quantity = 1, specialRequest = "") => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id && (i.specialRequest || "") === (specialRequest || ""));
      if (existing) {
        return prev.map((i) =>
          i.id === item.id && (i.specialRequest || "") === (specialRequest || "")
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, { ...item, quantity, specialRequest: specialRequest || "" }];
    });
  }, []);

  const updateCartItemQuantity = useCallback((itemId, quantity, specialRequest = null) => {
    const match = (i) => i.id === itemId && (i.specialRequest || "") === (specialRequest ?? "");
    if (quantity <= 0) {
      setCart((prev) => prev.filter((i) => !match(i)));
      return;
    }
    setCart((prev) =>
      prev.map((i) => (match(i) ? { ...i, quantity, ...(specialRequest != null && { specialRequest: specialRequest || "" }) } : i))
    );
  }, []);

  const removeFromCart = useCallback((itemId, specialRequest = null) => {
    setCart((prev) =>
      prev.filter((i) => !(i.id === itemId && (i.specialRequest || "") === (specialRequest ?? "")))
    );
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartTotal = cart.reduce((sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 1), 0);
  const cartCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  const value = {
    restaurantId,
    restaurantName,
    restaurantSlug,
    tableId,
    tableNumber,
    tableName: tableNumber ? `Bàn ${tableNumber}` : "",
    initSession,
    cart,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    cartTotal,
    cartCount,
  };

  return (
    <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>
  );
}

export function useCustomer() {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error("useCustomer must be used within CustomerProvider");
  return ctx;
}
