import { cx } from "../../utils/helpers/cx";

/**
 * Card-style "table" made of CSS-grid rows where each row is one clickable
 * button (dashboard project analytics, P&L rows). Use DataTable for plain
 * tabular data; use this where whole rows navigate and hold rich cells.
 *
 * Column layout comes from CSS: pass `className` for a class (in src/styles)
 * that sets `--cols` (grid-template-columns) and optionally `--min-w`
 * (row width before horizontal scroll kicks in on mobile).
 *
 * @param {string[]} headers
 * @param {Array} rows
 * @param {(row) => React.ReactNode[]} renderCells
 * @param {(row) => void} onRowClick
 */
export default function GridTable({ className, headers, rows, rowKey = "id", renderCells, onRowClick }) {
  return (
    <div className={cx("grid-table", className)}>
      <div className="grid-table__scroll">
        <div className="grid-table__head">
          {headers.map((h) => (
            <span key={h}>{h}</span>
          ))}
        </div>
        {rows.map((row) => {
          const cells = renderCells(row);
          return onRowClick ? (
            <button key={row[rowKey]} type="button" className="grid-table__row" onClick={() => onRowClick(row)}>
              {cells}
            </button>
          ) : (
            <div key={row[rowKey]} className="grid-table__row">
              {cells}
            </div>
          );
        })}
      </div>
    </div>
  );
}
