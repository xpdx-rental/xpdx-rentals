"use client";

import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays, parseISO } from "date-fns";


type DailyStat = {
  date: string;
  views: number;
  leads: number;
};

export function AnalyticsCharts({ stats }: { stats: DailyStat[] }) {
  // If stats is empty, generate an empty 30-day template so the chart renders nicely
  const chartData = useMemo(() => {
    if (stats.length > 0) return stats;
    
    const emptyStats: DailyStat[] = [];
    for (let i = 30; i >= 0; i--) {
      emptyStats.push({
        date: format(subDays(new Date(), i), "yyyy-MM-dd"),
        views: 0,
        leads: 0,
      });
    }
    return emptyStats;
  }, [stats]);

  return (
    <div className="w-full h-[350px] relative">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EA580C" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#EA580C" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="date" 
            tickFormatter={(val) => format(parseISO(val), "MMM d")}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 12 }}
            dy={10}
            minTickGap={30}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 12 }}
          />
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
          <Tooltip 
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-xl border border-white/10 bg-black/80 backdrop-blur-md p-3 shadow-xl">
                    <p className="text-sm font-semibold text-white/90 mb-2">{label ? format(parseISO(String(label)), "MMM d, yyyy") : ""}</p>
                    {payload.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm font-medium">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                        <span className="text-white/70">{p.name}:</span>
                        <span className="text-white ml-auto">{p.value}</span>
                      </div>
                    ))}
                  </div>
                );
              }
              return null;
            }}
          />
          <Area 
            type="monotone" 
            name="Page Views"
            dataKey="views" 
            stroke="#EA580C" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorViews)" 
          />
          <Area 
            type="monotone" 
            name="Leads"
            dataKey="leads" 
            stroke="#10B981" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorLeads)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
