import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { usePricing } from '../context/usePricing';
import { useToast } from '../context/useToast';
import './OnboardingPage.css';
import './OnboardingPayment.css';

const BASE_URL = 'https://apiqrcodeexe201-production.up.railway.app';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { getActivePackages } = usePricing();
  const { showSuccess, showError } = useToast();

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
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // Payment State
  const [paymentData, setPaymentData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending');

  // Bank Setup State (Step 4)
  const [bankData, setBankData] = useState({
    bank_code: '',
    account_number: '',
    account_name: ''
  });
  const [bankSaving, setBankSaving] = useState(false);
  const [restaurantId, setRestaurantId] = useState(null);

  // Supported Banks
  const SUPPORTED_BANKS = [
    { code: 'MB', name: 'MB Bank' },
    { code: 'VCB', name: 'Vietcombank' },
    { code: 'TCB', name: 'Techcombank' },
    { code: 'ACB', name: 'ACB' },
    { code: 'VPB', name: 'VPBank' },
    { code: 'TPB', name: 'TPBank' },
    { code: 'BIDV', name: 'BIDV' },
    { code: 'VTB', name: 'Vietinbank' },
  ];

  const packages = getActivePackages();

  // Redirect if no register data
  useEffect(() => {
    if (!registerData) {
      navigate('/');
    }
  }, [registerData, navigate]);



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

  // --- PAYMENT LOGIC ---

  // Hiển thị giá dựa trên chu kỳ
  const getPackagePrice = (pkg) => {
    return billingCycle === 'monthly' ? pkg.monthlyPrice : pkg.yearlyPrice;
  };

  // 1. Gọi API tạo subscription khi vào Step 3
  useEffect(() => {
    if (step === 3 && !paymentData && !isProcessing) {
      createSubscription();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const createSubscription = async () => {
    setIsProcessing(true);
    setError('');

    try {
      const payload = {
        email: registerData.email,
        password: registerData.password,
        name: registerData.name,
        phone: registerData.phone || restaurantData.phone,
        restaurant_name: restaurantData.name,
        package_id: selectedPackage.id,
        billing_cycle: billingCycle
      };

      console.log('Creating subscription:', payload);

      const resp = await fetch(`${BASE_URL}/api/v1/payment/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await resp.json();

      if (!resp.ok) {
        // Kiểm tra lỗi email đã tồn tại
        const errorMsg = data.message || 'Không thể tạo đăng ký';
        if (errorMsg.includes('EMAIL_EXISTS') || errorMsg.includes('Email đã được sử dụng')) {
          showError('Email này đã được đăng ký. Vui lòng quay lại và sử dụng email khác.');
          setError('Email đã được sử dụng. Vui lòng quay lại trang chủ và sử dụng email khác hoặc đăng nhập.');
          setIsProcessing(false);
          return;
        }
        throw new Error(errorMsg);
      }

      // Success
      setPaymentData(data.data); // data structure from API: { success: true, data: { ... } }
      setIsProcessing(false);

    } catch (err) {
      console.error('Subscription error:', err);
      setError(err.message);
      showError(err.message);
      setIsProcessing(false);
    }
  };

  // 2. Poll trạng thái thanh toán
  useEffect(() => {
    let intervalId;

    if (step === 3 && paymentData && paymentStatus === 'pending') {
      const checkStatus = async () => {
        try {
          const resp = await fetch(`${BASE_URL}/api/v1/payment/subscribe/${paymentData.payment_code}/status`);
          const data = await resp.json();

          if (resp.ok && data.data && data.data.status === 'paid') {
            setPaymentStatus('paid');
            handlePaymentSuccess();
            clearInterval(intervalId);
          }
        } catch (err) {
          console.error('Check status error:', err); // Silent error
        }
      };

      // Check immediately then every 3s
      checkStatus();
      intervalId = setInterval(checkStatus, 3000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, paymentData, paymentStatus]);

  // 3. Xử lý khi thanh toán thành công
  const handlePaymentSuccess = async () => {
    showSuccess('Thanh toán thành công! Đang đăng nhập...');

    // Auto login
    try {
      const result = await login(registerData.email, registerData.password);

      if (result.success) {
        // Lấy restaurant_id từ API response và chuyển sang Step 4
        if (result.restaurant_id) {
          setRestaurantId(result.restaurant_id);
          localStorage.setItem('restaurant_id', result.restaurant_id);
        }
        setStep(4); // Chuyển sang Step 4 - Bank Setup
      } else {
        showError('Đăng nhập tự động thất bại. Vui lòng đăng nhập lại.');
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (err) {
      console.error('Auto login error:', err);
      showError('Có lỗi xảy ra khi đăng nhập');
      navigate('/');
    }
  };

  // 4. Xử lý liên kết ngân hàng (Step 4)
  const handleBankSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!bankData.bank_code || !bankData.account_number || !bankData.account_name) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setBankSaving(true);
    try {
      const restId = restaurantId || localStorage.getItem('restaurant_id');
      const token = localStorage.getItem('token');

      await fetch(`${BASE_URL}/api/v1/restaurants/${restId}/sepay/link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bank_code: bankData.bank_code,
          account_number: bankData.account_number,
          account_name: bankData.account_name
        })
      });

      showSuccess('Liên kết ngân hàng thành công!');
      setTimeout(() => {
        navigate('/bussiness');
      }, 1000);
    } catch (err) {
      console.error('Bank link error:', err);
      setError('Liên kết thất bại. Vui lòng thử lại.');
    } finally {
      setBankSaving(false);
    }
  };

  const handleSkipBank = () => {
    showSuccess('Bạn có thể cấu hình ngân hàng sau trong phần Cài đặt');
    navigate('/bussiness');
  };

  const handleCancel = () => {
    if (confirm('Bạn có chắc muốn hủy? Tài khoản của bạn sẽ không được tạo.')) {
      navigate('/');
    }
  };

  if (!registerData) return null;

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
                  <span className="slug-prefix">{window.location.host}/</span>
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
                  Tiếp tục
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 2: Package Selection */}
        {step === 2 && (
          <div className="step-content">
            <div className="step-header-row">
              <div>
                <h1 className="step-title">Chọn gói dịch vụ phù hợp</h1>
                <p className="step-subtitle">Chọn gói phù hợp với quy mô nhà hàng của bạn</p>
              </div>

              {/* Billing Cycle Toggle */}
              <div className="billing-toggle-container">
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
                    <span className="discount-badge">-20%</span>
                  </span>
                </div>
              </div>
            </div>

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
                    {formatCurrency(getPackagePrice(pkg))}
                    <span className="price-period">/{billingCycle === 'monthly' ? 'tháng' : 'năm'}</span>
                  </div>
                  {pkg.targetAudience && (
                    <p className="package-target-small">
                      👉 {pkg.targetAudience}
                    </p>
                  )}
                  <ul className="package-features">
                    {pkg.features.map((feature, idx) => (
                      <li key={idx}>{feature.replace(/^[✓✔]\s*[✓✔]?\s*/g, '')}</li>
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
                Quay lại
              </button>
              <button type="button" className="btn-complete" onClick={handleStep2Submit}>
                Tiếp tục thanh toán
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <div className="step-content payment-step">
            <h1 className="step-title">Thanh toán qua SePay</h1>
            <p className="step-subtitle">
              Quét mã QR dưới đây để hoàn tất đăng ký. Hệ thống sẽ tự động xác nhận sau vài giây.
            </p>

            {error && (
              <div className="error-message">
                {error}
                <button className="btn-retry" onClick={createSubscription} style={{ marginLeft: '10px', textDecoration: 'underline', border: 'none', background: 'none', cursor: 'pointer', color: 'inherit' }}>Thử lại</button>
              </div>
            )}

            {isProcessing ? (
              <div className="loading-container">
                <span className="spinner"></span>
                <p>Đang tạo mã thanh toán...</p>
              </div>
            ) : paymentData ? (
              // SHOW REQUESTED PAYMENT QR
              <div className="payment-gateway-box custom-sepay-box">
                <div className="payment-qr-section">
                  <div className="qr-code-wrapper">
                    {/* QR Image from API */}
                    <div className="qr-image-container">
                      <img
                        src={paymentData.qr_url}
                        alt="SePay QR"
                        className="sepay-qr-img"
                        onError={(e) => {
                          // Fallback to generating QuickLink if URL fails
                          e.target.onerror = null;
                          e.target.src = `https://img.vietqr.io/image/${paymentData.bank_info?.bank_name}-${paymentData.bank_info?.account_number}-compact2.jpg?amount=${paymentData.amount}&addInfo=${paymentData.qr_content}&accountName=${paymentData.bank_info?.account_name}`;
                        }}
                      />
                    </div>

                    <div className="payment-instruction">
                      <h4>Hướng dẫn thanh toán</h4>
                      <ol>
                        <li>Mở ứng dụng Ngân hàng hoặc Ví điện tử</li>
                        <li>Quét mã QR ở trên</li>
                        <li>Kiểm tra số tiền và nội dung chuyển khoản phải chính xác</li>
                        <li>Xác nhận thanh toán</li>
                      </ol>
                    </div>

                    <div className="payment-status-indicator">
                      {paymentStatus === 'pending' && (
                        <div className="status-badge pending">
                          <span className="pulse-dot"></span> Đang chờ thanh toán...
                        </div>
                      )}
                      {paymentStatus === 'paid' && (
                        <div className="status-badge success">
                          ✅ Thanh toán thành công!
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="payment-info-section">
                  <div className="payment-info-header">
                    <h3>Thông tin đơn hàng</h3>
                  </div>

                  <div className="payment-details">
                    <div className="detail-group">
                      <label>Gói dịch vụ</label>
                      <div className="detail-value">{paymentData.package}</div>
                    </div>
                    <div className="detail-group">
                      <label>Thời hạn</label>
                      <div className="detail-value">{billingCycle === 'monthly' ? '1 Tháng' : '1 Năm'}</div>
                    </div>
                    <div className="detail-group">
                      <label>Nội dung CK</label>
                      <div className="detail-value highlight-text">{paymentData.qr_content}</div>
                    </div>

                    <div className="detail-group total-group">
                      <label>Tổng thanh toán</label>
                      <div className="detail-value total">{formatCurrency(paymentData.amount)}</div>
                    </div>
                  </div>

                  <div className="manual-transfer-info">
                    <p className="manual-note">Nếu không quét được mã, vui lòng chuyển khoản thủ công:</p>
                    <div className="bank-details-box">
                      <p><strong>Ngân hàng:</strong> {paymentData.bank_info?.bank_name}</p>
                      <p><strong>Số TK:</strong> {paymentData.bank_info?.account_number}</p>
                      <p><strong>Chủ TK:</strong> {paymentData.bank_info?.account_name}</p>
                      <p><strong>Nội dung:</strong> {paymentData.qr_content}</p>
                    </div>
                  </div>

                  <div className="payment-actions">
                    <button
                      className="btn-cancel-payment"
                      onClick={() => setStep(2)}
                    >
                      Quay lại chọn gói
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Fallback / Initial State
              <div className="empty-payment-state">
                <p>Không thể tải thông tin thanh toán.</p>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: BANK SETUP */}
        {step === 4 && (
          <div className="onboarding-step step-4">
            <div className="step-header text-center mb-4">
              <div className="success-icon mb-3">
                <span style={{ fontSize: '48px' }}>🎉</span>
              </div>
              <h2>Đăng ký thành công!</h2>
              <p className="text-muted">Cấu hình tài khoản ngân hàng để nhận thanh toán từ khách hàng</p>
            </div>

            <div className="bank-setup-card" style={{ maxWidth: '500px', margin: '0 auto' }}>
              <form onSubmit={handleBankSubmit} className="bank-form">
                {error && (
                  <div className="alert alert-danger">{error}</div>
                )}

                <div className="form-group mb-3">
                  <label className="form-label fw-bold">Ngân hàng</label>
                  <select
                    className="form-select"
                    value={bankData.bank_code}
                    onChange={(e) => setBankData({ ...bankData, bank_code: e.target.value })}
                  >
                    <option value="">-- Chọn ngân hàng --</option>
                    {SUPPORTED_BANKS.map((bank) => (
                      <option key={bank.code} value={bank.code}>
                        {bank.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group mb-3">
                  <label className="form-label fw-bold">Số tài khoản</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="VD: 0393531965"
                    value={bankData.account_number}
                    onChange={(e) => setBankData({ ...bankData, account_number: e.target.value })}
                  />
                </div>

                <div className="form-group mb-4">
                  <label className="form-label fw-bold">Tên chủ tài khoản</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="VD: NGUYEN VAN A"
                    value={bankData.account_name}
                    onChange={(e) => setBankData({ ...bankData, account_name: e.target.value.toUpperCase() })}
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>

                <div className="d-flex gap-3">
                  <button
                    type="submit"
                    className="btn btn-primary flex-fill"
                    disabled={bankSaving}
                  >
                    {bankSaving ? 'Đang xử lý...' : 'Liên kết ngân hàng'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={handleSkipBank}
                  >
                    Bỏ qua
                  </button>
                </div>

                <p className="text-muted text-center mt-3 small">
                  Bạn có thể cấu hình sau trong phần Cài đặt
                </p>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
