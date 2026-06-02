import { useMemo, useState } from "react";

import { ImageLightbox } from "@/components/forms/ImageLightbox";

import { InfoGrid, Section, formatCurrency } from "./profileShared";

const normalizeContractImages = (images = []) =>
  Array.isArray(images)
    ? images
        .map((image) => {
          if (typeof image === "string") return { kind: "url", url: image, publicId: "" };
          return { kind: "url", url: image?.url || "", publicId: image?.publicId || "" };
        })
        .filter((image) => image.url)
    : [];

export function ContractOverviewSection({ contract }) {
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const contractImages = useMemo(() => normalizeContractImages(contract?.contractImages), [contract]);
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
      { label: "Ngày nhận", value: contract.receivedAtLabel },
      { label: "Ngày dự kiến bàn giao", value: contract.expectedHandoverAtLabel },
      { label: "Trạng thái bàn giao", value: contract.handoverStatus },
      { label: "Ngày bàn giao", value: contract.handoverAtLabel },
      { label: "Ghi chú", value: contract.note },
    ];
  }, [contract]);

  return (
    <>
      <Section title="Tổng quan hợp đồng">
        <InfoGrid items={contractInfo} />
        {contractImages.length > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {contractImages.map((image, index) => (
              <button
                key={`${image.url}-${index}`}
                type="button"
                onClick={() => setLightboxIndex(index)}
                className="group overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-left"
                title="Bấm để xem ảnh hợp đồng"
              >
                <img
                  src={image.url}
                  alt={`Ảnh hợp đồng ${index + 1}`}
                  className="h-36 w-full object-contain p-2 transition group-hover:scale-[1.02]"
                />
              </button>
            ))}
          </div>
        ) : null}
      </Section>

      <ImageLightbox
        currentIndex={lightboxIndex}
        images={contractImages}
        onClose={() => setLightboxIndex(null)}
        onNext={() => setLightboxIndex(lightboxIndex + 1)}
        onPrev={() => setLightboxIndex(lightboxIndex - 1)}
      />
    </>
  );
}
