import { DataTable, Section, formatPoint } from "./profileShared";

export function StaffPointSection({ rows = [] }) {
  return (
    <Section title="Tổng điểm theo nhân sự">
      <DataTable
        rows={rows}
        emptyText="Chưa có điểm"
        columns={[
          { key: "name", label: "Nhân sự", className: "text-left" },
          { key: "designPoint", label: "Design", render: (row) => formatPoint(row.designPoint) },
          { key: "programPoint", label: "Lập trình", render: (row) => formatPoint(row.programPoint) },
          { key: "correctionPoint", label: "Chỉnh sửa", render: (row) => formatPoint(row.correctionPoint) },
          { key: "upgradePoint", label: "Nâng cấp", render: (row) => formatPoint(row.upgradePoint) },
          {
            key: "totalPoint",
            label: "Tổng điểm",
            render: (row) => (
              <span className="font-semibold text-sky-700">
                {formatPoint(row.totalPoint)}
                {row.totalDurationLabel ? ` (${row.totalDurationLabel})` : ""}
              </span>
            ),
          },
        ]}
      />
    </Section>
  );
}
