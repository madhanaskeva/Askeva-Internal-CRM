import { useCallback, useMemo, useState } from "react";

/**
 * "Project: All | Nova Retail | …" chip filter shared by Tasks, Follow-ups
 * and Change requests. Returns chip options, the selected id and a matcher.
 * @param {Array} projects  the projects the user can see
 */
export function useProjectFilter(projects) {
  const [filter, setFilter] = useState("all");
  const options = useMemo(() => [{ value: "all", label: "All" }, ...projects.map((p) => ({ value: p.id, label: p.client }))], [projects]);
  const matches = useCallback((x) => filter === "all" || x.projectId === filter, [filter]);
  /** projectId to pre-fill "new …" modals (undefined when "All"). */
  const selectedProjectId = filter !== "all" ? filter : undefined;
  return { filter, setFilter, options, matches, selectedProjectId };
}
