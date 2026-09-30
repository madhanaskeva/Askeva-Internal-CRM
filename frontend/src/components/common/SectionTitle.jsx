/** Display-font section heading with an optional mono meta on the right. */
export default function SectionTitle({ title, meta, children }) {
  return (
    <div className="section-title">
      <span className="section-title__text flex-1">{title}</span>
      {meta != null && <span className="section-title__meta">{meta}</span>}
      {children}
    </div>
  );
}
