import "bootstrap/dist/css/bootstrap.min.css";
import { Container, Row, Col, Card, Table, Badge, Button } from "react-bootstrap";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useEffect, useState } from "react";
import { 
  DollarSign, 
  ShoppingBag, 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  UtensilsCrossed
} from "lucide-react";
import { chartStatistics, overallStatistics, getPendingOrders } from "../../api/DashBoardApi";

// --- Helper Functions ---
const getDaysInMonth = (month, year) => new Date(year, month, 0).getDate();
const generateYearlyData = (year) => {
  return Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    revenue: Math.floor(Math.random() * 400000000) + 80000000,
  }));
};

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

const OrderItem = ({ order, onComplete }) => {
  // Màu sắc badge dựa trên kênh bán
  const getBadgeColor = (channel) => {
    if (channel.includes("Tại chỗ")) return "primary";
    if (channel.includes("Takeaway")) return "warning";
    return "success"; // Delivery apps
  };

  return (
    <div className="p-3 mb-2 bg-white border-0 shadow-sm rounded-3 d-flex justify-content-between align-items-center transition-all hover-shadow">
      <div className="d-flex flex-column">
        <div className="d-flex align-items-center gap-2 mb-1">
          <Badge bg={getBadgeColor(order.channel)} className="rounded-pill px-3">
            {order.channel}
          </Badge>
          <span className="fw-bold text-dark">{order.source}</span>
        </div>
        <div className="text-muted small d-flex align-items-center gap-1">
          <UtensilsCrossed size={14} /> {order.items.join(", ")}
        </div>
        <div className="text-muted small mt-1 d-flex align-items-center gap-1">
          <Clock size={14} /> {new Date(order.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
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
  );
};

export default function Dashboard() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
const [overview, setOverview] = useState(null);
const [loadingStats, setLoadingStats] = useState(true);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [chartData, setChartData] = useState([]);
const [loadingChart, setLoadingChart] = useState(false);

  const completeOrder = (id) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
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

  // Auto refresh every 30 seconds
  const interval = setInterval(fetchPendingOrders, 30000);
  return () => clearInterval(interval);
}, []);

useEffect(() => {
  const fetchChart = async () => {
    setLoadingChart(true);
    try {
      const res = await chartStatistics(year);
      if (res?.success) {
        /**
         * API trả về:
         * chart_data: null | [{ month: 1, revenue: 123456 }]
         */
        const apiData = res.data?.chart_data || [];

        // Chuẩn hóa đủ 12 tháng cho Recharts
        const fullYearData = Array.from({ length: 12 }, (_, i) => {
          const month = i + 1;
          const found = apiData.find((d) => d.month === month);
          return {
            month,
            revenue: found ? Number(found.revenue) : 0,
          };
        });

        setChartData(fullYearData);
      }
    } catch (e) {
      console.error("Lỗi load chart:", e);
      setChartData([]);
    } finally {
      setLoadingChart(false);
    }
  };

  fetchChart();
}, [year]);

  // const revenueData = generateYearlyData(year);

  // Format currency helper
  const formatCurrency = (val) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(val) || 0);
  const formatCompactNumber = (number) => new Intl.NumberFormat('vi-VN', { notation: "compact", compactDisplay: "short" }).format(number);

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


      {/* Main Content Area */}
      <Row className="g-4">
        {/* Left Column: Chart & Top Products */}
        <Col lg={8}>
          {/* Chart Section */}
          <Card className="border-0 shadow-sm rounded-4 mb-4">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold mb-0">Biểu đồ doanh thu</h5>
                <select
                  className="form-select w-auto border-0 bg-light fw-medium"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                >
                  {Array.from({ length: 5 }, (_, i) => (
                    <option key={i} value={currentYear - i}>Năm {currentYear - i}</option>
                  ))}
                </select>
              </div>
              <div style={{ width: "100%", height: 320 }}>
                <ResponsiveContainer>
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9ecef" />
                    <XAxis 
                        dataKey="month" 
                        tickFormatter={(m) => `T${m}`} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: "#6c757d", fontSize: 12 }} 
                        dy={10}
                    />
                    <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: "#6c757d", fontSize: 12 }} 
                        tickFormatter={(val) => `${val/1000000}tr`}
                    />
                    <Tooltip 
                        cursor={{ fill: '#f8f9fa' }}
                        formatter={(value) => [formatCurrency(value), "Doanh thu"]}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="revenue" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>

          {/* Top Products Section */}
          {/* <Card className="border-0 shadow-sm rounded-4">
            <Card.Body>
              <h5 className="fw-bold mb-3">Top món bán chạy</h5>
              <Table hover responsive className="align-middle mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="border-0 text-muted small text-uppercase">Tên món</th>
                    <th className="border-0 text-muted small text-uppercase text-center">Số lượng</th>
                    <th className="border-0 text-muted small text-uppercase text-end">Tổng thu</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                      { name: "Phở bò đặc biệt", qty: 42, rev: 5400000 },
                      { name: "Trà sữa nướng", qty: 38, rev: 3100000 },
                      { name: "Cơm gà xối mỡ", qty: 26, rev: 2600000 }
                  ].map((item, idx) => (
                    <tr key={idx}>
                      <td className="fw-medium">{item.name}</td>
                      <td className="text-center"><Badge bg="light" text="dark" className="border">{item.qty}</Badge></td>
                      <td className="text-end fw-bold text-success">{formatCompactNumber(item.rev)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card> */}
        </Col>

        {/* Right Column: Order Queue */}
        <Col lg={4}>
          <Card className="border-0 shadow-sm rounded-4 h-100" style={{ backgroundColor: "#f1f5f9" }}>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0">Đơn cần xử lý <Badge bg="danger" pill>{orders.length}</Badge></h5>
              </div>
              
              <div className="d-flex flex-column gap-2" style={{ maxHeight: '700px', overflowY: 'auto' }}>
                {orders.length === 0 ? (
                  <div className="text-center py-5">
                    <div className="bg-white rounded-circle p-4 d-inline-block shadow-sm mb-3">
                        <CheckCircle size={40} className="text-success" />
                    </div>
                    <h6 className="text-muted">Tuyệt vời! Đã hết đơn chờ.</h6>
                  </div>
                ) : (
                  orders.map((o) => (
                    <OrderItem key={o.id} order={o} onComplete={completeOrder} />
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