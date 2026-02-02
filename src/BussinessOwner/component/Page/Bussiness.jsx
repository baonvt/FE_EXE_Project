import Header from "../Header";
import Sidebar from "../Sidebar";
import Dashboard from "./DashBoard";
import MenuManagement from "./MenuManagement";
import OrderDetail from "./OrderDetail";
import OrderManagement from "./OrderManagement";
import { Routes, Route } from "react-router-dom";
import Profile from "./Profile";
import Payment from "./Payment";

export default function Bussiness(){
    return(
 <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1">
        <Header />
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="orders" element={<OrderManagement />} />
            <Route path="orders/table/:id" element={<OrderDetail/>} />
             <Route path="menu" element={<MenuManagement/>} />
             <Route path="profile" element={<Profile/>} />
             <Route path="payment" element={<Payment/>} />
          </Routes>
      </div>

    </div>
    )
}