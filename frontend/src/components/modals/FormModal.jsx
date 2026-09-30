import { Form, Modal } from "antd";
import { useMemo, useState } from "react";
import { MODAL_FORMS, resolve } from "../../forms/modalForms";
import { useDispatch, useSelector } from "react-redux";
import { selectData, selectFullData, selectRole, selectStrict } from "../../redux/selectors";
import { modalClosed } from "../../redux/slices/uiSlice";
import { submitModal } from "../../utils/actions/formActions";
import PillButton from "../common/PillButton";
import FormField from "../forms/FormField";

/** Global form modal — opened with `dispatch(modalOpened({ kind, extra }))`. */
export default function FormModal() {
  const modal = useSelector((s) => s.ui.modal);
  if (!modal) return null;
  // Keyed so every open starts from fresh defaults.
  return <FormModalBody key={`${modal.kind}-${JSON.stringify(modal.extra)}`} modal={modal} />;
}

function FormModalBody({ modal }) {
  const dispatch = useDispatch();
  const role = useSelector(selectRole);
  const data = useSelector(selectData);
  const fullData = useSelector(selectFullData);
  const strict = useSelector(selectStrict);
  const def = MODAL_FORMS[modal.kind];
  const ctx = useMemo(() => ({ role, data, fullData, strict, extra: modal.extra || {} }), [role, data, fullData, strict, modal.extra]);
  const [form, setForm] = useState(() => def.initial(ctx));
  const [error, setError] = useState("");

  const close = () => dispatch(modalClosed());
  const submit = () => setError(submitModal(modal.kind, form, modal.extra) || "");
  const note = def.note ? def.note(ctx) : "";
  const fields = def.fields(ctx, form);

  return (
    <Modal
      open
      title={resolve(def.title, ctx)}
      onCancel={close}
      rootClassName="brand-modal"
      classNames={{ mask: "brand-mask" }}
      width={520}
      centered
      destroyOnHidden
      footer={[
        <PillButton key="cancel" onClick={close}>Cancel</PillButton>,
        <PillButton key="ok" tone="green" shadow onClick={submit}>{resolve(def.submit, ctx)}</PillButton>,
      ]}
    >
      {note && <div className="modal-note">{note}</div>}
      <Form layout="vertical" className="brand-form" onFinish={submit} component="div">
        {fields.map((f) =>
          f.heading ? (
            <div key={f.heading} className="form-heading">{f.heading}</div>
          ) : (
            <FormField key={f.key} field={f} value={form[f.key]} onChange={(v) => setForm((prev) => ({ ...prev, [f.key]: v }))} />
          ),
        )}
      </Form>
      {error && <div className="form-error">{error}</div>}
    </Modal>
  );
}
