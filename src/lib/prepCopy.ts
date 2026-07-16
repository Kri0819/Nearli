/**
 * 首頁文案語氣：安靜、溫柔、自然，不裝可愛、不裝人工智慧、不濫用 emoji。
 * 這裡只負責把任務名稱轉成自然的中文短句，不影響任何資料結構或計算邏輯。
 */

interface TaskPhrase {
  /** 「現在去洗澡」這種現在式短句 */
  go: string;
  /** 完成按鈕文案，例如「洗好了」 */
  done: string;
}

const TASK_PHRASES: Record<string, TaskPhrase> = {
  洗澡: { go: "現在去洗澡", done: "洗好了" },
  化妝: { go: "現在化妝", done: "化好了" },
  挑衣服: { go: "現在挑衣服", done: "挑好了" },
  換衣服: { go: "現在換衣服", done: "換好了" },
  收拾包包: { go: "現在收拾包包", done: "收拾好了" },
  整理包包: { go: "現在整理包包", done: "整理好了" },
  上廁所: { go: "現在上廁所", done: "好了" },
  吃東西: { go: "現在吃東西", done: "吃完了" },
  吃早餐: { go: "現在吃早餐", done: "吃完了" },
  整理儀容: { go: "現在整理儀容", done: "弄好了" },
  吹頭髮: { go: "現在吹頭髮", done: "吹好了" },
  其他: { go: "現在準備一下", done: "完成" },
};

/** 「現在去洗澡」這種現在式短句，找不到對應詞彙時退回通用說法 */
export function getTaskGoPhrase(taskName: string): string {
  return TASK_PHRASES[taskName]?.go ?? `現在${taskName}`;
}

/** 完成這個事項的按鈕文案，例如「洗好了」，找不到對應詞彙時用「完成」 */
export function getTaskDonePhrase(taskName: string): string {
  return TASK_PHRASES[taskName]?.done ?? "完成";
}
