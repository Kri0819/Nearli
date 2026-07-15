"use client";

import { useParams } from "next/navigation";
import { decodeSharePayload } from "@/lib/shareEncoding";
import { formatDateWithWeekday } from "@/lib/dateUtils";

export default function SharedStopPage() {
  const params = useParams<{ id: string }>();
  const payload = decodeSharePayload(params.id);

  if (!payload) {
    return (
      <div className="mt-16 text-center">
        <p className="text-sm text-ink-500">這個分享連結無法讀取，可能已經失效。</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <p className="text-xs text-ink-400">會合資訊</p>
      <h1 className="mt-1 text-xl font-semibold text-ink-800">{payload.tripTitle}</h1>
      <p className="mt-1 text-sm text-ink-500">{formatDateWithWeekday(payload.date)}</p>

      <div className="mt-5 rounded-xl2 border border-ink-100 bg-white p-5 shadow-soft">
        <p className="text-sm text-ink-500">會合地點</p>
        <p className="mt-1 text-lg font-medium text-ink-800">{payload.stopName}</p>
        <p className="mt-0.5 text-sm text-ink-400">{payload.address}</p>

        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-2xl font-semibold tabular-nums text-ink-800">{payload.arrivalTime}</span>
          <span className="text-sm text-ink-500">抵達</span>
        </div>
        {payload.latestAcceptableTime && (
          <p className="mt-1 text-xs text-ink-400">最晚可接受時間：{payload.latestAcceptableTime}</p>
        )}
        {payload.simpleStatus && <p className="mt-2 text-sm text-aqua-600">{payload.simpleStatus}</p>}

        <a
          href={payload.mapUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-5 block w-full rounded-xl2 bg-aqua-500 py-3 text-center text-sm font-medium text-white"
        >
          在 Google Maps 開啟
        </a>
      </div>

      <p className="mt-4 text-center text-xs text-ink-300">此連結僅顯示會合資訊，不包含任何私人行程細節。</p>
    </div>
  );
}
