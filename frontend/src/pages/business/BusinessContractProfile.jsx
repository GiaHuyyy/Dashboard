import { ArrowLeft, ExternalLink, SquarePen } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button-v2";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { businessContractApi } from "@/lib/api-client";

const EMPTY_TEXT = "--";

const formatPoint = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "0";
  return Number(parsed.toFixed(3)).toString();
};

const formatCurrency = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "0 đ";
  return `${parsed.toLocaleString("vi-VN")} đ`;
};

const formatValue = (value) => {
  if (value === 0) return "0";
  return value || EMPTY_TEXT;
};

const Section = ({ title, description, actions, children }) => (
  <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-5 py-3">
      <div>
        <h2 className="text-lg font-semibold text-slate-700">{title}</h2>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
    <div className="p-5">{children}</div>
  </section>
);

const StatCard = ({ label, value, subvalue, hint }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
    <div className="flex items-baseline gap-2 text-sky-700">
      <p className="mt-2 text-2xl font-bold ">{value}</p>
      {subvalue ? <p className="text-sm font-medium">{subvalue}</p> : null}
    </div>
    {hint ? <p className="mt-1 text-sm text-slate-500">{hint}</p> : null}
  </div>
);

const InfoGrid = ({ items }) => (
  <dl className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    {items.map((item) => (
      <div key={item.label} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{item.label}</dt>
        <dd className="mt-1 wrap-break-word text-sm font-medium text-slate-700">{formatValue(item.value)}</dd>
      </div>
    ))}
  </dl>
);

const EmptyState = ({ children = "Chưa có dữ liệu" }) => (
  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
    {children}
  </div>
);

const DataTable = ({ columns, rows, emptyText, onRowClick }) => (
  <div className="w-full overflow-x-auto">
    <Table className="min-w-full text-center text-sm">
      <TableHeader className="bg-slate-50 text-slate-500">
        <TableRow>
          {columns.map((column) => (
            <TableHead
              key={column.key}
              className="border border-slate-200 p-3 text-center font-semibold text-slate-500"
            >
              {column.label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={columns.length} className="border border-slate-200 p-4 py-8 text-slate-500">
              {emptyText || "Chưa có dữ liệu"}
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row, index) => (
            <TableRow
              key={row.id || index}
              className={onRowClick ? "cursor-pointer text-slate-700 hover:bg-slate-50" : "text-slate-700"}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  className={["border border-slate-200 p-3", column.className].filter(Boolean).join(" ")}
                >
                  {column.render ? column.render(row, index) : formatValue(row[column.key])}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);

const PriceReferencesList = ({ references = [] }) => {
  if (!Array.isArray(references) || references.length === 0) return <span>{EMPTY_TEXT}</span>;

  return (
    <div className="space-y-1 text-left">
      {references.map((item, index) => (
        <div key={`${item.type}-${index}`} className="rounded-lg bg-slate-50 px-2 py-1">
          <p className="font-medium text-slate-700">{[item.type, item.label].filter(Boolean).join(" - ")}</p>
          {item.description ? <p className="text-xs text-slate-500">{item.description}</p> : null}
        </div>
      ))}
    </div>
  );
};

function BusinessContractProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const response = await businessContractApi.profile(id);
        if (!ignore) setProfile(response.profile);
      } catch (error) {
        if (!ignore) {
          toast.error(error?.message || "Không thể tải hồ sơ hợp đồng");
          navigate("/kinh-doanh/danh-sach");
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    if (id) void loadProfile();

    return () => {
      ignore = true;
    };
  }, [id, navigate]);

  const contract = profile?.contract;
  const summary = profile?.summary || {};
  const contractInfo = useMemo(() => {
    if (!contract) return [];
    return [
      { label: "Số hợp đồng", value: contract.contractCode },
      { label: "Tên hợp đồng", value: contract.contractName },
      { label: "Khách hàng", value: contract.customerName },
      { label: "SĐT khách hàng", value: contract.customerPhone },
      { label: "Email khách hàng", value: contract.customerEmail },
      { label: "Giá trị hợp đồng gốc", value: formatCurrency(contract.contractValue || 0) },
      { label: "Nhân viên kinh doanh", value: contract.selectedSalesStaff },
      { label: "Trạng thái", value: contract.status },
      { label: "Trạng thái mail", value: contract.mailStatus },
      { label: "Ngày dự kiến bàn giao", value: contract.expectedHandoverAtLabel },
      { label: "Trạng thái bàn giao", value: contract.handoverStatus },
      { label: "Ngày bàn giao", value: contract.handoverAtLabel },
      { label: "Ngày tạo", value: contract.createdAtLabel },
      { label: "Ghi chú", value: contract.note },
    ];
  }, [contract]);

  if (isLoading) {
    return (
      <div className="flex min-h-60 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-500">
        Đang tải hồ sơ hợp đồng...
      </div>
    );
  }

  if (!profile || !contract) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <p className="text-sm text-slate-500">Kinh doanh / Hợp đồng / Hồ sơ hợp đồng</p>
          <h1 className="mt-1 text-2xl font-bold text-sky-700">Hồ sơ hợp đồng {contract.contractCode}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Tổng hợp hợp đồng, design, lập trình, chỉnh sửa, nâng cấp, source, điểm và timeline xử lý.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            icon={ArrowLeft}
            label="Quay lại"
            variant="secondary"
            onClick={() => navigate("/kinh-doanh/danh-sach")}
          />
          <Button
            icon={SquarePen}
            label="Sửa hợp đồng"
            variant="primary"
            onClick={() => navigate(`/kinh-doanh/chinh-sua/${contract.id}`)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Tổng điểm"
          value={`${formatPoint(summary.totalPoint)}`}
          subvalue={`${summary.totalDurationLabel ? ` (${summary.totalDurationLabel})` : ""}`}
          hint="Design + lập trình + chỉnh sửa + nâng cấp"
        />
        <StatCard
          label="Công việc chính"
          value={(summary.designCount || 0) + (summary.programCount || 0)}
          hint={`${summary.designCount || 0} design, ${summary.programCount || 0} lập trình`}
        />
        <StatCard
          label="Yêu cầu phát sinh"
          value={(summary.correctionCount || 0) + (summary.upgradeCount || 0)}
          hint={`${summary.correctionCount || 0} chỉnh sửa, ${summary.upgradeCount || 0} nâng cấp`}
        />
        <StatCard
          label="Source"
          value={summary.sourceCount || 0}
          hint={`${summary.contractImageCount || 0} ảnh hợp đồng`}
        />
        <StatCard
          label="Tổng giá trị hợp đồng"
          value={formatCurrency(summary.totalContractValue || 0)}
          hint={`Gốc ${formatCurrency(contract.contractValue || 0)} + source ${formatCurrency(summary.sourcePriceTotal || 0)}`}
        />
      </div>

      <Section title="Tổng quan hợp đồng">
        <InfoGrid items={contractInfo} />
        {Array.isArray(contract.contractImages) && contract.contractImages.length > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {contract.contractImages.map((image, index) => (
              <a
                key={`${image.url}-${index}`}
                href={image.url}
                target="_blank"
                rel="noreferrer"
                className="group overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
              >
                <img
                  src={image.url}
                  alt={`Ảnh hợp đồng ${index + 1}`}
                  className="h-36 w-full object-contain p-2 transition group-hover:scale-[1.02]"
                />
              </a>
            ))}
          </div>
        ) : null}
      </Section>

      <Section title="Timeline xử lý" description="Các mốc chính từ hợp đồng tới source và bàn giao.">
        {profile.timeline.length === 0 ? (
          <EmptyState>Chưa có timeline</EmptyState>
        ) : (
          <div className="space-y-3">
            {profile.timeline.map((item, index) => (
              <div
                key={`${item.date}-${index}`}
                className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3"
              >
                <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-sky-500" />
                <div>
                  <p className="text-sm font-semibold text-slate-700">{item.title}</p>
                  <p className="text-xs text-slate-500">{item.dateLabel}</p>
                  {item.description ? <p className="mt-1 text-sm text-slate-600">{item.description}</p> : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Design liên quan">
        <DataTable
          rows={profile.designs}
          emptyText="Chưa có phiếu design liên quan"
          onRowClick={(row) => navigate(`/design/chinh-sua/${row.id}`)}
          columns={[
            { key: "title", label: "Tên design", className: "text-left" },
            { key: "designType", label: "Loại" },
            { key: "priority", label: "Ưu tiên" },
            { key: "durationLabel", label: "Thời gian" },
            { key: "convert", label: "Quy đổi", render: (row) => formatPoint(row.convert) },
            { key: "bonusPoint", label: "Điểm cộng thêm", render: (row) => formatPoint(row.bonusPoint) },
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
            { key: "time", label: "Thời gian" },
            { key: "convert", label: "Quy đổi", render: (row) => formatPoint(row.convert) },
            { key: "bonusPoint", label: "Điểm cộng thêm", render: (row) => formatPoint(row.bonusPoint) },
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
            { key: "time", label: "Thời gian" },
            { key: "convert", label: "Quy đổi", render: (row) => formatPoint(row.convert) },
            { key: "bonusPoint", label: "Điểm cộng thêm", render: (row) => formatPoint(row.bonusPoint) },
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
            { key: "time", label: "Thời gian" },
            { key: "convert", label: "Quy đổi", render: (row) => formatPoint(row.convert) },
            { key: "bonusPoint", label: "Điểm cộng thêm", render: (row) => formatPoint(row.bonusPoint) },
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

      <Section title="Tổng điểm theo nhân sự">
        <DataTable
          rows={profile.staffPoints}
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
    </div>
  );
}

export default BusinessContractProfile;
