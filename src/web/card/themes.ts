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
  background: string;
  ink: string;
  inkSoft: string;
  /** 绑定字体(web 或系统栈) */
  font: CardFont;
  /** 选区气泡色点(深底配亮色,浅底配沉色) */
  accents: string[];
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
    font: fontById("songti"),
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
    font: fontById("heiti"),
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
];

export function themeById(id: string): CardTheme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]!;
}
