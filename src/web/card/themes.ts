/**
 * 主题预设:背景 + 墨色 + 字体 + 强调色 一体化(选择粒度坍缩为一个维度,像滤镜)。
 * 同一字体可在多个主题复用;选区着色气泡的色点由主题 accents 提供。
 */

import { fontById, type CardFont } from "./fonts";

export interface CardTheme {
  id: string;
  name: string;
  /** 适用场景(主题卡副标题) */
  desc: string;
  /** 示例句(主题字体渲染,传达气质) */
  sample: string;
  /** 纯色背景/图片主题的打底色(图加载前与失败兕底) */
  background: string;
  /** 背景图(static 路径):设置后三层渲染(图 cover → scrim → 文字) */
  image?: string;
  /** 图片蒙层(css background 值,盖在图上增强文字可读):直排主题留空 */
  scrim?: string;
  /** 正文顶对齐:留白直排图的留白区在上部,垂直居中会压到图主体 */
  bodyTop?: boolean;
  ink: string;
  inkSoft: string;
  /** 绑定字体(web 或系统栈) */
  font: CardFont;
  /** 选区气泡色点(深底配亮色,浅底配沉色) */
  accents: string[];
}

import type { CSSProperties } from "react";

/** 卡片/主题卡共用的背景样式:图片主题 = 打底色 + scrim(可选) + 图层 cover,纯渐变主题 = 渐变。
 * 恒用长写不用 background 简写:简写↔长写切换时 React style diff 先设新值再删旧简写,
 * 删除简写会连带清掉刚设的 backgroundImage(跨形态切换丢背景的根源) */
export function themeBackgroundStyle(t: CardTheme): CSSProperties {
  const layers = [t.scrim, t.image != null ? `url(${t.image})` : null].filter((l): l is string => l != null);
  return {
    ...(t.image != null
      ? { backgroundColor: t.background, backgroundSize: "cover", backgroundPosition: "center" }
      : {}),
    backgroundImage: layers.length > 0 ? layers.join(", ") : t.background,
  };
}

export const THEMES: CardTheme[] = [
  {
    id: "monight",
    name: "墨夜",
    desc: "夜色心事 · 现代诗",
    sample: "夜深心事明",
    background: "linear-gradient(165deg, #1f2733 0%, #10151d 100%)",
    ink: "#f2f4f8",
    inkSoft: "#8b95a5",
    font: fontById("lxgw-wenkai"),
    accents: ["#e05a4e", "#d9a441", "#6fb3a8", "#7fa3c8"],
  },
  {
    id: "yuebai",
    name: "月白",
    desc: "素白极简 · 短句",
    sample: "素处以默",
    background: "linear-gradient(165deg, #fdfdfc 0%, #f2f1ee 100%)",
    ink: "#262626",
    inkSoft: "#9a968f",
    font: fontById("lxgw-wenkai"),
    accents: ["#c0392b", "#2c5f8a", "#6b7a3a", "#8a5f9e"],
  },
  {
    id: "nuansha",
    name: "暖砂",
    desc: "温暖怀旧 · 手记",
    sample: "人间烟火",
    background: "linear-gradient(165deg, #f7f1e6 0%, #ead9c2 100%)",
    ink: "#3d3327",
    inkSoft: "#a08d72",
    font: fontById("lxgw-wenkai"),
    accents: ["#a0522d", "#2f6690", "#7d4a6b", "#3d3327"],
  },
  {
    id: "daiqing",
    name: "黛青",
    desc: "古意书法 · 古体诗",
    sample: "笔墨见古意",
    background: "linear-gradient(165deg, #123c3b 0%, #0d1f26 100%)",
    ink: "#eef5f2",
    inkSoft: "#7fa39d",
    font: fontById("ma-shan-zheng"),
    accents: ["#e8b04b", "#e07a5f", "#83c5be", "#c8d8f0"],
  },
  {
    id: "muzi",
    name: "暮紫",
    desc: "浪漫抒怀 · 情诗",
    sample: "暮色与你",
    background: "linear-gradient(165deg, #3b2b4d 0%, #1c1a2e 100%)",
    ink: "#f3eefb",
    inkSoft: "#9d8fb5",
    font: fontById("lxgw-wenkai"),
    accents: ["#e6a4c4", "#d9b26f", "#9fc5e8", "#b39ddb"],
  },
  {
    id: "zhusha",
    name: "朱砂",
    desc: "热烈吉庆 · 祝辞",
    sample: "红泥小火炉",
    background: "linear-gradient(165deg, #8c201f 0%, #5c1210 100%)",
    ink: "#f5e6c8",
    inkSoft: "#c99a7a",
    font: fontById("ma-shan-zheng"),
    accents: ["#e8b04b", "#f2a65a", "#e77e6d"],
  },
  {
    id: "zhusha-wenkai",
    name: "朱砂",
    desc: "热烈吉庆 · 祝辞",
    sample: "红泥小火炉",
    background: "linear-gradient(165deg, #8c201f 0%, #5c1210 100%)",
    ink: "#f5e6c8",
    inkSoft: "#c99a7a",
    font: fontById("lxgw-wenkai"),
    accents: ["#e8b04b", "#f2a65a", "#e77e6d"],
  },
  {
    id: "zhusha-xing",
    name: "朱砂",
    desc: "热烈吉庆 · 祝辞",
    sample: "红泥小火炉",
    background: "linear-gradient(165deg, #8c201f 0%, #5c1210 100%)",
    ink: "#f5e6c8",
    inkSoft: "#c99a7a",
    font: fontById("zhi-mang-xing"),
    accents: ["#e8b04b", "#f2a65a", "#e77e6d"],
  },
  {
    id: "zhuqing",
    name: "竹青",
    desc: "山居田园 · 笔记",
    sample: "山静似太古",
    background: "linear-gradient(165deg, #2d4a3e 0%, #16261f 100%)",
    ink: "#e8f0e9",
    inkSoft: "#8fa89a",
    font: fontById("lxgw-wenkai"),
    accents: ["#d9c48f", "#a8c5a0", "#7fa8c9", "#d97b66"],
  },
  {
    id: "yanzhi",
    name: "胭脂",
    desc: "少女心绪 · 情诗",
    sample: "心事胭脂色",
    background: "linear-gradient(165deg, #f9e8e8 0%, #f0cfd0 100%)",
    ink: "#6b2737",
    inkSoft: "#a9707c",
    font: fontById("lxgw-wenkai"),
    accents: ["#b3426b", "#8a5f9e", "#5f7a8a", "#6b2737"],
  },
  {
    id: "cangqing",
    name: "藏青",
    desc: "沉静克制 · 格言",
    sample: "静水流深",
    background: "linear-gradient(165deg, #1a2a4a 0%, #0d1526 100%)",
    ink: "#e6ecf7",
    inkSoft: "#7c89a6",
    font: fontById("lxgw-wenkai"),
    accents: ["#d9a441", "#7fb3d0", "#c98fa8", "#9fc5a8"],
  },
  {
    id: "luoxia",
    name: "落霞",
    desc: "晚霞抒怀 · 随笔",
    sample: "落霞与孤鹜",
    background: "linear-gradient(165deg, #f2c9b8 0%, #d98e73 100%)",
    ink: "#53302a",
    inkSoft: "#9c6a5d",
    font: fontById("lxgw-wenkai"),
    accents: ["#8c3b3b", "#5f4a6b", "#3f5e5a", "#53302a"],
  },
  {
    id: "songyan",
    name: "松烟",
    desc: "禅意留白 · 短句",
    sample: "松风煮茶",
    background: "linear-gradient(165deg, #e9ece8 0%, #ccd3cb 100%)",
    ink: "#2f3a33",
    inkSoft: "#7f8a82",
    font: fontById("lxgw-wenkai"),
    accents: ["#4a6b5a", "#6b5f4a", "#4a5a6b", "#2f3a33"],
  },
  {
    id: "xuanzhi",
    name: "宣纸",
    desc: "日常手帐 · 诗笺",
    sample: "纸上日常",
    background: "linear-gradient(165deg, #faf6ef 0%, #efe7d8 100%)",
    ink: "#3b352c",
    inkSoft: "#a39a8a",
    font: fontById("lxgw-wenkai"),
    accents: ["#8a5f3b", "#4a5a6b", "#6b4a5a", "#3b352c"],
  },
  // ---------- 图片主题:三层渲染(图 cover → 蒙层 → 文字),统一浅字,蒙层按图色调压暗 ----------
  // bodyTop 主题正文顶对齐:蒙层三段式(顶部深保白字/中部透出图/底部中深保落款)
  {
    id: "xingye",
    name: "星野",
    desc: "银河雪山 · 独处",
    sample: "今夜星光",
    background: "#0c1020",
    image: "/static/images/theme-starry.jpg",
    scrim: "linear-gradient(180deg, rgba(12,16,32,0.30) 0%, rgba(12,16,32,0.45) 55%, rgba(12,16,32,0.62) 100%)",
    ink: "#f0f3fa",
    inkSoft: "#adb8cc",
    font: fontById("lxgw-wenkai"),
    accents: ["#e8d28a", "#9fc5e8", "#c9a8e8", "#f0f3fa"],
  },
  {
    id: "xueyuan",
    name: "雪原",
    desc: "雪地雾凇 · 留白",
    sample: "落雪无声",
    background: "#1e2834",
    image: "/static/images/theme-snowfield.jpg",
    bodyTop: true,
    scrim: "linear-gradient(180deg, rgba(30,40,52,0.52) 0%, rgba(30,40,52,0.24) 40%, rgba(30,40,52,0.42) 100%)",
    ink: "#f6f7f9",
    inkSoft: "#c5cbd3",
    font: fontById("ma-shan-zheng"),
    accents: ["#e8d28a", "#a8cbe8", "#e8a8a0", "#f6f7f9"],
  },
  {
    id: "muhai",
    name: "暮海",
    desc: "黄昏海面 · 思念",
    sample: "海是暮色的",
    background: "#182232",
    image: "/static/images/theme-dusksea.jpg",
    bodyTop: true,
    scrim: "linear-gradient(180deg, rgba(24,34,50,0.52) 0%, rgba(24,34,50,0.26) 40%, rgba(24,34,50,0.44) 100%)",
    ink: "#f5f3ee",
    inkSoft: "#c3c3bd",
    font: fontById("long-cang"),
    accents: ["#e8c98a", "#a8c8e0", "#d8a8c0", "#f5f3ee"],
  },
  {
    id: "chenguang",
    name: "晨光",
    desc: "日出薄雾 · 希望",
    sample: "天光渐亮",
    background: "#38261a",
    image: "/static/images/theme-dawnfield.jpg",
    bodyTop: true,
    scrim: "linear-gradient(180deg, rgba(56,38,26,0.50) 0%, rgba(56,38,26,0.24) 40%, rgba(56,38,26,0.42) 100%)",
    ink: "#fbf5ec",
    inkSoft: "#d3c4b3",
    font: fontById("lxgw-wenkai"),
    accents: ["#f0d8a0", "#f0b8a8", "#d8e0c0", "#fbf5ec"],
  },
  {
    id: "jieshi",
    name: "街市",
    desc: "城市灯火 · 烟火气",
    sample: "灯火可亲",
    background: "#141628",
    image: "/static/images/theme-citydusk.jpg",
    scrim: "linear-gradient(180deg, rgba(20,22,40,0.35) 0%, rgba(20,22,40,0.55) 70%, rgba(16,18,34,0.68) 100%)",
    ink: "#f4f1e8",
    inkSoft: "#b5b2a6",
    font: fontById("zhi-mang-xing"),
    accents: ["#e8b04b", "#e6a4c4", "#9fc5e8", "#f4f1e8"],
  },
  {
    id: "wulin",
    name: "雾林",
    desc: "雾中针叶 · 静谧",
    sample: "雾散见林",
    background: "#16221e",
    image: "/static/images/theme-mistforest.jpg",
    bodyTop: true,
    scrim: "linear-gradient(180deg, rgba(22,34,30,0.52) 0%, rgba(22,34,30,0.26) 40%, rgba(22,34,30,0.44) 100%)",
    ink: "#f2f5f3",
    inkSoft: "#becac4",
    font: fontById("lxgw-wenkai"),
    accents: ["#d8e8b0", "#a8d0c8", "#e0d0a0", "#f2f5f3"],
  },
  {
    id: "yunshan",
    name: "云山",
    desc: "层山雾霭 · 出世",
    sample: "山色有无中",
    background: "#16202e",
    image: "/static/images/theme-cloudmount.jpg",
    bodyTop: true,
    scrim: "linear-gradient(180deg, rgba(22,32,46,0.52) 0%, rgba(22,32,46,0.26) 40%, rgba(22,32,46,0.44) 100%)",
    ink: "#f2f4f8",
    inkSoft: "#c0c8d4",
    font: fontById("long-cang"),
    accents: ["#a8cbe8", "#e8d28a", "#c8d8e8", "#f2f4f8"],
  },
];

export function themeById(id: string): CardTheme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]!;
}
