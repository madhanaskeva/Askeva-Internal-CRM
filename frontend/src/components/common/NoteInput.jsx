import { Input } from "antd";

/** Pill-shaped note input shared by task/bug/deploy actions. Enter triggers `onEnter`. */
export default function NoteInput({ value, onChange, onEnter, placeholder, className }) {
  return (
    <Input
      className={`brand-input input-pill ${className || ""}`}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onPressEnter={onEnter}
    />
  );
}
