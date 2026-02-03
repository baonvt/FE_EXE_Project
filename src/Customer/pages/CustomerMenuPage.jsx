import "bootstrap/dist/css/bootstrap.min.css";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Offcanvas,
  Badge,
  Nav,
  Spinner,
  ListGroup,
  Modal,
  Form,
  InputGroup,
} from "react-bootstrap";
import { ShoppingCart, Plus, Minus, UtensilsCrossed, Search } from "lucide-react";
import { CustomerProvider, useCustomer } from "../context/CustomerContext";
import {
  getRestaurantBySlug,
  getTableBySlugAndNumber,
  getMenuBySlug,
  getMenuItemById,
  createOrderBySlug,
  getPublicMenu,
  getPublicCategories,
} from "../api/CustomerAPI";
import { useToast } from "../../context/useToast";
import CustomerNotFoundPage from "./CustomerNotFoundPage";
import "./CustomerMenu.css";

function CustomerMenuContent() {
  const { restaurantSlug, tableNumber } = useParams();
  const { showToast } = useToast();
  const {
    restaurantId,
    restaurantName,
    tableId,
    tableNumber: ctxTableNumber,
    initSession,
    cart,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    cartTotal,
    cartCount,
  } = useCustomer();

  const [restaurant, setRestaurant] = useState(null);
  const [table, setTable] = useState(null);
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [showCart, setShowCart] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemDetail, setItemDetail] = useState(null);
  const [itemQty, setItemQty] = useState(1);
  const [itemNote, setItemNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerNote, setCustomerNote] = useState("");

  useEffect(() => {
    if (!restaurantSlug) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const res = await getRestaurantBySlug(restaurantSlug);
        if (cancelled) return;
        const r = res?.data ?? res ?? res?.restaurant;
        if (!r?.id && !r?.restaurant_id) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setRestaurant(r);
      } catch (e) {
        if (cancelled) return;
        if (restaurantSlug === "demo") {
          setRestaurant({ id: 1, restaurant_id: 1, name: "Nhà hàng Demo", slug: "demo" });
        } else {
          setNotFound(true);
        }
        setLoading(false);
        return;
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [restaurantSlug]);

  useEffect(() => {
    if (!restaurantSlug || !tableNumber) return;
    const isDemo = restaurantSlug === "demo";
    let cancelled = false;
    (async () => {
      if (!isDemo) setLoading(true);
      try {
        // Sử dụng API mới: lấy table theo slug và số bàn
        const res = await getTableBySlugAndNumber(restaurantSlug, tableNumber);
        if (cancelled) return;
        const t = res?.data ?? res ?? res?.table;
        if (!t) {
          if (!isDemo) setNotFound(true);
          else {
            const demoRestaurant = { id: 1, restaurant_id: 1, name: "Nhà hàng Demo", slug: "demo" };
            const demoTable = { id: 1, table_number: tableNumber, name: `Bàn ${tableNumber}` };
            setRestaurant(demoRestaurant);
            setTable(demoTable);
            initSession(demoRestaurant, demoTable);
          }
          if (!cancelled) setLoading(false);
          return;
        }
        // API trả về cả restaurant info trong response
        const r = t.restaurant ?? restaurant ?? { id: t.restaurant_id };
        if (r) setRestaurant(r);
        setTable(t);
        initSession(r, t);
      } catch (e) {
        if (cancelled) return;
        if (isDemo) {
          const demoRestaurant = { id: 1, restaurant_id: 1, name: "Nhà hàng Demo", slug: "demo" };
          const demoTable = { id: 1, table_number: tableNumber, name: `Bàn ${tableNumber}` };
          setRestaurant(demoRestaurant);
          setTable(demoTable);
          initSession(demoRestaurant, demoTable);
        } else {
          setNotFound(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [restaurantSlug, tableNumber, initSession]);

  useEffect(() => {
    if (!restaurantSlug || !restaurantId) return;
    let cancelled = false;
    (async () => {
      try {
        // Sử dụng API mới: lấy menu theo slug
        const menuData = await getMenuBySlug(restaurantSlug);
        if (cancelled) return;
        
        // API trả về { restaurant, menu: [{ id, name, items: [...] }] }
        const menuCategories = menuData?.menu ?? menuData ?? [];
        
        // Lấy danh sách categories
        const catList = Array.isArray(menuCategories) 
          ? menuCategories.map(cat => ({ id: cat.id, name: cat.name, description: cat.description, image: cat.image }))
          : [];
        
        // Flatten items từ tất cả categories
        const menuItems = [];
        if (Array.isArray(menuCategories)) {
          menuCategories.forEach(cat => {
            if (Array.isArray(cat.items)) {
              cat.items.forEach(item => {
                menuItems.push({
                  id: item.id,
                  name: item.name,
                  price: item.price,
                  description: item.description ?? "",
                  category_id: cat.id,
                  image: item.image ?? "https://placehold.co/400x300?text=Món+ăn",
                  badge: item.tags ?? "",
                  options: item.options,
                });
              });
            }
          });
        }
        
        setCategories(catList);
        setMenu(menuItems);
      } catch (e) {
        // Fallback sang API cũ nếu API mới không hoạt động
        try {
          const [c, m] = await Promise.all([getPublicCategories(restaurantId), getPublicMenu(restaurantId)]);
          const catList = Array.isArray(c) ? c : (c?.data ?? []);
          const menuList = Array.isArray(m) ? m : (m?.data ?? []);
          if (!cancelled) {
            setCategories(Array.isArray(catList) ? catList : []);
            setMenu(
              (Array.isArray(menuList) ? menuList : []).map((m) => ({
                id: m.id,
                name: m.name,
                price: m.price,
                description: m.description ?? m.desc ?? "",
                category_id: m.category_id ?? m.categoryId,
                image: m.image_url ?? m.image ?? "https://placehold.co/400x300?text=Món+ăn",
                badge: m.badge ?? m.tags ?? "",
              }))
            );
          }
        } catch (_) {
          if (!cancelled) {
            setMenu([]);
            setCategories([]);
          }
        }
      }
    })();
    return () => { cancelled = true; };
  }, [restaurantSlug, restaurantId]);

  const openItemModal = useCallback(async (item) => {
    setSelectedItem(item);
    setItemQty(1);
    setItemNote("");
    setShowItemModal(true);
    setItemDetail(null);
    try {
      const detail = await getMenuItemById(item.id);
      setItemDetail(detail?.data ?? detail ?? item);
    } catch (_) {
      setItemDetail(item);
    }
  }, []);

  const handleAddToCartFromModal = useCallback(() => {
    const it = itemDetail ?? selectedItem;
    if (!it) return;
    addToCart(
      { id: it.id, name: it.name, price: it.price, image: it.image_url ?? it.image },
      itemQty,
      itemNote.trim() || ""
    );
    setShowItemModal(false);
    showToast("Đã thêm vào giỏ hàng", "success");
  }, [itemDetail, selectedItem, itemQty, itemNote, addToCart, showToast]);

  const filteredMenu = menu.filter((m) => {
    const matchSearch =
      !searchTerm ||
      [m.name, m.description, m.badge].some(
        (s) => s && String(s).toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchCat =
      activeCategory === "all" || String(m.category_id) === String(activeCategory);
    return matchSearch && matchCat;
  });

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      showToast("Vui lòng thêm món vào giỏ hàng", "warning");
      return;
    }
    setSubmitting(true);
    try {
      // Payload theo format API backend mới
      const payload = {
        table_number: Number(ctxTableNumber || tableNumber),
        payment_method: "cash", // Mặc định thanh toán tiền mặt
        customer_name: customerName.trim() || "",
        customer_phone: customerPhone.trim() || "",
        notes: customerNote.trim() || "",
        items: cart.map((i) => ({
          menu_item_id: Number(i.id),
          quantity: Number(i.quantity),
          notes: (i.specialRequest || "").trim() || "",
        })),
      };
      // Sử dụng API mới: tạo order theo slug
      const res = await createOrderBySlug(restaurantSlug, payload);
      const order = res?.data ?? res;
      const id = order?.id ?? order?.orderId ?? order?.order_id;
      if (id) {
        clearCart();
        setShowCart(false);
        showToast("Đặt món thành công!", "success");
      } else {
        clearCart();
        setShowCart(false);
        showToast("Đơn đã gửi. Chờ xác nhận.", "info");
      }
    } catch (err) {
      console.error("Order error:", err);
      // Hiển thị lỗi cụ thể nếu có
      const errorMsg = err?.message || "Có lỗi xảy ra khi đặt món";
      showToast(errorMsg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (notFound) return <CustomerNotFoundPage />;

  if (loading && !restaurant) {
    return (
      <div className="customer-loading">
        <Spinner animation="border" role="status" />
        <p>Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="customer-menu-page">
      <header className="customer-header">
        <Container>
          <div className="d-flex justify-content-between align-items-center py-3">
            <div>
              <h1 className="customer-title">{restaurantName || "Thực đơn"}</h1>
              <p className="customer-table mb-0">Bàn {ctxTableNumber || tableNumber}</p>
            </div>
            <Button
              variant="outline-primary"
              className="cart-trigger position-relative"
              onClick={() => setShowCart(true)}
            >
              <ShoppingCart size={24} />
              {cartCount > 0 && (
                <Badge bg="danger" pill className="cart-badge">
                  {cartCount}
                </Badge>
              )}
            </Button>
          </div>
        </Container>
      </header>

      <Container className="py-4">
        <InputGroup className="mb-4 search-box">
          <InputGroup.Text><Search size={18} /></InputGroup.Text>
          <Form.Control
            placeholder="Tìm món..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </InputGroup>

        {categories.length > 0 && (
          <Nav
            variant="pills"
            className="category-tabs mb-4 flex-nowrap overflow-auto"
            activeKey={activeCategory}
            onSelect={setActiveCategory}
          >
            <Nav.Item><Nav.Link eventKey="all">Tất cả</Nav.Link></Nav.Item>
            {categories.map((cat) => (
              <Nav.Item key={cat.id}>
                <Nav.Link eventKey={String(cat.id)}>{cat.name}</Nav.Link>
              </Nav.Item>
            ))}
          </Nav>
        )}

        <Row xs={1} sm={2} md={3} lg={4} className="g-4">
          {filteredMenu.map((item) => (
            <Col key={item.id}>
              <Card className="menu-item-card h-100" onClick={() => openItemModal(item)}>
                <div className="menu-item-image-wrap">
                  <Card.Img variant="top" src={item.image} alt={item.name} />
                  {item.badge && (
                    <Badge bg="primary" className="menu-item-badge">{item.badge}</Badge>
                  )}
                </div>
                <Card.Body className="d-flex flex-column">
                  <Card.Title className="small-title">{item.name}</Card.Title>
                  {item.description && (
                    <Card.Text className="menu-item-desc text-muted small">{item.description}</Card.Text>
                  )}
                  <div className="mt-auto d-flex justify-content-between align-items-center">
                    <span className="text-primary fw-bold">
                      {Number(item.price).toLocaleString("vi-VN")} ₫
                    </span>
                    <Button size="sm" variant="primary">Thêm vào giỏ</Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        {menu.length === 0 && !loading && (
          <p className="text-center text-muted py-5">Chưa có món trong thực đơn.</p>
        )}
      </Container>

      {cartCount > 0 && (
        <Button
          className="cart-floating-btn"
          variant="primary"
          onClick={() => setShowCart(true)}
        >
          <ShoppingCart size={22} className="me-2" />
          Xem giỏ hàng ({cartCount})
        </Button>
      )}

      <Modal show={showItemModal} onHide={() => setShowItemModal(false)} centered className="item-detail-modal">
        <Modal.Header closeButton>
          <Modal.Title>Chi tiết món</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {itemDetail && (
            <>
              <div className="item-detail-image-wrap mb-3">
                <img
                  src={itemDetail.image_url ?? itemDetail.image ?? "https://placehold.co/400x300?text=Món+ăn"}
                  alt={itemDetail.name}
                  className="img-fluid rounded"
                />
              </div>
              <h5>{itemDetail.name}</h5>
              {itemDetail.description && <p className="text-muted">{itemDetail.description}</p>}
              <p className="fw-bold text-primary mb-3">{Number(itemDetail.price || 0).toLocaleString("vi-VN")} ₫</p>
              <Form.Group className="mb-3">
                <Form.Label>Số lượng</Form.Label>
                <div className="d-flex align-items-center gap-2">
                  <Button size="sm" variant="outline-secondary" onClick={() => setItemQty((q) => Math.max(1, q - 1))}>−</Button>
                  <span className="px-3">{itemQty}</span>
                  <Button size="sm" variant="outline-secondary" onClick={() => setItemQty((q) => q + 1)}>+</Button>
                </div>
              </Form.Group>
              <Form.Group>
                <Form.Label>Ghi chú đặc biệt</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Ví dụ: Ít cay, không hành..."
                  value={itemNote}
                  onChange={(e) => setItemNote(e.target.value)}
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowItemModal(false)}>Đóng</Button>
          <Button variant="primary" onClick={handleAddToCartFromModal}>
            Thêm vào giỏ
          </Button>
        </Modal.Footer>
      </Modal>

      <Offcanvas show={showCart} onHide={() => setShowCart(false)} placement="end" className="customer-cart-offcanvas">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title><ShoppingCart className="me-2" /> Giỏ hàng ({cartCount})</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="d-flex flex-column">
          {cart.length === 0 ? (
            <p className="text-muted text-center">Chưa có món trong giỏ</p>
          ) : (
            <>
              <ListGroup className="flex-grow-1 overflow-auto mb-3">
                {cart.map((item, idx) => (
                  <ListGroup.Item key={`${item.id}-${item.specialRequest || ""}-${idx}`} className="cart-item">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <strong>{item.name}</strong>
                        {item.specialRequest && <small className="d-block text-muted">Ghi chú: {item.specialRequest}</small>}
                        <small className="d-block text-muted">{Number(item.price).toLocaleString("vi-VN")} ₫</small>
                      </div>
                      <div className="d-flex align-items-center gap-1">
                        <Button size="sm" variant="outline-secondary" onClick={() => updateCartItemQuantity(item.id, item.quantity - 1, item.specialRequest)}><Minus size={14} /></Button>
                        <span className="px-2">{item.quantity}</span>
                        <Button size="sm" variant="outline-secondary" onClick={() => updateCartItemQuantity(item.id, item.quantity + 1, item.specialRequest)}><Plus size={14} /></Button>
                        <Button size="sm" variant="outline-danger" className="ms-1" onClick={() => removeFromCart(item.id, item.specialRequest)}>Xóa</Button>
                      </div>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
              <Form className="mb-3">
                <Form.Group className="mb-2">
                  <Form.Control placeholder="Tên khách (optional)" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Control placeholder="SĐT (optional)" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Control as="textarea" rows={2} placeholder="Ghi chú chung (optional)" value={customerNote} onChange={(e) => setCustomerNote(e.target.value)} />
                </Form.Group>
              </Form>
              <div className="cart-footer mt-auto pt-3 border-top">
                <div className="d-flex justify-content-between mb-2">
                  <span>Tạm tính:</span>
                  <strong className="text-primary">{cartTotal.toLocaleString("vi-VN")} ₫</strong>
                </div>
                <Button className="w-100" variant="success" size="lg" disabled={submitting} onClick={handlePlaceOrder}>
                  {submitting ? "Đang xử lý..." : "Đặt món"}
                </Button>
              </div>
            </>
          )}
        </Offcanvas.Body>
      </Offcanvas>
    </div>
  );
}

export default function CustomerMenuPage() {
  return (
    <CustomerProvider>
      <CustomerMenuContent />
    </CustomerProvider>
  );
}
