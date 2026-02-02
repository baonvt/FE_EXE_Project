import React from "react";
import { Nav } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import "../css/Sidebar.css";
import {
  LayoutDashboard,
  UtensilsCrossed,
  ClipboardList,
  LogOut
} from "lucide-react";

export default function Sidebar() {
  return (
    <div className="sidebar d-flex flex-column justify-content-between">
      <div>
        {/* Header */}
        <div className="sidebar-header">
          <div className="logo-container">
            <img
              src="src/assets/img/image3.png"
              alt="Foodie"
              onError={(e) => (e.target.style.display = "none")}
            />
            <UtensilsCrossed size={24} className="fallback-logo text-primary" />
          </div>
          <span className="brand-name">Foodie POS</span>
        </div>

        {/* Menu */}
        <Nav className="flex-column gap-2 mt-3">
          <NavLink
            to="/bussiness"
            end
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            <LayoutDashboard size={20} />
            <span>Tổng quan</span>
          </NavLink>

          <NavLink
            to="/bussiness/orders"
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            <UtensilsCrossed size={20} />
            <span>Bàn & Đơn</span>
          </NavLink>

          <NavLink
            to="/bussiness/menu"
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            <ClipboardList size={20} />
            <span>Thực đơn</span>
          </NavLink>
        </Nav>
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="nav-item text-danger mt-1" style={{ cursor: "pointer" }}>
          <LogOut size={20} />
          <span>Đăng xuất</span>
        </div>
      </div>
    </div>
  );
}
