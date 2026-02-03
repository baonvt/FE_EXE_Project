import { useState } from 'react';
import { href, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useToast } from '../context/useToast';
import { usePricing } from '../context/usePricing';
import './LandingPage.css';

const API_BASE = 'https://apiqrcodeexe201-production.up.railway.app';

export default function LandingPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();
  const { getActivePackages } = usePricing();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' or 'yearly'

  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: '',
    phone: '',
    email: '',
    subject: 'Đăng ký dùng thử',
    message: ''
  });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/v1/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Không thể gửi tin nhắn');
      }

      setContactSuccess(true);
      showToast('Gửi tin nhắn thành công! Chúng tôi sẽ liên hệ lại sớm.', 'success');
      setContactForm({
        name: '',
        phone: '',
        email: '',
        subject: 'Đăng ký dùng thử',
        message: ''
      });

      // Reset success message after 5 seconds
      setTimeout(() => setContactSuccess(false), 5000);
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setContactLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    const result = await login(loginForm.email, loginForm.password);

    if (result.success) {
      showToast('Đăng nhập thành công!', 'success');
      setShowLoginModal(false);
      // Redirect based on role
        setTimeout(() => {
          const role = (result.user?.role || '').toString().toLowerCase();

          if (role === 'super_admin' || role === 'admin') {
            navigate('/admin');
            return;
          }

          // Accept several possible role names that represent restaurant owners
          const restaurantRoles = ['restaurant', 'restaurant_owner', 'owner', 'restaurant-admin'];
          if (restaurantRoles.includes(role)) {
            navigate('/bussiness');
            return;
          }
        }, 500);
    } else {
      showToast(result.error, 'error');
      setError(result.error);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!registerForm.name || !registerForm.email || !registerForm.password) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerForm.email)) {
      setError('Email không hợp lệ');
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (registerForm.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    // Check if email already exists
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'https://apiqrcodeexe201-production.up.railway.app';
      const resp = await fetch(`${API_URL}/api/v1/auth/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: registerForm.email })
      });

      const data = await resp.json();

      if (!resp.ok) {
        if (data.code === 'EMAIL_EXISTS') {
          setError('Email này đã được đăng ký. Vui lòng sử dụng email khác hoặc đăng nhập.');
          showToast('Email đã tồn tại trong hệ thống', 'error');
        } else {
          setError(data.message || 'Không thể kiểm tra email');
        }
        return;
      }
    } catch (err) {
      console.error('Check email error:', err);
      setError('Không thể kết nối đến server. Vui lòng thử lại.');
      return;
    }

    // Email is available, proceed to onboarding
    showToast('Tiếp tục bước onboarding để hoàn tất đăng ký', 'info');
    setShowRegisterModal(false);
    navigate('/onboarding', { state: { registerData: registerForm } });
  };

  const features = [
    {
      icon: '📱',
      iconBg: '#e3f2fd',
      iconColor: '#1976d2',
      title: 'Quét QR - Đặt món ngay',
      description: 'Khách hàng quét mã QR trên bàn, xem menu và đặt món trực tiếp trên điện thoại'
    },
    {
      icon: '📋',
      iconBg: '#e8f5e9',
      iconColor: '#388e3c',
      title: 'Quản lý Menu dễ dàng',
      description: 'Thêm, sửa, xóa món ăn chỉ với vài cú click. Cập nhật giá và hình ảnh nhanh chóng'
    },
    {
      icon: '📦',
      iconBg: '#fff3e0',
      iconColor: '#f57c00',
      title: 'Theo dõi đơn hàng realtime',
      description: 'Xem tình trạng đơn hàng từ bếp đến phục vụ. Không bao giờ bỏ sót đơn'
    },
    {
      icon: '🪑',
      iconBg: '#f3e5f5',
      iconColor: '#7b1fa2',
      title: 'Quản lý bàn thông minh',
      description: 'Theo dõi trạng thái bàn, tạo QR code cho từng bàn tự động'
    },
    {
      icon: '📊',
      iconBg: '#e0f2f1',
      iconColor: '#00796b',
      title: 'Báo cáo doanh thu',
      description: 'Thống kê doanh thu theo ngày, tuần, tháng. Biết rõ món nào bán chạy nhất'
    },
    {
      icon: '⚡',
      iconBg: '#fff9c4',
      iconColor: '#f57f17',
      title: 'Nhanh chóng - Tiện lợi',
      description: 'Giảm thời gian chờ đợi, tăng trải nghiệm khách hàng. Tối ưu vận hành nhà hàng'
    }
  ];

  const packages = getActivePackages();

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getPackagePrice = (pkg) => {
    return billingCycle === 'monthly' ? pkg.monthlyPrice : pkg.yearlyPrice;
  };

  const getPricePeriod = () => {
    return billingCycle === 'monthly' ? '/tháng' : '/năm';
  };

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="landing-header">
        <div className="container">
          <div className="header-content">
            <div className="logo">
              <span className="logo-icon">🍴</span>
              <span className="logo-text">F&B Manager</span>
            </div>
            <nav className="nav-menu">
              <a href="#features">Tính năng</a>
              <a href="#pricing">Bảng giá</a>
              <a href="#contact">Liên hệ</a>
            </nav>
            <div className="auth-buttons">
              <button className="btn-login" onClick={() => setShowLoginModal(true)}>
                Đăng nhập
              </button>
              <button className="btn-register" onClick={() => setShowRegisterModal(true)}>
                Đăng ký ngay
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Quản lý nhà hàng <span className="gradient-text">thông minh</span><br />
              với công nghệ QR Code
            </h1>
            <p className="hero-subtitle">
              Khách hàng quét mã, đặt món ngay. Không cần gọi phục vụ, không cần chờ đợi.<br />
              Tăng doanh thu, giảm chi phí vận hành cho nhà hàng của bạn.
            </p>
            <div className="hero-actions">
              <button className="btn-primary-large" onClick={() => href('#contact')}>
                Dùng thử miễn phí 14 ngày
              </button>
              <button className="btn-secondary-large">
                <span className="play-icon">▶</span> Xem demo
              </button>
            </div>
            <div className="hero-stats">
              <div className="stat-item">
                <div className="stat-number">50+</div>
                <div className="stat-label">Nhà hàng tin dùng</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">2K+</div>
                <div className="stat-label">Đơn hàng/tháng</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">98%</div>
                <div className="stat-label">Hài lòng</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Tính năng nổi bật</h2>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div 
                  className="feature-icon" 
                  style={{ 
                    background: feature.iconBg,
                    color: feature.iconColor
                  }}
                >
                  {feature.icon}
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Bảng giá minh bạch</h2>
            
            {/* Billing Cycle Toggle */}
            <div className="billing-toggle">
              <span className={billingCycle === 'monthly' ? 'active' : ''}>Theo tháng</span>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={billingCycle === 'yearly'}
                  onChange={(e) => setBillingCycle(e.target.checked ? 'yearly' : 'monthly')}
                />
                <span className="slider"></span>
              </label>
              <span className={billingCycle === 'yearly' ? 'active' : ''}>
                Theo năm
                <span className="discount-badge">Tiết kiệm 20%</span>
              </span>
            </div>
          </div>
          <div className="pricing-grid">
            {packages.map((pkg, index) => (
              <div key={index} className={`pricing-card ${pkg.popular ? 'popular' : ''}`}>
                {pkg.popular && <div className="popular-badge">Phổ biến nhất</div>}
                <h3 className="package-name">{pkg.name}</h3>
                <div className="package-price">
                  <span className="price">{formatPrice(getPackagePrice(pkg))}</span>
                  <span className="period">{getPricePeriod()}</span>
                </div>
                <ul className="package-features">
                  {pkg.features.map((feature, idx) => (
                    <li key={idx}>✓ {feature}</li>
                  ))}
                </ul>
                <button className="btn-package" onClick={() => setShowRegisterModal(true)}>
                  Chọn gói này
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Liên hệ với chúng tôi</h2>
            <p className="section-subtitle">Đội ngũ chuyên gia sẵn sàng hỗ trợ bạn 24/7</p>
          </div>
          
          <div className="contact-container">
            {/* Contact Info */}
            <div className="contact-info">
              <div className="contact-item">
                <div className="contact-icon">📞</div>
                <div className="contact-details">
                  <h4>Hotline hỗ trợ</h4>
                  <a href="tel:0377128183" className="contact-link">0377 128 183</a>
                  <p className="contact-desc">24/7 - Miễn phí cuộc gọi</p>
                </div>
              </div>

              <div className="contact-item">
                <div className="contact-icon">✉️</div>
                <div className="contact-details">
                  <h4>Email hỗ trợ</h4>
                  <a href="mailto:baonvthe180736@fpt.edu.vn" className="contact-link">baonvthe180736@fpt.edu.vn</a>
                  <p className="contact-desc">Phản hồi trong 2 giờ</p>
                </div>
              </div>

              <div className="social-links">
                <h4>Kết nối với chúng tôi</h4>
                <div className="social-buttons">
                  <a href="#" className="social-btn">Facebook</a>
                  <a href="#" className="social-btn">YouTube</a>
                  <a href="#" className="social-btn">LinkedIn</a>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="contact-form-wrapper">
              <h3 className="form-title">Gửi tin nhắn cho chúng tôi</h3>
              
              {contactSuccess && (
                <div className="success-message" style={{
                  background: '#d4edda',
                  color: '#155724',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  textAlign: 'center'
                }}>
                  ✅ Cảm ơn bạn! Chúng tôi sẽ liên hệ lại trong thời gian sớm nhất.
                </div>
              )}

              <form className="contact-form" onSubmit={handleContactSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Họ tên *</label>
                    <input 
                      type="text" 
                      placeholder="Nhập họ tên đầy đủ..." 
                      required 
                      value={contactForm.name}
                      onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Số điện thoại *</label>
                    <input 
                      type="tel" 
                      placeholder="0912345678" 
                      required 
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input 
                    type="email" 
                    placeholder="email@example.com" 
                    required 
                    value={contactForm.email}
                    onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Chủ đề</label>
                  <select
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
                  >
                    <option value="Đăng ký dùng thử">Đăng ký dùng thử</option>
                    <option value="Tư vấn gói dịch vụ">Tư vấn gói dịch vụ</option>
                    <option value="Hỗ trợ kỹ thuật">Hỗ trợ kỹ thuật</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Tin nhắn *</label>
                  <textarea 
                    rows="4" 
                    placeholder="Mô tả chi tiết yêu cầu của bạn..." 
                    required
                    value={contactForm.message}
                    onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  className="btn-submit"
                  disabled={contactLoading}
                  style={{ opacity: contactLoading ? 0.7 : 1 }}
                >
                  {contactLoading ? '⏳ Đang gửi...' : '📤 Gửi tin nhắn'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Back to Top Button */}
      <button 
        className="back-to-top" 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        ↑
      </button>

      {/* Floating Contact Buttons */}
      <div className="floating-contacts">
        <a 
          href="https://zalo.me/0708787216" 
          target="_blank" 
          rel="noopener noreferrer"
          className="floating-btn zalo"
          title="Chat Zalo"
        >
          <img src="https://page.widget.zalo.me/static/images/2.0/Logo.svg" alt="Zalo" />
        </a>
        <a 
          href="https://m.me/YOUR_FACEBOOK_PAGE" 
          target="_blank" 
          rel="noopener noreferrer"
          className="floating-btn messenger"
          title="Chat Messenger"
        >
          💬
        </a>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="modal-overlay" onClick={() => setShowLoginModal(false)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowLoginModal(false)}>×</button>
            <h2 className="modal-title">Đăng nhập</h2>
            <form onSubmit={handleLogin}>
              {error && <div className="error-message">{error}</div>}
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  placeholder="email@example.com"
                  required
                />
              </div>
              <div className="form-group">
                <label>Mật khẩu</label>
                <input
                  type="password"
                  name="current-password"
                  autoComplete="current-password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="••••••••"
                  required
                />
              </div>
              <button type="submit" className="btn-submit">Đăng nhập</button>
              <p className="switch-auth">
                Chưa có tài khoản? <button type="button" onClick={() => { setShowLoginModal(false); setShowRegisterModal(true); }}>Đăng ký ngay</button>
              </p>
            </form>
          </div>
        </div>
      )}

      {/* Register Modal */}
      {showRegisterModal && (
        <div className="modal-overlay" onClick={() => setShowRegisterModal(false)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowRegisterModal(false)}>×</button>
            <h2 className="modal-title">Đăng ký tài khoản</h2>
            <form onSubmit={handleRegister}>
              {error && <div className="error-message">{error}</div>}
              <div className="form-group">
                <label>Họ và tên *</label>
                <input
                  type="text"
                  name="name"
                  autoComplete="name"
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                  placeholder="Nguyễn Văn A"
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  placeholder="email@example.com"
                  required
                />
              </div>
              <div className="form-group">
                <label>Số điện thoại</label>
                <input
                  type="tel"
                  name="tel"
                  autoComplete="tel"
                  value={registerForm.phone}
                  onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                  placeholder="0123456789"
                />
              </div>
              <div className="form-group">
                <label>Mật khẩu *</label>
                <input
                  type="password"
                  name="new-password"
                  autoComplete="new-password"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="form-group">
                <label>Xác nhận mật khẩu *</label>
                <input
                  type="password"
                  name="new-password-confirm"
                  autoComplete="new-password"
                  value={registerForm.confirmPassword}
                  onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  required
                />
              </div>
              <button type="submit" className="btn-submit">Tiếp tục</button>
              <p className="switch-auth">
                Đã có tài khoản? <button type="button" onClick={() => { setShowRegisterModal(false); setShowLoginModal(true); }}>Đăng nhập</button>
              </p>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <p>&copy; 2024 F&B Manager. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
