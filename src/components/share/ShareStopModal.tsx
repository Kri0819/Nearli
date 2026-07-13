"use client";

import { useMemo, useState } from "react";
import { Trip } from "@/types/trip";
import { Stop } from "@/types/stop";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { SharePreviewCard } from "@/components/share/SharePreviewCard";
import { buildShareableStopPayload, encodeSharePayload } from "@/lib/shareEncoding";
import { buildPlaceViewUrl } from "@/lib/mapsAdapter";

export function ShareStopModal({ open, onClose, trip }: { open: boolean; onClose: () => void; trip: Trip }) {
  const orderedStops = [...trip.stops].sort((a, b) => a.order - b.order);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(orderedStops[0]?.id ?? null);
  const [includeDeadline, setIncludeDeadline] = useState(true);
  const [includeStatus, setIncludeStatus] = useState(false);

  const selectedStop: Stop | undefined = orderedStops.find((s) => s.id === selectedStopId);

  const shareUrl = useMemo(() => {
    if (!selectedStop) return "";
    const payload = buildShareableStopPayload(trip, selectedStop, buildPlaceViewUrl(selectedStop), {
      includeLatestAcceptableTime: includeDeadline,
      includeStatus,
      simpleStatus: includeStatus ? "目前仍可準時抵達" : undefined,
    });
    const encoded = encodeSharePayload(payload);
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/share/${encoded}`;
  }, [selectedStop, trip, includeDeadline, includeStatus]);

  const payload = useMemo(() => {
    if (!selectedStop) return null;
    return buildShareableStopPayload(trip, selectedStop, buildPlaceViewUrl(selectedStop), {
      includeLatestAcceptableTime: includeDeadline,
      includeStatus,
      simpleStatus: includeStatus ? "目前仍可準時抵達" : undefined,
    });
  }, [selectedStop, trip, includeDeadline, includeStatus]);

  return (
    <Modal open={open} onClose={onClose} title="分享會合資訊">
      <div className="space-y-4">
        <p className="text-xs text-ink-400">
          只會分享會合地點與時間，不會分享出發地、準備事項或私人備註。
        </p>

        <div>
          <span className="mb-1 block text-sm text-ink-500">選擇要分享的一站</span>
          <div className="flex flex-wrap gap-2">
            {orderedStops.map((stop) => (
              <button
                key={stop.id}
                onClick={() => setSelectedStopId(stop.id)}
                className={`rounded-full px-3.5 py-2 text-sm ${
                  selectedStopId === stop.id ? "bg-aqua-500 text-white" : "bg-aqua-50 text-aqua-700"
                }`}
              >
                {stop.name || "未命名地點"}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-ink-600">
          <input type="checkbox" checked={includeDeadline} onChange={(e) => setIncludeDeadline(e.target.checked)} className="accent-aqua-500" />
          附上最晚可接受時間（若有寬限時間）
        </label>
        <label className="flex items-center gap-2 text-sm text-ink-600">
          <input type="checkbox" checked={includeStatus} onChange={(e) => setIncludeStatus(e.target.checked)} className="accent-aqua-500" />
          附上簡單抵達狀態
        </label>

        {payload && <SharePreviewCard payload={payload} shareUrl={shareUrl} />}

        <Button variant="ghost" fullWidth onClick={onClose}>
          關閉
        </Button>
      </div>
    </Modal>
  );
}
