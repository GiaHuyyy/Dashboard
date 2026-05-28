import { Navigate } from "react-router-dom";

import Home from "@/pages/home/Home";
import SourceForm from "@/pages/system/SourceForm";
import SourceManagement from "@/pages/system/SourceManagement";
import ServerManagement from "@/pages/system/ServerManagement";
import WebsiteTemplateManagement from "@/pages/template-store/WebsiteTemplateManagement";
import WebsiteTemplateForm from "@/pages/template-store/WebsiteTemplateForm";
import HostPriceManagement from "@/pages/price/HostPriceManagement";
import HostPriceForm from "@/pages/price/HostPriceForm";
import SslPriceManagement from "@/pages/price/SslPriceManagement";
import SslPriceForm from "@/pages/price/SslPriceForm";
import DomainPriceManagement from "@/pages/price/DomainPriceManagement";
import DomainPriceForm from "@/pages/price/DomainPriceForm";
import PackagePriceManagement from "@/pages/price/PackagePriceManagement";
import PackagePriceForm from "@/pages/price/PackagePriceForm";
import AdministrationPriceManagement from "@/pages/price/AdministrationPriceManagement";
import AdministrationPriceForm from "@/pages/price/AdministrationPriceForm";
import AdvertisingPriceManagement from "@/pages/price/AdvertisingPriceManagement";
import AdvertisingPriceForm from "@/pages/price/AdvertisingPriceForm";
import ListProgram from "@/pages/program/ListProgram";
import ProgramForm from "@/pages/program/ProgramForm";
import ProgramUpgradeManagement from "@/pages/program/ProgramUpgradeManagement";
import ProgramUpgradeForm from "@/pages/program/ProgramUpgradeForm";
import ProgramEditManagement from "@/pages/program/ProgramEditManagement";
import ProgramCorrectionForm from "@/pages/program/ProgramCorrectionForm";
import ProgramPointManagement from "@/pages/program/ProgramPointManagement";
import StaffForm from "@/pages/staff/StaffForm";
import StaffManagement from "@/pages/staff/StaffManagement";
import DesignForm from "@/pages/design/DesignForm";
import DesignManagement from "@/pages/design/DesignManagement";
import DesignPointManagement from "@/pages/design/DesignPointManagement";
import BusinessManagement from "@/pages/business/BusinessManagement";
import BusinessForm from "@/pages/business/BusinessForm";
import BusinessContractProfile from "@/pages/business/BusinessContractProfile";
import SystemCategoryManagement from "@/pages/config/SystemCategoryManagement";
import MailConfigurationManagement from "@/pages/config/MailConfigurationManagement";
import SystemSettingManagement from "@/pages/config/SystemSettingManagement";
import UserManagement from "@/pages/users/UserManagement";
import UserForm from "@/pages/users/UserForm";
import RolePermissionManagement from "@/pages/permissions/RolePermissionManagement";
import EmailTemplateManagement from "@/pages/template/EmailTemplateManagement";
import EmailTemplateForm from "@/pages/template/EmailTemplateForm";

export const appRoutes = [
  { index: true, element: <Navigate to="/home" replace /> },
  { path: "home", element: <Home /> },

  { path: "he-thong", element: <Navigate to="/he-thong/source" replace /> },
  { path: "he-thong/source", element: <SourceManagement /> },
  { path: "he-thong/source/them-moi", element: <SourceForm /> },
  { path: "he-thong/source/chinh-sua/:id", element: <SourceForm /> },
  { path: "he-thong/server", element: <ServerManagement /> },

  { path: "kho-mau", element: <Navigate to="/kho-mau/website-mau" replace /> },
  { path: "kho-mau/website-mau", element: <WebsiteTemplateManagement /> },
  { path: "kho-mau/website-mau/them-moi", element: <WebsiteTemplateForm /> },
  { path: "kho-mau/website-mau/chinh-sua/:id", element: <WebsiteTemplateForm /> },

  { path: "bang-gia", element: <Navigate to="/bang-gia/host" replace /> },
  { path: "bang-gia/host", element: <HostPriceManagement /> },
  { path: "bang-gia/host/them-moi", element: <HostPriceForm /> },
  { path: "bang-gia/host/chinh-sua/:id", element: <HostPriceForm /> },
  { path: "bang-gia/ssl", element: <SslPriceManagement /> },
  { path: "bang-gia/ssl/them-moi", element: <SslPriceForm /> },
  { path: "bang-gia/ssl/chinh-sua/:id", element: <SslPriceForm /> },
  { path: "bang-gia/ten-mien", element: <DomainPriceManagement /> },
  { path: "bang-gia/ten-mien/them-moi", element: <DomainPriceForm /> },
  { path: "bang-gia/ten-mien/chinh-sua/:id", element: <DomainPriceForm /> },
  { path: "bang-gia/tron-goi", element: <PackagePriceManagement /> },
  { path: "bang-gia/tron-goi/them-moi", element: <PackagePriceForm /> },
  { path: "bang-gia/tron-goi/chinh-sua/:id", element: <PackagePriceForm /> },
  { path: "bang-gia/quan-tri", element: <AdministrationPriceManagement /> },
  { path: "bang-gia/quan-tri/them-moi", element: <AdministrationPriceForm /> },
  { path: "bang-gia/quan-tri/chinh-sua/:id", element: <AdministrationPriceForm /> },
  { path: "bang-gia/quang-cao", element: <AdvertisingPriceManagement /> },
  { path: "bang-gia/quang-cao/them-moi", element: <AdvertisingPriceForm /> },
  { path: "bang-gia/quang-cao/chinh-sua/:id", element: <AdvertisingPriceForm /> },

  { path: "lap-trinh", element: <Navigate to="/lap-trinh/danh-sach" replace /> },
  { path: "lap-trinh/danh-sach", element: <ListProgram /> },
  { path: "lap-trinh/them-moi", element: <ProgramForm /> },
  { path: "lap-trinh/chinh-sua/:id", element: <ProgramForm /> },
  { path: "lap-trinh/nang-cap", element: <ProgramUpgradeManagement /> },
  { path: "lap-trinh/nang-cap/them-moi", element: <ProgramUpgradeForm /> },
  { path: "lap-trinh/nang-cap/chinh-sua/:id", element: <ProgramUpgradeForm /> },
  { path: "lap-trinh/chinh-sua", element: <ProgramEditManagement /> },
  { path: "lap-trinh/quan-ly-chinh-sua/them-moi", element: <ProgramCorrectionForm /> },
  { path: "lap-trinh/quan-ly-chinh-sua/chinh-sua/:id", element: <ProgramCorrectionForm /> },
  { path: "lap-trinh/quan-ly-diem", element: <ProgramPointManagement /> },

  { path: "nhan-su", element: <Navigate to="/nhan-su/danh-sach" replace /> },
  { path: "nhan-su/danh-sach", element: <StaffManagement /> },
  { path: "nhan-su/them-moi", element: <StaffForm /> },
  { path: "nhan-su/chinh-sua/:id", element: <StaffForm /> },

  { path: "design", element: <Navigate to="/design/danh-sach" replace /> },
  { path: "design/danh-sach", element: <DesignManagement /> },
  { path: "design/them-moi", element: <DesignForm /> },
  { path: "design/chinh-sua/:id", element: <DesignForm /> },
  { path: "design/quan-ly-diem", element: <DesignPointManagement /> },

  { path: "kinh-doanh", element: <Navigate to="/kinh-doanh/danh-sach" replace /> },
  { path: "kinh-doanh/danh-sach", element: <BusinessManagement /> },
  { path: "kinh-doanh/them-moi", element: <BusinessForm /> },
  { path: "kinh-doanh/chinh-sua/:id", element: <BusinessForm /> },
  { path: "kinh-doanh/hop-dong/:id/ho-so", element: <BusinessContractProfile /> },

  { path: "cau-hinh", element: <Navigate to="/cau-hinh/danh-muc-he-thong" replace /> },
  { path: "cau-hinh/danh-muc-he-thong", element: <SystemCategoryManagement /> },
  { path: "cau-hinh/mail", element: <MailConfigurationManagement /> },
  { path: "cau-hinh/tham-so", element: <SystemSettingManagement /> },

  { path: "phan-quyen", element: <Navigate to="/phan-quyen/tai-khoan" replace /> },
  { path: "phan-quyen/tai-khoan", element: <UserManagement /> },
  { path: "phan-quyen/tai-khoan/them-moi", element: <UserForm /> },
  { path: "phan-quyen/tai-khoan/chinh-sua/:id", element: <UserForm /> },
  { path: "phan-quyen/vai-tro", element: <RolePermissionManagement /> },

  { path: "bieu-mau", element: <Navigate to="/bieu-mau/mau-email" replace /> },
  { path: "bieu-mau/mau-email", element: <EmailTemplateManagement /> },
  { path: "bieu-mau/mau-email/them-moi", element: <EmailTemplateForm /> },
  { path: "bieu-mau/mau-email/chinh-sua/:id", element: <EmailTemplateForm /> },
];