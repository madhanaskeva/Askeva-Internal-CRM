// URL helpers built on the view → path table in data/routes.js.
import { VIEW_PATHS } from "../../data";

/** Build a URL for a view (and project id for the detail view). */
export const pathFor = (view, params = {}) =>
  view === "detail" ? `/projects/${params.projectId}` : VIEW_PATHS[view] || VIEW_PATHS.dashboard;

/** Reverse lookup: which view does a pathname belong to? */
export const viewForPath = (pathname) => {
  if (/^\/projects\/[^/]+/.test(pathname)) return "detail";
  const hit = Object.entries(VIEW_PATHS).find(([, p]) => p === pathname);
  return hit ? hit[0] : null;
};
