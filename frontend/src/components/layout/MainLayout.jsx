import { Drawer } from "antd";
import { Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { images } from "../../assets/images";
import { viewForPath } from "../../utils/helpers/routes";
import { useDispatch } from "react-redux";
import { viewChanged } from "../../redux/slices/uiSlice";
import FormModal from "../modals/FormModal";
import RoleSwitchModal from "../modals/RoleSwitchModal";
import TaskDrawer from "../modals/TaskDrawer";
import Header from "./Header";
import Sidebar from "./Sidebar";

/**
 * Authenticated shell: sidebar (a drawer below 900px), header, routed page,
 * and the global overlays (task drawer, form modal, role switch).
 */
export default function MainLayout() {
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const view = viewForPath(pathname) || "dashboard";
  const projectId = view === "detail" ? decodeURIComponent(pathname.split("/")[2]) : null;
  const [menuOpen, setMenuOpen] = useState(false);

  // Record the current view for the audit log (the original stored `view` on every change).
  useEffect(() => {
    dispatch(viewChanged(view));
  }, [dispatch, view]);

  // Scroll to top on page change.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="app-shell">
      <div className="mobile-topbar">
        <img src={images.logoGreen} alt="Askeva" />
        <button type="button" className="mobile-menu-btn" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
          <Menu size={18} />
        </button>
      </div>

      <Sidebar />
      <Drawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        placement="left"
        size={260}
        closable={false}
        rootClassName="nav-drawer"
        classNames={{ body: "nav-drawer__body" }}
      >
        <Sidebar className="sidebar--drawer" onNavigate={() => setMenuOpen(false)} />
      </Drawer>

      <main className="app-main">
        <Header view={view} projectId={projectId} />
        <Outlet />
      </main>

      <TaskDrawer />
      <FormModal />
      <RoleSwitchModal />
    </div>
  );
}
