import { App } from "antd";
import { useEffect } from "react";
import { useSelector } from "react-redux";

/** Shows `ui.toast` messages via Ant Design's message API (3.5s, like the original). */
export default function ToastHost() {
  const { message } = App.useApp();
  const toast = useSelector((s) => s.ui.toast);

  useEffect(() => {
    if (toast) message.open({ key: "crm-toast", content: toast.message, duration: 3.5, icon: null, className: "brand-toast" });
  }, [toast, message]);

  return null;
}
