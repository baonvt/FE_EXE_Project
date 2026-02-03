import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  RESTAURANT_OWNER: 'restaurant_owner',
  STAFF: 'staff',
  CUSTOMER: 'customer',
};

const BASE_URL = 'https://apiqrcodeexe201-production.up.railway.app';

export const AuthProvider = ({ children }) => {
  // 1. Chỉ lưu currentUser, KHÔNG lưu danh sách users (bảo mật & hiệu năng)
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  // 2. Quản lý Token trong State
  const [token, setToken] = useState(() => localStorage.getItem('authToken'));
  
  const [loading, setLoading] = useState(false);

  // 3. Helper để lấy Header khi gọi API ở các trang khác
  const getAuthHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  };

  // Sync Token & User với LocalStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }, [token]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [currentUser]);

  // --- LOGIN (CHỈ GỌI API) ---
  const login = async (email, password) => {
    setLoading(true);
    
    // Clear restaurant_id cũ trước khi login mới để tránh lẫn giữa các nhà hàng
    localStorage.removeItem('restaurant_id');
    
    try {
      // Xóa sạch fallback local, chỉ tin tưởng Server
      const url = `${BASE_URL}/api/v1/auth/login`;
      const payload = { email: (email || '').trim().toLowerCase(), password };
      
      console.debug('Login Request:', payload);

      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      let data;
      try {
        data = await resp.json();
      } catch (e) {
        console.debug('Login response: non-JSON response', resp.status);
        data = null;
      }

      console.debug('Login response:', resp.status, data);

      if (!resp.ok) {
        return { success: false, error: data?.message || 'Đăng nhập thất bại' };
      }

      // Logic lấy Token - support several shapes (token, accessToken, access_token, nested in data)
      const receivedToken =
        data?.token ||
        data?.accessToken ||
        data?.access_token ||
        data?.data?.token ||
        data?.data?.accessToken ||
        data?.data?.access_token ||
        null;

      // Extract user object if present (prefer data.user or data.data.user)
      const userFromBody = data?.user || (data?.data && data.data.user) || null;

      if (!receivedToken) {
        return { success: false, error: 'Server không trả về Token' };
}

      // Cập nhật State
      setToken(receivedToken);

      // Lưu restaurant_id nếu có (check cả root và nested trong data)
      const restaurantId = data?.data?.restaurant_id || data?.restaurant_id || null;
      if (restaurantId) {
        localStorage.setItem('restaurant_id', String(restaurantId));
      }

      if (userFromBody) {
        const { password: _, ...cleanUser } = userFromBody;
        // Map role nếu server trả về khác chuẩn
        if (cleanUser.role === 'restaurant') cleanUser.role = USER_ROLES.RESTAURANT_OWNER;
        
        // Thêm restaurant_id vào user object
        cleanUser.restaurant_id = restaurantId;
        
        setCurrentUser(cleanUser);
        return { success: true, user: cleanUser, restaurant_id: restaurantId };
      }

      // Nếu chỉ có token mà không có user info, tạm thời set user ảo dựa trên email
      const tempUser = { email, role: 'unknown' };
      setCurrentUser(tempUser);
      return { success: true, user: tempUser };

    } catch (err) {
      console.error('Login Error:', err);
      // KHÔNG FALLBACK VỀ MOCK DATA NỮA
      return { success: false, error: 'Lỗi kết nối Server. Vui lòng kiểm tra mạng.' };
    } finally {
      setLoading(false);
    }
  };

  // --- LOGOUT ---
  const logout = () => {
    setToken(null);
    setCurrentUser(null);
    // Remove only auth-related keys to avoid wiping other app data (restaurants, settings...)
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('restaurant_id');
  };

  // --- REGISTER (CHỈ GỌI API) ---
  const register = async (userData) => {
    setLoading(true);
    try {
      const url = `${BASE_URL}/api/v1/auth/register`;
      const payload = {
        name: userData.name,
        email: (userData.email || '').trim().toLowerCase(),
        password: userData.password,
        phone: userData.phone,
        role: userData.role || USER_ROLES.RESTAURANT_OWNER,
      };

      // Xử lý các trường đặc thù của Backend (bao gồm nhiều dạng tên trường)
      const rName = userData.restaurantName || userData.RestaurantName || userData.restaurant_name;
      if (rName) {
        payload.RestaurantName = rName;
        payload.restaurantName = rName;
        payload.restaurant_name = rName;
      }

      const pkgIdRaw = userData.PackageID || userData.packageId || userData.package_id;
      if (pkgIdRaw !== undefined && pkgIdRaw !== null) {
        const pkgId = Number(pkgIdRaw);
        payload.PackageID = pkgId;
        payload.packageId = pkgId;
        payload.package_id = pkgId;
      }

      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await resp.json();

      if (!resp.ok) {
        return { success: false, error: data?.message || 'Đăng ký thất bại' };
      }

      // Auto login sau khi đăng ký thành công (nếu server trả token)
      const receivedToken = data?.token || data?.accessToken || data?.data?.token;
      const userFromBody = data?.user || data?.data?.user || data?.data || null;

      if (receivedToken) setToken(receivedToken);

      if (userFromBody) {
        // Normalize role if backend uses alternate names
if (userFromBody.role === 'restaurant') userFromBody.role = USER_ROLES.RESTAURANT_OWNER;
        setCurrentUser(userFromBody);
        return { success: true, user: userFromBody };
      }

      // If server returned success but no user object, return minimal info
      return { success: true, user: data?.user || null };

    } catch (err) {
      console.error("Register Error:", err);
      return { success: false, error: 'Không thể kết nối Server để đăng ký' };
    } finally {
      setLoading(false);
    }
  };

  // --- CÁC HÀM CẦN NÂNG CẤP API (PLACEHOLDER) ---
  
  // Hàm này cần API thật để tạo staff. Tạm thời trả về lỗi để bạn biết cần làm gì.
  const registerStaff = async (staffData, restaurantId) => {
    if (!token) return { success: false, error: "Vui lòng đăng nhập lại" };
    
    // TODO: Thay thế bằng API thật khi Backend sẵn sàng
    // Ví dụ: POST /api/v1/users/create-staff
    console.warn("Chức năng tạo Staff cần kết nối API");
    return { success: false, error: "Chức năng đang bảo trì (cần API Backend)" };
  };

  const updateProfile = async (userId, updates) => {
    // TODO: Gọi API PUT /users/:id kèm header token
    console.warn("Update Profile cần kết nối API");
    // Tạm thời update ở client để UI mượt, nhưng phải nhớ làm API sau
    setCurrentUser(prev => ({ ...prev, ...updates }));
  };

  const changePassword = async (userId, oldPass, newPass) => {
    // TODO: Gọi API Change Password
    return { success: false, error: "Chức năng đổi mật khẩu chưa kết nối Server" };
  };

  const getAllUsers = () => {
    // Không thể lấy local array nữa. Phải gọi API list users.
    return [];
  };

  // Các hàm check quyền vẫn giữ nguyên logic Client
  const hasPermission = (permission) => {
    if (!currentUser) return false;
    if (currentUser.role === USER_ROLES.SUPER_ADMIN) return true;
    if (currentUser.role === USER_ROLES.RESTAURANT_OWNER) return true;
    return currentUser.permissions?.includes(permission) || false;
  };

  const value = {
    currentUser,
    token, // Quan trọng: Public token ra ngoài
    loading,
    login,
    logout,
    register,
    registerStaff,
    updateProfile,
    changePassword,
    getAllUsers, // Lưu ý: hàm này giờ trả về rỗng
    hasPermission,
    isAuthenticated: () => !!token && !!currentUser,
    hasRole: (role) => currentUser?.role === role,
    USER_ROLES,
    getAuthHeaders, // Public helper này ra để các file khác dùng
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};