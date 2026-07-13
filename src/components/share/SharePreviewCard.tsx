"use client";

import { SharedStopPayload } from "@/lib/shareEncoding";
import { Button } from "@/components/common/Button";

export function SharePreviewCard({ payload, shareUrl }: { payload: SharedStopPayload; shareUrl: string }) {
  const shareText = `${payload.tripTitle}｜${payload.date} ${payload.arrivalTime} 於 ${payload.stopName} 會合\n${payload.address}\n${payload.mapUrl}`;

  const handleSystemShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: payload.tripTitle, text: shareText, url: shareUrl });
      } catch {
        // 使用者取消分享，不需要特別處理
      }
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
    } catch (error) {
      console.error("[SharePreviewCard] 複製文字失敗", error);
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl2 border border-ink-100 bg-cream-100 p-4">
        <p className="text-sm font-semibold text-ink-800">{payload.tripTitle}</p>
        <p className="mt-1 text-xs text-ink-500">
          {payload.date} · {payload.arrivalTime} 抵達
        </p>
        <p className="mt-2 text-sm text-ink-700">{payload.stopName}</p>
        <p className="text-xs text-ink-400">{payload.address}</p>
        {payload.latestAcceptableTime && (
          <p className="mt-1 text-xs text-ink-400">最晚可接受時間：{payload.latestAcceptableTime}</p>
        )}
        {payload.simpleStatus && <p className="mt-1 text-xs text-aqua-600">{payload.simpleStatus}</p>}
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" fullWidth onClick={handleSystemShare}>
          系統分享
        </Button>
        <Button variant="ghost" fullWidth onClick={handleCopy}>
          複製文字
        </Button>
      </div>
    </div>
  );
}
