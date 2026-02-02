import "bootstrap/dist/css/bootstrap.min.css";
import { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Modal,
  Form,
  Badge,
  InputGroup,
  Nav,
  Dropdown,
} from "react-bootstrap";
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  ImageIcon,
  UtensilsCrossed,
  Coffee,
  MoreHorizontal,
  FolderPlus,
  Flame,
  Sparkles,
  MoreVertical, // Icon cho nút 3 chấm
} from "lucide-react";
import {
  createCategory,
  createMenuItem,
  deleteCategory,
  deleteMenuItem,
  getCategoriesAll,
  getMenuAll,
  updateCategory,
  updateMenuItem,
  uploadMenuImage,
  // Giả định bạn có thêm các API này trong file MenuManagementAPI
  // updateCategory,
  // deleteCategory,
} from "../../api/MenuManagementAPI";

export default function MenuManagement() {
  // --- STATE ---
  const [menus, setMenus] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // States cho Modals
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // States cho Edit
  const [editingId, setEditingId] = useState(null);
  const [editingCategoryId, setEditingCategoryId] = useState(null);

  // States cho Form Category
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [newCategoryImage, setNewCategoryImage] = useState("");
  const [newCategorySortOrder, setNewCategorySortOrder] = useState("");

  // States cho Form Menu
  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "",
    image: null,
    preview: null,
    tags: "",
  });

  // --- FETCH DATA ---
  const fetchCategories = async () => {
    try {
      const res = await getCategoriesAll();
      const list = res.data || res;
      if (Array.isArray(list)) {
        const mapped = list.map((c) => ({
          value: c.id.toString(),
          label: c.name,
          description: c.description || "",
          image: c.image || "",
          sort_order: c.sort_order || 0,
          icon: <MoreHorizontal size={16} />,
        }));
        setCategories(mapped);
        if (mapped.length > 0 && !form.category) {
          setForm((prev) => ({ ...prev, category: mapped[0].value }));
        }
      }
    } catch (error) {
      console.error("Lỗi tải danh mục:", error);
    }
  };

  const fetchMenus = async () => {
    try {
      const res = await getMenuAll();
      const list = res.data || res;
      if (Array.isArray(list)) {
        setMenus(list.map(m => ({
          id: m.id,
          name: m.name,
          price: m.price,
          category: m.category_id?.toString(),
          image: m.image_url || "https://placehold.co/300x200?text=No+Image",
          tags: m.tags || "",
        })));
      }
    } catch (error) {
      console.error("Lỗi tải thực đơn:", error);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchMenus();
  }, []);

  // --- HANDLERS CATEGORY ---
  const handleOpenCategoryModal = (cat = null) => {
    if (cat) {
      setEditingCategoryId(cat.value);
      setNewCategoryName(cat.label);
      setNewCategoryDescription(cat.description);
      setNewCategoryImage(cat.image);
      setNewCategorySortOrder(cat.sort_order);
    } else {
      setEditingCategoryId(null);
      setNewCategoryName("");
      setNewCategoryDescription("");
      setNewCategoryImage("");
      setNewCategorySortOrder("");
    }
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async () => {
if (!newCategoryName.trim()) {
    alert("Vui lòng nhập tên danh mục");
    return;
  }

  const payload = {
    name: newCategoryName.trim(),
    description: null,
    image: null,
    sort_order: null,
    status: "active",
  };

  try {
    if (editingCategoryId) {
      // 🔥 UPDATE CATEGORY
      await updateCategory(editingCategoryId, payload);
      alert("Cập nhật tên danh mục thành công ✅");
    } else {
      // CREATE vẫn dùng payload đầy đủ
      await createCategory({
        name: newCategoryName.trim(),
        description: newCategoryDescription,
        image: newCategoryImage,
        sort_order: Number(newCategorySortOrder) || 0,
      });
      alert("Thêm danh mục mới thành công 🎉");
    }

    setShowCategoryModal(false);
    fetchCategories();
  } catch (error) {
    console.error(error);
    alert("Thao tác thất bại ❌");
  }
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm("Xóa danh mục này?")) {
      try {
        await deleteCategory(id);
        alert("Xóa danh mục thành công!");
        fetchCategories();
      } catch (error) {
        alert("Xóa thất bại!");
      }
  };
}

  // --- HANDLERS MENU ---
  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm({ name: "", price: "", category: categories[0]?.value || "", image: null, preview: null, tags: "" });
  };

  const handleEditMenu = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      price: item.price,
      category: item.category,
      image: null,
      preview: item.image,
      tags: item.tags || "",
    });
    setShowModal(true);
  };

  const handleDeleteMenu = async (id) => {
    if (window.confirm("Xóa món này?")) {
      try {
        await deleteMenuItem(id);
        setMenus(prev => prev.filter(m => m.id !== id));
      } catch (error) {
        alert("Xóa thất bại!");
      }
    }
  };

const handleSubmitMenu = async () => {
  if (!form.name || !form.price) {
    alert("Vui lòng nhập đủ!");
    return;
  }

  try {
    let imageUrl = "";

    if (form.image) {
      const uploadRes = await uploadMenuImage(form.image);

      imageUrl =
        uploadRes?.data?.url ||
        uploadRes?.url ||
        uploadRes?.image_url ||
        "";

      if (!imageUrl) throw new Error("Upload ảnh thất bại");
    }

    const payload = {
      name: form.name.trim(),
      price: Number(form.price),
      category_id: Number(form.category),
      tags: form.tags,
      image: imageUrl,
    };

    if (editingId) {
      await updateMenuItem(editingId, payload);
    } else {
      await createMenuItem(payload);
    }

    fetchMenus();
    closeModal();
  } catch (e) {
    console.error(e);
    alert("Thao tác thất bại ❌");
  }
};

  const handleImageChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Optional: validate ảnh
  if (!file.type.startsWith("image/")) {
    alert("Vui lòng chọn file ảnh");
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    alert("Ảnh không được vượt quá 2MB");
    return;
  }

  setForm((prev) => ({
    ...prev,
    image: file,
    preview: URL.createObjectURL(file),
  }));
};

  const formatCurrency = (v) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v);

  const filteredMenus = menus.filter(m => (filter === "all" || m.category === filter) && m.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Visual effects logic cho Modal
  const getTagVisuals = () => {
    if (form.tags === "best_seller") return { borderColor: "#f59e0b", shadow: "0 0 25px rgba(245, 158, 11, 0.4)", bgSoft: "#fffbeb", text: "#b45309", icon: <Flame size={20} className="text-warning fill-warning" />, label: "BEST SELLER", badgeColor: "warning" };
    if (form.tags === "new") return { borderColor: "#3b82f6", shadow: "0 0 25px rgba(59, 130, 246, 0.4)", bgSoft: "#eff6ff", text: "#1d4ed8", icon: <Sparkles size={20} className="text-primary fill-primary" />, label: "NEW ARRIVAL", badgeColor: "primary" };
    return { borderColor: "transparent", shadow: "0 0.5rem 1rem rgba(0, 0, 0, 0.15)", bgSoft: "#f8f9fa", text: "#6c757d", icon: <ImageIcon size={40} />, label: "", badgeColor: "light" };
  };
  const activeVisuals = getTagVisuals();

  return (
    <Container fluid className="p-4" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold">Quản lý Thực đơn</h3>
          <p className="text-muted small">Quản lý danh mục và món ăn</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="white" className="border shadow-sm d-flex align-items-center gap-2" onClick={() => handleOpenCategoryModal()}>
            <FolderPlus size={18} /> Thêm danh mục
          </Button>
          <Button style={{ background: "#4f46e5", border: "none" }} className="shadow-sm d-flex align-items-center gap-2" onClick={() => setShowModal(true)}>
            <Plus size={20} /> Thêm món mới
          </Button>
        </div>
      </div>

      {/* FILTERS & SEARCH */}
      <Card className="border-0 shadow-sm rounded-4 mb-4">
  <Card.Body className="p-2">
    <Row className="g-2 align-items-center">
      {/* Search */}
      <Col md={4}>
        <InputGroup>
          <InputGroup.Text className="bg-light border-0">
            <Search size={18} className="text-muted" />
          </InputGroup.Text>
          <Form.Control
            placeholder="Tìm tên món ăn..."
            className="bg-light border-0 shadow-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </InputGroup>
      </Col>

      {/* Category Pills - FIX LỖI BỊ CHE KHUẤT */}
      <Col md={8}>
        <Nav
          className="justify-content-md-end gap-2 flex-nowrap overflow-visible pb-1 pb-md-0"
          style={{ 
            scrollbarWidth: "none",
            WebkitOverflowScrolling: "touch"
          }}
        >
          <Button
            variant={filter === "all" ? "dark" : "light"}
            onClick={() => setFilter("all")}
            className="rounded-pill px-3 fw-medium text-nowrap border-0"
          >
            Tất cả
          </Button>

          {categories.map((c) => (
            <div 
              key={c.value} 
              className={`d-flex align-items-center rounded-pill px-1 border transition-all ${
                filter === c.value ? "bg-primary-subtle border-primary" : "bg-light"
              }`}
            >
              {/* Nút lọc */}
              <Button
                variant="link"
                onClick={() => setFilter(c.value)}
                className={`text-decoration-none px-2 py-1 small fw-bold text-nowrap border-0 d-flex align-items-center gap-1 ${
                  filter === c.value ? "text-primary" : "text-secondary"
                }`}
              >
                {c.label}
              </Button>

              {/* Dropdown chỉnh sửa - Dùng strategy="fixed" để không bị che */}
              <Dropdown align="end">
                <Dropdown.Toggle
                  as="div"
                  className="p-1 cursor-pointer text-muted d-flex align-items-center"
                  style={{ cursor: 'pointer' }}
                >
                  <MoreVertical size={14} />
                </Dropdown.Toggle>

                <Dropdown.Menu 
                  flip={true}
                  strategy="fixed" // QUAN TRỌNG: Giúp menu hiển thị đè lên trên mọi thứ
                  className="border-0 shadow-lg rounded-3 p-1"
                  style={{ zIndex: 9999 }}
                >
                  <Dropdown.Item 
                    onClick={() => handleOpenCategoryModal(c)}
                    className="rounded-2 py-2 d-flex align-items-center"
                  >
                    <Edit3 size={14} className="me-2 text-info" /> 
                    <span className="small">Sửa danh mục</span>
                  </Dropdown.Item>
                  
                  <Dropdown.Divider className="my-1" />
                  
                  <Dropdown.Item 
                    onClick={() => handleDeleteCategory(c.value)}
                    className="rounded-2 py-2 d-flex align-items-center text-danger"
                  >
                    <Trash2 size={14} className="me-2" /> 
                    <span className="small">Xóa danh mục</span>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          ))}
        </Nav>
      </Col>
    </Row>
  </Card.Body>
</Card>

      {/* GRID MENU */}
      <Row xs={1} sm={2} md={3} lg={4} xl={5} className="g-4">
        {filteredMenus.map((item) => (
          <Col key={item.id}>
            <Card className="h-100 border-0 shadow-sm rounded-4 overflow-hidden position-relative">
              <div className="position-relative" style={{ paddingTop: "75%" }}>
                <Card.Img variant="top" src={item.image} className="position-absolute top-0 start-0 w-100 h-100 object-fit-cover" />
                {item.tags && <Badge bg={item.tags === "new" ? "primary" : "warning"} className="position-absolute bottom-0 start-0 m-2">{item.tags.toUpperCase()}</Badge>}
              </div>
              <Card.Body>
                <h6 className="fw-bold mb-1 text-truncate">{item.name}</h6>
                <h5 className="text-primary fw-bold">{formatCurrency(item.price)}</h5>
                <div className="d-flex gap-2 mt-3 border-top pt-2">
                  <Button variant="light" size="sm" className="flex-fill" onClick={() => handleEditMenu(item)}><Edit3 size={14} /> Sửa</Button>
                  <Button variant="light" size="sm" className="flex-fill text-danger bg-danger-subtle" onClick={() => handleDeleteMenu(item.id)}><Trash2 size={14} /> Xóa</Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* MODAL MENU */}
      <Modal show={showModal} onHide={closeModal} centered contentClassName="border-0 rounded-4" style={{ "--bs-modal-box-shadow": activeVisuals.shadow }}>
        <div style={{ border: `2px solid ${activeVisuals.borderColor}`, borderRadius: "1rem", overflow: "hidden" }}>
          <Modal.Header closeButton className="border-0"><Modal.Title className="fw-bold">{editingId ? "Cập nhật món" : "Thêm món mới"}</Modal.Title></Modal.Header>
          <Modal.Body>
            <Form>
              <div className="rounded-4 border-2 border-dashed mb-3 text-center p-4" style={{ backgroundColor: activeVisuals.bgSoft, cursor: "pointer" }} onClick={() => document.getElementById("imgUp").click()}>
                {form.preview ? <img src={form.preview} className="w-100 rounded" alt="preview" /> : <div>{activeVisuals.icon}<p>Chọn ảnh món ăn</p></div>}
                <input id="imgUp" type="file" className="d-none" onChange={handleImageChange} />
              </div>
              <Form.Group className="mb-2"><Form.Label className="small fw-bold">Tên món</Form.Label><Form.Control value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></Form.Group>
              <Row>
                <Col><Form.Group className="mb-2"><Form.Label className="small fw-bold">Danh mục</Form.Label><Form.Select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>{categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</Form.Select></Form.Group></Col>
                <Col><Form.Group className="mb-2"><Form.Label className="small fw-bold">Giá bán</Form.Label><Form.Control type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} /></Form.Group></Col>
              </Row>
              <Form.Group><Form.Label className="small fw-bold">Tag đặc biệt</Form.Label><Form.Select value={form.tags} onChange={e => setForm({...form, tags: e.target.value})}><option value="">Không có</option><option value="new">Món mới</option><option value="best_seller">Bán chạy</option></Form.Select></Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="light" onClick={closeModal}>Đóng</Button>
            <Button style={{ background: form.tags ? activeVisuals.borderColor : "#4f46e5", border: "none" }} onClick={handleSubmitMenu}>{editingId ? "Lưu" : "Tạo món"}</Button>
          </Modal.Footer>
        </div>
      </Modal>

      {/* MODAL CATEGORY */}
      <Modal show={showCategoryModal} onHide={() => setShowCategoryModal(false)} centered size="sm" contentClassName="border-0 rounded-4">
        <Modal.Header closeButton><Modal.Title className="fw-bold">{editingCategoryId ? "Sửa danh mục" : "Danh mục mới"}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-2"><Form.Label className="small fw-bold">Tên danh mục</Form.Label><Form.Control value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} /></Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-0"><Button className="w-100 rounded-pill" style={{ background: "#4f46e5", border: "none" }} onClick={handleSaveCategory}>{editingCategoryId ? "Cập nhật" : "Thêm ngay"}</Button></Modal.Footer>
      </Modal>
    </Container>
  );
}