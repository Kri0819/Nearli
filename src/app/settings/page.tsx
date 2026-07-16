"use client";

import { useState } from "react";
import { useSettings } from "@/hooks/useSettings";
import { useNotifications } from "@/hooks/useNotifications";
import { PageHeader } from "@/components/layout/PageHeader";
import { ListItemSkeleton } from "@/components/common/Skeleton";
import { TransportModeSelect } from "@/components/forms/TransportModeSelect";
import { DurationInput } from "@/components/forms/DurationInput";
import { Collapsible } from "@/components/common/Collapsible";
import { Button } from "@/components/common/Button";
import { clearAllLocalData } from "@/lib/storage";
import { generateId } from "@/lib/id";
import { APP_CONFIG } from "@/config/app";

export default function SettingsPage() {
  const { settings, updateSettings, isLoading } = useSettings();
  const { permission, requestPermission } = useNotifications();
  const [newOriginLabel, setNewOriginLabel] = useState("");
  const [newOriginAddress, setNewOriginAddress] = useState("");
  const [newPrepName, setNewPrepName] = useState("");

  if (isLoading) {
    return (
      <div className="space-y-3">
        <ListItemSkeleton />
        <ListItemSkeleton />
        <ListItemSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title="設定" />

      <section>
        <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-400">預設交通方式</h2>
        <TransportModeSelect
          value={settings.defaultTransportMode}
          onChange={(mode) => updateSettings({ ...settings, defaultTransportMode: mode })}
        />
      </section>

      <section>
        <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-400">預設提前抵達 / 停車時間</h2>
        <div className="space-y-3">
          <DurationInput
            label="預設提前抵達時間"
            minutes={settings.defaultEarlyArrivalMinutes}
            onChange={(m) => updateSettings({ ...settings, defaultEarlyArrivalMinutes: m })}
          />
          <DurationInput
            label="預設停車時間"
            minutes={settings.defaultParkingMinutes}
            onChange={(m) => updateSettings({ ...settings, defaultParkingMinutes: m })}
          />
        </div>
      </section>

      <Collapsible title="常用出發地">
        <div className="space-y-2">
          {settings.frequentOrigins.map((origin) => (
            <div key={origin.id} className="flex items-center justify-between rounded-xl2 border border-ink-100 px-3 py-2 text-sm">
              <div>
                <p className="text-ink-700">{origin.label}</p>
                <p className="text-xs text-ink-400">{origin.address}</p>
              </div>
              <button
                onClick={() =>
                  updateSettings({
                    ...settings,
                    frequentOrigins: settings.frequentOrigins.filter((o) => o.id !== origin.id),
                  })
                }
                className="text-risk-500"
                aria-label="刪除"
              >
                ✕
              </button>
            </div>
          ))}
          <div className="flex flex-col gap-2 pt-1">
            <input
              value={newOriginLabel}
              onChange={(e) => setNewOriginLabel(e.target.value)}
              placeholder="名稱，例如：住家"
              className="rounded-xl2 border border-ink-100 px-3 py-2 text-sm"
            />
            <input
              value={newOriginAddress}
              onChange={(e) => setNewOriginAddress(e.target.value)}
              placeholder="地址"
              className="rounded-xl2 border border-ink-100 px-3 py-2 text-sm"
            />
            <Button
              size="md"
              variant="secondary"
              onClick={() => {
                if (!newOriginLabel.trim()) return;
                updateSettings({
                  ...settings,
                  frequentOrigins: [
                    ...settings.frequentOrigins,
                    { id: generateId("origin"), label: newOriginLabel.trim(), address: newOriginAddress.trim() },
                  ],
                });
                setNewOriginLabel("");
                setNewOriginAddress("");
              }}
            >
              新增常用出發地
            </Button>
          </div>
        </div>
      </Collapsible>

      <Collapsible title="常用準備事項名稱">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {settings.frequentPreparationNames.map((name) => (
              <span key={name} className="flex items-center gap-1 rounded-full bg-aqua-50 px-3 py-1.5 text-sm text-aqua-700">
                {name}
                <button
                  onClick={() =>
                    updateSettings({
                      ...settings,
                      frequentPreparationNames: settings.frequentPreparationNames.filter((n) => n !== name),
                    })
                  }
                  aria-label={`移除${name}`}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newPrepName}
              onChange={(e) => setNewPrepName(e.target.value)}
              placeholder="新增名稱"
              className="flex-1 rounded-xl2 border border-ink-100 px-3 py-2 text-sm"
            />
            <Button
              size="md"
              variant="secondary"
              onClick={() => {
                if (!newPrepName.trim()) return;
                updateSettings({
                  ...settings,
                  frequentPreparationNames: [...settings.frequentPreparationNames, newPrepName.trim()],
                });
                setNewPrepName("");
              }}
            >
              新增
            </Button>
          </div>
        </div>
      </Collapsible>

      <Collapsible title="通知設定">
        <div className="space-y-3">
          <p className="text-xs text-warn-500">
            提醒僅在 App 開啟期間可靠觸發，關閉分頁或瀏覽器後無法保證準時推播。
          </p>
          <div className="rounded-xl2 border border-ink-100 p-3 text-sm">
            <p className="text-ink-700">瀏覽器通知權限：{PERMISSION_LABEL[permission]}</p>
            {permission !== "granted" && permission !== "unsupported" && (
              <Button size="md" variant="secondary" className="mt-2" onClick={() => requestPermission()}>
                開啟通知權限
              </Button>
            )}
          </div>
          {(
            [
              ["prepReminder", "該開始準備"],
              ["tenMinuteWarning", "距離離開還有 10 分鐘"],
              ["mustLeaveNow", "現在必須離開"],
              ["possibleDelay", "行程可能遲到"],
              ["nextStopAffected", "下一站時間受到影響"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center justify-between text-sm text-ink-600">
              {label}
              <input
                type="checkbox"
                checked={settings.notifications[key]}
                onChange={(e) =>
                  updateSettings({
                    ...settings,
                    notifications: { ...settings.notifications, [key]: e.target.checked },
                  })
                }
                className="accent-aqua-500"
              />
            </label>
          ))}
        </div>
      </Collapsible>

      <Collapsible title="關於">
        <p className="text-sm text-ink-500">
          {APP_CONFIG.displayName} v{APP_CONFIG.version}
        </p>
      </Collapsible>

      <Button
        variant="danger"
        fullWidth
        onClick={() => {
          if (confirm("確定要清除所有本機資料嗎？這個動作無法復原。")) {
            clearAllLocalData();
            window.location.href = "/";
          }
        }}
      >
        清除所有本機資料
      </Button>
    </div>
  );
}

const PERMISSION_LABEL: Record<string, string> = {
  unsupported: "此瀏覽器不支援",
  default: "尚未開啟",
  granted: "已開啟",
  denied: "已封鎖",
};
