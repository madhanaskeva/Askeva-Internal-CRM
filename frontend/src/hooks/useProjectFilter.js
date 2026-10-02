import { useCallback, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { selectData } from "../redux/selectors";

/**
 * "Project: All | Nova Retail | …" chip filter shared by Tasks, Follow-ups
 * and Change requests. Returns chip options, the selected id and a matcher.
 */
export function useProjectFilter() {
  const data = useSelector(selectData);
  const [filter, setFilter] = useState("all");
  const options = useMemo(
    () => [{ value: "all", label: "All" }, ...data.projects.map((p) => ({ value: p.id, label: p.client }))],
    [data.projects],
  );
  const matches = useCallback((x) => filter === "all" || x.projectId === filter, [filter]);
  /** projectId to pre-fill "new …" modals (undefined when "All"). */
  const selectedProjectId = filter !== "all" ? filter : undefined;
  return { filter, setFilter, options, matches, selectedProjectId };
}
