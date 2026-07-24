/**
 * Nearli 的吉祥物：白色「正圓形」的小球身體，兩隻小腳，簡單的笑臉。
 * 純 SVG 手繪，沒有外部圖片，走路時輕輕上下晃動增加可愛感。
 */
export function NearliMascot({ size = 96, className = "" }: { size?: number; className?: string }) {
  return (
    <div className={`mascot-bob ${className}`} style={{ width: size, height: size * 1.12 }}>
      <svg viewBox="0 0 120 134" width={size} height={size * 1.12} fill="none" aria-hidden>
        {/* 落地陰影 */}
        <ellipse cx="60" cy="124" rx="28" ry="6" fill="#212932" opacity="0.08" />

        {/* 兩隻小腳 */}
        <ellipse cx="42" cy="114" rx="9" ry="6.5" fill="#2e3844" />
        <ellipse cx="78" cy="114" rx="9" ry="6.5" fill="#2e3844" />

        {/* 正圓形身體 */}
        <circle cx="60" cy="62" r="50" fill="#ffffff" stroke="#dfe3e7" strokeWidth="2" />

        {/* 腮紅 */}
        <ellipse cx="34" cy="70" rx="7" ry="5" fill="#f3b4b0" opacity="0.55" />
        <ellipse cx="86" cy="70" rx="7" ry="5" fill="#f3b4b0" opacity="0.55" />

        {/* 眼睛（含小亮點，增加可愛感） */}
        <circle cx="44" cy="58" r="4.5" fill="#212932" />
        <circle cx="76" cy="58" r="4.5" fill="#212932" />
        <circle cx="45.5" cy="56.5" r="1.4" fill="#ffffff" />
        <circle cx="77.5" cy="56.5" r="1.4" fill="#ffffff" />

        {/* 微笑 */}
        <path d="M50 74C53 79 67 79 70 74" stroke="#212932" strokeWidth="3" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  );
}
