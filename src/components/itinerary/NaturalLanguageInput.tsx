"use client";

import { useState } from "react";
import { Button } from "@/components/common/Button";
import { requestItineraryParse } from "@/lib/aiParser";
import { ParsedItinerary } from "@/types/ai";

const EXAMPLE =
  "星期六下午兩點到漢神巨蛋，六點去餐廳，餐廳可以晚十分鐘，八點看電影，電影要提早十分鐘進場。我出門前要洗澡、化妝、挑衣服。";

export function NaturalLanguageInput({ onParsed }: { onParsed: (parsed: ParsedItinerary) => void }) {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const parsed = await requestItineraryParse(text.trim());
      onParsed(parsed);
    } catch (e) {
      setError("解析失敗，請稍後再試，或改用手動建立。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-ink-800">直接告訴我今天要去哪裡</h2>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={EXAMPLE}
        rows={6}
        className="w-full rounded-xl2 border border-ink-100 bg-white px-3.5 py-3 text-sm leading-relaxed text-ink-800 focus:border-aqua-400 focus:outline-none"
      />
      <p className="text-xs text-ink-400">
        範例：「{EXAMPLE}」
      </p>
      {error && <p className="text-xs text-risk-500">{error}</p>}
      <Button fullWidth onClick={handleSubmit} disabled={isLoading || !text.trim()}>
        {isLoading ? "解析中…" : "幫我整理行程"}
      </Button>
    </div>
  );
}
