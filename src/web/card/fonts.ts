/**
 * 字体注册表。
 * web 字体:css(woff2 走 npmmirror CDN)由 /static/* 服务,按需加载,导出时嵌入。
 * 系统字体:family 直接写本机字体栈,零加载零嵌入(渲染机器需装有对应字体)。
 */

export interface CardFont {
  id: string;
  name: string;
  /** CSS font-family 值(单个家族或整段栈) */
  family: string;
  /** web 字体 css(可选:系统字体无) */
  cssPath?: string;
}

export const FONTS: CardFont[] = [
  {
    id: "lxgw-wenkai",
    name: "霞鹜文楷",
    family: `"LXGW WenKai"`,
    cssPath: "/static/fonts/lxgw-wenkai/lxgwwenkai-regular.css",
  },
  {
    id: "songti",
    name: "宋体(系统)",
    family: `"Songti SC", "STSong", "SimSun", "Noto Serif CJK SC", serif`,
  },
  {
    id: "heiti",
    name: "黑体(系统)",
    family: `"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif`,
  },
  {
    id: "ma-shan-zheng",
    name: "马善政楷",
    family: `"Ma Shan Zheng"`,
    cssPath: "/static/fonts/ma-shan-zheng/400.css",
  },
  {
    id: "zhi-mang-xing",
    name: "志莽行书",
    family: `"Zhi Mang Xing"`,
    cssPath: "/static/fonts/zhi-mang-xing/400.css",
  },
];

export function fontById(id: string): CardFont {
  return FONTS.find((f) => f.id === id) ?? FONTS[0]!;
}
