import "bootstrap/dist/css/bootstrap.min.css";
import { useState, useEffect } from "react";
import {
    Container,
    Row,
    Col,
    Card,
    Button,
    Form,
    Badge,
    Spinner,
    Alert,
    Modal,
} from "react-bootstrap";
import {
    CreditCard,
    Building2,
    Package,
    CheckCircle2,
    AlertCircle,
    ArrowUpCircle,
} from "lucide-react";
import {
    getBankSettings,
    linkBankAccount,
    unlinkBankAccount,
    getCurrentPackage,
    getAllPackages,
    createUpgradeSubscription,
    getUpgradeStatus,
    SUPPORTED_BANKS,
} from "../../api/SettingsAPI";

export default function SettingsManagement() {
    // Bank State
    const [bankData, setBankData] = useState({
        bank_code: "",
        account_number: "",
        account_name: "",
    });
    const [bankStatus, setBankStatus] = useState({
        linked: false,
        bank_name: "",
        account_no: "",
    });
    const [bankLoading, setBankLoading] = useState(true);
    const [bankSaving, setBankSaving] = useState(false);
    const [bankError, setBankError] = useState("");
    const [bankSuccess, setBankSuccess] = useState("");

    // Package State
    const [currentPackage, setCurrentPackage] = useState(null);
    const [allPackages, setAllPackages] = useState([]);
    const [packageLoading, setPackageLoading] = useState(true);
    const [restaurantId, setRestaurantId] = useState(null);

    // Upgrade Modal State
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [billingCycle, setBillingCycle] = useState("monthly");
    const [upgradeData, setUpgradeData] = useState(null);
    const [upgradeLoading, setUpgradeLoading] = useState(false);
    const [checkingPayment, setCheckingPayment] = useState(false);

    // Fetch data on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Lấy restaurant ID từ localStorage, token hoặc context
                let storedRestaurantId = localStorage.getItem("restaurant_id");
                
                // Nếu không có trong localStorage, thử lấy từ token
                if (!storedRestaurantId) {
                    const token = localStorage.getItem("authToken");
                    if (token) {
                        try {
                            const payload = JSON.parse(atob(token.split('.')[1]));
                            storedRestaurantId = payload.restaurant_id;
                            if (storedRestaurantId) {
                                localStorage.setItem("restaurant_id", storedRestaurantId);
                            }
                        } catch (e) {
                            console.error("Lỗi decode token:", e);
                        }
                    }
                }
                
                if (storedRestaurantId) {
                    setRestaurantId(parseInt(storedRestaurantId));
                    await Promise.all([
                        fetchBankSettings(storedRestaurantId),
                        fetchPackageInfo(),
                    ]);
                } else {
                    console.error("Không tìm thấy restaurant_id");
                }
            } catch (error) {
                console.error("Lỗi tải dữ liệu:", error);
            }
        };
        fetchData();
    }, []);

    const fetchBankSettings = async (restId) => {
        setBankLoading(true);
        try {
            const response = await getBankSettings(restId);
            if (response.data) {
                setBankStatus({
                    linked: response.data.linked || false,
                    bank_name: response.data.bank_name || "",
                    account_no: response.data.account_no || "",
                    account_name: response.data.account_name || "",
                });
                if (response.data.linked && response.data.bank_code) {
                    setBankData({
                        bank_code: response.data.bank_code || "",
                        account_number: response.data.account_no?.replace(/\*/g, "") || "",
                        account_name: response.data.account_name || "",
                    });
                }
            }
        } catch (error) {
            console.error("Lỗi tải bank settings:", error);
        } finally {
            setBankLoading(false);
        }
    };

    const fetchPackageInfo = async () => {
        setPackageLoading(true);
        try {
            const [restaurantRes, packagesRes] = await Promise.all([
                getCurrentPackage(),
                getAllPackages(),
            ]);

            if (restaurantRes.data) {
                setCurrentPackage({
                    id: restaurantRes.data.package?.id,
                    name: restaurantRes.data.package?.display_name || "Starter",
                    end_date: restaurantRes.data.package_end_date,
                    status: restaurantRes.data.package_status,
                });
            }

            if (packagesRes.data) {
                setAllPackages(packagesRes.data);
            }
        } catch (error) {
            console.error("Lỗi tải package info:", error);
        } finally {
            setPackageLoading(false);
        }
    };

    const handleBankSubmit = async (e) => {
        e.preventDefault();
        setBankError("");
        setBankSuccess("");

        if (!bankData.bank_code || !bankData.account_number || !bankData.account_name) {
            setBankError("Vui lòng điền đầy đủ thông tin");
            return;
        }

        setBankSaving(true);
        try {
            await linkBankAccount(restaurantId, bankData);
            setBankSuccess("Liên kết tài khoản thành công!");
            await fetchBankSettings(restaurantId);
        } catch (error) {
            setBankError(error.response?.data?.message || "Có lỗi xảy ra");
        } finally {
            setBankSaving(false);
        }
    };

    const handleUnlink = async () => {
        if (!window.confirm("Bạn có chắc muốn hủy liên kết tài khoản ngân hàng?")) {
            return;
        }

        setBankSaving(true);
        try {
            await unlinkBankAccount(restaurantId);
            setBankStatus({ linked: false, bank_name: "", account_no: "" });
            setBankData({ bank_code: "", account_number: "", account_name: "" });
            setBankSuccess("Đã hủy liên kết");
        } catch (error) {
            setBankError(error.response?.data?.message || "Có lỗi xảy ra");
        } finally {
            setBankSaving(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "---";
        const date = new Date(dateStr);
        // Kiểm tra ngày hợp lệ và không phải năm 1970/0001
        if (isNaN(date.getTime()) || date.getFullYear() < 2000) {
            return "---";
        }
        return date.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit", 
            year: "numeric"
        });
    };

    // Check if package is expired
    const isPackageExpired = () => {
        if (!currentPackage?.end_date) return true;
        const endDate = new Date(currentPackage.end_date);
        if (isNaN(endDate.getTime()) || endDate.getFullYear() < 2000) return true;
        return endDate < new Date();
    };

    // Get package status label
    const getPackageStatusLabel = () => {
        if (currentPackage?.status === "active" && !isPackageExpired()) {
            return { text: "Đang hoạt động", variant: "success" };
        }
        return { text: "Hết hạn", variant: "secondary" };
    };

    // Handle upgrade button click
    const handleUpgradeClick = (pkg) => {
        setSelectedPackage(pkg);
        setUpgradeData(null);
        setBillingCycle("monthly");
        setShowUpgradeModal(true);
    };

    // Create upgrade request
    const handleCreateUpgrade = async () => {
        if (!selectedPackage || !restaurantId) return;

        setUpgradeLoading(true);
        try {
            const response = await createUpgradeSubscription(
                restaurantId,
                selectedPackage.id,
                billingCycle
            );
            setUpgradeData(response.data);
            // Start polling for payment status
            startPaymentPolling(response.data.subscription_code);
        } catch (error) {
            console.error("Lỗi tạo nâng cấp:", error);
            alert(error.message || "Có lỗi xảy ra khi tạo yêu cầu nâng cấp");
        } finally {
            setUpgradeLoading(false);
        }
    };

    // Poll for payment status
    const startPaymentPolling = (code) => {
        setCheckingPayment(true);
        const interval = setInterval(async () => {
            try {
                const response = await getUpgradeStatus(code);
                if (response.data?.status === "paid" || response.data?.status === "active") {
                    clearInterval(interval);
                    setCheckingPayment(false);
                    setShowUpgradeModal(false);
                    alert("Thanh toán thành công! Gói của bạn đã được nâng cấp.");
                    // Refresh package info
                    fetchPackageInfo();
                }
            } catch (error) {
                console.error("Lỗi kiểm tra thanh toán:", error);
            }
        }, 5000); // Check every 5 seconds

        // Stop polling after 10 minutes
        setTimeout(() => {
            clearInterval(interval);
            setCheckingPayment(false);
        }, 600000);
    };

    // Get price based on billing cycle
    const getPrice = (pkg) => {
        if (billingCycle === "yearly") {
            return pkg.yearly_price || pkg.monthly_price * 12 * 0.8;
        }
        return pkg.monthly_price;
    };

    const packageStatus = getPackageStatusLabel();

    return (
        <Container fluid className="p-4" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
            {/* Header */}
            <div className="mb-4">
                <h3 className="fw-bold">Cài đặt</h3>
                <p className="text-muted">Quản lý tài khoản ngân hàng và gói dịch vụ</p>
            </div>

            <Row className="g-4">
                {/* BANK SETTINGS */}
                <Col lg={6}>
                    <Card className="border-0 shadow-sm rounded-4 h-100">
                        <Card.Header className="bg-white border-0 pt-4 px-4">
                            <div className="d-flex align-items-center gap-2">
                                <div
                                    className="rounded-circle p-2"
                                    style={{ backgroundColor: "#e0f2fe" }}
                                >
                                    <Building2 size={20} className="text-primary" />
                                </div>
                                <div>
                                    <h5 className="fw-bold mb-0">Tài khoản ngân hàng</h5>
                                    <small className="text-muted">Nhận thanh toán từ khách hàng</small>
                                </div>
                            </div>
                        </Card.Header>
                        <Card.Body className="p-4">
                            {bankLoading ? (
                                <div className="text-center py-5">
                                    <Spinner animation="border" variant="primary" />
                                </div>
                            ) : (
                                <>
                                    {/* Status Badge */}
                                    <div className="mb-4">
                                        {bankStatus.linked ? (
                                            <Alert variant="success" className="d-flex align-items-center gap-2 mb-0">
                                                <CheckCircle2 size={18} />
                                                <div>
                                                    <strong>Đã liên kết:</strong> {bankStatus.bank_name} - {bankStatus.account_no}
                                                </div>
                                            </Alert>
                                        ) : (
                                            <Alert variant="warning" className="d-flex align-items-center gap-2 mb-0">
                                                <AlertCircle size={18} />
                                                <span>Chưa liên kết tài khoản - Khách hàng chưa thể thanh toán QR</span>
                                            </Alert>
                                        )}
                                    </div>

                                    {/* Bank Form */}
                                    <Form onSubmit={handleBankSubmit}>
                                        {bankError && <Alert variant="danger">{bankError}</Alert>}
                                        {bankSuccess && <Alert variant="success">{bankSuccess}</Alert>}

                                        <Form.Group className="mb-3">
                                            <Form.Label className="fw-bold">
                                                <CreditCard size={16} className="me-2" />
                                                Ngân hàng
                                            </Form.Label>
                                            <Form.Select
                                                value={bankData.bank_code}
                                                onChange={(e) =>
                                                    setBankData({ ...bankData, bank_code: e.target.value })
                                                }
                                            >
                                                <option value="">-- Chọn ngân hàng --</option>
                                                {SUPPORTED_BANKS.map((bank) => (
                                                    <option key={bank.code} value={bank.code}>
                                                        {bank.name}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label className="fw-bold">Số tài khoản</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="VD: 0393531965"
                                                value={bankData.account_number}
                                                onChange={(e) =>
                                                    setBankData({ ...bankData, account_number: e.target.value })
                                                }
                                            />
                                        </Form.Group>

                                        <Form.Group className="mb-4">
                                            <Form.Label className="fw-bold">Tên chủ tài khoản</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="VD: NGUYEN VAN A"
                                                value={bankData.account_name}
                                                onChange={(e) =>
                                                    setBankData({
                                                        ...bankData,
                                                        account_name: e.target.value.toUpperCase(),
                                                    })
                                                }
                                                style={{ textTransform: "uppercase" }}
                                            />
                                        </Form.Group>

                                        <div className="d-flex gap-2">
                                            <Button
                                                type="submit"
                                                variant="primary"
                                                disabled={bankSaving}
                                                className="flex-fill"
                                            >
                                                {bankSaving ? (
                                                    <Spinner size="sm" />
                                                ) : bankStatus.linked ? (
                                                    "Cập nhật"
                                                ) : (
                                                    "Liên kết"
                                                )}
                                            </Button>
                                            {bankStatus.linked && (
                                                <Button
                                                    variant="outline-danger"
                                                    onClick={handleUnlink}
                                                    disabled={bankSaving}
                                                >
                                                    Hủy liên kết
                                                </Button>
                                            )}
                                        </div>
                                    </Form>
                                </>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                {/* PACKAGE SETTINGS */}
                <Col lg={6}>
                    <Card className="border-0 shadow-sm rounded-4 h-100">
                        <Card.Header className="bg-white border-0 pt-4 px-4">
                            <div className="d-flex align-items-center gap-2">
                                <div
                                    className="rounded-circle p-2"
                                    style={{ backgroundColor: "#fef3c7" }}
                                >
                                    <Package size={20} className="text-warning" />
                                </div>
                                <div>
                                    <h5 className="fw-bold mb-0">Gói dịch vụ</h5>
                                    <small className="text-muted">Quản lý đăng ký của bạn</small>
                                </div>
                            </div>
                        </Card.Header>
                        <Card.Body className="p-4">
                            {packageLoading ? (
                                <div className="text-center py-5">
                                    <Spinner animation="border" variant="warning" />
                                </div>
                            ) : (
                                <>
                                    {/* Current Package */}
                                    <Card className="mb-4 border-2 border-primary bg-primary bg-opacity-10">
                                        <Card.Body>
                                            <div className="d-flex justify-content-between align-items-start">
                                                <div>
                                                    <Badge bg="primary" className="mb-2">
                                                        Gói hiện tại
                                                    </Badge>
                                                    <h4 className="fw-bold mb-1">
                                                        {currentPackage?.name || "Starter"}
                                                    </h4>
                                                    <p className="text-muted mb-0">
                                                        Hết hạn: {formatDate(currentPackage?.end_date)}
                                                    </p>
                                                </div>
                                                <Badge
                                                    bg={packageStatus.variant}
                                                    className="px-3 py-2"
                                                >
                                                    {packageStatus.text}
                                                </Badge>
                                            </div>
                                        </Card.Body>
                                    </Card>

                                    {/* Upgrade Options */}
                                    <h6 className="fw-bold mb-3">
                                        <ArrowUpCircle size={18} className="me-2" />
                                        Nâng cấp gói
                                    </h6>

                                    <div className="d-flex flex-column gap-3">
                                        {allPackages
                                            .filter((pkg) => pkg.monthly_price > (currentPackage?.id ? allPackages.find(p => p.id === currentPackage.id)?.monthly_price || 0 : 0))
                                            .map((pkg) => (
                                                <Card
                                                    key={pkg.id}
                                                    className="border hover-shadow cursor-pointer"
                                                    style={{ cursor: "pointer" }}
                                                >
                                                    <Card.Body className="d-flex justify-content-between align-items-center py-3">
                                                        <div>
                                                            <h6 className="fw-bold mb-1">
                                                                {pkg.display_name}
                                                                {pkg.is_popular && (
                                                                    <Badge bg="warning" className="ms-2">Phổ biến</Badge>
                                                                )}
                                                            </h6>
                                                            <small className="text-muted">
                                                                {new Intl.NumberFormat("vi-VN").format(pkg.monthly_price)}đ/tháng
                                                            </small>
                                                        </div>
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline-primary"
                                                            onClick={() => handleUpgradeClick(pkg)}
                                                        >
                                                            Nâng cấp
                                                        </Button>
                                                    </Card.Body>
                                                </Card>
                                            ))}

                                        {allPackages.filter((pkg) => pkg.monthly_price > (currentPackage?.id ? allPackages.find(p => p.id === currentPackage.id)?.monthly_price || 0 : 0)).length === 0 && (
                                            <p className="text-muted text-center py-3">
                                                Bạn đang dùng gói cao nhất
                                            </p>
                                        )}
                                    </div>
                                </>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Upgrade Modal */}
            <Modal 
                show={showUpgradeModal} 
                onHide={() => !upgradeLoading && !checkingPayment && setShowUpgradeModal(false)}
                centered
                size="lg"
            >
                <Modal.Header closeButton>
                    <Modal.Title>
                        <ArrowUpCircle className="me-2" />
                        Nâng cấp gói {selectedPackage?.display_name}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {!upgradeData ? (
                        <>
                            {/* Package Details */}
                            <div className="bg-light p-4 rounded-3 mb-4">
                                <h5 className="fw-bold mb-3">{selectedPackage?.display_name}</h5>
                                <p className="text-muted mb-3">{selectedPackage?.description}</p>
                                
                                {/* Features */}
                                <div className="mb-3">
                                    <strong>Tính năng:</strong>
                                    <ul className="mt-2 mb-0">
                                        {selectedPackage?.features && JSON.parse(selectedPackage.features).map((feature, idx) => (
                                            <li key={idx}>{feature}</li>
                                        ))}
                                    </ul>
                                </div>
                                
                                <div className="d-flex gap-2">
                                    <Badge bg="secondary">Tối đa {selectedPackage?.max_menu_items} món</Badge>
                                    <Badge bg="secondary">Tối đa {selectedPackage?.max_tables} bàn</Badge>
                                    <Badge bg="secondary">Tối đa {selectedPackage?.max_categories} danh mục</Badge>
                                </div>
                            </div>

                            {/* Billing Cycle Selection */}
                            <div className="mb-4">
                                <h6 className="fw-bold mb-3">Chu kỳ thanh toán</h6>
                                <div className="d-flex gap-3">
                                    <Form.Check
                                        type="radio"
                                        id="monthly"
                                        label={
                                            <span>
                                                Hàng tháng - <strong>{new Intl.NumberFormat("vi-VN").format(selectedPackage?.monthly_price)}đ</strong>
                                            </span>
                                        }
                                        name="billingCycle"
                                        checked={billingCycle === "monthly"}
                                        onChange={() => setBillingCycle("monthly")}
                                    />
                                    <Form.Check
                                        type="radio"
                                        id="yearly"
                                        label={
                                            <span>
                                                Hàng năm - <strong>{new Intl.NumberFormat("vi-VN").format(selectedPackage?.yearly_price || selectedPackage?.monthly_price * 12 * 0.8)}đ</strong>
                                                <Badge bg="success" className="ms-2">Tiết kiệm 20%</Badge>
                                            </span>
                                        }
                                        name="billingCycle"
                                        checked={billingCycle === "yearly"}
                                        onChange={() => setBillingCycle("yearly")}
                                    />
                                </div>
                            </div>

                            {/* Total */}
                            <div className="bg-primary bg-opacity-10 p-3 rounded-3">
                                <div className="d-flex justify-content-between align-items-center">
                                    <span className="fw-bold">Tổng thanh toán:</span>
                                    <span className="fs-4 fw-bold text-primary">
                                        {new Intl.NumberFormat("vi-VN").format(getPrice(selectedPackage))}đ
                                    </span>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* QR Code Payment */
                        <div className="text-center">
                            <h5 className="mb-3">Quét mã QR để thanh toán</h5>
                            
                            <div className="mb-3">
                                <img 
                                    src={upgradeData.qr_url} 
                                    alt="QR Code thanh toán"
                                    style={{ maxWidth: "300px", width: "100%" }}
                                    className="border rounded"
                                />
                            </div>

                            <div className="bg-light p-3 rounded-3 mb-3">
                                <p className="mb-1"><strong>Số tiền:</strong> {new Intl.NumberFormat("vi-VN").format(upgradeData.amount)}đ</p>
                                <p className="mb-1"><strong>Nội dung:</strong> {upgradeData.subscription_code}</p>
                                <p className="mb-0 text-muted small">
                                    Vui lòng nhập đúng nội dung chuyển khoản
                                </p>
                            </div>

                            {checkingPayment && (
                                <Alert variant="info" className="d-flex align-items-center justify-content-center gap-2">
                                    <Spinner size="sm" animation="border" />
                                    <span>Đang chờ thanh toán...</span>
                                </Alert>
                            )}

                            <p className="text-muted small">
                                Hệ thống sẽ tự động xác nhận sau khi thanh toán thành công
                            </p>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button 
                        variant="secondary" 
                        onClick={() => setShowUpgradeModal(false)}
                        disabled={upgradeLoading || checkingPayment}
                    >
                        Đóng
                    </Button>
                    {!upgradeData && (
                        <Button 
                            variant="primary" 
                            onClick={handleCreateUpgrade}
                            disabled={upgradeLoading}
                        >
                            {upgradeLoading ? (
                                <>
                                    <Spinner size="sm" className="me-2" />
                                    Đang xử lý...
                                </>
                            ) : (
                                "Tiếp tục thanh toán"
                            )}
                        </Button>
                    )}
                </Modal.Footer>
            </Modal>
        </Container>
    );
}
