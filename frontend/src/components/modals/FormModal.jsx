import { Form, Modal } from "antd";
import { useMemo, useState } from "react";
import { MODAL_FORMS, resolve } from "../forms/modalForms";
import { useDispatch, useSelector } from "react-redux";
import { selectRole } from "../../redux/selectors";
import { modalClosed } from "../../redux/slices/uiSlice";
import { submitModal } from "../../utils/actions/formActions";
import { cx } from "../../utils/helpers/classNames";
import PillButton from "../common/PillButton";
import FormField from "../forms/FormField";
import { useAction, useData, useFullData, useStrict } from "../../app/useCrm";

/** Global form modal — opened with `dispatch(modalOpened({ kind, extra }))`. */
export default function FormModal() {
  const modal = useSelector((s) => s.ui.modal);
  if (!modal) return null;
  // Keyed so every open starts from fresh defaults.
  return <FormModalBody key={`${modal.kind}-${JSON.stringify(modal.extra)}`} modal={modal} />;
}

/** Split a field list at its headings: [{ heading, fields }]. */
const toSections = (fields) =>
  fields.reduce((acc, f) => {
    if (f.heading) acc.push({ heading: f.heading, fields: [] });
    else {
      if (!acc.length) acc.push({ heading: "", fields: [] });
      acc[acc.length - 1].fields.push(f);
    }
    return acc;
  }, []);

/**
 * Form definitions may set (see ../forms/modalForms.js):
 *   width  — modal width (default 560)
 *   steps  — show each heading section as a wizard step
 *   hint(ctx, form) — live line under the fields (e.g. where a task will land)
 * Fields with `span: 2` take the full row of the two-column grid.
 */
function FormModalBody({ modal }) {
  const dispatch = useDispatch();
  const run = useAction();
  const role = useSelector(selectRole);
  const data = useData();
  const fullData = useFullData();
  const strict = useStrict();
  const def = MODAL_FORMS[modal.kind];
  const ctx = useMemo(() => ({ role, data, fullData, strict, extra: modal.extra || {} }), [role, data, fullData, strict, modal.extra]);
  const [form, setForm] = useState(() => def.initial(ctx));
  const [error, setError] = useState("");
  const [step, setStep] = useState(0);

  const close = () => dispatch(modalClosed());
  const submit = () => setError(run(submitModal, modal.kind, form, modal.extra).error || "");
  const note = def.note ? def.note(ctx) : "";
  const hint = def.hint ? def.hint(ctx, form) : "";
  const sections = toSections(def.fields(ctx, form));
  const wizard = !!def.steps && sections.length > 1;
  const shown = wizard ? [sections[step]] : sections;
  const last = !wizard || step === sections.length - 1;

  const renderField = (f) => (
    <FormField
      key={f.key}
      field={f}
      className={cx((f.span === 2 || f.kind === "area") && "form-span-2")}
      value={form[f.key]}
      onChange={(v) => setForm((prev) => ({ ...prev, [f.key]: v }))}
    />
  );

  const footer = [
    wizard && step > 0 ? (
      <PillButton key="back" onClick={() => setStep(step - 1)}>← Back</PillButton>
    ) : (
      <PillButton key="cancel" onClick={close}>Cancel</PillButton>
    ),
    last ? (
      <PillButton key="ok" tone="green" shadow onClick={submit}>{resolve(def.submit, ctx)}</PillButton>
    ) : (
      <PillButton key="next" tone="ink" onClick={() => setStep(step + 1)}>Next →</PillButton>
    ),
  ];

  return (
    <Modal
      open
      title={resolve(def.title, ctx)}
      onCancel={close}
      rootClassName="brand-modal"
      classNames={{ mask: "brand-mask" }}
      width={def.width || 560}
      centered
      destroyOnHidden
      footer={footer}
    >
      {note && <div className="modal-note">{note}</div>}
      {wizard && (
        <div className="form-steps">
          {sections.map((s, i) => (
            <button
              key={s.heading}
              type="button"
              className={cx("form-step", i === step && "is-current", i < step && "is-done")}
              onClick={() => setStep(i)}
            >
              <span className="form-step__num">{i < step ? "✓" : i + 1}</span>
              <span className="form-step__label">{s.heading.replace(/^\d+\s*·\s*/, "").replace(/\s*\(.*\)$/, "")}</span>
            </button>
          ))}
        </div>
      )}
      <Form layout="vertical" className="brand-form" onFinish={submit} component="div">
        {shown.map((s) => (
          <div key={s.heading || "main"} className="form-section">
            {s.heading && !wizard && <div className="form-heading">{s.heading}</div>}
            <div className="form-grid">{s.fields.map(renderField)}</div>
          </div>
        ))}
      </Form>
      {hint && <div className="form-hint">{hint}</div>}
      {error && <div className="form-error">{error}</div>}
    </Modal>
  );
}
