import { useState } from "react";

/** Draft/applied search text + role filter shared by both QA pages. */
export function useQaSearch() {
  const [input, setInput] = useState("");
  const [applied, setApplied] = useState("");
  const [role, setRole] = useState("all");
  return {
    input,
    applied,
    role,
    barProps: {
      input,
      onInput: setInput,
      applied,
      onApply: () => setApplied(input),
      onClear: () => {
        setInput("");
        setApplied("");
      },
      role,
      onRole: setRole,
    },
  };
}
