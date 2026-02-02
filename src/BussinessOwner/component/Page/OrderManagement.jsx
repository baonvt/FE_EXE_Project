import "bootstrap/dist/css/bootstrap.min.css";
import { useEffect, useRef, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Button,
  Modal,
  Form,
  Dropdown,
  InputGroup,
  Nav,
} from "react-bootstrap";
import { QRCodeCanvas } from "qrcode.react";
import { useNavigate } from "react-router-dom";
import {
  Trash2,
  Edit3,
  Search,
  Plus,
  Coffee,
  CheckCircle2,
  Clock,
  LayoutGrid,
} from "lucide-react";
import {
  getTableOrders,
  createTableOrder,
  deleteTableOrder,
  updateTableOrder,
} from "../../api/OrderManagementAPI";

// Cấu hình màu sắc trạng thái nâng cao
const statusConfig = {
  empty: {
    label: "Bàn trống",
    color: "#16a34a",
    bg: "#dcfce7",
    border: "#16a34a",
  },
  serving: {
    label: "Đang có khách",
    color: "#dc2626",
    bg: "#fee2e2",
    border: "#dc2626",
  },
  reserved: {
    label: "Đã đặt trước",
    color: "#6366f1",
    bg: "#eef2ff",
    border: "#6366f1",
    icon: <Clock size={14} className="me-1" />,
  },
};

export default function OrderManagement() {
  const [tables, setTables] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // States cho các Modal
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const qrRef = useRef(null);
  const navigate = useNavigate();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    capacity: 4,
    name: "",
    table_number: "",
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [tableToDelete, setTableToDelete] = useState(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [tableToEdit, setTableToEdit] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    capacity: 0,
    status: "empty",
  });

  // --- LOGIC XỬ LÝ DỮ LIỆU ---

  // Định nghĩa mapping trạng thái
  const BACKEND_TO_FRONTEND_STATUS = {
    AVAILABLE: "empty",
    OCCUPIED: "serving",
    RESERVED: "reserved",

    available: "empty",
    occupied: "serving",
    reserved: "reserved",
  };

  useEffect(() => {
    fetchTables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTables = async () => {
    try {
      const response = await getTableOrders();
      let tableList = response.data || response;
      if (!Array.isArray(tableList)) tableList = [];

      const activeTables = tableList
        .filter((table) => table.is_active === true)
        .map((table) => {
          const hasActiveOrder =
            table.active_orders_count && table.active_orders_count > 0;

          return {
            ...table,
            status: hasActiveOrder
              ? "serving"
              : BACKEND_TO_FRONTEND_STATUS[table.status] || "empty",
          };
        });


      // Sort tables by table_number numerically
      activeTables.sort((a, b) => a.table_number - b.table_number);
      setTables(activeTables);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu bàn:", error);
    }
  };

  const filteredTables = tables.filter((table) => {
    const matchStatus = filterStatus === "all" || table.status === filterStatus;
    const matchSearch = table.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  // Thống kê nhanh (Đã thêm reserved)
  const stats = {
    total: tables.length,
    empty: tables.filter((t) => t.status === "empty").length,
    serving: tables.filter((t) => t.status === "serving").length,
    reserved: tables.filter((t) => t.status === "reserved").length,
  };

  // --- HANDLERS ---
  const handleCreate = async () => {
    const tableNumber = Number(createForm.table_number);

    if (!tableNumber) {
      alert("Vui lòng nhập số bàn");
      return;
    }

    // check trùng ở frontend
    const isDuplicate = tables.some(
      (t) => t.table_number === tableNumber
    );

    if (isDuplicate) {
      alert("Số bàn đã tồn tại");
      return;
    }

    const newTable = {
      name: `Bàn ${tableNumber}`,
      capacity: Number(createForm.capacity),
      table_number: tableNumber,
    };

    try {
      await createTableOrder(newTable);
      await fetchTables();
      setShowCreateModal(false);
      setCreateForm({ capacity: 4, name: "", table_number: "" });
    } catch (error) {
      alert(error.message);
    }
  };


  const handleDelete = async () => {
    try {
      if (tableToDelete) {
        await deleteTableOrder(tableToDelete.id);
        fetchTables();
        setShowDeleteConfirm(false);
        setTableToDelete(null);
      }
    } catch {
      alert("Lỗi khi xóa bàn");
    }
  };

  const handleEdit = async () => {
    if (!tableToEdit) return;

    const payload = {
      name: editForm.name,
      capacity: Number(editForm.capacity),
      status: editForm.status,
    };

    try {
      await updateTableOrder(tableToEdit.id, payload);
      await fetchTables();
      setShowEditModal(false);
      setTableToEdit(null);
    } catch (error) {
      console.error(error);
      alert("Cập nhật bàn thất bại");
    }
  };



  const handleDownloadQR = () => {
    if (qrRef.current) {
      const canvas = qrRef.current.querySelector("canvas");
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = url;
      link.download = `${selectedTable.name}-QR.png`;
      link.click();
    }
  };

  // Component nhỏ cho thẻ thống kê
  // eslint-disable-next-line no-unused-vars
  const StatCard = ({ label, value, icon: IconComponent, color, bg }) => (
    <Card className="border-0 shadow-sm h-100 rounded-4">
      <Card.Body className="d-flex align-items-center justify-content-between p-3">
        <div>
          <p className="text-muted small mb-1 fw-bold text-uppercase">
            {label}
          </p>
          <h4 className="fw-bold mb-0" style={{ color: color }}>
            {value}
          </h4>
        </div>
        <div
          className="rounded-circle p-3 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: bg, color: color }}
        >
          <IconComponent size={24} />
        </div>
      </Card.Body>
    </Card>
  );

  return (
    <Container
      fluid
      className="p-4"
      style={{ backgroundColor: "#f3f4f6", minHeight: "100vh" }}
    >
      {/* 1. HEADER & STATS */}
      <Row className="mb-4 g-3">
        <Col
          xs={12}
          className="d-flex justify-content-between align-items-center mb-2"
        >
          <div>
            <h3 className="fw-bold text-dark mb-0">Quản lý bàn ăn</h3>
            <p className="text-muted small mb-0">
              Theo dõi trạng thái và quản lý khu vực bàn
            </p>
          </div>
          <Button
            onClick={() => {
              // Auto-calculate next table number
              const maxNumber = tables.reduce((max, t) => Math.max(max, t.table_number || 0), 0);
              setCreateForm(prev => ({ ...prev, table_number: maxNumber + 1 }));
              setShowCreateModal(true);
            }}
            className="d-flex align-items-center gap-2 rounded-pill px-4 py-2 fw-bold shadow-sm"
            style={{ background: "#4f46e5", border: "none" }}
          >
            <Plus size={20} />{" "}
            <span className="d-none d-md-inline">Thêm bàn</span>
          </Button>
        </Col>

        {/* Stats Cards - Đã chia lại grid thành 4 cột */}
        <Col xs={6} md={3}>
          <StatCard
            label="Tổng số bàn"
            value={stats.total}
            icon={LayoutGrid}
            color="#4f46e5"
            bg="#e0e7ff"
          />
        </Col>
        <Col xs={6} md={3}>
          <StatCard
            label="Bàn trống"
            value={stats.empty}
            icon={CheckCircle2}
            color="#10b981"
            bg="#ecfdf5"
          />
        </Col>
        <Col xs={6} md={3}>
          <StatCard
            label="Đang phục vụ"
            value={stats.serving}
            icon={Coffee}
            color="#f59e0b"
            bg="#fffbeb"
          />
        </Col>
        <Col xs={6} md={3}>
          <StatCard
            label="Đã đặt trước"
            value={stats.reserved}
            icon={Clock}
            color="#6366f1"
            bg="#eef2ff"
          />
        </Col>
      </Row>

      {/* 2. FILTERS */}
      <Card
        className="border-0 shadow-sm rounded-4 mb-4 sticky-top"
        style={{ zIndex: 1020, top: 10 }}
      >
        <Card.Body className="p-2">
          <Row className="g-2 align-items-center">
            <Col md={5}>
              <InputGroup>
                <InputGroup.Text className="bg-white border-0 ps-3">
                  <Search size={18} className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Tìm kiếm theo tên bàn..."
                  className="bg-white border-0 shadow-none ps-2"
                  style={{ fontSize: "0.95rem" }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={7}>
              <Nav
                variant="pills"
                className="justify-content-md-end gap-2 p-1 bg-light rounded-pill d-inline-flex float-md-end"
              >
                {[
                  { key: "all", label: "Tất cả" },
                  { key: "empty", label: "Bàn trống" },
                  { key: "serving", label: "Đang phục vụ" },
                  { key: "reserved", label: "Đã đặt trước" }, // Thêm tab lọc nếu muốn (option)
                ].map((tab) => (
                  <Nav.Item key={tab.key}>
                    <Nav.Link
                      active={filterStatus === tab.key}
                      onClick={() => setFilterStatus(tab.key)}
                      className={`rounded-pill px-3 py-1 small fw-bold ${filterStatus === tab.key
                        ? "bg-white text-dark shadow-sm"
                        : "text-muted"
                        }`}
                      style={{ cursor: "pointer", transition: "all 0.2s" }}
                    >
                      {tab.label}
                    </Nav.Link>
                  </Nav.Item>
                ))}
              </Nav>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* 3. TABLE GRID */}
      {filteredTables.length === 0 ? (
        <div className="text-center py-5">
          <div className="text-muted opacity-50 mb-3">
            <LayoutGrid size={64} />
          </div>
          <h5 className="text-muted fw-bold">Không tìm thấy bàn nào</h5>
          <p className="text-muted small">
            Thử thay đổi bộ lọc hoặc thêm bàn mới.
          </p>
        </div>
      ) : (
        <Row xs={1} sm={2} md={3} xl={4} className="g-4 pb-5">
          {filteredTables.map((table) => {
            const status = statusConfig[table.status] || statusConfig.empty;
            return (
              <Col key={table.id}>
                {/* Card Main */}
                <Card
                  className="border-0 shadow-sm h-100 rounded-4 position-relative table-card transition-transform"
                  style={{ transition: "transform 0.2s, box-shadow 0.2s" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-5px)";
                    e.currentTarget.style.boxShadow =
                      "0 10px 20px rgba(0,0,0,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 .125rem .25rem rgba(0,0,0,.075)";
                  }}
                >
                  {/* Status Strip Color */}
                  <div
                    className="position-absolute top-0 start-0 w-100 rounded-top-4"
                    style={{ height: "6px", background: status.border }}
                  ></div>

                  <Card.Body className="p-3 pt-4">
                    {/* Header Card */}
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div
                        onClick={() => navigate(`table/${table.id}`)}
                        style={{ cursor: "pointer" }}
                      >
                        <h5
                          className="fw-bolder mb-1 text-dark"
                          style={{ fontSize: "1.25rem" }}
                        >
                          {table.name}
                        </h5>
                        <span
                          className="badge rounded-pill fw-medium d-inline-flex align-items-center px-2 py-1"
                          style={{
                            backgroundColor: status.bg,
                            color: status.color,
                            border: `1px solid ${status.bg}`,
                          }}
                        >
                          {status.icon} {status.label}
                        </span>
                      </div>

                      <Dropdown align="end">
                        <Dropdown.Toggle
                          as="div"
                          className="p-2 rounded-circle hover-bg-light cursor-pointer text-muted"
                        >
                          <MoreVertical size={20} />
                        </Dropdown.Toggle>
                        <Dropdown.Menu
                          className="border-0 shadow-lg rounded-4 p-2"
                          style={{ zIndex: 1050, minWidth: "200px" }}
                        >
                          <Dropdown.Item
                            onClick={() => {
                              setSelectedTable(table);
                              setShowQRModal(true);
                            }}
                            className="rounded-3 fw-medium py-2 mb-1"
                          >
                            <QrCode size={16} className="me-2 text-dark" /> Xem
                            mã QR
                          </Dropdown.Item>
                          <Dropdown.Item
                            onClick={() => {
                              setTableToEdit(table);
                              setEditForm({
                                name: table.name,
                                capacity: table.capacity,
                                status: table.status,
                              });
                              setShowEditModal(true);
                            }}
                            className="rounded-3 fw-medium py-2 mb-1"
                          >
                            <Edit3 size={16} className="me-2 text-info" /> Chỉnh
                            sửa
                          </Dropdown.Item>
                          <Dropdown.Divider className="my-1" />
                          <Dropdown.Item
                            onClick={() => {
                              setTableToDelete(table);
                              setShowDeleteConfirm(true);
                            }}
                            className="rounded-3 fw-medium py-2 text-danger bg-danger-subtle mt-1"
                          >
                            <Trash2 size={16} className="me-2" /> Xóa bàn
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>

                    {/* Info Area */}
                    <div
                      className="d-flex align-items-center gap-3 text-secondary mb-4 ps-1"
                      style={{ fontSize: "0.9rem" }}
                    >
                      <div className="d-flex align-items-center gap-1 bg-light px-2 py-1 rounded-3">
                        <Users size={14} />{" "}
                        <span className="fw-medium">
                          {table.capacity} khách
                        </span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button
                      variant={
                        table.status === "empty"
                          ? "outline-primary"
                          : "primary"
                      }
                      className="w-100 rounded-pill fw-bold py-2"
                      onClick={() => navigate(`table/${table.id}`)}
                    >
                      {table.status === "empty"
                        ? "Bắt đầu gọi món"
                        : "Xem đơn hàng"}
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* --- MODALS --- */}
      {/* 1. Modal Tạo Bàn */}
      <Modal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        centered
        contentClassName="border-0 rounded-4 shadow-lg"
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Thêm bàn mới</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2">
          <p className="text-muted small mb-4">
            Nhập thông tin để tạo bàn mới trong hệ thống.
          </p>
          <Form>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-muted">
                    Số bàn
                  </Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Tự động"
                    value={createForm.table_number}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        table_number: e.target.value,
                      })
                    }
                    className="bg-light border-0 py-2"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-muted">
                    Sức chứa (người)
                  </Form.Label>
                  <Form.Control
                    type="number"
                    value={createForm.capacity}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, capacity: e.target.value })
                    }
                    className="bg-light border-0 py-2"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button
            variant="light"
            onClick={() => setShowCreateModal(false)}
            className="rounded-pill px-4 fw-medium"
          >
            Hủy
          </Button>
          <Button
            onClick={handleCreate}
            className="rounded-pill px-4 fw-bold shadow-sm"
            style={{ background: "#4f46e5", border: "none" }}
          >
            Tạo bàn
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 2. Modal QR Code */}
      <Modal
        show={showQRModal}
        onHide={() => setShowQRModal(false)}
        centered
        contentClassName="border-0 rounded-4 shadow-lg"
      >
        <Modal.Body className="text-center p-5" ref={qrRef}>
          <div className="mb-4">
            <h4 className="fw-bold mb-1">{selectedTable?.name}</h4>
            <Badge
              bg="light"
              text="dark"
              className="border px-3 py-2 rounded-pill fw-normal"
            >
              Scan to Order
            </Badge>
          </div>
          {selectedTable && (
            <div className="p-4 bg-white rounded-4 shadow-sm d-inline-block border mb-4">
              <QRCodeCanvas
                value={`https://fbmanager.io.vn${selectedTable.qr_url}`}
                size={220}
                level={"H"}
              />
            </div>
          )}
          <div className="d-flex gap-2 justify-content-center w-100">
            <Button
              variant="light"
              className="flex-fill rounded-pill fw-medium"
              onClick={() => setShowQRModal(false)}
            >
              Đóng
            </Button>
            <Button
              variant="primary"
              className="flex-fill rounded-pill fw-bold shadow-sm"
              style={{ background: "#4f46e5", border: "none" }}
              onClick={handleDownloadQR}
            >
              <QrCode size={18} className="me-2" /> Tải ảnh về
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* 3. Modal Xóa */}
      <Modal
        show={showDeleteConfirm}
        onHide={() => setShowDeleteConfirm(false)}
        centered
        size="sm"
        contentClassName="border-0 rounded-4 shadow-lg"
      >
        <Modal.Body className="text-center p-4">
          <div
            className="bg-danger-subtle text-danger rounded-circle p-3 d-inline-flex mb-3 align-items-center justify-content-center"
            style={{ width: 60, height: 60 }}
          >
            <Trash2 size={28} />
          </div>
          <h5 className="fw-bold mb-2">Xóa bàn này?</h5>
          <p className="text-muted small mb-4">
            Bạn có chắc muốn xóa <strong>{tableToDelete?.name}</strong>? Dữ liệu
            đơn hàng liên quan có thể bị ảnh hưởng.
          </p>
          <div className="d-flex gap-2">
            <Button
              variant="light"
              className="flex-fill rounded-pill fw-medium"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Không
            </Button>
            <Button
              variant="danger"
              className="flex-fill rounded-pill fw-bold shadow-sm"
              onClick={handleDelete}
            >
              Xóa ngay
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* 4. Modal Edit */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        centered
        contentClassName="border-0 rounded-4 shadow-lg"
      >
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">Cập nhật thông tin</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">
                Tên Bàn
              </Form.Label>
              <Form.Control
                type="text"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                className="bg-light border-0 py-2"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">
                Sức chứa
              </Form.Label>
              <Form.Control
                type="number"
                value={editForm.capacity}
                onChange={(e) =>
                  setEditForm({ ...editForm, capacity: e.target.value })
                }
                className="bg-light border-0 py-2"
              />
            </Form.Group>
            <Form.Select
              value={editForm.status}
              onChange={(e) =>
                setEditForm({ ...editForm, status: e.target.value })
              }
            >
              <option value="available">Bàn trống</option>
              <option value="occupied">Đang phục vụ</option>
              <option value="reserved">Đã đặt trước</option>
            </Form.Select>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button
            variant="light"
            className="rounded-pill px-4 fw-medium"
            onClick={() => setShowEditModal(false)}
          >
            Hủy
          </Button>
          <Button
            variant="primary"
            className="rounded-pill px-4 fw-bold shadow-sm"
            style={{ background: "#4f46e5", border: "none" }}
            onClick={handleEdit}
          >
            Lưu thay đổi
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}