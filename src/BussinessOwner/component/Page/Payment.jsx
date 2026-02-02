import "bootstrap/dist/css/bootstrap.min.css";
import { useState } from "react";
import { Container, Row, Col, Card, Button, ListGroup, Form, Badge, Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";

export default function Payment() {
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [showQRModal, setShowQRModal] = useState(false);

  const order = {
    tableName: "Bàn 1",
    items: [
      { id: 1, name: "Mì cay hải sản", qty: 2, price: 45000 },
      { id: 2, name: "Trà đào", qty: 1, price: 30000 },
    ],
  };

  const subTotal = order.items.reduce(
    (sum, item) => sum + item.qty * item.price,
    0
  );
  const vat = subTotal * 0.1;
  const total = subTotal + vat;

  const handlePay = () => {
    alert("Thanh toán thành công!");
    navigate("/orders");
  };

  return (
    <Container fluid className="p-4 bg-light min-vh-100">
      <Row className="mb-4">
        <Col>
          <h4 className="fw-bold">Thanh toán</h4>
          <p className="text-muted mb-0">{order.tableName}</p>
        </Col>
      </Row>

      <Row>
        {/* LEFT */}
        <Col md={7}>
          <Card className="shadow-sm mb-4">
            <Card.Body>
              <h6 className="mb-3">Danh sách món</h6>
              <ListGroup variant="flush">
                {order.items.map((item) => (
                  <ListGroup.Item key={item.id}>
                    <div className="d-flex justify-content-between">
                      <div>
                        {item.name} <Badge bg="secondary">x{item.qty}</Badge>
                      </div>
                      <div className="fw-semibold">
                        {(item.qty * item.price).toLocaleString()} đ
                      </div>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>

        {/* RIGHT */}
        <Col md={5}>
          <Card className="shadow-sm">
            <Card.Body>
              <h6 className="mb-3">Thông tin thanh toán</h6>

              <div className="d-flex justify-content-between mb-2">
                <span>Tạm tính</span>
                <span>{subTotal.toLocaleString()} đ</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>VAT (10%)</span>
                <span>{vat.toLocaleString()} đ</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between mb-3 fs-5">
                <strong>Tổng cộng</strong>
                <strong className="text-success">
                  {total.toLocaleString()} đ
                </strong>
              </div>

              <Form className="mb-3">
                <Form.Label>Phương thức thanh toán</Form.Label>
                <Form.Check
                  type="radio"
                  label="Tiền mặt"
                  name="payment"
                  checked={paymentMethod === "cash"}
                  onChange={() => setPaymentMethod("cash")}
                />
                <Form.Check
                  type="radio"
                  label="Chuyển khoản / QR"
                  name="payment"
                  checked={paymentMethod === "qr"}
                  onChange={() => setPaymentMethod("qr")}
                />
              </Form>

              {paymentMethod === "qr" && (
                <Button 
                  variant="outline-primary" 
                  className="w-100 mb-2"
                  onClick={() => setShowQRModal(true)}
                >
                  Hiển thị QR chuyển khoản
                </Button>
              )}

              <Button variant="success" className="w-100 mb-2" onClick={handlePay}>
                Xác nhận thanh toán
              </Button>
              <Button
                variant="outline-secondary"
                className="w-100"
                onClick={() => navigate(-1)}
              >
                Quay lại
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* QR TRANSFER MODAL */}
      <Modal show={showQRModal} onHide={() => setShowQRModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Mã QR Chuyển Khoản</Modal.Title>
        </Modal.Header>

        <Modal.Body className="text-center">
          <div className="mb-3">
            <QRCodeCanvas
              value={`TRANSFER|BANK_VIETCOMBANK|1234567890|Nha_hang_ABC|${total.toFixed(0)}`}
              size={250}
            />
          </div>
          <div className="p-3 bg-light rounded">
            <p className="mb-2"><strong>Thông tin chuyển khoản:</strong></p>
            <p className="mb-1">Ngân hàng: Vietcombank</p>
            <p className="mb-1">Số tài khoản: 1234567890</p>
            <p className="mb-1">Chủ tài khoản: Nhà hàng ABC</p>
            <p className="mb-1 text-success"><strong>Số tiền: {total.toLocaleString()} đ</strong></p>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowQRModal(false)}
          >
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
