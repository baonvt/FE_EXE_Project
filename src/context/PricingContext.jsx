import React, { createContext, useState, useEffect } from 'react';

export const PricingContext = createContext();

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
      menuItems: -1, // -1 = unlimited
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
