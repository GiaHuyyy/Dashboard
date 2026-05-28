import { FileText } from "lucide-react";

import { PERMISSIONS } from "@/constants/permissions";

export const navItems = [
  {
    label: "Trang chủ",
    path: "/home",
    icon: FileText,
    permission: null,
  },
  {
    label: "Quản lý hệ thống",
    path: "/he-thong",
    icon: FileText,
    children: [
      {
        label: "Quản lý source",
        path: "/he-thong/source",
        permission: PERMISSIONS.SOURCE_VIEW,
        activePathPrefixes: ["/he-thong/source/"],
      },
      { label: "Quản lý server", path: "/he-thong/server", permission: PERMISSIONS.SERVER_VIEW },
    ],
  },
  {
    label: "Quản lý bảng giá",
    path: "/bang-gia",
    icon: FileText,
    children: [
      {
        label: "Bảng giá host",
        path: "/bang-gia/host",
        permission: PERMISSIONS.PRICE_VIEW,
        activePathPrefixes: ["/bang-gia/host/"],
      },
      {
        label: "Bảng giá ssl",
        path: "/bang-gia/ssl",
        permission: PERMISSIONS.PRICE_VIEW,
        activePathPrefixes: ["/bang-gia/ssl/"],
      },
      {
        label: "Bảng giá tên miền",
        path: "/bang-gia/ten-mien",
        permission: PERMISSIONS.PRICE_VIEW,
        activePathPrefixes: ["/bang-gia/ten-mien/"],
      },
      {
        label: "Bảng giá trọn gói",
        path: "/bang-gia/tron-goi",
        permission: PERMISSIONS.PRICE_VIEW,
        activePathPrefixes: ["/bang-gia/tron-goi/"],
      },
      {
        label: "Bảng giá quản trị",
        path: "/bang-gia/quan-tri",
        permission: PERMISSIONS.PRICE_VIEW,
        activePathPrefixes: ["/bang-gia/quan-tri/"],
      },
      {
        label: "Bảng giá quảng cáo",
        path: "/bang-gia/quang-cao",
        permission: PERMISSIONS.PRICE_VIEW,
        activePathPrefixes: ["/bang-gia/quang-cao/"],
      },
    ],
  },
  {
    label: "Quản lý lập trình",
    path: "/lap-trinh",
    icon: FileText,
    children: [
      {
        label: "Danh sách lập trình",
        path: "/lap-trinh/danh-sach",
        permission: PERMISSIONS.PROGRAM_VIEW,
        activePaths: ["/lap-trinh/them-moi"],
        activePathPrefixes: ["/lap-trinh/chinh-sua/"],
      },
      {
        label: "Danh sách nâng cấp",
        path: "/lap-trinh/nang-cap",
        permission: PERMISSIONS.UPGRADE_VIEW,
        activePathPrefixes: ["/lap-trinh/nang-cap/"],
      },
      {
        label: "Quản lý chỉnh sửa",
        path: "/lap-trinh/chinh-sua",
        permission: PERMISSIONS.CORRECTION_VIEW,
        activePathPrefixes: ["/lap-trinh/quan-ly-chinh-sua/"],
      },
      { label: "Quản lý điểm", path: "/lap-trinh/quan-ly-diem", permission: PERMISSIONS.PROGRAM_UPDATE_POINT },
    ],
  },
  {
    label: "Quản lý design",
    path: "/design",
    icon: FileText,
    children: [
      {
        label: "Danh sách design",
        path: "/design/danh-sach",
        permission: PERMISSIONS.DESIGN_VIEW,
        activePathPrefixes: ["/design/them-moi", "/design/chinh-sua/"],
      },
      { label: "Quản lý điểm", path: "/design/quan-ly-diem", permission: PERMISSIONS.DESIGN_UPDATE_POINT },
    ],
  },
  {
    label: "Quản lý kho mẫu",
    path: "/kho-mau",
    icon: FileText,
    children: [
      {
        label: "Website mẫu",
        path: "/kho-mau/website-mau",
        permission: PERMISSIONS.WEBSITE_TEMPLATE_VIEW,
        activePathPrefixes: ["/kho-mau/website-mau/"],
      },
    ],
  },
  {
    label: "Quản lý nhân sự",
    path: "/nhan-su",
    icon: FileText,
    children: [
      {
        label: "Danh sách nhân sự",
        path: "/nhan-su/danh-sach",
        permission: PERMISSIONS.STAFF_VIEW,
        activePathPrefixes: ["/nhan-su/chinh-sua/", "/nhan-su/them-moi"],
      },
    ],
  },
  {
    label: "Phân quyền",
    path: "/phan-quyen",
    icon: FileText,
    children: [
      {
        label: "Tài khoản người dùng",
        path: "/phan-quyen/tai-khoan",
        permission: PERMISSIONS.PERMISSION_USER_VIEW,
        activePathPrefixes: ["/phan-quyen/tai-khoan"],
      },
      {
        label: "Vai trò & quyền",
        path: "/phan-quyen/vai-tro",
        permission: PERMISSIONS.PERMISSION_ROLE_VIEW,
        activePathPrefixes: ["/phan-quyen/vai-tro"],
      },
    ],
  },
  {
    label: "Quản lý kinh doanh",
    path: "/kinh-doanh",
    icon: FileText,
    children: [
      {
        label: "Danh sách hợp đồng",
        path: "/kinh-doanh/danh-sach",
        permission: PERMISSIONS.CONTRACT_VIEW,
        activePaths: ["/kinh-doanh/them-moi"],
        activePathPrefixes: ["/kinh-doanh/chinh-sua/", "/kinh-doanh/hop-dong/"],
      },
    ],
  },
  {
    label: "Quản lý cấu hình",
    path: "/cau-hinh",
    icon: FileText,
    children: [
      {
        label: "Danh mục hệ thống",
        path: "/cau-hinh/danh-muc-he-thong",
        permission: PERMISSIONS.CONFIG_CATEGORY_VIEW,
        activePathPrefixes: ["/cau-hinh/danh-muc-he-thong"],
      },
      {
        label: "Cấu hình mail",
        path: "/cau-hinh/mail",
        permission: PERMISSIONS.CONFIG_MAIL_VIEW,
        activePathPrefixes: ["/cau-hinh/mail"],
      },
      {
        label: "Cấu hình SLA/tham số",
        path: "/cau-hinh/tham-so",
        permission: PERMISSIONS.CONFIG_SETTING_VIEW,
        activePathPrefixes: ["/cau-hinh/tham-so"],
      },
    ],
  },
  {
    label: "Biểu mẫu",
    path: "/bieu-mau",
    icon: FileText,
    children: [
      {
        label: "Thư viện mẫu email",
        path: "/bieu-mau/mau-email",
        permission: PERMISSIONS.TEMPLATE_VIEW,
        activePathPrefixes: ["/bieu-mau/mau-email"],
      },
    ],
  },
];

export const disabledNavigationMessage = "Bạn không có quyền truy cập chức năng này";