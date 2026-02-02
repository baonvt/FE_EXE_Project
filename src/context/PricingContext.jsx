import React, { createContext, useState, useEffect } from 'react';

export const PricingContext = createContext();

export const PricingProvider = ({ children }) => {
  const [packages, setPackages] = useState(() => {
    const saved = localStorage.getItem('pricingPackages');
    return saved ? JSON.parse(saved) : null;
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
