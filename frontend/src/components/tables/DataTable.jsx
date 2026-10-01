import { Table } from "antd";
import { cx } from "../../utils/helpers/classNames";

/**
 * Ant Design Table in the Askeva style (ink header, compact rows, horizontal
 * scroll on small screens). Pagination is off unless `pageSize` is given,
 * matching the original which listed every row.
 *
 * @param {(record) => void} onRowClick  makes rows clickable
 * @param {(record) => string} rowTone    returns "danger" | "done" | undefined for row tint
 */
export default function DataTable({ columns, dataSource, rowKey = "id", onRowClick, rowTone, pageSize, flat = false, className, emptyText, ...rest }) {
  return (
    <Table
      className={cx("brand-table", flat && "brand-table--flat", className)}
      columns={columns}
      dataSource={dataSource}
      rowKey={rowKey}
      size="small"
      scroll={{ x: "max-content" }}
      pagination={pageSize ? { pageSize, showSizeChanger: false, hideOnSinglePage: true } : false}
      locale={emptyText ? { emptyText } : undefined}
      rowClassName={(r) => cx(onRowClick && "row-clickable", rowTone && rowTone(r) && `row-${rowTone(r)}`)}
      onRow={onRowClick ? (r) => ({ onClick: () => onRowClick(r) }) : undefined}
      {...rest}
    />
  );
}
