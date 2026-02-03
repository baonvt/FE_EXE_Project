import "bootstrap/dist/css/bootstrap.min.css";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Card, Badge, Spinner, ListGroup, Button, Alert } from "react-bootstrap";
import { 
    CheckCircle, 
    Clock, 
    CreditCard, 
    RefreshCw, 
    ChefHat, 
    UtensilsCrossed,
    AlertCircle
} from "lucide-react";
import { trackOrder, getOrderPaymentQR } from "../api/CustomerAPI";
import "./OrderTracking.css";

const STATUS_CONFIG = {
    pending: {
        label: "Chờ xác nhận",
        color: "warning",
        icon: Clock,
        description: "Đơn hàng đang chờ nhà hàng xác nhận"
    },
    confirmed: {
        label: "Đã xác nhận",
        color: "info",
        icon: CheckCircle,
        description: "Nhà hàng đã xác nhận đơn hàng"
    },
    preparing: {
        label: "Đang chế biến",
        color: "primary",
        icon: ChefHat,
        description: "Đầu bếp đang chuẩn bị món ăn"
    },
    ready: {
        label: "Sẵn sàng phục vụ",
        color: "success",
        icon: UtensilsCrossed,
        description: "Món ăn đã sẵn sàng"
    },
    completed: {
        label: "Hoàn thành",
        color: "success",
        icon: CheckCircle,
        description: "Đơn hàng đã hoàn thành"
    },
    cancelled: {
        label: "Đã hủy",
        color: "danger",
        icon: AlertCircle,
        description: "Đơn hàng đã bị hủy"
    }
};

const PAYMENT_STATUS_CONFIG = {
    unpaid: {
        label: "Chưa thanh toán",
        color: "danger",
        description: "Vui lòng thanh toán để hoàn tất đơn hàng"
    },
    pending: {
        label: "Đang xử lý",
        color: "warning",
        description: "Đang chờ xác nhận thanh toán"
    },
    paid: {
        label: "Đã thanh toán",
        color: "success",
        description: "Thanh toán thành công"
    }
};

export default function OrderTrackingPage() {
    const { orderNumber } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [paymentQR, setPaymentQR] = useState(null);
    const [loadingQR, setLoadingQR] = useState(false);

    const fetchOrder = async () => {
        try {
            setRefreshing(true);
            const res = await trackOrder(orderNumber);
            const data = res?.data ?? res;
            setOrder(data);
            setError(null);
        } catch (err) {
            setError(err?.message || "Không tìm thấy đơn hàng");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (!orderNumber) {
            setError("Không có mã đơn hàng");
            setLoading(false);
            return;
        }
        fetchOrder();

        // Auto refresh every 30 seconds
        const interval = setInterval(fetchOrder, 30000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderNumber]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount || 0);
    };

    const formatTime = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    };

    if (loading) {
        return (
            <div className="tracking-loading">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Đang tải thông tin đơn hàng...</p>
            </div>
        );
    }

    if (error) {
        return (
            <Container className="py-5">
                <Alert variant="danger" className="text-center">
                    <AlertCircle size={48} className="mb-3" />
                    <h5>{error}</h5>
                    <Button 
                        variant="outline-danger" 
                        className="mt-3"
                        onClick={() => navigate(-1)}
                    >
                        Quay lại
                    </Button>
                </Alert>
            </Container>
        );
    }

    const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
    const paymentConfig = PAYMENT_STATUS_CONFIG[order.payment_status] || PAYMENT_STATUS_CONFIG.unpaid;
    const StatusIcon = statusConfig.icon;

    return (
        <div className="order-tracking-page">
            <header className="tracking-header">
                <Container>
                    <div className="d-flex justify-content-between align-items-center py-3">
                        <div>
                            <h4 className="mb-1">{order.restaurant?.name || "Nhà hàng"}</h4>
                            <small className="text-muted">
                                {order.table_name ? `${order.table_name} - ` : ""}
                                Bàn {order.table_number}
                            </small>
                        </div>
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={fetchOrder}
                            disabled={refreshing}
                        >
                            <RefreshCw size={16} className={refreshing ? "spin" : ""} />
                        </Button>
                    </div>
                </Container>
            </header>

            <Container className="py-4">
                {/* Order Number Card */}
                <Card className="mb-4 order-number-card">
                    <Card.Body className="text-center">
                        <small className="text-muted">Mã đơn hàng</small>
                        <h3 className="mb-0 order-number">{order.order_number}</h3>
                        <small className="text-muted">{formatTime(order.created_at)}</small>
                    </Card.Body>
                </Card>

                {/* Status Card */}
                <Card className="mb-4 status-card">
                    <Card.Body>
                        <div className="d-flex align-items-center">
                            <div className={`status-icon bg-${statusConfig.color}`}>
                                <StatusIcon size={24} color="white" />
                            </div>
                            <div className="ms-3">
                                <h5 className="mb-1">
                                    <Badge bg={statusConfig.color}>{statusConfig.label}</Badge>
                                </h5>
                                <p className="mb-0 text-muted small">{statusConfig.description}</p>
                            </div>
                        </div>
                    </Card.Body>
                </Card>

                {/* Payment Status */}
                <Card className="mb-4 payment-card">
                    <Card.Body>
                        <div className="d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center">
                                <CreditCard size={20} className="me-2 text-muted" />
                                <span>Thanh toán</span>
                            </div>
                            <Badge bg={paymentConfig.color}>{paymentConfig.label}</Badge>
                        </div>
                        {order.payment_status === "unpaid" && (
                            <>
                                <Alert variant="warning" className="mt-3 mb-2">
                                    <small>
                                        <strong>Hướng dẫn:</strong> Quét mã QR bên dưới để thanh toán qua VietQR
                                    </small>
                                </Alert>
                                <div className="text-center mt-3">
                                    {!paymentQR ? (
                                        <Button 
                                            variant="primary" 
                                            onClick={async () => {
                                                setLoadingQR(true);
                                                try {
                                                    const res = await getOrderPaymentQR(order.id);
                                                    setPaymentQR(res?.data || res);
                                                } catch (err) {
                                                    alert("Không thể tạo mã QR: " + (err.message || ""));
                                                } finally {
                                                    setLoadingQR(false);
                                                }
                                            }}
                                            disabled={loadingQR}
                                        >
                                            {loadingQR ? (
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                            ) : (
                                                <CreditCard size={18} className="me-2" />
                                            )}
                                            Hiển thị mã QR thanh toán
                                        </Button>
                                    ) : (
                                        <div>
                                            <img 
                                                src={paymentQR.qr_url} 
                                                alt="VietQR Payment" 
                                                className="img-fluid mb-3"
                                                style={{ maxWidth: "300px", border: "1px solid #dee2e6", borderRadius: "8px" }}
                                            />
                                            <div className="small text-muted">
                                                <div><strong>Ngân hàng:</strong> {paymentQR.bank_name || paymentQR.bank_code}</div>
                                                <div><strong>Số TK:</strong> {paymentQR.account_number}</div>
                                                <div><strong>Chủ TK:</strong> {paymentQR.account_name}</div>
                                                <div><strong>Số tiền:</strong> {formatCurrency(paymentQR.total_amount)}</div>
                                                <div><strong>Nội dung:</strong> {paymentQR.description}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </Card.Body>
                </Card>

                {/* Order Items */}
                <Card className="mb-4">
                    <Card.Header className="bg-white">
                        <strong>Chi tiết đơn hàng</strong>
                    </Card.Header>
                    <ListGroup variant="flush">
                        {(order.items || []).map((item, idx) => (
                            <ListGroup.Item key={idx} className="d-flex justify-content-between">
                                <div>
                                    <span className="fw-medium">{item.name}</span>
                                    <small className="text-muted d-block">
                                        x{item.quantity}
                                        {item.notes && ` - ${item.notes}`}
                                    </small>
                                </div>
                                <span>{formatCurrency(item.price * item.quantity)}</span>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                    <Card.Footer className="bg-white">
                        <div className="d-flex justify-content-between">
                            <strong>Tổng cộng</strong>
                            <strong className="text-primary">
                                {formatCurrency(order.total_amount)}
                            </strong>
                        </div>
                    </Card.Footer>
                </Card>

                {/* Actions */}
                <div className="d-grid gap-2">
                    <Button
                        variant="outline-secondary"
                        onClick={() => {
                            // Navigate back to menu
                            if (order.restaurant?.slug && order.table_number) {
                                navigate(`/${order.restaurant.slug}/menu/${order.table_number}`);
                            } else {
                                navigate(-1);
                            }
                        }}
                    >
                        Quay lại thực đơn
                    </Button>
                </div>
            </Container>
        </div>
    );
}
