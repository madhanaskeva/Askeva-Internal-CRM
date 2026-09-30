import { Input } from "antd";
import { Search } from "lucide-react";
import Card from "../../../components/common/Card";
import ChipGroup from "../../../components/common/ChipGroup";
import PillButton from "../../../components/common/PillButton";
import { QA_ROLE_FILTERS } from "../../../utils/domain/qa";

/**
 * "Filter & Search QA" bar. The input is a draft; the search applies on Enter
 * or the Search button (as in the original).
 */
export default function QaSearchBar({ input, onInput, applied, onApply, onClear, role, onRole }) {
  return (
    <Card className="stack gap-10 qa-search">
      <div className="row row--wrap gap-8">
        <div className="row gap-6 qa-search__title">
          <Search size={15} strokeWidth={2.5} />
          <span>Filter &amp; Search QA</span>
        </div>
        <div className="row gap-6 qa-search__field">
          <Input
            className="brand-input input-pill tone-paper"
            value={input}
            placeholder="Search by task, bug, module, dev, tester, project..."
            onChange={(e) => onInput(e.target.value)}
            onPressEnter={onApply}
          />
          <PillButton size="xs" tone="lime" className="qa-shadow-btn" onClick={onApply}>Search</PillButton>
          {applied.trim() && (
            <PillButton size="xs" className="qa-clear-btn" onClick={onClear}>Clear</PillButton>
          )}
        </div>
      </div>
      <ChipGroup label="Role Filter:" options={QA_ROLE_FILTERS} value={role} onChange={onRole} className="qa-roles" />
    </Card>
  );
}
