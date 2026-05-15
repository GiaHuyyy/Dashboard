import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import DashboardLayout from "./layouts/DashboardLayout";
import Home from "./pages/home/Home";
import Placeholder from "./pages/Placeholder";
import ListProgram from "./pages/list_program/ListProgram";
import ProgramForm from "./pages/list_program/ProgramForm";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import { fetchCurrentUser } from "./store/auth-slice";

function RequireAuth({ children, isAuthenticated, isInitializing }) {
  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        Đang tải thông tin tài khoản...
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function RedirectIfAuth({ children, isAuthenticated, isInitializing }) {
  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        Đang tải thông tin tài khoản...
      </div>
    );
  }
  return isAuthenticated ? <Navigate to="/home" replace /> : children;
}

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, isInitializing } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <RedirectIfAuth isAuthenticated={isAuthenticated} isInitializing={isInitializing}>
            <Login />
          </RedirectIfAuth>
        }
      />
      <Route
        path="/register"
        element={
          <RedirectIfAuth isAuthenticated={isAuthenticated} isInitializing={isInitializing}>
            <Register />
          </RedirectIfAuth>
        }
      />
      <Route
        element={
          <RequireAuth isAuthenticated={isAuthenticated} isInitializing={isInitializing}>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Home />} />
        <Route path="home" element={<Home />} />
        <Route path="he-thong" element={<Placeholder title="Quản lý hệ thống" />} />
        <Route path="bang-gia" element={<Placeholder title="Quản lý bảng giá" />} />
        <Route path="lap-trinh" element={<Navigate to="/lap-trinh/danh-sach" replace />} />
        <Route path="lap-trinh/danh-sach" element={<ListProgram />} />
        <Route path="lap-trinh/them-moi" element={<ProgramForm />} />
        <Route path="lap-trinh/nang-cap" element={<Placeholder title="Danh sách nâng cấp" />} />
        <Route path="lap-trinh/chinh-sua" element={<Placeholder title="Quản lý chỉnh sửa" />} />
        <Route path="lap-trinh/quan-ly-diem" element={<Placeholder title="Quản lý điểm" />} />
        <Route path="design" element={<Navigate to="/design/danh-sach" replace />} />
        <Route path="design/danh-sach" element={<Placeholder title="Danh sách design" />} />
        <Route path="design/quan-ly-diem" element={<Placeholder title="Quản lý điểm" />} />
        <Route path="kinh-doanh" element={<Placeholder title="Quản lý kinh doanh" />} />
        <Route path="cau-hinh" element={<Placeholder title="Quản lý cấu hình" />} />
        <Route path="bieu-mau" element={<Placeholder title="Biểu mẫu" />} />
      </Route>
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

export default App;
