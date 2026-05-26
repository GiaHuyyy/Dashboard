import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import "./App.css";
import Modal from "@/components/ui/modal";
import { appRoutes } from "@/config/app-routes";
import { SESSION_EXPIRED_EVENT } from "@/lib/api-client";
import DashboardLayout from "./layouts/DashboardLayout";
import Login from "./pages/auth/Login";
import { fetchCurrentUser, logoutUser } from "./store/auth-slice";

function RequireAuth({ children, isAuthenticated, isInitializing, isSessionExpiredModalOpen }) {
  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        Đang tải thông tin tài khoản...
      </div>
    );
  }
  if (isSessionExpiredModalOpen) {
    return children;
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

const renderAppRoutes = (routes) =>
  routes.map((route) =>
    route.index ? (
      <Route key="index" index element={route.element} />
    ) : (
      <Route key={route.path} path={route.path} element={route.element} />
    ),
  );

function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, isInitializing } = useSelector((state) => state.auth);
  const [isSessionExpiredModalOpen, setIsSessionExpiredModalOpen] = useState(false);
  const [isHandlingSessionExpired, setIsHandlingSessionExpired] = useState(false);

  useEffect(() => {
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  useEffect(() => {
    const handleSessionExpired = () => {
      setIsSessionExpiredModalOpen(true);
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, []);

  const handleCloseSessionExpiredModal = async () => {
    if (isHandlingSessionExpired) return;
    setIsHandlingSessionExpired(true);
    try {
      await dispatch(logoutUser()).unwrap();
    } catch (error) {
      void error;
    }
    setIsSessionExpiredModalOpen(false);
    setIsHandlingSessionExpired(false);
    navigate("/login", { replace: true });
  };

  return (
    <>
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
          element={
            <RequireAuth
              isAuthenticated={isAuthenticated}
              isInitializing={isInitializing}
              isSessionExpiredModalOpen={isSessionExpiredModalOpen}
            >
              <DashboardLayout />
            </RequireAuth>
          }
        >
          {renderAppRoutes(appRoutes)}
        </Route>
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>

      <Modal
        open={isSessionExpiredModalOpen}
        onClose={handleCloseSessionExpiredModal}
        title="Phiên đăng nhập đã hết hạn"
        size="sm"
        footer={
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={handleCloseSessionExpiredModal}
              disabled={isHandlingSessionExpired}
              className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-sky-300"
            >
              {isHandlingSessionExpired ? "Đang xử lý..." : "Đã hiểu"}
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">Vui lòng đăng nhập lại để tiếp tục sử dụng hệ thống.</p>
      </Modal>
    </>
  );
}

export default App;
