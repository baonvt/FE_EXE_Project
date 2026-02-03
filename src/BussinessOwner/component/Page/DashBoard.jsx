import "bootstrap/dist/css/bootstrap.min.css";
import { Container, Row, Col, Card, Table, Badge, Button } from "react-bootstrap";
import { useEffect, useState } from "react";
import { 
  DollarSign, 
  ShoppingBag, 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  UtensilsCrossed,
  CreditCard
} from "lucide-react";
import { overallStatistics, getPendingOrders } from "../../api/DashBoardApi";
import { confirmOrderPayment } from "../../api/OrderManagementAPI";

// --- Helper Functions ---
const getDaysInMonth = (month, year) => new Date(year, month, 0).getDate();

// --- Sub-components for cleaner code ---
const StatCard = ({ title, value, icon: Icon, color, subText }) => (
  <Card className="border-0 shadow-sm h-100 rounded-4">
    <Card.Body className="d-flex align-items-center justify-content-between">
      <div>
        <h6 className="text-muted mb-1 text-uppercase fw-semibold" style={{ fontSize: "0.75rem" }}>{title}</h6>
        <h3 className="fw-bold mb-0 text-dark">{value}</h3>
        {subText && <small className={`text-${color} fw-medium`}>{subText}</small>}
      </div>
      <div className={`p-3 bg-${color}-subtle rounded-circle text-${color}`}>
        <Icon size={24} />
      </div>
    </Card.Body>
  </Card>
);

const OrderItem = ({ order, onComplete, onConfirmPayment, confirmingId }) => {
  // Màu sắc badge dựa trên kênh bán
  const getBadgeColor = (channel) => {
    if (channel.includes("Tại chỗ")) return "primary";
    if (channel.includes("Takeaway")) return "warning";
    return "success"; // Delivery apps
  };

  const getPaymentBadge = (status) => {
    if (status === "paid") return <Badge bg="success" className="ms-2">Đã thanh toán</Badge>;
    if (status === "pending") return <Badge bg="warning" text="dark" className="ms-2">Chờ thanh toán</Badge>;
    return null;
  };

  return (
    <div className="p-3 mb-2 bg-white border-0 shadow-sm rounded-3 d-flex justify-content-between align-items-center transition-all hover-shadow">
      <div className="d-flex flex-column">
        <div className="d-flex align-items-center gap-2 mb-1">
          <Badge bg={getBadgeColor(order.channel)} className="rounded-pill px-3">
            {order.channel}
          </Badge>
          <span className="fw-bold text-dark">{order.source}</span>
          {getPaymentBadge(order.payment_status)}
        </div>
        <div className="text-muted small d-flex align-items-center gap-1">
          <UtensilsCrossed size={14} /> Đơn #{order.order_number}
        </div>
        <div className="text-muted small mt-1 d-flex align-items-center gap-1">
          <Clock size={14} /> {new Date(order.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          {order.total_amount && (
            <span className="ms-2 text-success fw-bold">
              {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(order.total_amount)}
            </span>
          )}
        </div>
      </div>
      <div className="d-flex gap-2">
        {/* Nút xác nhận đã nhận tiền - chỉ hiện khi chưa thanh toán */}
        {order.payment_status === "pending" && (
          <Button 
            variant="success" 
            size="sm" 
            className="rounded-pill px-3"
            onClick={() => onConfirmPayment(order.id)}
            disabled={confirmingId === order.id}
            title="Xác nhận đã nhận tiền từ khách"
          >
            {confirmingId === order.id ? (
              <span className="spinner-border spinner-border-sm"></span>
            ) : (
              <>
                <CreditCard size={16} className="me-1" />
                Xác nhận tiền
              </>
            )}
          </Button>
        )}
        {/* Nút hoàn thành đơn */}
        <Button 
          variant="outline-success" 
          size="sm" 
          className="rounded-circle p-2 border-2"
          onClick={() => onComplete(order.id)}
          title="Hoàn thành đơn"
        >
          <CheckCircle size={20} />
        </Button>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [overview, setOverview] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [confirmingId, setConfirmingId] = useState(null);

  const completeOrder = (id) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
  };

  // Xác nhận đã nhận tiền
  const handleConfirmPayment = async (orderId) => {
    setConfirmingId(orderId);
    try {
      const res = await confirmOrderPayment(orderId);
      if (res?.success) {
        // Cập nhật trạng thái trong danh sách
        setOrders(prev => prev.map(o => 
          o.id === orderId ? { ...o, payment_status: "paid" } : o
        ));
      } else {
        alert(res?.message || "Có lỗi xảy ra khi xác nhận thanh toán");
      }
    } catch (error) {
      console.error("Lỗi xác nhận thanh toán:", error);
      alert("Có lỗi xảy ra khi xác nhận thanh toán");
    } finally {
      setConfirmingId(null);
    }
  };
useEffect(() => {
  const fetchOverview = async () => {
    setLoadingStats(true);
    try {
      const res = await overallStatistics();
      if (res?.success) {
        console.log("OVERVIEW:", res.data);
        setOverview(res.data);
      }
    } catch (e) {
      console.error("Lỗi load thống kê:", e);
    } finally {
      setLoadingStats(false);
    }
  };

  fetchOverview();
}, []);

useEffect(() => {
  const fetchPendingOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await getPendingOrders();
      if (res?.success) {
        const ordersData = res.data?.orders || [];
        // Transform API data to match UI format
        const transformedOrders = ordersData.map(order => ({
          id: order.id,
          order_number: order.order_number,
          source: order.table_name || `Bàn ${order.table_number}`,
          channel: "Tại chỗ",
          items: [], // Will be populated if needed
          time: new Date(order.created_at),
          total_amount: order.total_amount,
          payment_status: order.payment_status,
          status: order.status
        }));
        setOrders(transformedOrders);
      }
    } catch (e) {
      console.error("Lỗi load đơn hàng:", e);
    } finally {
      setLoadingOrders(false);
    }
  };

  fetchPendingOrders();

  // Auto refresh every 10 seconds
  const interval = setInterval(fetchPendingOrders, 10000);
  return () => clearInterval(interval);
}, []);

  // Format currency helper
  const formatCurrency = (val) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(val) || 0);

  return (
    <Container fluid className="p-4 min-vh-100" style={{ backgroundColor: "#f8f9fa" }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0 text-dark">Tổng quan kinh doanh</h4>
          <p className="text-muted mb-0">Xin chào, chúc bạn một ngày buôn bán đắt hàng!</p>
        </div>
        <div className="d-flex gap-2">
            <Button variant="white" className="bg-white border shadow-sm text-muted">
                 <Clock size={18} className="me-2"/> {new Date().toLocaleDateString('vi-VN')}
            </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <Row className="g-3 mb-4">
  <Col md={3}>
    <StatCard
      title="Doanh thu hôm nay"
      value={loadingStats ? "..." : formatCurrency(overview?.today?.revenue)}
      icon={DollarSign}
      color="success"
    />
  </Col>

  <Col md={3}>
    <StatCard
      title="Đơn hàng"
      value={loadingStats ? "..." : overview?.today?.orders}
      icon={ShoppingBag}
      color="primary"
    />
  </Col>

  <Col md={3}>
    <StatCard
      title="Số bàn đang dùng"
      value={loadingStats ? "..." : overview?.tables?.occupied}
      icon={Users}
      color="info"
    />
  </Col>

  <Col md={3}>
    <StatCard
      title="Giá trị TB / đơn"
      value={loadingStats ? "..." : formatCurrency(overview?.today?.avg_order_value)}
      icon={TrendingUp}
      color="warning"
    />
  </Col>
</Row>


      {/* Main Content Area - Đơn cần xử lý */}
      <Row className="g-4">
        <Col lg={12}>
          <Card className="border-0 shadow-sm rounded-4" style={{ backgroundColor: "#f1f5f9" }}>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0">Đơn cần xử lý <Badge bg="danger" pill>{orders.length}</Badge></h5>
              </div>
              
              <div className="row g-3" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {orders.length === 0 ? (
                  <div className="col-12 text-center py-5">
                    <div className="bg-white rounded-circle p-4 d-inline-block shadow-sm mb-3">
                        <CheckCircle size={40} className="text-success" />
                    </div>
                    <h6 className="text-muted">Tuyệt vời! Đã hết đơn chờ.</h6>
                  </div>
                ) : (
                  orders.map((o) => (
                    <div key={o.id} className="col-md-6 col-lg-4">
                      <OrderItem 
                        order={o} 
                        onComplete={completeOrder} 
                        onConfirmPayment={handleConfirmPayment}
                        confirmingId={confirmingId}
                      />
                    </div>
                  ))
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}