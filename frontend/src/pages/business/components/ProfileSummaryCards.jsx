import { StatCard, formatCurrency, formatPoint } from "./profileShared";

export function ProfileSummaryCards({ summary = {}, contract = {} }) {
  return (
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
        subvalue={summary.mainWorkDurationLabel ? `(${summary.mainWorkDurationLabel})` : ""}
        hint={`${summary.designCount || 0} design, ${summary.programCount || 0} lập trình`}
      />
      <StatCard
        label="Yêu cầu phát sinh"
        value={(summary.correctionCount || 0) + (summary.upgradeCount || 0)}
        subvalue={summary.extraWorkDurationLabel ? `(${summary.extraWorkDurationLabel})` : ""}
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
  );
}
