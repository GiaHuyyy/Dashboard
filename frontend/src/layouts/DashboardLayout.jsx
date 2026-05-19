import { Bell, ChevronLeft, Cloud, FileText, Menu, SquareArrowRightExit } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { authApi } from "@/lib/api-client";
import { logoutUser } from "@/store/auth-slice";

const navItems = [
  {
    label: "Quản lý hệ thống",
    path: "/he-thong",
    icon: FileText,
    children: [
      {
        label: "Quản lý source",
        path: "/he-thong/source",
        activePathPrefixes: ["/he-thong/source/"],
      },
      { label: "Quản lý server", path: "/he-thong/server" },
    ],
  },
  {
    label: "Quản lý bảng giá",
    path: "/bang-gia",
    icon: FileText,
    children: [
      { label: "Bảng giá host", path: "/bang-gia/host", activePathPrefixes: ["/bang-gia/host/"] },
      { label: "Bảng giá ssl", path: "/bang-gia/ssl", activePathPrefixes: ["/bang-gia/ssl/"] },
      { label: "Bảng giá tên miền", path: "/bang-gia/ten-mien", activePathPrefixes: ["/bang-gia/ten-mien/"] },
      { label: "Bảng giá trọn gói", path: "/bang-gia/tron-goi", activePathPrefixes: ["/bang-gia/tron-goi/"] },
      { label: "Bảng giá quản trị", path: "/bang-gia/quan-tri", activePathPrefixes: ["/bang-gia/quan-tri/"] },
      { label: "Bảng giá quảng cáo", path: "/bang-gia/quang-cao", activePathPrefixes: ["/bang-gia/quang-cao/"] },
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
        activePaths: ["/lap-trinh/them-moi"],
        activePathPrefixes: ["/lap-trinh/chinh-sua/"],
      },
      {
        label: "Danh sách nâng cấp",
        path: "/lap-trinh/nang-cap",
        activePathPrefixes: ["/lap-trinh/nang-cap/"],
      },
      {
        label: "Quản lý chỉnh sửa",
        path: "/lap-trinh/chinh-sua",
        activePathPrefixes: ["/lap-trinh/quan-ly-chinh-sua/"],
      },
      { label: "Quản lý điểm", path: "/lap-trinh/quan-ly-diem" },
    ],
  },
  {
    label: "Quản lý design",
    path: "/design",
    icon: FileText,
    children: [
      { label: "Danh sách design", path: "/design/danh-sach" },
      { label: "Quản lý điểm", path: "/design/quan-ly-diem" },
    ],
  },
  {
    label: "Quản lý nhân sự",
    path: "/nhan-su",
    icon: FileText,
    children: [{ label: "Danh sách nhân sự", path: "/nhan-su/danh-sach", activePathPrefixes: ["/nhan-su/chinh-sua/", "/nhan-su/them-moi"] }],
  },
  { label: "Quản lý kinh doanh", path: "/kinh-doanh", icon: FileText },
  { label: "Quản lý cấu hình", path: "/cau-hinh", icon: FileText },
  { label: "Biểu mẫu", path: "/bieu-mau", icon: FileText },
];

const linkBase = "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium transition";

function DashboardLayout() {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [openSections, setOpenSections] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const activeLabel = useMemo(() => {
    for (const item of navItems) {
      if (item.path === location.pathname) {
        return item.label;
      }
      if (item.children) {
        const match = item.children.find(
          (child) =>
            child.path === location.pathname ||
            (child.activePaths && child.activePaths.includes(location.pathname)) ||
            (child.activePathPrefixes && child.activePathPrefixes.some((prefix) => location.pathname.startsWith(prefix))),
        );
        if (match) return match.label;
      }
    }
    return "Trang chủ";
  }, [location.pathname]);

  const isChildActive = (child) =>
    child.path === location.pathname ||
    (child.activePaths && child.activePaths.includes(location.pathname)) ||
    (child.activePathPrefixes && child.activePathPrefixes.some((prefix) => location.pathname.startsWith(prefix)));

  useEffect(() => {
    const defaults = {};
    navItems.forEach((item) => {
      if (item.children) {
        defaults[item.path] = location.pathname.startsWith(item.path);
      }
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpenSections((prev) => ({ ...defaults, ...prev }));
  }, [location.pathname]);

  useEffect(() => {
    authApi.me().catch(() => null);
  }, [location.pathname]);

  const pageTitle = activeLabel;
  const toggleSection = (path) => {
    setOpenSections((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      toast.success("Đăng xuất thành công");
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(error || "Đăng xuất thất bại");
    }
  };

  return (
    <div className="relative h-screen overflow-hidden bg-gray-100 text-slate-900">
      <div className="relative flex h-screen">
        {sidebarOpen && (
          <aside
            className={`h-screen w-72 shrink-0 border-r border-slate-800/60 bg-slate-900 text-slate-100 lg:flex lg:flex-col`}
          >
            <NavLink to={"/home"} className="flex items-center gap-3 border-b border-slate-800 px-6 py-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-lg font-semibold">
                A
              </div>
              <div>
                <p className="text-sm uppercase tracking-widest-[0.1em] text-white-400">Dashboard</p>
              </div>
            </NavLink>

            <nav className="flex-1 overflow-y-auto px-4 py-5">
              <ul className="space-y-2">
                {navItems.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.children ? item.children[0].path : item.path}
                      onClick={(event) => {
                        if (item.children) {
                          event.preventDefault();
                          toggleSection(item.path);
                          navigate(item.children[0].path);
                        }
                      }}
                      className={({ isActive }) =>
                        [
                          linkBase,
                          isActive || location.pathname.startsWith(item.path)
                            ? "bg-white/15 text-white"
                            : "text-gray-400 hover:bg-white/10",
                        ].join(" ")
                      }
                    >
                      <item.icon className={`h-4 w-4 text-gray-300 ${openSections[item.path] ? "text-white" : ""}`} />
                      {item.label}
                      <span className="ml-auto">
                        {item.children && (
                          <ChevronLeft
                            className={`h-4 w-4 text-gray-500 transition ${openSections[item.path] ? "-rotate-90 text-white" : ""}`}
                          />
                        )}
                      </span>
                    </NavLink>
                    {item.children && openSections[item.path] && (
                      <ul className="mt-2 space-y-1 pl-6">
                        {item.children.map((child) => (
                          <li key={child.path}>
                            <NavLink
                              to={child.path}
                              className={() =>
                                [
                                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition",
                                  isChildActive(child) ? "bg-white/15 text-white" : "text-slate-300 hover:bg-white/10",
                                ].join(" ")
                              }
                            >
                              <span
                                className={`relative flex h-3 w-3 items-center justify-center rounded-full border ${
                                  isChildActive(child) ? "border-white" : "border-slate-500"
                                }`}
                              >
                                {isChildActive(child) && <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />}
                              </span>
                              {child.label}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        )}

        <main className="flex h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 bg-white/90 px-6 py-4 backdrop-blur">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-3 py-1.5">
                <button
                  onClick={toggleSidebar}
                  className="flex items-center justify-center rounded-md hover:bg-slate-100 p-1"
                >
                  <Menu className="h-4 w-4" />
                </button>
                <p className="ml-4 text-sm font-semibold text-slate-900">{pageTitle}</p>
                <div>
                  <p className="text-xs text-slate-800">Ho Chi Minh City</p>
                  <p className="text-xs text-slate-800">Thu 6, 8/5/2026</p>
                </div>
                <div className="mx-2 h-6 w-px bg-slate-300" />
                <Cloud className="h-7 w-7 text-slate-300" />
                <p className="text-md text-slate-900">34°C</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden text-right md:block">
                <p className="text-sm font-semibold text-slate-700">{user?.name || "Người dùng"}</p>
                <p className="text-xs text-slate-500">{user?.userName || ""}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="relative flex h-8 w-8 items-center justify-center rounded-xl hover:bg-slate-100"
                  aria-label="Thông báo"
                >
                  <Bell className="h-4 w-4 text-slate-500" />
                  <span className="absolute -top-0.5 right-0 flex h-4 w-4 items-center justify-center rounded-3xl bg-yellow-500 text-[10px]">
                    1
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="relative flex h-8 w-8 items-center justify-center rounded-xl hover:bg-slate-100"
                  aria-label="Đăng xuất"
                >
                  <SquareArrowRightExit className="h-4 w-4 text-slate-500" />
                </button>
              </div>
            </div>
          </header>

          <section className="flex-1 overflow-y-auto px-6 py-6">
            <div className="mb-5 text-sm text-slate-500">
              <span className="text-[#66aada]">Bảng điều khiển</span> / Quản lý
            </div>
            <Outlet />
          </section>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
