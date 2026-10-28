"use client";

import React, { useState, useEffect } from "react";
import { Activity, Clock, ShieldCheck, Zap } from "lucide-react";

interface UsageData {
  requestsUsed: number;
  requestsLimit: number;
  resetIntervalSeconds: number;
  dailyHistory: Array<{ date: string; count: number }>;
}

export default function UsageSettingsPage() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/account/usage")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.stats) {
          setUsage(data.stats);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const requestsUsed = usage?.requestsUsed ?? 12;
  const requestsLimit = usage?.requestsLimit ?? 60;
  const percentage = Math.min(100, Math.round((requestsUsed / requestsLimit) * 100));

  // Determine max count for scaling chart
  const maxDailyCount = usage?.dailyHistory
    ? Math.max(...usage.dailyHistory.map((d) => d.count), 15)
    : 20;

  return (
    <div className="bg-white rounded-lg border border-[#ebebeb] p-6 sm:p-8 space-y-6">
      <div>
        <h2 className="text-base font-semibold text-[#171717]">Usage & Rate Limits</h2>
        <p className="text-xs text-[#666666] mt-0.5">
          Monitor your API query consumption, active rate limits, and 30-day activity trends.
        </p>
      </div>

      {/* Current Window Status Card */}
      <div className="p-5 rounded-lg border border-[#ebebeb] bg-[#fafafa] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#171717]" />
            <span className="text-xs font-semibold text-[#171717]">
              Current Rate Limit Window (1-Minute Rolling)
            </span>
          </div>
          <span className="text-[11px] font-mono text-[#8f8f8f]">
            Resets continuously
          </span>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#171717] font-medium">
              {requestsUsed} / {requestsLimit} requests used
            </span>
            <span className="text-[#666666]">{percentage}%</span>
          </div>

          <div className="w-full h-2 rounded-full bg-[#ebebeb] overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                percentage > 85
                  ? "bg-[#dc2626]"
                  : percentage > 60
                  ? "bg-[#d97706]"
                  : "bg-[#171717]"
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono border-t border-[#ebebeb]">
          <div>
            <span className="text-[#8f8f8f] block text-[10px] uppercase">Plan Tier</span>
            <span className="text-[#171717] font-medium">Authenticated Member</span>
          </div>
          <div>
            <span className="text-[#8f8f8f] block text-[10px] uppercase">Request Limit</span>
            <span className="text-[#171717] font-medium">60 req / min</span>
          </div>
          <div>
            <span className="text-[#8f8f8f] block text-[10px] uppercase">Model Provider</span>
            <span className="text-[#171717] font-medium">Gemma 2 Architecture</span>
          </div>
        </div>
      </div>

      {/* 30-Day Activity Bar Chart */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#171717]">
            30-Day Ingestion & Query History
          </span>
          <span className="text-[11px] font-mono text-[#8f8f8f]">
            Daily requests
          </span>
        </div>

        <div className="p-4 rounded-lg border border-[#ebebeb] bg-white space-y-2">
          {isLoading ? (
            <div className="h-28 flex items-center justify-center text-xs font-mono text-[#8f8f8f]">
              Loading usage history...
            </div>
          ) : (
            <div className="h-28 flex items-end justify-between gap-1 pt-4">
              {usage?.dailyHistory.map((item, idx) => {
                const heightPct = Math.max(8, Math.round((item.count / maxDailyCount) * 100));
                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center group relative h-full justify-end"
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-[#171717] text-white text-[10px] font-mono px-1.5 py-0.5 rounded shadow-md z-10 whitespace-nowrap">
                      {item.date}: {item.count} reqs
                    </div>
                    {/* Bar */}
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t transition-all ${
                        idx === (usage?.dailyHistory.length ?? 0) - 1
                          ? "bg-[#171717]"
                          : "bg-[#e5e5e5] group-hover:bg-[#a3a3a3]"
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between text-[10px] font-mono text-[#8f8f8f] pt-2 border-t border-[#f5f5f5]">
            <span>30 days ago</span>
            <span>Today</span>
          </div>
        </div>
      </div>

      {/* Plain Language Limit Explanation */}
      <div className="p-4 rounded border border-[#ebebeb] bg-[#fafafa] space-y-2 text-xs">
        <div className="flex items-center gap-1.5 text-[#171717] font-semibold">
          <ShieldCheck className="w-4 h-4 text-[#16a34a]" />
          <span>Fair Usage Policy & Rate Limit Safeguards</span>
        </div>
        <p className="text-[#666666] leading-relaxed">
          RepoPilot enforces rate limiting to safeguard inference availability. Authenticated users are allocated 60 requests per minute with isolated per-user tracking. Unauthenticated guests are allocated 15 requests per minute keyed by IP. If a limit is exceeded, RepoPilot displays an honest retry countdown rather than failing silently.
        </p>
      </div>
    </div>
  );
}

