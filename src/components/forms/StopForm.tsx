"use client";

import { useEffect, useMemo, useState } from "react";
import { ParkingMode, Stop, TimeConstraintType, TransportMode } from "@/types/stop";
import { TimeInput } from "@/components/forms/TimeInput";
import { DurationInput } from "@/components/forms/DurationInput";
import { TransportModeSelect } from "@/components/forms/TransportModeSelect";
import { TimeConstraintSelect } from "@/components/forms/TimeConstraintSelect";
import { Collapsible } from "@/components/common/Collapsible";
import { Button } from "@/components/common/Button";
import { combineDateAndTime, formatTime } from "@/lib/dateUtils";
import { estimateParkingMinutes } from "@/lib/parkingEstimator";

interface StopFormProps {
  tripDate: string;
  initialStop: Stop;
  order: number;
  onSave: (stop: Stop) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const PARKING_MODE_LABELS: Record<ParkingMode, string> = {
  auto: "自動估算",
  manual: "自己設定",
  none: "不需要停車",
};

export function StopForm({ tripDate, initialStop, order, onSave, onCancel, onDelete }: StopFormProps) {
  const [name, setName] = useState(initialStop.name);
  const [address, setAddress] = useState(initialStop.address);
  const [arrivalTime, setArrivalTime] = useState(
    initialStop.targetArrivalTime ? formatTime(new Date(initialStop.targetArrivalTime)) : "18:00"
  );
  const [timeConstraintType, setTimeConstraintType] = useState<TimeConstraintType>(initialStop.timeConstraintType);
  const [graceMinutes, setGraceMinutes] = useState(initialStop.graceMinutes || 10);
  const [earlyArrivalMinutes, setEarlyArrivalMinutes] = useState(initialStop.earlyArrivalMinutes || 10);
  const [transportMode, setTransportMode] = useState<TransportMode>(initialStop.transportMode);
  const [travelMinutes, setTravelMinutes] = useState(initialStop.travelMinutes);
  const [parkingMode, setParkingMode] = useState<ParkingMode>(initialStop.parking.mode);
  const [parkingMinutes, setParkingMinutes] = useState(initialStop.parkingMinutes);
  const [walkFromParkingMinutes, setWalkFromParkingMinutes] = useState(initialStop.walkFromParkingMinutes);
  const [entryBufferMinutes, setEntryBufferMinutes] = useState(initialStop.entryBufferMinutes);
  const [note, setNote] = useState(initialStop.note);

  const parkingEstimate = useMemo(() => {
    if (parkingMode !== "auto") return null;
    const at = combineDateAndTime(tripDate || new Date().toISOString().slice(0, 10), arrivalTime);
    return estimateParkingMinutes({
      transportMode,
      placeHasOwnParking: false,
      isPopularArea: false,
      areaType: "downtown",
      at,
      personalHistoryAverageMinutes: null,
    });
  }, [parkingMode, transportMode, tripDate, arrivalTime]);

  useEffect(() => {
    if (parkingEstimate) setParkingMinutes(parkingEstimate.minutes);
  }, [parkingEstimate]);

  const canSave = name.trim().length > 0 && arrivalTime.length > 0;

  const handleSubmit = () => {
    if (!canSave) return;
    const dateForCombine = tripDate || new Date().toISOString().slice(0, 10);
    const stop: Stop = {
      ...initialStop,
      name: name.trim(),
      address: address.trim(),
      targetArrivalTime: combineDateAndTime(dateForCombine, arrivalTime).toISOString(),
      timeConstraintType,
      graceMinutes,
      earlyArrivalMinutes,
      transportMode,
      travelMinutes,
      travelSource: initialStop.travelSource || "目前使用示範路程資料。",
      parking: { mode: parkingMode, manualMinutes: parkingMode === "manual" ? parkingMinutes : undefined },
      parkingMinutes,
      walkFromParkingMinutes,
      entryBufferMinutes,
      note,
      order,
    };
    onSave(stop);
  };

  return (
    <div className="space-y-5">
      <label className="block">
        <span className="mb-1 block text-sm text-ink-500">地點名稱</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例如：漢神巨蛋"
          className="w-full rounded-xl2 border border-ink-100 bg-white px-3 py-2.5 text-ink-800 focus:border-aqua-400 focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm text-ink-500">地址（選填）</span>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="尚未串接 Google Places，可先手動輸入"
          className="w-full rounded-xl2 border border-ink-100 bg-white px-3 py-2.5 text-ink-800 focus:border-aqua-400 focus:outline-none"
        />
      </label>

      <TimeInput label="指定抵達時間" value={arrivalTime} onChange={setArrivalTime} />

      <TimeConstraintSelect
        value={timeConstraintType}
        onChange={setTimeConstraintType}
        graceMinutes={graceMinutes}
        onGraceMinutesChange={setGraceMinutes}
        earlyArrivalMinutes={earlyArrivalMinutes}
        onEarlyArrivalMinutesChange={setEarlyArrivalMinutes}
      />

      <TransportModeSelect value={transportMode} onChange={setTransportMode} />

      <DurationInput
        label="路程時間"
        minutes={travelMinutes}
        onChange={setTravelMinutes}
        max={240}
        hint="目前使用示範路程資料，之後串接 Google Maps 後會自動帶入"
      />

      <Collapsible title="停車與進場細節">
        <div className="space-y-4">
          <div>
            <span className="mb-1 block text-sm text-ink-500">停車設定</span>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(PARKING_MODE_LABELS) as ParkingMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setParkingMode(mode)}
                  className={`rounded-full px-3.5 py-2 text-sm transition-colors ${
                    parkingMode === mode ? "bg-aqua-500 text-white" : "bg-aqua-50 text-aqua-700 hover:bg-aqua-100"
                  }`}
                >
                  {PARKING_MODE_LABELS[mode]}
                </button>
              ))}
            </div>
          </div>

          {parkingMode !== "none" && (
            <DurationInput
              label="找車位時間"
              minutes={parkingMinutes}
              onChange={setParkingMinutes}
              max={60}
              hint={parkingMode === "auto" ? parkingEstimate?.source : "手動設定的找車位時間"}
            />
          )}

          <DurationInput label="停好車後步行時間" minutes={walkFromParkingMinutes} onChange={setWalkFromParkingMinutes} max={30} />

          <DurationInput
            label="找入口、搭電梯或報到時間"
            minutes={entryBufferMinutes}
            onChange={setEntryBufferMinutes}
            max={30}
          />

          <label className="block">
            <span className="mb-1 block text-sm text-ink-500">備註</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full rounded-xl2 border border-ink-100 bg-white px-3 py-2.5 text-ink-800 focus:border-aqua-400 focus:outline-none"
            />
          </label>
        </div>
      </Collapsible>

      <div className="flex gap-2 pt-2">
        <Button variant="ghost" onClick={onCancel} fullWidth>
          取消
        </Button>
        <Button onClick={handleSubmit} disabled={!canSave} fullWidth>
          儲存
        </Button>
      </div>
      {onDelete && (
        <Button variant="danger" onClick={onDelete} fullWidth>
          刪除這一站
        </Button>
      )}
    </div>
  );
}
