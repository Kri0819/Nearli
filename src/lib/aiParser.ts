import { ParsedItinerary, ParsedStop } from "@/types/ai";
import { TimeConstraintType } from "@/types/stop";

/**
 * 本地 mock 自然語言解析器。
 *
 * 這不是真正的大型語言模型，而是規則式的關鍵字與時間解析，
 * 目的是在沒有設定 AI API Key 時，App 仍然可以完整操作與展示。
 * 真正接上 AI 服務時，請改由 /api/parse-itinerary 呼叫外部模型，
 * 並保持相同的回傳 JSON 結構（ParsedItinerary）。
 *
 * 規則：
 * - 絕對不自己編造地址、猜分店、猜路程時間、聲稱停車好找。
 * - 遇到「電影院」「鼎泰豐」等不明確地點，一律標記為 unresolvedPlaces。
 */

const CHINESE_DIGITS: Record<string, number> = {
  〇: 0, 一: 1, 二: 2, 兩: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10,
};

const WEEKDAY_MAP: Record<string, number> = {
  日: 0, 天: 0, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6,
};

/** known 地點名稱可能造成分店混淆，需標記為待確認 */
const AMBIGUOUS_PLACE_KEYWORDS = ["電影", "鼎泰豐", "餐廳", "百貨", "diner", "影城"];

const KNOWN_PREP_TASKS: Array<{ names: string[]; minutes: number }> = [
  { names: ["洗澡"], minutes: 20 },
  { names: ["挑衣服", "換衣服"], minutes: 15 },
  { names: ["化妝"], minutes: 20 },
  { names: ["上廁所"], minutes: 5 },
  { names: ["收拾包包", "整理包包"], minutes: 10 },
  { names: ["吃東西", "吃飯", "吃早餐"], minutes: 15 },
  { names: ["整理儀容", "整理頭髮", "吹頭髮"], minutes: 10 },
];

function chineseNumberToArabic(text: string): number | null {
  if (/^\d+$/.test(text)) return parseInt(text, 10);
  if (!text) return null;

  // 例如「十」「十五」「二十」「兩」
  if (text === "十") return 10;
  const tenIndex = text.indexOf("十");
  if (tenIndex >= 0) {
    const tensPart = text.slice(0, tenIndex);
    const onesPart = text.slice(tenIndex + 1);
    const tens = tensPart ? (CHINESE_DIGITS[tensPart] ?? 1) : 1;
    const ones = onesPart ? CHINESE_DIGITS[onesPart] ?? 0 : 0;
    return tens * 10 + ones;
  }
  if (text.length === 1 && text in CHINESE_DIGITS) return CHINESE_DIGITS[text];
  return null;
}

/** 找出下一個符合星期幾的日期（含今天） */
function resolveDateFromWeekday(weekdayChar: string, now: Date): string {
  const targetDow = WEEKDAY_MAP[weekdayChar];
  if (targetDow === undefined) return "";
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let diff = targetDow - today.getDay();
  if (diff < 0) diff += 7;
  const target = new Date(today.getTime() + diff * 86_400_000);
  const y = target.getFullYear();
  const m = String(target.getMonth() + 1).padStart(2, "0");
  const d = String(target.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function resolveDate(text: string, now: Date): string | null {
  if (text.includes("今天")) {
    return resolveDateFromWeekday(["日", "一", "二", "三", "四", "五", "六"][now.getDay()], now);
  }
  if (text.includes("明天")) {
    const tomorrow = new Date(now.getTime() + 86_400_000);
    return resolveDateFromWeekday(["日", "一", "二", "三", "四", "五", "六"][tomorrow.getDay()], now);
  }
  const weekdayMatch = text.match(/(?:星期|週|周)([一二三四五六日天])/);
  if (weekdayMatch) {
    return resolveDateFromWeekday(weekdayMatch[1], now);
  }
  return null;
}

interface TimeMatch {
  hour: number;
  minute: number;
  index: number;
  matchLength: number;
}

function findTimeMatches(text: string): TimeMatch[] {
  const results: TimeMatch[] = [];

  // 24 小時制，例如 14:00 或 14點30分
  const digitTimeRegex = /(上午|下午|早上|晚上|凌晨)?(\d{1,2})[:點:](\d{1,2})?分?/g;
  let match: RegExpExecArray | null;
  while ((match = digitTimeRegex.exec(text)) !== null) {
    let hour = parseInt(match[2], 10);
    const minute = match[3] ? parseInt(match[3], 10) : 0;
    const period = match[1];
    if (period === "下午" || period === "晚上") {
      if (hour < 12) hour += 12;
    }
    if (period === "凌晨" && hour === 12) hour = 0;
    results.push({ hour, minute, index: match.index, matchLength: match[0].length });
  }

  // 中文數字時間，例如 兩點 / 八點半 / 下午兩點
  const chineseTimeRegex = /(上午|下午|早上|晚上|凌晨)?([一二三四五六七八九十兩]{1,2})點半?/g;
  while ((match = chineseTimeRegex.exec(text)) !== null) {
    const period = match[1];
    let hour = chineseNumberToArabic(match[2]) ?? 0;
    const minute = match[0].endsWith("半") ? 30 : 0;
    if (period === "下午" || period === "晚上") {
      if (hour < 12) hour += 12;
    }
    // 避免與數字版重複收錄同一段文字
    const overlaps = results.some((r) => match!.index < r.index + r.matchLength && r.index < match!.index + match![0].length);
    if (!overlaps) {
      results.push({ hour, minute, index: match.index, matchLength: match[0].length });
    }
  }

  return results.sort((a, b) => a.index - b.index);
}

function extractMinutesNear(text: string, keyword: RegExp): number | null {
  const match = text.match(keyword);
  if (!match) return null;
  const numText = match[1];
  return chineseNumberToArabic(numText);
}

function guessPlaceName(segmentBeforeTime: string, segmentAfterTime: string): string {
  // 「到 X」「去 X」在時間之前或之後都可能出現
  const combined = `${segmentBeforeTime} ${segmentAfterTime}`;
  const toMatch = combined.match(/(?:到|去|抵達)([^\s，,。]{2,10})/);
  if (toMatch) return toMatch[1];

  const seeMatch = combined.match(/看([^\s，,。]{1,10})/);
  if (seeMatch) return `${seeMatch[1]}院`;

  return combined.trim().slice(0, 10) || "未命名地點";
}

function isAmbiguousPlace(name: string): boolean {
  return AMBIGUOUS_PLACE_KEYWORDS.some((kw) => name.includes(kw));
}

function inferConstraint(segment: string): {
  type: TimeConstraintType;
  graceMinutes: number | null;
  earlyArrivalMinutes: number | null;
} {
  if (/提早|提前/.test(segment)) {
    const early = extractMinutesNear(segment, /提(?:早|前)([一二三四五六七八九十兩\d]+)分鐘/);
    return { type: "strict", graceMinutes: null, earlyArrivalMinutes: early ?? 10 };
  }
  if (/晚|寬限/.test(segment)) {
    const grace = extractMinutesNear(segment, /晚([一二三四五六七八九十兩\d]+)分鐘/);
    return { type: "grace", graceMinutes: grace ?? 10, earlyArrivalMinutes: null };
  }
  if (/電影|火車|飛機|考試|面試|報到|車票/.test(segment)) {
    return { type: "strict", graceMinutes: null, earlyArrivalMinutes: 10 };
  }
  return { type: "flexible", graceMinutes: null, earlyArrivalMinutes: null };
}

function extractPreparationTasks(text: string): Array<{ name: string; estimatedMinutes: number }> {
  const found: Array<{ name: string; estimatedMinutes: number }> = [];
  for (const task of KNOWN_PREP_TASKS) {
    for (const name of task.names) {
      if (text.includes(name)) {
        found.push({ name: task.names[0], estimatedMinutes: task.minutes });
        break;
      }
    }
  }
  return found;
}

export function parseItineraryLocally(text: string, now: Date = new Date()): ParsedItinerary {
  const warnings: string[] = [
    "目前使用本地示範解析（未設定 AI API Key），僅能辨識簡單的時間與地點用語，請於下方確認每一站內容。",
  ];
  const unresolvedPlaces: string[] = [];

  const date = resolveDate(text, now);
  if (!date) {
    warnings.push("無法判斷行程日期，請手動選擇日期。");
  }

  const timeMatches = findTimeMatches(text);
  const stops: ParsedStop[] = [];

  timeMatches.forEach((tm, index) => {
    const segStart = index === 0 ? 0 : timeMatches[index - 1].index + timeMatches[index - 1].matchLength;
    const segEnd = index === timeMatches.length - 1 ? text.length : timeMatches[index + 1].index;
    const before = text.slice(segStart, tm.index);
    const after = text.slice(tm.index + tm.matchLength, segEnd);
    const fullSegment = text.slice(segStart, segEnd);

    const rawName = guessPlaceName(before, after);
    const ambiguous = isAmbiguousPlace(rawName);
    if (ambiguous) unresolvedPlaces.push(rawName);

    const constraint = inferConstraint(fullSegment);
    const arrivalTime = `${String(tm.hour).padStart(2, "0")}:${String(tm.minute).padStart(2, "0")}`;

    stops.push({
      rawName,
      resolvedName: ambiguous ? null : rawName,
      arrivalTime,
      timeConstraintType: constraint.type,
      graceMinutes: constraint.graceMinutes,
      earlyArrivalMinutes: constraint.earlyArrivalMinutes,
      note: null,
    });
  });

  if (stops.length === 0) {
    warnings.push("沒有辨識出任何停靠點時間，請手動新增。");
  }

  const preparationTasks = extractPreparationTasks(text);

  return {
    tripTitle: "新行程",
    date,
    preparationTasks,
    stops,
    unresolvedPlaces: Array.from(new Set(unresolvedPlaces)),
    warnings,
  };
}

/** 從前端呼叫解析 API（伺服器端會決定使用真正的 AI 或本地 mock） */
export async function requestItineraryParse(text: string): Promise<ParsedItinerary> {
  const response = await fetch("/api/parse-itinerary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) {
    throw new Error("解析行程時發生錯誤，請稍後再試。");
  }
  return (await response.json()) as ParsedItinerary;
}
