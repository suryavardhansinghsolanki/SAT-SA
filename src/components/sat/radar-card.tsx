import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { CAPABILITY_META, type CapabilityKey, type CapabilityScore } from "@/lib/sat/types";
import { ClientOnly } from "./client-only";

export function RadarCard({
  series,
}: {
  series: { name: string; scores: CapabilityScore[]; color?: string }[];
}) {
  const keys = Object.keys(CAPABILITY_META) as CapabilityKey[];
  const data = keys.map((key) => {
    const row: Record<string, string | number> = { axis: CAPABILITY_META[key].short };
    for (const s of series) {
      row[s.name] = s.scores.find((c) => c.key === key)?.score ?? 0;
    }
    return row;
  });
  const colors = ["#c5cdd6", "#d16456", "#7d9a7e", "#7f93a6"];

  return (
    <ClientOnly>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="72%">
            <PolarGrid stroke="#2a2e36" />
            <PolarAngleAxis dataKey="axis" tick={{ fill: "#9a958b", fontSize: 11 }} />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            {series.map((s, i) => (
              <Radar
                key={s.name}
                name={s.name}
                dataKey={s.name}
                stroke={s.color ?? colors[i % colors.length]}
                fill={s.color ?? colors[i % colors.length]}
                fillOpacity={0.12}
                strokeWidth={1.5}
              />
            ))}
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </ClientOnly>
  );
}
