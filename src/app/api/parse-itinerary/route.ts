import { NextRequest, NextResponse } from "next/server";
import { parseItineraryLocally } from "@/lib/aiParser";
import { ParsedItinerary } from "@/types/ai";

/**
 * POST /api/parse-itinerary
 *
 * body: { text: string }
 * 回傳固定 JSON Schema：ParsedItinerary
 * { tripTitle, date, preparationTasks, stops, unresolvedPlaces, warnings }
 *
 * 若有設定 ANTHROPIC_API_KEY（僅存在於伺服器端環境變數，不會出現在前端 bundle），
 * 會呼叫 AI 服務協助解析；否則使用本地 mock parser，確保 App 仍可完整操作。
 *
 * AI 解析規則（無論是否使用真正 AI，都必須遵守）：
 * - 不可以自己編造地址
 * - 不可以自己猜分店
 * - 不可以自己猜不存在的地點
 * - 不可以自己計算路程時間（路程時間一律交給 mapsAdapter）
 * - 不可以聲稱停車很好找
 * - 遇到不明確地點（例如「鼎泰豐」「電影院」），必須標示 unresolvedPlaces
 */

const SYSTEM_PROMPT = `你是行程規劃 App 的自然語言解析器。使用者會用一段話描述一天的行程，
請把它整理成嚴格符合以下 JSON Schema 的資料，只能回傳 JSON，不要有任何其他文字：

{
  "tripTitle": string,
  "date": string | null (YYYY-MM-DD),
  "preparationTasks": [{ "name": string, "estimatedMinutes": number }],
  "stops": [{
    "rawName": string,
    "resolvedName": string | null,
    "arrivalTime": string | null (HH:mm),
    "timeConstraintType": "strict" | "grace" | "flexible",
    "graceMinutes": number | null,
    "earlyArrivalMinutes": number | null,
    "note": string | null
  }],
  "unresolvedPlaces": string[],
  "warnings": string[]
}

規則：
- 絕對不要自己編造地址、猜分店、猜路程時間，也不要聲稱停車很好找。
- 遇到不明確的地點名稱（例如常見連鎖店、只說「電影院」而沒有指定哪一間），
  resolvedName 設為 null，並把該地點加進 unresolvedPlaces。
- 只輸出使用者實際提到的資訊，不要補充使用者沒說的細節。`;

export async function POST(request: NextRequest) {
  let body: { text?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "請求格式錯誤" }, { status: 400 });
  }

  const text = (body.text ?? "").trim();
  if (!text) {
    return NextResponse.json({ error: "請輸入行程描述" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    const result = parseItineraryLocally(text);
    return NextResponse.json(result);
  }

  try {
    const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: text }],
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI 服務回應錯誤：${aiResponse.status}`);
    }

    const data = await aiResponse.json();
    const textBlock = (data?.content ?? []).find((b: { type: string }) => b.type === "text");
    if (!textBlock?.text) {
      throw new Error("AI 回應沒有內容");
    }

    const cleaned = textBlock.text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned) as ParsedItinerary;
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("[parse-itinerary] AI 解析失敗，改用本地 mock parser", error);
    const fallback = parseItineraryLocally(text);
    fallback.warnings.unshift("AI 服務暫時無法使用，已改用本地示範解析。");
    return NextResponse.json(fallback);
  }
}
