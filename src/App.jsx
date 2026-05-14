import { Route, Routes } from "react-router-dom";
import "./App.css";
import DashboardLayout from "./layouts/DashboardLayout";
import Home from "./pages/Home";
import Placeholder from "./pages/Placeholder";

function App() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route index element={<Home />} />
        <Route path="home" element={<Home />} />
        <Route path="he-thong" element={<Placeholder title="Quản lý hệ thống" />} />
        <Route path="bang-gia" element={<Placeholder title="Quản lý bảng giá" />} />
        <Route path="lap-trinh" element={<Placeholder title="Quản lý lập trình" />} />
        <Route path="lap-trinh/danh-sach" element={<Placeholder title="Danh sách lập trình" />} />
        <Route path="lap-trinh/nang-cap" element={<Placeholder title="Danh sách nâng cấp" />} />
        <Route path="lap-trinh/chinh-sua" element={<Placeholder title="Quản lý chỉnh sửa" />} />
        <Route path="lap-trinh/quan-ly-diem" element={<Placeholder title="Quản lý điểm" />} />
        <Route path="design" element={<Placeholder title="Quản lý thiết kế" />} />
        <Route path="design/danh-sach" element={<Placeholder title="Danh sách design" />} />
        <Route path="design/quan-ly-diem" element={<Placeholder title="Quản lý điểm" />} />
        <Route path="kinh-doanh" element={<Placeholder title="Quản lý kinh doanh" />} />
        <Route path="cau-hinh" element={<Placeholder title="Quản lý cấu hình" />} />
        <Route path="bieu-mau" element={<Placeholder title="Biểu mẫu" />} />
      </Route>
    </Routes>
  );
}

export default App;
