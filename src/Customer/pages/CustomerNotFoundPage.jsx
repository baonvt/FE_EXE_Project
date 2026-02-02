import "bootstrap/dist/css/bootstrap.min.css";
import { Link } from "react-router-dom";
import { Container, Card, Button } from "react-bootstrap";
import { AlertCircle, Home } from "lucide-react";
import "./CustomerNotFoundPage.css";

export default function CustomerNotFoundPage() {
  return (
    <div className="customer-notfound-page">
      <Container className="py-5">
        <Card className="notfound-card shadow">
          <Card.Body className="text-center p-5">
            <div className="notfound-icon-wrap mb-4">
              <AlertCircle size={64} />
            </div>
            <h1 className="notfound-title">Không tìm thấy trang</h1>
            <p className="notfound-desc text-muted mb-4">
              Mã QR hoặc đường dẫn không hợp lệ. Nhà hàng có thể đã ngừng hoạt động hoặc bàn không khả dụng.
            </p>
            <Link to="/">
              <Button variant="primary" size="lg" className="rounded-pill">
                <Home className="me-2" size={20} />
                Về trang chủ
              </Button>
            </Link>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}
