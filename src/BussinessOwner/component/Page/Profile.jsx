import "bootstrap/dist/css/bootstrap.min.css";
import { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Modal,
} from "react-bootstrap";
import { getBusinessOwnerProfile, updateBusinessOwnerProfile } from "../../api/ProfileAPI";

export default function Profile() {
  const [editMode, setEditMode] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

const [profile, setProfile] = useState({
  name: "",
  email: "",
  phone: "",
  role: "",
  avatar: "",
  restaurant: "",
  address: "",
});


  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // ======================
  // FETCH PROFILE
  // ======================
useEffect(() => {
  const fetchProfile = async () => {
    try {
      const res = await getBusinessOwnerProfile();

      if (!res || !res.data) {
        throw new Error("Không có dữ liệu profile");
      }

      const data = res.data;

      setProfile({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        role: data.role || "",
        avatar: data.avatar || "",
        restaurant: data.restaurantName || "",
        address: data.address || "",
      });
    } catch (err) {
      console.error("Profile API lỗi:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchProfile();
}, []);



  // ======================
  // HANDLERS
  // ======================
  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
    setPasswordError("");
  };

const handleSave = async () => {
  setEditMode(false);
  try {
    // Gọi API update
    const updatedProfile = await updateBusinessOwnerProfile(profile);

    // Nếu API trả về dữ liệu, cập nhật lại state
    if (updatedProfile) {
      setProfile((prev) => ({
        ...prev,
        ...updatedProfile,
      }));
    }

    // Hiển thị thông báo thành công (có thể dùng toast hoặc alert)
    alert("✅ Cập nhật hồ sơ thành công!");
  } catch (error) {
    console.error("Update profile failed:", error);
    alert("⚠ Cập nhật hồ sơ thất bại: " + error.message);
    setEditMode(true); // quay lại editMode nếu update thất bại
  }
};

  const handleChangePassword = () => {
    setPasswordError("");
    setPasswordSuccess(false);

    if (!passwordForm.currentPassword) {
      setPasswordError("Vui lòng nhập mật khẩu hiện tại");
      return;
    }
    if (!passwordForm.newPassword) {
      setPasswordError("Vui lòng nhập mật khẩu mới");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError("Mật khẩu mới phải ít nhất 6 ký tự");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Mật khẩu xác nhận không khớp");
      return;
    }

    setPasswordSuccess(true);
    setTimeout(() => {
      setShowChangePassword(false);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordSuccess(false);
    }, 1500);
  };

  // ======================
  // LOADING
  // ======================
  if (loading) {
    return (
      <Container className="p-5 text-center">
        <h5>⏳ Đang tải thông tin hồ sơ...</h5>
      </Container>
    );
  }

  // ======================
  // UI
  // ======================
  return (
    <Container fluid className="p-4 bg-light min-vh-100">
      <h4 className="fw-bold mb-4">Hồ sơ cá nhân</h4>

      <Row className="g-4">
        <Col md={8}>
          <Card className="shadow-sm rounded-4">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between mb-3">
                <h5 className="fw-bold">Thông tin cá nhân</h5>
                {!editMode && (
                  <Button size="sm" onClick={() => setEditMode(true)}>
                    ✎ Chỉnh sửa
                  </Button>
                )}
              </div>

              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Họ và tên</Form.Label>
                  <Form.Control
                    name="name"
                    value={profile.name}
                    onChange={handleChange}
                    disabled={!editMode}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control value={profile.email} disabled />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Số điện thoại</Form.Label>
                  <Form.Control
                    name="phone"
                    value={profile.phone}
                    onChange={handleChange}
                    disabled={!editMode}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Tên nhà hàng</Form.Label>
                  <Form.Control
                    name="restaurant"
                    value={profile.name}
                    onChange={handleChange}
                    disabled={!editMode}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Địa chỉ</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="address"
                    value={profile.address}
                    onChange={handleChange}
                    disabled={!editMode}
                  />
                </Form.Group>

                {editMode && (
                  <div className="d-flex gap-2">
                    <Button onClick={handleSave}>Lưu</Button>
                    <Button
                      variant="secondary"
                      onClick={() => setEditMode(false)}
                    >
                      Hủy
                    </Button>
                  </div>
                )}
              </Form>
            </Card.Body>
          </Card>

          {/* CHANGE PASSWORD */}
          <Card className="shadow-sm rounded-4 mt-4">
            <Card.Body className="p-4">
              <h5 className="fw-bold mb-3">Bảo mật</h5>
              <Button variant="danger" onClick={() => setShowChangePassword(true)}>
                Đổi mật khẩu
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* PASSWORD MODAL */}
      <Modal show={showChangePassword} onHide={() => setShowChangePassword(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Đổi mật khẩu</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {passwordSuccess ? (
            <p className="text-success text-center fw-bold">
              ✅ Đổi mật khẩu thành công
            </p>
          ) : (
            <Form>
              {passwordError && (
                <p className="text-danger fw-bold">⚠ {passwordError}</p>
              )}

              <Form.Group className="mb-3">
                <Form.Label>Mật khẩu hiện tại</Form.Label>
                <Form.Control
                  type="password"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Mật khẩu mới</Form.Label>
                <Form.Control
                  type="password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Xác nhận mật khẩu</Form.Label>
                <Form.Control
                  type="password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowChangePassword(false)}>
            Hủy
          </Button>
          <Button onClick={handleChangePassword}>Cập nhật</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}