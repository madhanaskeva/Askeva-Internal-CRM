import { App } from "antd";
import { useState } from "react";
import CountCard from "../../components/cards/CountCard";
import ChipGroup from "../../components/common/ChipGroup";
import PillButton from "../../components/common/PillButton";
import { useSelector } from "react-redux";
import { selectRole } from "../../redux/selectors";
import { resetDemo } from "../../utils/actions/adminActions";
import ClientsTab from "./ClientsTab";
import PmTab from "./PmTab";
import RulesTab from "./RulesTab";
import StaffTab from "./StaffTab";
import StructureTab from "./StructureTab";
import { SETTINGS_TABS } from "../../data";
import { useAction, useFullData, usePms } from "../../app/useCrm";

/** Settings (Admin / Super admin) — staff, structure, PM assignment, rules, client accounts. */
export default function Settings() {
  const run = useAction();
  const { modal } = App.useApp();
  const full = useFullData();
  const pms = usePms();
  const isSuper = useSelector(selectRole) === "SuperAdmin";
  const [tab, setTab] = useState("staff");
  const staff = full.staff || [];

  const confirmReset = () =>
    modal.confirm({
      title: "Reset demo data?",
      content: "All saved changes in this browser are wiped and the demo portfolio is reloaded.",
      okText: "Reset",
      okButtonProps: { className: "btn-pill tone-danger" },
      cancelButtonProps: { className: "btn-pill tone-white" },
      onOk: () => run(resetDemo),
    });

  return (
    <div className="page">
      <div className="grid-auto count-grid">
        <CountCard label="Active staff" value={staff.filter((s) => s.status === "Active").length} tone="ink800" labelColor="lime" />
        <CountCard label="Project managers" value={pms.length} labelColor="muted" />
        <CountCard label="Projects without PM" value={full.projects.filter((p) => !p.pmId).length} tone="rose" valueColor="danger" />
        <CountCard label="Client accounts" value={(full.clientAccounts || []).length} labelColor="muted" />
      </div>

      <div className="row row--wrap gap-6">
        <ChipGroup options={SETTINGS_TABS} value={tab} onChange={setTab} />
        <PillButton size="xxs" dangerText className="ml-auto" onClick={confirmReset}>Reset demo data</PillButton>
      </div>

      {tab === "staff" && <StaffTab staff={staff} isSuper={isSuper} />}
      {tab === "tree" && <StructureTab staff={staff} projects={full.projects} />}
      {tab === "pm" && <PmTab projects={full.projects} pms={pms} />}
      {tab === "rules" && <RulesTab rules={full.rules || {}} isSuper={isSuper} />}
      {tab === "clients" && <ClientsTab accounts={full.clientAccounts || []} projects={full.projects} />}
    </div>
  );
}
