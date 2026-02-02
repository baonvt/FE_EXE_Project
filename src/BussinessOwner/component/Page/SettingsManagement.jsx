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

    // Fetch data on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Lấy restaurant ID từ localStorage hoặc context
                const storedRestaurantId = localStorage.getItem("restaurant_id");
                if (storedRestaurantId) {
                    setRestaurantId(parseInt(storedRestaurantId));
                    await Promise.all([
                        fetchBankSettings(storedRestaurantId),
                        fetchPackageInfo(storedRestaurantId),
                    ]);
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

    const fetchPackageInfo = async (restId) => {
        setPackageLoading(true);
        try {
            const [restaurantRes, packagesRes] = await Promise.all([
                getCurrentPackage(restId),
                getAllPackages(),
            ]);

            if (restaurantRes.data) {
                setCurrentPackage({
                    id: restaurantRes.data.package_id,
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
        return new Date(dateStr).toLocaleDateString("vi-VN");
    };

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
                                                    bg={currentPackage?.status === "active" ? "success" : "secondary"}
                                                    className="px-3 py-2"
                                                >
                                                    {currentPackage?.status === "active" ? "Đang hoạt động" : "Hết hạn"}
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
                                            .filter((pkg) => pkg.id !== currentPackage?.id)
                                            .map((pkg) => (
                                                <Card
                                                    key={pkg.id}
                                                    className="border hover-shadow cursor-pointer"
                                                    style={{ cursor: "pointer" }}
                                                >
                                                    <Card.Body className="d-flex justify-content-between align-items-center py-3">
                                                        <div>
                                                            <h6 className="fw-bold mb-1">{pkg.display_name}</h6>
                                                            <small className="text-muted">
                                                                {new Intl.NumberFormat("vi-VN").format(pkg.monthly_price)}đ/tháng
                                                            </small>
                                                        </div>
                                                        <Button size="sm" variant="outline-primary">
                                                            Nâng cấp
                                                        </Button>
                                                    </Card.Body>
                                                </Card>
                                            ))}

                                        {allPackages.length === 0 && (
                                            <p className="text-muted text-center py-3">
                                                Không có gói nâng cấp khả dụng
                                            </p>
                                        )}
                                    </div>
                                </>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}
