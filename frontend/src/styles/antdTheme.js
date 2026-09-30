// Ant Design theme mapped to the Askeva design tokens (styles/global.css).
// antd needs literal colour values, so these mirror the CSS variables.
export const antdTheme = {
  token: {
    colorPrimary: "#3DC838", // --green-500
    colorSuccess: "#3DC838",
    colorError: "#B42318", // --danger
    colorWarning: "#C8FF4A", // --lime-400
    colorText: "#3A4033", // --text-body
    colorTextHeading: "#10180C", // --ink-900
    colorTextSecondary: "#7A8172", // --text-muted
    colorBorder: "#10180C",
    colorBgLayout: "#EFECE3", // --paper
    colorBgContainer: "#FFFFFF",
    colorLink: "#2E9E2B", // --green-600
    fontFamily: "'Archivo', Helvetica, sans-serif",
    fontSize: 13,
    borderRadius: 10,
    controlOutline: "rgba(61, 200, 56, 0.2)",
  },
  components: {
    Table: { headerBg: "#10180C", headerColor: "#EFECE3", rowHoverBg: "#FAF9F4", borderColor: "#E3E0D5" },
    Modal: { contentBg: "#EFECE3", headerBg: "transparent" },
    Drawer: { colorBgElevated: "#EFECE3" },
    Select: { optionSelectedBg: "#C8FF4A" },
  },
};
