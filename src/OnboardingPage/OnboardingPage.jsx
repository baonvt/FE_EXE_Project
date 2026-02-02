import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useRestaurant } from '../context/useRestaurant';
import { usePricing } from '../context/usePricing';
import { usePayment } from '../context/usePayment';
import { PAYMENT_TYPES } from '../context/PaymentContext';
import { useToast } from '../context/useToast';
import './OnboardingPage.css';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, login } = useAuth();
  const { addRestaurant } = useRestaurant();
  const { getActivePackages } = usePricing();
  const { processVNPayPayment, processMoMoPayment } = usePayment();
  const { showSuccess, showError, showWarning } = useToast();
  
  const registerData = location.state?.registerData;
  
  const [step, setStep] = useState(1);
  const [restaurantData, setRestaurantData] = useState({
    name: '',
    slug: '',
    address: '',
    phone: '',
    description: ''
  });
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const packages = getActivePackages();

  if (!registerData) {
    navigate('/');
    return null;
  }

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleRestaurantNameChange = (name) => {
    setRestaurantData({
      ...restaurantData,
      name,
      slug: generateSlug(name)
    });
  };

  const handleStep1Submit = (e) => {
    e.preventDefault();
    setError('');

    if (!restaurantData.name || !restaurantData.address || !restaurantData.phone) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setStep(2);
  };

  const handlePackageSelect = (pkg) => {
    setSelectedPackage(pkg);
  };

  const handleStep2Submit = () => {
    if (!selectedPackage) {
      setError('Vui lòng chọn gói dịch vụ');
      return;
    }
    setStep(3);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleComplete = async () => {
    if (!selectedMethod) {
      setError('Vui lòng chọn phương thức thanh toán');
      return;
    }

    setIsProcessing(true);
    setError('');

    // Create temporary user first
    const tempUserId = `temp_${Date.now()}`;
    
    const paymentData = {
      userId: tempUserId,
      type: PAYMENT_TYPES.REGISTRATION,
      packageId: selectedPackage.id,
      packageName: selectedPackage.name,
      amount: selectedPackage.monthlyPrice,
      description: `Đăng ký gói ${selectedPackage.name}`,
      restaurantName: restaurantData.name,
    };

    try {
      let result;
      if (selectedMethod === 'vnpay') {
        result = await processVNPayPayment(paymentData);
      } else if (selectedMethod === 'momo') {
        result = await processMoMoPayment(paymentData);
      }

      // if (!result.success) {
      //   setError('Thanh toán thất bại. Vui lòng thử lại.');
      //   setIsProcessing(false);
      //   return;
      // }

      // Payment successful, now register user (include restaurant and package info expected by backend)
      const registerPayload = {
        email: registerData.email,
        password: registerData.password,
        name: registerData.name,
        phone: registerData.phone,
        role: 'restaurant_owner',
        // include both camelCase, PascalCase and snake_case keys to satisfy backend validation
        restaurantName: restaurantData.name,
        RestaurantName: restaurantData.name,
        restaurant_name: restaurantData.name,
        packageId: selectedPackage?.id,
        PackageID: selectedPackage ? Number(selectedPackage.id) : undefined,
        package_id: selectedPackage ? Number(selectedPackage.id) : undefined,
      };

      console.debug('Onboarding register payload:', registerPayload);

      const registerResult = await register(registerPayload);

      if (!registerResult.success) {
        setError(registerResult.error || 'Đăng ký không thành công. Email có thể đã tồn tại.');
        showError(registerResult.error);
        setIsProcessing(false);
        return;
      }

      const newUser = registerResult.user;

      // Create restaurant with active status (payment completed)
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 1); // 30 days paid period

      const newRestaurant = addRestaurant({
        name: restaurantData.name,
        slug: restaurantData.slug,
        address: restaurantData.address,
        phone: restaurantData.phone,
        description: restaurantData.description,
        ownerId: newUser.id,
        package: {
          ...selectedPackage,
          expiryDate: expiryDate.toISOString(),
          isTrial: false,
          paymentInfo: {
            transactionId: result.details.transactionId,
            method: result.details.method,
            paidAt: result.details.paidAt,
          }
        },
        status: 'active' // Active status after payment
      });

      showSuccess('Thanh toán và đăng ký thành công! Chào mừng bạn!');

      // Auto login user after successful registration
      const loginResult = await login(registerData.email, registerData.password);

      if (loginResult.success) {
        // Auto login successful, navigate to business dashboard
        setTimeout(() => {
          navigate('/bussiness');
        }, 1000);
      } else {
        // If auto login fails, show error but still navigate to login or landing
        showError('Đăng ký thành công nhưng đăng nhập tự động thất bại. Vui lòng đăng nhập lại.');
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }

    } catch (error) {
      setError('Có lỗi xảy ra. Vui lòng thử lại.');
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    if (confirm('Bạn có chắc muốn hủy? Tài khoản của bạn sẽ không được tạo.')) {
      navigate('/');
    }
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-container">
        {/* Progress Steps */}
        <div className="progress-steps">
          <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Thông tin nhà hàng</div>
          </div>
          <div className="step-line"></div>
          <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Chọn gói dịch vụ</div>
          </div>
          <div className="step-line"></div>
          <div className={`step ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">Thanh toán</div>
          </div>
        </div>

        {/* Step 1: Restaurant Info */}
        {step === 1 && (
          <div className="step-content">
            <h1 className="step-title">Thiết lập thông tin nhà hàng</h1>
            <p className="step-subtitle">Để bắt đầu, vui lòng cung cấp thông tin cơ bản về nhà hàng của bạn</p>
            
            <form onSubmit={handleStep1Submit} className="onboarding-form">
              {error && <div className="error-message">{error}</div>}
              
              <div className="form-group">
                <label>Tên nhà hàng *</label>
                <input
                  type="text"
                  value={restaurantData.name}
                  onChange={(e) => handleRestaurantNameChange(e.target.value)}
                  placeholder="VD: Nhà hàng ABC"
                  required
                />
              </div>

              <div className="form-group">
                <label>Đường dẫn (Slug)</label>
                <div className="slug-input">
                  <span className="slug-prefix">{window.location.origin}/</span>
                  <input
                    type="text"
                    value={restaurantData.slug}
                    onChange={(e) => setRestaurantData({ ...restaurantData, slug: e.target.value })}
                    placeholder="nha-hang-abc"
                  />
                </div>
                <small className="form-hint">Đường dẫn này sẽ được dùng cho QR code menu</small>
              </div>

              <div className="form-group">
                <label>Địa chỉ *</label>
                <input
                  type="text"
                  value={restaurantData.address}
                  onChange={(e) => setRestaurantData({ ...restaurantData, address: e.target.value })}
                  placeholder="123 Đường ABC, Quận XYZ, TP.HCM"
                  required
                />
              </div>

              <div className="form-group">
                <label>Số điện thoại *</label>
                <input
                  type="tel"
                  value={restaurantData.phone}
                  onChange={(e) => setRestaurantData({ ...restaurantData, phone: e.target.value })}
                  placeholder="0123456789"
                  required
                />
              </div>

              <div className="form-group">
                <label>Mô tả</label>
                <textarea
                  value={restaurantData.description}
                  onChange={(e) => setRestaurantData({ ...restaurantData, description: e.target.value })}
                  placeholder="Mô tả ngắn về nhà hàng của bạn..."
                  rows="3"
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={handleCancel}>
                  Hủy
                </button>
                <button type="submit" className="btn-next">
                  Tiếp tục →
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 2: Package Selection */}
        {step === 2 && (
          <div className="step-content">
            <h1 className="step-title">Chọn gói dịch vụ phù hợp</h1>
            <p className="step-subtitle">Chọn gói phù hợp với quy mô nhà hàng của bạn</p>
            
            {error && <div className="error-message">{error}</div>}
            
            <div className="packages-grid">
              {packages.map((pkg) => (
                <div 
                  key={pkg.id} 
                  className={`package-card ${selectedPackage?.id === pkg.id ? 'selected' : ''} ${pkg.popular ? 'popular' : ''}`}
                  onClick={() => handlePackageSelect(pkg)}
                >
                  {pkg.popular && <div className="popular-badge">Phổ biến nhất</div>}
                  <h3 className="package-name">{pkg.displayName || pkg.name}</h3>
                  {pkg.description && (
                    <p className="package-description">{pkg.description}</p>
                  )}
                  <div className="package-price">
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                    }).format(pkg.monthlyPrice)}/tháng
                  </div>
                  {pkg.targetAudience && (
                    <p className="package-target-small">
                      👉 {pkg.targetAudience}
                    </p>
                  )}
                  <ul className="package-features">
                    {pkg.features.map((feature, idx) => (
                      <li key={idx}>{feature}</li>
                    ))}
                  </ul>
                  {selectedPackage?.id === pkg.id && (
                    <div className="selected-badge">✓ Đã chọn</div>
                  )}
                </div>
              ))}
            </div>

            <div className="form-actions">
              <button type="button" className="btn-back" onClick={() => setStep(1)}>
                ← Quay lại
              </button>
              <button type="button" className="btn-complete" onClick={handleStep2Submit}>
                Tiếp tục thanh toán →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <div className="step-content payment-step">
            <h1 className="step-title">Thanh toán</h1>
            <p className="step-subtitle">Chọn phương thức và quét mã QR để thanh toán</p>
            
            {error && <div className="error-message">{error}</div>}

            {/* Payment Methods Selection */}
            <div className="payment-methods-tabs">
              <button
                className={`payment-tab ${selectedMethod === 'vnpay' ? 'active' : ''}`}
                onClick={() => !isProcessing && setSelectedMethod('vnpay')}
                disabled={isProcessing}
              >
                <div className="tab-logo vnpay-logo">VNPAY</div>
                <span>VNPay QR</span>
              </button>
              <button
                className={`payment-tab ${selectedMethod === 'momo' ? 'active' : ''}`}
                onClick={() => !isProcessing && setSelectedMethod('momo')}
                disabled={isProcessing}
              >
                <div className="tab-logo momo-logo">MOMO</div>
                <span>MoMo</span>
              </button>
            </div>

            {selectedMethod && (
              <div className="payment-gateway-container">
                {/* Sandbox/Demo Notice */}
                <div style={{
                  backgroundColor: '#fff3cd',
                  border: '2px solid #ffc107',
                  borderRadius: '12px',
                  padding: '1rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                  <div style={{ flex: 1 }}>
                    <strong style={{ color: '#856404', display: 'block', marginBottom: '0.25rem' }}>
                      Chế độ Demo/Sandbox
                    </strong>
                    <p style={{ margin: 0, color: '#856404', fontSize: '0.875rem' }}>
                      Đây là môi trường demo. Thanh toán sẽ được xử lý tự động sau 2 giây mà không cần quét QR thật.
                    </p>
                  </div>
                </div>

                <div className="payment-gateway-box">
                  {/* Left Side - QR Code */}
                  <div className="payment-qr-section">
                    <div className={`gateway-header ${selectedMethod}`}>
                      <div className="gateway-logo">
                        {selectedMethod === 'vnpay' ? (
                          <>
                            <div className="vnpay-brand">VNPAY</div>
                            <span className="gateway-subtitle">Cổng thanh toán VNPAY-QR</span>
                          </>
                        ) : (
                          <>
                            <div className="momo-brand">MoMo</div>
                            <span className="gateway-subtitle">Ví điện tử MoMo</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="qr-code-wrapper">
                      <div className="qr-code-placeholder">
                        <svg viewBox="0 0 100 100" className="qr-pattern">
                          <rect x="10" y="10" width="35" height="35" fill="#000" opacity="0.8"/>
                          <rect x="55" y="10" width="35" height="35" fill="#000" opacity="0.8"/>
                          <rect x="10" y="55" width="35" height="35" fill="#000" opacity="0.8"/>
                          <rect x="15" y="15" width="25" height="25" fill="#fff"/>
                          <rect x="60" y="15" width="25" height="25" fill="#fff"/>
                          <rect x="15" y="60" width="25" height="25" fill="#fff"/>
                          <rect x="20" y="20" width="15" height="15" fill="#000"/>
                          <rect x="65" y="20" width="15" height="15" fill="#000"/>
                          <rect x="20" y="65" width="15" height="15" fill="#000"/>
                          <rect x="55" y="55" width="12" height="12" fill="#000" opacity="0.6"/>
                          <rect x="70" y="55" width="12" height="12" fill="#000" opacity="0.6"/>
                          <rect x="55" y="70" width="12" height="12" fill="#000" opacity="0.6"/>
                          <rect x="70" y="70" width="12" height="12" fill="#000" opacity="0.6"/>
                        </svg>
                        <div className="scan-to-pay">Scan to Pay</div>
                      </div>
                      
                      <div className="payment-instruction">
                        <h4>Hướng dẫn thanh toán</h4>
                        <ol>
                          <li>Mở ứng dụng {selectedMethod === 'vnpay' ? 'Mobile Banking' : 'MoMo'}</li>
                          <li>Quét mã QR phía trên</li>
                          <li>Xác nhận thanh toán</li>
                        </ol>
                      </div>
                      
                      <div className="payment-amount-display">
                        <div className="amount-label">Thanh toán trực tuyến</div>
                        <div className="amount-value">{formatCurrency(selectedPackage.monthlyPrice)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Right Side - Payment Info */}
                  <div className="payment-info-section">
                    <div className="payment-info-header">
                      <h3>Thông tin thanh toán</h3>
                    </div>
                    
                    <div className="payment-details">
                      <div className="detail-group">
                        <label>Nội dung thanh toán</label>
                        <div className="detail-value">{restaurantData.name} - Gói {selectedPackage.name}</div>
                      </div>
                      
                      <div className="detail-group total-group">
                        <label>Tổng thanh toán</label>
                        <div className="detail-value total">{formatCurrency(selectedPackage.monthlyPrice)}</div>
                      </div>
                    </div>
                    
                    <div className="payment-actions">
                      <button 
                        className="btn-confirm-payment" 
                        onClick={handleComplete}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <>
                            <span className="spinner"></span>
                            Đang xử lý...
                          </>
                        ) : (
                          'XÁC THỰC'
                        )}
                      </button>
                      <button 
                        className="btn-cancel-payment" 
                        onClick={() => setStep(2)}
                        disabled={isProcessing}
                      >
                        HỦY
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!selectedMethod && (
              <div className="select-method-prompt">
                <p>Vui lòng chọn phương thức thanh toán phía trên</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
