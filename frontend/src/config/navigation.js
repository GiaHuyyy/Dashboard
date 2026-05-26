import { FileText } from "lucide-react";

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
        permission: "source.view",
        activePathPrefixes: ["/he-thong/source/"],
      },
      { label: "Quản lý server", path: "/he-thong/server", permission: "server.view" },
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
        permission: "price.view",
        activePathPrefixes: ["/bang-gia/host/"],
      },
      {
        label: "Bảng giá ssl",
        path: "/bang-gia/ssl",
        permission: "price.view",
        activePathPrefixes: ["/bang-gia/ssl/"],
      },
      {
        label: "Bảng giá tên miền",
        path: "/bang-gia/ten-mien",
        permission: "price.view",
        activePathPrefixes: ["/bang-gia/ten-mien/"],
      },
      {
        label: "Bảng giá trọn gói",
        path: "/bang-gia/tron-goi",
        permission: "price.view",
        activePathPrefixes: ["/bang-gia/tron-goi/"],
      },
      {
        label: "Bảng giá quản trị",
        path: "/bang-gia/quan-tri",
        permission: "price.view",
        activePathPrefixes: ["/bang-gia/quan-tri/"],
      },
      {
        label: "Bảng giá quảng cáo",
        path: "/bang-gia/quang-cao",
        permission: "price.view",
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
        permission: "program.view",
        activePaths: ["/lap-trinh/them-moi"],
        activePathPrefixes: ["/lap-trinh/chinh-sua/"],
      },
      {
        label: "Danh sách nâng cấp",
        path: "/lap-trinh/nang-cap",
        permission: "upgrade.view",
        activePathPrefixes: ["/lap-trinh/nang-cap/"],
      },
      {
        label: "Quản lý chỉnh sửa",
        path: "/lap-trinh/chinh-sua",
        permission: "correction.view",
        activePathPrefixes: ["/lap-trinh/quan-ly-chinh-sua/"],
      },
      { label: "Quản lý điểm", path: "/lap-trinh/quan-ly-diem", permission: "program.updatePoint" },
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
        permission: "design.view",
        activePathPrefixes: ["/design/them-moi", "/design/chinh-sua/"],
      },
      { label: "Quản lý điểm", path: "/design/quan-ly-diem", permission: "design.updatePoint" },
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
        permission: "websiteTemplate.view",
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
        permission: "staff.view",
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
        permission: "permission.user.view",
        activePathPrefixes: ["/phan-quyen/tai-khoan"],
      },
      {
        label: "Vai trò & quyền",
        path: "/phan-quyen/vai-tro",
        permission: "permission.role.view",
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
        permission: "contract.view",
        activePaths: ["/kinh-doanh/them-moi"],
        activePathPrefixes: ["/kinh-doanh/chinh-sua/"],
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
        permission: "config.category.view",
        activePathPrefixes: ["/cau-hinh/danh-muc-he-thong"],
      },
      {
        label: "Cấu hình mail",
        path: "/cau-hinh/mail",
        permission: "config.mail.view",
        activePathPrefixes: ["/cau-hinh/mail"],
      },
      {
        label: "Cấu hình SLA/tham số",
        path: "/cau-hinh/tham-so",
        permission: "config.setting.view",
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
        permission: "template.view",
        activePathPrefixes: ["/bieu-mau/mau-email"],
      },
    ],
  },
];

export const disabledNavigationMessage = "Bạn không có quyền truy cập chức năng này";
