import { Modal } from "antd";
import { images } from "../../assets/images";
import { ROLE_LABEL } from "../../constants/crm";
import { useDispatch, useSelector } from "react-redux";
import { selectMe, selectRole } from "../../redux/selectors";
import { switchClosed } from "../../redux/slices/uiSlice";
import PillButton from "../common/PillButton";
import RolePicker from "../common/RolePicker";

/** "Switch role" overlay — view the system as any role without signing out. */
export default function RoleSwitchModal() {
  const dispatch = useDispatch();
  const open = useSelector((s) => s.ui.switchOpen);
  const me = useSelector(selectMe);
  const role = useSelector(selectRole);
  const close = () => dispatch(switchClosed());

  return (
    <Modal
      open={open}
      onCancel={close}
      footer={null}
      closable={false}
      width={560}
      centered
      rootClassName="brand-modal brand-modal--lg"
      classNames={{ mask: "brand-mask brand-mask--dark" }}
    >
      <div className="stack gap-16">
        <div className="stack gap-4">
          <img src={images.logoInk} alt="Askeva" className="logo-ink" />
          <div className="overlay-title">
            Switch role<span className="text-brand">.</span>
          </div>
          <div className="fs-12 text-body">
            You are {me} · {ROLE_LABEL[role]}. Pick another role to view the system as them.
          </div>
        </div>
        <RolePicker />
        <div className="row row--end">
          <PillButton size="sm" onClick={close}>Cancel</PillButton>
        </div>
      </div>
    </Modal>
  );
}
