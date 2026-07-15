import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // 桌面版背景，比 App 畫布（cream）稍深一點
        page: "#efe6d6",
        // 柔和水藍主色
        aqua: {
          50: "#f2fafb",
          100: "#e1f2f5",
          200: "#c3e5eb",
          300: "#98d0da",
          400: "#6cb6c4",
          500: "#4a99aa",
          600: "#3a7c8c",
          700: "#316472",
          800: "#2b515d",
          900: "#26444e",
        },
        // 米白背景
        cream: {
          50: "#fdfcfa",
          100: "#faf7f2",
          200: "#f3ede2",
        },
        // 深藍灰文字（50-300 為淺色分隔線／底色，400-800 為文字）
        ink: {
          50: "#f7f8f9",
          100: "#eef0f2",
          200: "#dfe3e7",
          300: "#c7ced4",
          400: "#6b7684",
          500: "#525f6e",
          600: "#3e4956",
          700: "#2e3844",
          800: "#212932",
        },
        // 橘紅：遲到風險
        risk: {
          50: "#fdf1ec",
          100: "#fbe0d4",
          400: "#e0784a",
          500: "#c95f33",
          600: "#a94a24",
        },
        // 綠色：時間充足
        ok: {
          50: "#eef7f0",
          100: "#dcefe1",
          400: "#5fa872",
          500: "#4a8f5c",
          600: "#3b7349",
        },
        // 黃：時間偏緊
        warn: {
          50: "#fbf5e8",
          100: "#f5e7c4",
          400: "#c9973e",
          500: "#ab7d2c",
        },
      },
      fontFamily: {
        sans: [
          '"Noto Sans TC"',
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        // 卡片：貼近、柔和的雙層陰影，比單層 blur 更有「浮起」的實體感
        soft: "0 1px 2px 0 rgba(33, 41, 50, 0.04), 0 8px 20px -6px rgba(33, 41, 50, 0.10)",
        // 底部導覽列：往上投影，讓導覽列有輕微懸浮感
        "nav-lift": "0 -2px 12px -2px rgba(33, 41, 50, 0.08)",
        // 主要按鈕：極輕的落陰影，增加可點擊的實體感
        tap: "0 1px 2px 0 rgba(33, 41, 50, 0.12)",
      },
    },
  },
  plugins: [],
};
export default config;
