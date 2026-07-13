/** 產生一個簡單、足夠獨特的本機 ID（不需要伺服器） */
export function generateId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `${prefix}-${time}-${random}`;
}
