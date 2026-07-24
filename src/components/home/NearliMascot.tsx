/**
 * Nearli 的吉祥物：白色圓潤的小蛋形身體，兩隻小腳，簡單的笑臉。
 * 純 SVG 手繪，沒有外部圖片，走路時輕輕上下晃動增加可愛感。
 */
export function NearliMascot({ size = 96, className = "" }: { size?: number; className?: string }) {
  return (
    <div className={`mascot-bob ${className}`} style={{ width: size, height: size * 1.15 }}>
      <svg viewBox="0 0 120 138" width={size} height={size * 1.15} fill="none" aria-hidden>
        {/* 落地陰影 */}
        <ellipse cx="60" cy="128" rx="30" ry="6" fill="#212932" opacity="0.08" />

        {/* 兩隻小腳 */}
        <ellipse cx="40" cy="118" rx="10" ry="7" fill="#2e3844" />
        <ellipse cx="80" cy="118" rx="10" ry="7" fill="#2e3844" />

        {/* 蛋形身體 */}
        <path
          d="M60 8C86 8 104 42 104 76C104 106 85 124 60 124C35 124 16 106 16 76C16 42 34 8 60 8Z"
          fill="#ffffff"
          stroke="#dfe3e7"
          strokeWidth="2"
        />

        {/* 腮紅 */}
        <ellipse cx="35" cy="80" rx="7" ry="5" fill="#f3b4b0" opacity="0.55" />
        <ellipse cx="85" cy="80" rx="7" ry="5" fill="#f3b4b0" opacity="0.55" />

        {/* 眼睛（含小亮點，增加可愛感） */}
        <circle cx="45" cy="66" r="4.5" fill="#212932" />
        <circle cx="75" cy="66" r="4.5" fill="#212932" />
        <circle cx="46.5" cy="64.5" r="1.4" fill="#ffffff" />
        <circle cx="76.5" cy="64.5" r="1.4" fill="#ffffff" />

        {/* 微笑 */}
        <path d="M50 82C53 87 67 87 70 82" stroke="#212932" strokeWidth="3" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  );
}
