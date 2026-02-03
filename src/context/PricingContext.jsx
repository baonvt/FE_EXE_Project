import React, { createContext, useState, useEffect } from 'react';

export const PricingContext = createContext();

// Default packages fallback
const defaultPackages = [
  {
    id: 1,
    name: 'Basic',
    displayName: 'Gói Cơ Bản',
    monthlyPrice: 229000,
    yearlyPrice: 2290000,
    description: 'Dành cho quán nhỏ, phục vụ dưới 40 khách/lượt',
    targetAudience: 'Quán cà phê nhỏ, quán ăn gia đình, hoặc mô hình take-away',
    features: [
      'Tạo thực đơn (tối đa 30 món)',
      'Gọi món bằng mã QR',
      'Thống kê doanh thu cơ bản',
      'Quản lý tối đa 10 bàn',
      '3 danh mục món ăn (Món chính - Đồ uống - Tráng miệng)',
      'Hỗ trợ qua email'
    ],
    limits: {
      menuItems: 30,
      maxMenuItems: 30,
      tables: 10,
      maxTables: 10,
      categories: 3,
      maxCategories: 3
    },
    popular: false,
    active: true
  },
  {
    id: 2,
    name: 'Pro',
    displayName: 'Gói Chuyên Nghiệp',
    monthlyPrice: 270000,
    yearlyPrice: 2700000,
    description: 'Dành cho quán cà phê và nhà hàng đang phát triển',
    targetAudience: 'Quán vừa, có phục vụ tại bàn và menu đa dạng',
    features: [
      'Bao gồm tất cả tính năng của Gói Cơ Bản',
      'Quản lý nhân viên phục vụ',
      'Lưu trữ đám mây',
      'Quản lý tối đa 25 bàn',
      'Tạo đến 80 món ăn/đồ uống',
      '6 danh mục món ăn (Món chính - Món phụ - Đồ nướng - Lẩu - Đồ uống - Tráng miệng)',
      'Báo cáo doanh thu chi tiết theo danh mục',
      'Hỗ trợ 24/7'
    ],
    limits: {
      menuItems: 80,
      maxMenuItems: 80,
      tables: 25,
      maxTables: 25,
      categories: 6,
      maxCategories: 6
    },
    popular: true,
    active: true
  },
  {
    id: 3,
    name: 'Premium',
    displayName: 'Gói Cao Cấp',
    monthlyPrice: 279000,
    yearlyPrice: 2790000,
    description: 'Dành cho chuỗi hoặc nhà hàng có nhiều chi nhánh',
    targetAudience: 'Nhà hàng quy mô vừa, hoặc hệ thống có nhiều chi nhánh cần quản lý tập trung',
    features: [
      'Bao gồm tất cả tính năng của Gói Chuyên Nghiệp',
      'Hỗ trợ kỹ thuật ưu tiên',
      'Kết nối nhiều chi nhánh',
      'Đánh giá & đặt chỗ của khách hàng',
      'Quản lý không giới hạn số bàn và món ăn',
      'Tạo danh mục tùy chỉnh linh hoạt (theo chi nhánh, theo loại hình phục vụ)',
      'Tích hợp thực đơn số đồng bộ giữa các chi nhánh',
      'API tích hợp',
      'Hỗ trợ ưu tiên 24/7',
      'Tùy chỉnh theo yêu cầu'
    ],
    limits: {
      menuItems: -1,
      maxMenuItems: -1,
      tables: -1,
      maxTables: -1,
      categories: -1,
      maxCategories: -1
    },
    popular: false,
    active: true
  }
];

export const PricingProvider = ({ children }) => {
  const [packages, setPackages] = useState(() => {
    const saved = localStorage.getItem('pricingPackages');
    return saved ? JSON.parse(saved) : defaultPackages;
  });

  const BASE_URL = 'https://apiqrcodeexe201-production.up.railway.app';

  // Normalize backend package shape to the frontend expected shape
  const normalizePackage = (p) => {
    // support snake_case and camelCase
    const id = p.id ?? p.PackageID ?? p.package_id ?? p.packageId ?? null;
    const name = p.name || p.displayName || p.title || `Package ${id}`;
    const displayName = p.displayName || p.display_name || p.name || p.title || name;
    const monthlyPrice = p.monthlyPrice ?? p.monthly_price ?? p.price_monthly ?? p.price ?? 0;
    const yearlyPrice = p.yearlyPrice ?? p.yearly_price ?? p.price_yearly ?? (monthlyPrice * 10) ?? 0;
    const description = p.description || p.desc || p.summary || '';
    const targetAudience = p.targetAudience || p.target_audience || p.audience || '';

    // features may come as a JSON string in backend response
    let features = [];
    if (Array.isArray(p.features)) features = p.features;
    else if (typeof p.features === 'string') {
      try {
        const parsed = JSON.parse(p.features);
        if (Array.isArray(parsed)) features = parsed;
        else features = [String(parsed)];
      } catch (err) {
        // fallback: split by comma if it looks like a CSV
        features = p.features.split(',').map(s => s.trim()).filter(Boolean);
      }
    } else {
      features = [];
    }

    // Limits mapping (backend uses max_* fields)
    const limits = {
      menuItems: p.max_menu_items ?? p.maxMenuItems ?? p.limits?.menuItems ?? null,
      maxMenuItems: p.max_menu_items ?? p.maxMenuItems ?? p.limits?.maxMenuItems ?? null,
      tables: p.max_tables ?? p.maxTables ?? p.limits?.tables ?? null,
      maxTables: p.max_tables ?? p.maxTables ?? p.limits?.maxTables ?? null,
      categories: p.max_categories ?? p.maxCategories ?? p.limits?.categories ?? null,
      maxCategories: p.max_categories ?? p.maxCategories ?? p.limits?.maxCategories ?? null,
    };

    const popular = p.popular ?? p.isPopular ?? p.is_popular ?? false;
    const active = p.active ?? (p.status ? p.status === 'active' : true);

    return {
      id: Number(id) || null,
      name,
      displayName,
      monthlyPrice: Number(monthlyPrice) || 0,
      yearlyPrice: Number(yearlyPrice) || 0,
      description,
      targetAudience,
      features: features,
      limits,
      popular,
      active,
    };
  };

  // Fetch packages from backend on mount and fallback to local defaults
  useEffect(() => {
    let cancelled = false;

    const fetchPackages = async () => {
      try {
        const resp = await fetch(`${BASE_URL}/api/v1/packages`);
        if (!resp.ok) {
          console.warn('Failed to fetch packages, using defaults', resp.status);
          return;
        }
        const data = await resp.json();
        // Expecting an array; the backend may return { data: [...] }
        const list = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : null);
        if (!list || list.length === 0) return;

        const mapped = list.map(normalizePackage).filter(p => p.id !== null);
        if (!cancelled && mapped.length > 0) {
          setPackages(mapped);
        }
      } catch (err) {
        console.warn('Error fetching packages:', err);
      }
    };

    fetchPackages();

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    localStorage.setItem('pricingPackages', JSON.stringify(packages));
  }, [packages]);

  // Get all active packages
  const getActivePackages = () => {
    return packages.filter(pkg => pkg.active);
  };

  // Get all packages (for admin)
  const getAllPackages = () => {
    return packages;
  };

  // Get package by ID
  const getPackageById = (id) => {
    return packages.find(pkg => pkg.id === id);
  };

  // Add new package
  const addPackage = (packageData) => {
    const newPackage = {
      ...packageData,
      id: Math.max(...packages.map(p => p.id), 0) + 1,
      active: true
    };
    setPackages(prev => [...prev, newPackage]);
    return newPackage;
  };

  // Update package
  const updatePackage = (id, updates) => {
    setPackages(prev =>
      prev.map(pkg => (pkg.id === id ? { ...pkg, ...updates } : pkg))
    );
  };

  // Delete package (soft delete by setting active = false)
  const deletePackage = (id) => {
    setPackages(prev =>
      prev.map(pkg => (pkg.id === id ? { ...pkg, active: false } : pkg))
    );
  };

  // Toggle popular
  const togglePopular = (id) => {
    setPackages(prev =>
      prev.map(pkg => ({
        ...pkg,
        popular: pkg.id === id ? !pkg.popular : pkg.popular
      }))
    );
  };

  const value = {
    packages,
    getActivePackages,
    getAllPackages,
    getPackageById,
    addPackage,
    updatePackage,
    deletePackage,
    togglePopular
  };

  return (
    <PricingContext.Provider value={value}>
      {children}
    </PricingContext.Provider>
  );
};
