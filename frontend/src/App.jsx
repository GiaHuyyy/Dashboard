
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import "./App.css";
import Modal from "@/components/ui/modal";
import { SESSION_EXPIRED_EVENT } from "@/lib/api-client";
import DashboardLayout from "./layouts/DashboardLayout";
import Home from "./pages/home/Home";
// import Placeholder from "./pages/Placeholder";
import ProgramCorrectionForm from "./pages/program/ProgramCorrectionForm";
import ListProgram from "./pages/program/ListProgram";
import ProgramEditManagement from "./pages/program/ProgramEditManagement";
import ProgramForm from "./pages/program/ProgramForm";
import ProgramPointManagement from "./pages/program/ProgramPointManagement";
import ProgramUpgradeForm from "./pages/program/ProgramUpgradeForm";
import ProgramUpgradeManagement from "./pages/program/ProgramUpgradeManagement";
import DesignForm from "./pages/design/DesignForm";
import DesignManagement from "./pages/design/DesignManagement";
import DesignPointManagement from "./pages/design/DesignPointManagement";
import HostPriceManagement from "./pages/price/HostPriceManagement";
import HostPriceForm from "./pages/price/HostPriceForm";
import SslPriceManagement from "./pages/price/SslPriceManagement";
import SslPriceForm from "./pages/price/SslPriceForm";
import DomainPriceManagement from "./pages/price/DomainPriceManagement";
import DomainPriceForm from "./pages/price/DomainPriceForm";
import PackagePriceManagement from "./pages/price/PackagePriceManagement";
import PackagePriceForm from "./pages/price/PackagePriceForm";
import AdministrationPriceManagement from "./pages/price/AdministrationPriceManagement";
import AdministrationPriceForm from "./pages/price/AdministrationPriceForm";
import AdvertisingPriceManagement from "./pages/price/AdvertisingPriceManagement";
import AdvertisingPriceForm from "./pages/price/AdvertisingPriceForm";
import StaffForm from "./pages/staff/StaffForm";
import StaffManagement from "./pages/staff/StaffManagement";
import SourceForm from "./pages/system/SourceForm";
import SourceManagement from "./pages/system/SourceManagement";
import ServerManagement from "./pages/system/ServerManagement";
import SystemCategoryManagement from "./pages/config/SystemCategoryManagement";
import MailConfigurationManagement from "./pages/config/MailConfigurationManagement";
import SystemSettingManagement from "./pages/config/SystemSettingManagement";
import EmailTemplateManagement from "./pages/template/EmailTemplateManagement";
import EmailTemplateForm from "./pages/template/EmailTemplateForm";
import BusinessManagement from "./pages/business/BusinessManagement";
import BusinessForm from "./pages/business/BusinessForm";
import Login from "./pages/auth/Login";
import UserManagement from "./pages/users/UserManagement";
import UserForm from "./pages/users/UserForm";
import RolePermissionManagement from "./pages/permissions/RolePermissionManagement";
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
          <Route index element={<Navigate to="/home" replace />} />
          <Route path="home" element={<Home />} />
          <Route path="he-thong" element={<Navigate to="/he-thong/source" replace />} />
          <Route path="he-thong/source" element={<SourceManagement />} />
          <Route path="he-thong/source/them-moi" element={<SourceForm />} />
          <Route path="he-thong/source/chinh-sua/:id" element={<SourceForm />} />
          <Route path="he-thong/server" element={<ServerManagement />} />
          <Route path="bang-gia" element={<Navigate to="/bang-gia/host" replace />} />
          <Route path="bang-gia/host" element={<HostPriceManagement />} />
          <Route path="bang-gia/host/them-moi" element={<HostPriceForm />} />
          <Route path="bang-gia/host/chinh-sua/:id" element={<HostPriceForm />} />
          <Route path="bang-gia/ssl" element={<SslPriceManagement />} />
          <Route path="bang-gia/ssl/them-moi" element={<SslPriceForm />} />
          <Route path="bang-gia/ssl/chinh-sua/:id" element={<SslPriceForm />} />
          <Route path="bang-gia/ten-mien" element={<DomainPriceManagement />} />
          <Route path="bang-gia/ten-mien/them-moi" element={<DomainPriceForm />} />
          <Route path="bang-gia/ten-mien/chinh-sua/:id" element={<DomainPriceForm />} />
          <Route path="bang-gia/tron-goi" element={<PackagePriceManagement />} />
          <Route path="bang-gia/tron-goi/them-moi" element={<PackagePriceForm />} />
          <Route path="bang-gia/tron-goi/chinh-sua/:id" element={<PackagePriceForm />} />
          <Route path="bang-gia/quan-tri" element={<AdministrationPriceManagement />} />
          <Route path="bang-gia/quan-tri/them-moi" element={<AdministrationPriceForm />} />
          <Route path="bang-gia/quan-tri/chinh-sua/:id" element={<AdministrationPriceForm />} />
          <Route path="bang-gia/quang-cao" element={<AdvertisingPriceManagement />} />
          <Route path="bang-gia/quang-cao/them-moi" element={<AdvertisingPriceForm />} />
          <Route path="bang-gia/quang-cao/chinh-sua/:id" element={<AdvertisingPriceForm />} />
          <Route path="lap-trinh" element={<Navigate to="/lap-trinh/danh-sach" replace />} />
          <Route path="lap-trinh/danh-sach" element={<ListProgram />} />
          <Route path="lap-trinh/them-moi" element={<ProgramForm />} />
          <Route path="lap-trinh/chinh-sua/:id" element={<ProgramForm />} />
          <Route path="lap-trinh/nang-cap" element={<ProgramUpgradeManagement />} />
          <Route path="lap-trinh/nang-cap/them-moi" element={<ProgramUpgradeForm />} />
          <Route path="lap-trinh/nang-cap/chinh-sua/:id" element={<ProgramUpgradeForm />} />
          <Route path="lap-trinh/chinh-sua" element={<ProgramEditManagement />} />
          <Route path="lap-trinh/quan-ly-chinh-sua/them-moi" element={<ProgramCorrectionForm />} />
          <Route path="lap-trinh/quan-ly-chinh-sua/chinh-sua/:id" element={<ProgramCorrectionForm />} />
          <Route path="lap-trinh/quan-ly-diem" element={<ProgramPointManagement />} />
          <Route path="nhan-su" element={<Navigate to="/nhan-su/danh-sach" replace />} />
          <Route path="nhan-su/danh-sach" element={<StaffManagement />} />
          <Route path="nhan-su/them-moi" element={<StaffForm />} />
          <Route path="nhan-su/chinh-sua/:id" element={<StaffForm />} />
          <Route path="design" element={<Navigate to="/design/danh-sach" replace />} />
          <Route path="design/danh-sach" element={<DesignManagement />} />
          <Route path="design/them-moi" element={<DesignForm />} />
          <Route path="design/chinh-sua/:id" element={<DesignForm />} />
          <Route path="design/quan-ly-diem" element={<DesignPointManagement />} />
          <Route path="kinh-doanh" element={<Navigate to="/kinh-doanh/danh-sach" replace />} />
          <Route path="kinh-doanh/danh-sach" element={<BusinessManagement />} />
          <Route path="kinh-doanh/them-moi" element={<BusinessForm />} />
          <Route path="kinh-doanh/chinh-sua/:id" element={<BusinessForm />} />
          <Route path="cau-hinh" element={<Navigate to="/cau-hinh/danh-muc-he-thong" replace />} />
          <Route path="cau-hinh/danh-muc-he-thong" element={<SystemCategoryManagement />} />
          <Route path="cau-hinh/mail" element={<MailConfigurationManagement />} />
          <Route path="cau-hinh/tham-so" element={<SystemSettingManagement />} />
          <Route path="phan-quyen" element={<Navigate to="/phan-quyen/tai-khoan" replace />} />
          <Route path="phan-quyen/tai-khoan" element={<UserManagement />} />
          <Route path="phan-quyen/tai-khoan/them-moi" element={<UserForm />} />
          <Route path="phan-quyen/tai-khoan/chinh-sua/:id" element={<UserForm />} />
          <Route path="phan-quyen/vai-tro" element={<RolePermissionManagement />} />
          <Route path="bieu-mau" element={<Navigate to="/bieu-mau/mau-email" replace />} />
          <Route path="bieu-mau/mau-email" element={<EmailTemplateManagement />} />
          <Route path="bieu-mau/mau-email/them-moi" element={<EmailTemplateForm />} />
          <Route path="bieu-mau/mau-email/chinh-sua/:id" element={<EmailTemplateForm />} />
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
