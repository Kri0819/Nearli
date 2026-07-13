/** 出門前的準備事項，例如洗澡、化妝、挑衣服。 */
export interface PreparationTask {
  id: string;
  /** 名稱，例如「洗澡」 */
  name: string;
  /** 預估分鐘數 */
  estimatedMinutes: number;
  /** 是否啟用（本次行程是否需要做這件事） */
  enabled: boolean;
  /** 排序順序，數字越小越前面 */
  order: number;
}

/** 建立預設準備事項清單（可由使用者新增、刪除、修改、拖曳排序） */
export function createDefaultPreparationTasks(): PreparationTask[] {
  const defaults: Array<[string, number]> = [
    ["洗澡", 20],
    ["挑衣服", 15],
    ["化妝", 20],
    ["上廁所", 5],
    ["收拾包包", 10],
    ["吃東西", 15],
    ["整理儀容", 10],
    ["其他", 10],
  ];
  return defaults.map(([name, estimatedMinutes], index) => ({
    id: `prep-default-${index}`,
    name,
    estimatedMinutes,
    enabled: false,
    order: index,
  }));
}
