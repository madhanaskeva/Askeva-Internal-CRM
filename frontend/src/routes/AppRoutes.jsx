import { Spin } from "antd";
import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import { LOGIN_PATH, VIEW_PATHS } from "../constants/routes";
import Login from "../pages/Login/Login";
import { HomeRedirect, ProtectedRoute, RequireView } from "./ProtectedRoute";

// Pages are code-split so each role only downloads what it opens.
const PAGES = {
  dashboard: lazy(() => import("../pages/Dashboard/Dashboard")),
  projects: lazy(() => import("../pages/Projects/Projects")),
  detail: lazy(() => import("../pages/ProjectDetail/ProjectDetail")),
  deadlines: lazy(() => import("../pages/Deadlines/Deadlines")),
  finance: lazy(() => import("../pages/Finance/Finance")),
  salary: lazy(() => import("../pages/Salary/Salary")),
  settings: lazy(() => import("../pages/Settings/Settings")),
  syslog: lazy(() => import("../pages/SystemLog/SystemLog")),
  pl: lazy(() => import("../pages/ProfitLoss/ProfitLoss")),
  deploy: lazy(() => import("../pages/Deploy/Deploy")),
  team: lazy(() => import("../pages/Team/Team")),
  inbox: lazy(() => import("../pages/Inbox/Inbox")),
  mywork: lazy(() => import("../pages/MyWork/MyWork")),
  qa: lazy(() => import("../pages/QaWorkspace/QaWorkspace")),
  teamqa: lazy(() => import("../pages/TeamQa/TeamQa")),
  audit: lazy(() => import("../pages/DailyAudit/DailyAudit")),
  client: lazy(() => import("../pages/ClientPortal/ClientPortal")),
  communication: lazy(() => import("../pages/Communication/Communication")),
  tasks: lazy(() => import("../pages/Tasks/Tasks")),
  followups: lazy(() => import("../pages/FollowUps/FollowUps")),
  crs: lazy(() => import("../pages/ChangeRequests/ChangeRequests")),
};

const PageFallback = () => (
  <div className="page-loading">
    <Spin />
  </div>
);

export default function AppRoutes() {
  return (
    <Routes>
      <Route path={LOGIN_PATH} element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          {Object.entries(PAGES).map(([view, Page]) => (
            <Route
              key={view}
              path={VIEW_PATHS[view]}
              element={
                <RequireView view={view}>
                  <Suspense fallback={<PageFallback />}>
                    <Page />
                  </Suspense>
                </RequireView>
              }
            />
          ))}
        </Route>
      </Route>
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}
