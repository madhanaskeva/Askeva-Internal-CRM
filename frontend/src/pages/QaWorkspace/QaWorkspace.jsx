import { useMemo, useState } from "react";
import ChipGroup from "../../components/common/ChipGroup";
import { activeTesters, buildQaAnalytics, buildQaQueue, qaMatcher, qaWindow } from "../../utils/domain/qa";
import QaAnalytics from "./components/QaAnalytics";
import QaQueue from "./components/QaQueue";
import QaSearchBar from "./components/QaSearchBar";
import { useQaSearch } from "./useQaSearch";
import { QA_PERIODS, QA_TABS } from "../../data";
import { useData, useFullData, useMe } from "../../app/useCrm";

/** Tester workspace: personal daily activity analytics + test queue & bug decisions. */
export default function QaWorkspace() {
  const data = useData();
  const full = useFullData();
  const me = useMe();
  const [tab, setTab] = useState("activity");
  const [period, setPeriod] = useState("today");
  const [focus, setFocus] = useState(null);
  const search = useQaSearch();

  const testers = useMemo(() => activeTesters(full), [full]);
  const analytics = useMemo(() => buildQaAnalytics(data, testers, me, period, {}, focus), [data, testers, me, period, focus]);
  const queue = useMemo(() => buildQaQueue(data, qaMatcher(search.applied, search.role)), [data, search.applied, search.role]);

  return (
    <div className="page">
      <QaSearchBar {...search.barProps} />

      <div className="row row--between row--wrap gap-8">
        <ChipGroup options={QA_TABS} value={tab} onChange={setTab} />
        {tab === "activity" && (
          <div className="row row--wrap gap-6">
            <span className="font-mono fs-11 text-ink">{qaWindow(period).label}</span>
            <ChipGroup options={QA_PERIODS} value={period} onChange={setPeriod} />
          </div>
        )}
      </div>

      {tab === "activity" ? <QaAnalytics qa={analytics} onFocus={setFocus} /> : <QaQueue q={queue} />}
    </div>
  );
}
