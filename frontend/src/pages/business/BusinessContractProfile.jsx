import { ArrowLeft, SquarePen } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button-v2";
import { businessContractApi } from "@/lib/api-client";

import { ContractOverviewSection } from "./components/ContractOverviewSection";
import { ContractTimelineSection } from "./components/ContractTimelineSection";
import { ProfileSummaryCards } from "./components/ProfileSummaryCards";
import { RelatedWorkSections } from "./components/RelatedWorkSections";
import { StaffPointSection } from "./components/StaffPointSection";

function BusinessContractProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timelineView, setTimelineView] = useState("chart");

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

      <ProfileSummaryCards summary={summary} contract={contract} />
      <ContractOverviewSection contract={contract} />
      <ContractTimelineSection
        contract={contract}
        profile={profile}
        timelineView={timelineView}
        onTimelineViewChange={setTimelineView}
      />
      <RelatedWorkSections profile={profile} navigate={navigate} />
      <StaffPointSection rows={profile.staffPoints} />
    </div>
  );
}

export default BusinessContractProfile;
