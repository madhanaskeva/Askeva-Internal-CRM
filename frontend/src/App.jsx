import { App as AntApp, ConfigProvider } from "antd";
import enGB from "antd/locale/en_GB";
import { BrowserRouter } from "react-router-dom";
import ToastHost from "./components/common/ToastHost";
import AppRoutes from "./routes/AppRoutes";
import { antdTheme } from "./styles/antdTheme";

export default function App() {
  return (
    <ConfigProvider theme={antdTheme} locale={enGB}>
      <AntApp>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
        <ToastHost />
      </AntApp>
    </ConfigProvider>
  );
}
