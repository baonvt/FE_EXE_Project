import "bootstrap/dist/css/bootstrap.min.css";
import { Link } from "react-router-dom";
import { Container, Card, Button } from "react-bootstrap";
import { QrCode, UtensilsCrossed } from "lucide-react";
import "./CustomerEntryPage.css";

export default function CustomerEntryPage() {
  return (
    <div className="customer-entry-page">
      <Container className="py-5">
        <Card className="entry-card shadow">
          <Card.Body className="text-center p-5">
            <div className="entry-icon-wrap mb-4">
              <QrCode size={64} />
            </div>
            <h1 className="entry-title">Quét mã QR tại bàn</h1>
            <p className="entry-desc text-muted mb-4">
              Ngồi vào bàn, mở camera hoặc app quét mã QR trên bàn để xem thực đơn,
              thêm món vào giỏ và đặt món.
            </p>
            <p className="text-muted small mb-4">
              Đường dẫn: <code>/{`{restaurant-slug}`}/menu/{`{số-bàn}`}</code>
            </p>
            <hr className="my-4" />
            <p className="small text-muted mb-2">Thử nhanh (không cần quét):</p>
            <Link to="/demo/menu/1">
              <Button variant="primary" size="lg" className="rounded-pill">
                <UtensilsCrossed className="me-2" size={20} />
                Vào thực đơn mẫu — Bàn 1
              </Button>
            </Link>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}
