import React, { createContext, useState, useEffect } from 'react';
import { setItem, getItem } from '../utils/storage';

export const RestaurantContext = createContext();

// Initial mock data cho restaurants - Trống để bắt đầu
const initialRestaurants = [];

export const RestaurantProvider = ({ children }) => {
  // Load từ localStorage (synchronous initial load)
  const [restaurants, setRestaurants] = useState(() => {
    const saved = localStorage.getItem('restaurants');
    return saved ? JSON.parse(saved) : initialRestaurants;
  });

  const [currentRestaurant, setCurrentRestaurant] = useState(() => {
    const saved = localStorage.getItem('currentRestaurant');
    return saved ? JSON.parse(saved) : null;
  });

  // Load from IndexedDB if needed
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedRestaurants = await getItem('restaurants');
        if (savedRestaurants) {
          setRestaurants(JSON.parse(savedRestaurants));
        }
        
        const savedCurrent = await getItem('currentRestaurant');
        if (savedCurrent) {
          setCurrentRestaurant(JSON.parse(savedCurrent));
        }
      } catch (error) {
        console.error('Error loading restaurants:', error);
      }
    };
    loadData();
  }, []);

  // Save với automatic fallback to IndexedDB
  useEffect(() => {
    const saveData = async () => {
      try {
        await setItem('restaurants', JSON.stringify(restaurants));
      } catch (error) {
        console.error('Error saving restaurants:', error);
      }
    };
    if (restaurants.length > 0 || restaurants !== initialRestaurants) {
      saveData();
    }
  }, [restaurants]);

  useEffect(() => {
    const saveData = async () => {
      if (currentRestaurant) {
        try {
          await setItem('currentRestaurant', JSON.stringify(currentRestaurant));
        } catch (error) {
          console.error('Error saving current restaurant:', error);
        }
      }
    };
    saveData();
  }, [currentRestaurant]);

  // CRUD Operations
  const addRestaurant = (restaurantData) => {
    const newRestaurant = {
      ...restaurantData,
      id: Math.max(...restaurants.map(r => r.id), 0) + 1,
      setupCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      businessHours: {
        monday: { open: '08:00', close: '22:00', isOpen: true },
        tuesday: { open: '08:00', close: '22:00', isOpen: true },
        wednesday: { open: '08:00', close: '22:00', isOpen: true },
        thursday: { open: '08:00', close: '22:00', isOpen: true },
        friday: { open: '08:00', close: '22:00', isOpen: true },
        saturday: { open: '08:00', close: '23:00', isOpen: true },
        sunday: { open: '08:00', close: '23:00', isOpen: true },
      },
      settings: {
        currency: 'VND',
        taxRate: 10,
        serviceCharge: 5,
        autoAcceptOrders: false,
        allowCustomerReview: true,
        minimumOrderAmount: 50000,
      },
    };
    setRestaurants(prev => [...prev, newRestaurant]);
    setCurrentRestaurant(newRestaurant);
    return newRestaurant;
  };

  const registerRestaurant = (restaurantData) => {
    return addRestaurant(restaurantData);
  };

  const updateRestaurant = (id, updates) => {
    setRestaurants(prev =>
      prev.map(restaurant => {
        if (restaurant.id === id) {
          const updated = { ...restaurant, ...updates, updatedAt: new Date().toISOString() };
          // Update current restaurant if it's the one being updated
          if (currentRestaurant?.id === id) {
            setCurrentRestaurant(updated);
          }
          return updated;
        }
        return restaurant;
      })
    );
  };

  const deleteRestaurant = (id) => {
    setRestaurants(prev => prev.filter(r => r.id !== id));
    if (currentRestaurant?.id === id) {
      setCurrentRestaurant(null);
    }
  };

  const getRestaurantById = (id) => {
    return restaurants.find(r => r.id === id);
  };

  const getRestaurantBySlug = (slug) => {
    return restaurants.find(r => r.slug === slug);
  };

  const switchRestaurant = (restaurantId) => {
    const restaurant = getRestaurantById(restaurantId);
    if (restaurant) {
      setCurrentRestaurant(restaurant);
      return true;
    }
    return false;
  };

  const uploadLogo = (restaurantId, logoFile) => {
    // Simulate file upload - trong thực tế sẽ upload lên server
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const logoDataUrl = e.target.result;
        updateRestaurant(restaurantId, { logo: logoDataUrl });
        resolve(logoDataUrl);
      };
      reader.readAsDataURL(logoFile);
    });
  };

  const completeSetup = (restaurantId) => {
    updateRestaurant(restaurantId, { setupCompleted: true });
  };

  const updateBusinessHours = (restaurantId, businessHours) => {
    updateRestaurant(restaurantId, { businessHours });
  };

  const updateSettings = (restaurantId, settings) => {
    const restaurant = getRestaurantById(restaurantId);
    if (restaurant) {
      updateRestaurant(restaurantId, {
        settings: { ...restaurant.settings, ...settings }
      });
    }
  };

  const assignPackage = (restaurantId, packageData) => {
    if (packageData) {
      // Normalize limits to support both naming conventions
      const normalizedLimits = packageData.limits ? {
        menuItems: packageData.limits.menuItems || packageData.limits.maxMenuItems || 0,
        maxMenuItems: packageData.limits.maxMenuItems || packageData.limits.menuItems || 0,
        tables: packageData.limits.tables || packageData.limits.maxTables || 0,
        maxTables: packageData.limits.maxTables || packageData.limits.tables || 0,
        categories: packageData.limits.categories || packageData.limits.maxCategories || 0,
        maxCategories: packageData.limits.maxCategories || packageData.limits.categories || 0,
      } : undefined;

      const packageInfo = {
        ...packageData,
        limits: normalizedLimits,
        billingCycle: 'monthly',
        expiryDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
      };
      updateRestaurant(restaurantId, { package: packageInfo });
    }
  };

  const updateRestaurantStatus = (restaurantId, status) => {
    updateRestaurant(restaurantId, { status });
  };

  const suspendPackage = (restaurantId) => {
    const restaurant = getRestaurantById(restaurantId);
    if (restaurant && restaurant.package) {
      updateRestaurant(restaurantId, { 
        package: { ...restaurant.package, suspended: true }
      });
    }
  };

  const resumePackage = (restaurantId) => {
    const restaurant = getRestaurantById(restaurantId);
    if (restaurant && restaurant.package) {
      updateRestaurant(restaurantId, { 
        package: { ...restaurant.package, suspended: false }
      });
    }
  };

  // Check package limits
  const checkLimit = (restaurantId, limitType) => {
    const restaurant = getRestaurantById(restaurantId);
    if (!restaurant || !restaurant.package || !restaurant.package.limits) {
      return { canAdd: false, message: 'Không tìm thấy gói dịch vụ' };
    }

    const limits = restaurant.package.limits;
    
    // Get current counts from localStorage
    const menuItems = JSON.parse(localStorage.getItem('menuItems') || '[]');
    const categories = JSON.parse(localStorage.getItem('categories') || '[]');
    const tables = JSON.parse(localStorage.getItem('tables') || '[]');

    const currentCounts = {
      menuItems: menuItems.filter(item => item.restaurantId === restaurantId).length,
      categories: categories.filter(cat => cat.restaurantId === restaurantId).length,
      tables: tables.filter(table => table.restaurantId === restaurantId).length,
    };

    switch (limitType) {
      case 'menuItems':
        const maxMenuItems = limits.menuItems || limits.maxMenuItems;
        if (currentCounts.menuItems >= maxMenuItems) {
          return {
            canAdd: false,
            message: `Gói ${restaurant.package.name} chỉ cho phép tối đa ${maxMenuItems} món ăn. Vui lòng nâng cấp gói để thêm món mới.`,
            current: currentCounts.menuItems,
            max: maxMenuItems
          };
        }
        break;
      case 'categories':
        const maxCategories = limits.categories || limits.maxCategories;
        if (currentCounts.categories >= maxCategories) {
          return {
            canAdd: false,
            message: `Gói ${restaurant.package.name} chỉ cho phép tối đa ${maxCategories} danh mục. Vui lòng nâng cấp gói để thêm danh mục mới.`,
            current: currentCounts.categories,
            max: maxCategories
          };
        }
        break;
      case 'tables':
        const maxTables = limits.tables || limits.maxTables;
        if (currentCounts.tables >= maxTables) {
          return {
            canAdd: false,
            message: `Gói ${restaurant.package.name} chỉ cho phép tối đa ${maxTables} bàn ăn. Vui lòng nâng cấp gói để thêm bàn mới.`,
            current: currentCounts.tables,
            max: maxTables
          };
        }
        break;
      default:
        return { canAdd: false, message: 'Loại giới hạn không hợp lệ' };
    }

    return { canAdd: true };
  };

  // Get pending restaurants (for admin notifications)
  const getPendingRestaurants = () => {
    return restaurants.filter(r => r.status === 'pending');
  };

  // Statistics
  const getRestaurantStats = () => {
    return {
      total: restaurants.length,
      active: restaurants.filter(r => r.status === 'active').length,
      trial: restaurants.filter(r => r.status === 'trial').length,
      pending: restaurants.filter(r => r.status === 'pending').length,
      suspended: restaurants.filter(r => r.status === 'suspended').length,
      monthlyRevenue: restaurants.reduce((sum, r) => sum + (r.package?.monthlyPrice || 0), 0),
    };
  };

  // Get all restaurants (for admin)
  const getAllRestaurants = () => {
    return restaurants;
  };

  const value = {
    restaurants,
    currentRestaurant,
    selectedRestaurant: currentRestaurant, // Alias for compatibility
    addRestaurant,
    registerRestaurant,
    updateRestaurant,
    deleteRestaurant,
    getRestaurantById,
    getRestaurantBySlug,
    getAllRestaurants,
    switchRestaurant,
    uploadLogo,
    completeSetup,
    updateBusinessHours,
    updateSettings,
    assignPackage,
    updateRestaurantStatus,
    suspendPackage,
    resumePackage,
    checkLimit,
    getPendingRestaurants,
    getRestaurantStats,
  };

  return (
    <RestaurantContext.Provider value={value}>
      {children}
    </RestaurantContext.Provider>
  );
};
