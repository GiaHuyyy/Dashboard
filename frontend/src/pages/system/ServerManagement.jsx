import { RefreshCw} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button-v2";
import { ManagementTableCard } from "@/components/program/ManagementTableCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const initialServers = [
  {
    id: "srv-1",
    domain: "greenideasvn.com",
    bandwidthUsed: 6.38,
    bandwidthLimit: 40,
    storageUsed: 542.1,
    storageLimit: 2048,
    onOff: "Chưa suspend",
    onOffDate: "",
    ip: "103.1.238.142",
    suspend: false,
    visible: true,
    note: "",
  },
  {
    id: "srv-2",
    domain: "trontru.vn",
    bandwidthUsed: 1.88,
    bandwidthLimit: null,
    storageUsed: 271.4,
    storageLimit: 10240,
    onOff: "Chưa suspend",
    onOffDate: "",
    ip: "103.1.238.142",
    suspend: false,
    visible: true,
    note: "",
  },
  {
    id: "srv-3",
    domain: "daitoh-vietnam.com",
    bandwidthUsed: 1.69,
    bandwidthLimit: null,
    storageUsed: 285.9,
    storageLimit: 10240,
    onOff: "Chưa suspend",
    onOffDate: "",
    ip: "103.7.43.154",
    suspend: false,
    visible: true,
    note: "",
  },
];

const formatValue = (used, limit) => `${used.toFixed(2)} GB/${limit ? `${limit} GB` : "unlimited"}`;

function ServerManagement() {
  const [rows] = useState(initialServers);
  const [searchText, setSearchText] = useState("");
  const [filterIp, setFilterIp] = useState("all");
  const [filterSuspend, setFilterSuspend] = useState("all");
  const [sortBy, setSortBy] = useState("domain");

  const ipOptions = useMemo(() => ["all", ...new Set(rows.map((item) => item.ip))], [rows]);

  const filteredRows = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    return [...rows]
      .filter((row) => {
        if (keyword && !row.domain.toLowerCase().includes(keyword) && !row.ip.toLowerCase().includes(keyword)) {
          return false;
        }
        if (filterIp !== "all" && row.ip !== filterIp) return false;
        if (filterSuspend === "suspend" && !row.suspend) return false;
        if (filterSuspend === "active" && row.suspend) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "ip") return a.ip.localeCompare(b.ip);
        if (sortBy === "bandwidth") return b.bandwidthUsed - a.bandwidthUsed;
        return a.domain.localeCompare(b.domain);
      });
  }, [filterIp, filterSuspend, rows, searchText, sortBy]);

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button icon={RefreshCw} label="Đồng bộ server" variant="info" className="bg-cyan-500" onClick={() => toast.success("Đã đồng bộ dữ liệu mẫu")} />
        <select
          className="w-64 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
          value={filterIp}
          onChange={(event) => setFilterIp(event.target.value)}
        >
          <option value="all">Lọc theo địa chỉ IP</option>
          {ipOptions.filter((item) => item !== "all").map((ip) => (
            <option key={ip} value={ip}>
              {ip}
            </option>
          ))}
        </select>
        <select
          className="w-56 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
          value={filterSuspend}
          onChange={(event) => setFilterSuspend(event.target.value)}
        >
          <option value="all">Lọc theo suspend</option>
          <option value="active">Chưa suspend</option>
          <option value="suspend">Đã suspend</option>
        </select>
        <select
          className="w-56 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value)}
        >
          <option value="domain">Sắp xếp theo</option>
          <option value="ip">IP</option>
          <option value="bandwidth">Băng thông</option>
        </select>
      </div>

      <ManagementTableCard searchText={searchText} onSearchChange={setSearchText} searchPlaceholder="Tìm domain">
        <Table className="min-w-full text-center text-sm">
          <TableHeader className="bg-slate-50 text-slate-500">
            <TableRow>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">Domain (3)</TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">Băng thông</TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">Dung lượng (GB)</TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">On/Off</TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">Ngày on/off</TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="border border-slate-200 p-4 py-8 text-slate-500">
                  Chưa có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((row) => {
                const bandwidthLimit = row.bandwidthLimit ?? 0;
                const storageLimit = row.storageLimit ?? 0;
                const bandwidthPercent = bandwidthLimit ? Math.min((row.bandwidthUsed / bandwidthLimit) * 100, 100) : 100;
                const storagePercent = storageLimit ? Math.min((row.storageUsed / storageLimit) * 100, 100) : 100;

                return (
                  <TableRow key={row.id} className="text-slate-700 hover:bg-slate-50">
                    <TableCell className="border border-slate-200 p-4 text-left font-semibold text-sky-700">{row.domain}</TableCell>
                    <TableCell className="border border-slate-200 p-4">
                      <div className="mx-auto w-48 bg-slate-100">
                        <div
                          className="h-5 bg-amber-400 text-xs leading-5 text-slate-800"
                          style={{ width: `${bandwidthPercent}%` }}
                        >
                          <span className="px-2">{formatValue(row.bandwidthUsed, row.bandwidthLimit)}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="border border-slate-200 p-4">
                      <div className="mx-auto w-56 bg-slate-100">
                        <div
                          className="h-5 bg-cyan-500 text-xs leading-5 text-slate-800"
                          style={{ width: `${storagePercent}%` }}
                        >
                          <span className="px-2">
                            {row.storageUsed.toFixed(1)} MB/{row.storageLimit ? `${row.storageLimit} GB` : "10 GB"}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="border border-slate-200 p-4">
                      <span className="rounded bg-emerald-500 px-3 py-1 text-white">{row.onOff}</span>
                    </TableCell>
                    <TableCell className="border border-slate-200 p-4 text-slate-500 font-medium">{row.onOffDate || "N/A"}</TableCell>
                    <TableCell className="border border-slate-200 p-4">{row.ip}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </ManagementTableCard>
    </>
  );
}

export default ServerManagement;
