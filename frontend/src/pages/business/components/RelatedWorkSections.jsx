import { ExternalLink } from "lucide-react";

import {
  DataTable,
  EMPTY_TEXT,
  PriceReferencesList,
  Section,
  formatCurrency,
  formatPoint,
} from "./profileShared";

export function RelatedWorkSections({ profile, navigate }) {
  return (
    <>
      <Section title="Design liên quan">
        <DataTable
          rows={profile.designs}
          emptyText="Chưa có phiếu design liên quan"
          onRowClick={(row) => navigate(`/design/chinh-sua/${row.id}`)}
          columns={[
            { key: "title", label: "Tên design", className: "text-left" },
            { key: "designType", label: "Loại" },
            { key: "priority", label: "Ưu tiên" },
            { key: "bonusPoint", label: "Điểm cộng", render: (row) => formatPoint(row.bonusPoint) },
            { key: "status", label: "Trạng thái" },
            { key: "assigner", label: "Người giao" },
            { key: "assignee", label: "Người nhận" },
            { key: "completedDateLabel", label: "Hoàn thành" },
          ]}
        />
      </Section>

      <Section title="Lập trình">
        <DataTable
          rows={profile.programs}
          emptyText="Chưa có phiếu lập trình"
          onRowClick={(row) => navigate(`/lap-trinh/chinh-sua/${row.id}`)}
          columns={[
            { key: "module", label: "Module", className: "text-left" },
            { key: "priority", label: "Ưu tiên" },
            { key: "bonusPoint", label: "Điểm cộng", render: (row) => formatPoint(row.bonusPoint) },
            { key: "processingStatus", label: "Trạng thái" },
            { key: "assigner", label: "Người giao" },
            { key: "assignee", label: "Lập trình viên" },
            { key: "dueAtLabel", label: "Hạn xử lý" },
            { key: "note", label: "Ghi chú", className: "text-left" },
          ]}
        />
      </Section>

      <Section title="Chỉnh sửa">
        <DataTable
          rows={profile.corrections}
          emptyText="Chưa có yêu cầu chỉnh sửa"
          onRowClick={(row) => navigate(`/lap-trinh/quan-ly-chinh-sua/chinh-sua/${row.id}`)}
          columns={[
            { key: "issueContent", label: "Nội dung", className: "text-left" },
            { key: "module", label: "Module" },
            { key: "priority", label: "Ưu tiên" },
            { key: "bonusPoint", label: "Điểm cộng", render: (row) => formatPoint(row.bonusPoint) },
            { key: "status", label: "Trạng thái" },
            { key: "assigner", label: "Người giao" },
            { key: "assignee", label: "Người nhận" },
          ]}
        />
      </Section>

      <Section title="Nâng cấp">
        <DataTable
          rows={profile.upgrades}
          emptyText="Chưa có yêu cầu nâng cấp"
          onRowClick={(row) => navigate(`/lap-trinh/nang-cap/chinh-sua/${row.id}`)}
          columns={[
            { key: "upgradeItem", label: "Nội dung", className: "text-left" },
            { key: "module", label: "Module" },
            { key: "priority", label: "Ưu tiên" },
            { key: "bonusPoint", label: "Điểm cộng", render: (row) => formatPoint(row.bonusPoint) },
            { key: "status", label: "Trạng thái" },
            { key: "assigner", label: "Người giao" },
            { key: "assignee", label: "Người nhận" },
          ]}
        />
      </Section>

      <Section title="Source">
        <DataTable
          rows={profile.sources}
          emptyText="Chưa có source"
          onRowClick={(row) => window.open(row.sourceLink, "_blank", "noopener,noreferrer")}
          columns={[
            { key: "domain", label: "Tên miền", className: "text-left" },
            {
              key: "sourceLink",
              label: "Link source",
              className: "text-left",
              render: (row) => (
                <span className="inline-flex items-center gap-1 text-sky-700">
                  {row.sourceLink || EMPTY_TEXT}
                  {row.sourceLink ? <ExternalLink className="h-3.5 w-3.5" /> : null}
                </span>
              ),
            },
            {
              key: "priceReferences",
              label: "Tham chiếu bảng giá",
              className: "min-w-[260px]",
              render: (row) => <PriceReferencesList references={row.priceReferences} />,
            },
            { key: "priceTotal", label: "Giá tiền", render: (row) => formatCurrency(row.priceTotal || 0) },
            { key: "sendStatus", label: "Trạng thái gửi" },
            { key: "sentAtLabel", label: "Ngày gửi" },
            { key: "expiresAtLabel", label: "Hết hạn link" },
            { key: "downloadStatus", label: "Trạng thái tải" },
            { key: "downloadCount", label: "Số lượt tải" },
          ]}
        />
      </Section>
    </>
  );
}
