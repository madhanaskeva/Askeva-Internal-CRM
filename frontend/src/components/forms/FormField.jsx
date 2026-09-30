import { DatePicker, Form, Input, InputNumber, Select } from "antd";
import dayjs from "dayjs";

/**
 * One field from a modal form definition (src/forms/modalForms.js).
 * Values are kept as strings (ISO dates, numeric strings), the same shape the
 * original stored, and converted for the Ant Design controls here.
 */
export default function FormField({ field, value, onChange }) {
  const { label, kind, placeholder, options } = field;
  let control;
  switch (kind) {
    case "select":
      control = (
        <Select
          className="brand-input"
          value={value ?? ""}
          options={options}
          onChange={onChange}
          showSearch={options.length > 8}
          optionFilterProp="label"
          popupMatchSelectWidth={false}
        />
      );
      break;
    case "area":
      control = <Input.TextArea className="brand-input" value={value} rows={3} onChange={(e) => onChange(e.target.value)} />;
      break;
    case "date":
      control = (
        <DatePicker
          className="brand-input w-full"
          format="DD MMM YYYY"
          value={value ? dayjs(value) : null}
          onChange={(d) => onChange(d ? d.format("YYYY-MM-DD") : "")}
        />
      );
      break;
    case "number":
      control = (
        <InputNumber
          className="brand-input w-full"
          value={value === "" || value == null ? null : Number(value)}
          placeholder={placeholder}
          onChange={(n) => onChange(n == null ? "" : String(n))}
        />
      );
      break;
    default:
      control = <Input className="brand-input" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
  }
  return <Form.Item label={label}>{control}</Form.Item>;
}
