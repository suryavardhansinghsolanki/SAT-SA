import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WeekPoint } from "@/lib/sat/trends";
import { ClientOnly } from "./client-only";

export function WeekChart({ points }: { points: WeekPoint[] }) {
  return (
    <ClientOnly>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#2a2e36" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "#9a958b", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#9a958b", fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
            <Tooltip
              contentStyle={{
                background: "#1a1d24",
                border: "1px solid #2a2e36",
                borderRadius: 8,
                fontSize: 12,
                color: "#ece7de",
              }}
            />
            <Area type="monotone" dataKey="alerts" name="Alerts" stroke="#c5cdd6" fill="#c5cdd6" fillOpacity={0.12} strokeWidth={1.6} />
            <Area type="monotone" dataKey="critical" name="High / critical" stroke="#d16456" fill="#d16456" fillOpacity={0.16} strokeWidth={1.4} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ClientOnly>
  );
}
