/**
 * 主题预设:版式 + 配色 + 字体一体化(选择粒度坍缩为一个维度,像滤镜)。
 * 三种版式:gradient 纯渐变底 / cover 图满铺做卡面背景(浅底纹理,深墨) /
 * flat 平铺(标题 → 图片带 → 诗词,文字区落纸底)。同一字体可在多个主题复用。
 */

import { fontById, type CardFont } from "./fonts";

/** 纸样:flat 主题的文字区底色,选纸即选墨(墨色随纸走,不单独配) */
export interface CardPaper {
  id: string;
  name: string;
  /** 文字区底色(纯色) */
  bg: string;
  ink: string;
  inkSoft: string;
}

export const PAPERS: CardPaper[] = [
  { id: "yuebai", name: "月白", bg: "#f7f6f1", ink: "#2b2a26", inkSoft: "#9a968c" },
  { id: "nuanmi", name: "暖米", bg: "#efe7d6", ink: "#3d3327", inkSoft: "#a68f6f" },
  { id: "daiqing", name: "黛青", bg: "#16332f", ink: "#e9f2ee", inkSoft: "#8fada5" },
  { id: "jiangsha", name: "绛纱", bg: "#f3e2de", ink: "#6b2737", inkSoft: "#b08188" },
  { id: "xuanmo", name: "玄墨", bg: "#1b1d28", ink: "#eceef6", inkSoft: "#8c92a6" },
];

export function paperById(id: string): CardPaper {
  return PAPERS.find((p) => p.id === id) ?? PAPERS[0]!;
}

/** 装裱垫层色板(卡外四周):全主题生效;投影墨色随垫层明暗配(深垫亮影、浅垫墨影) */
export interface CardMat {
  id: string;
  name: string;
  bg: string;
  /** 投影墨色(hex) */
  shadow: string;
}

export const MATS: CardMat[] = [
  { id: "yuehui", name: "月灰", bg: "#d7dade", shadow: "#0f172a" },
  { id: "chunbai", name: "纯白", bg: "#ffffff", shadow: "#334155" },
  { id: "nuanbei", name: "暖贝", bg: "#eae2d3", shadow: "#5c4a33" },
  { id: "qingci", name: "青瓷", bg: "#cfd8d4", shadow: "#2f4038" },
  { id: "xuanqing", name: "玄青", bg: "#2c3240", shadow: "#e9eef9" },
];

export function matById(id: string | null | undefined): CardMat {
  return MATS.find((m) => m.id === id) ?? MATS[0]!;
}

interface ThemeBase {
  id: string;
  name: string;
  /** 适用场景(主题卡副标题) */
  desc: string;
  /** 示例句(主题字体渲染,传达气质) */
  sample: string;
  /** 绑定字体(web 或系统栈) */
  font: CardFont;
}

interface GradientTheme extends ThemeBase {
  layout: "gradient";
  /** 背景渐变(css background 值) */
  background: string;
  ink: string;
  inkSoft: string;
}

interface CoverTheme extends ThemeBase {
  layout: "cover";
  /** 图加载前与失败的兜底色 */
  background: string;
  /** 背景图(static 路径):满铺做卡面,文字直接压图 */
  image: string;
  /** 蒙层(css background 值,叠在图上方):同色调压一屈增强文字可读,纹理杂乱时用 */
  scrim?: string;
  /** 纹理填字:笔画内直接填卡面纹理(background-clip: text),此调墨层叠在纹理上构成墨色;缺省 = 纯色压字 */
  inkLayer?: string;
  /** 墨迹揉开强度(feDisplacementMap scale):笔画边缘随表面凹凸变形,写字的物理感;缺省 = 不揉 */
  inkFlow?: number;
  ink: string;
  inkSoft: string;
}

interface FlatTheme extends ThemeBase {
  layout: "flat";
  /** 默认图组(图 + 纸底一体):图片带与纸底都是参数,主题只锁定版式与字体 */
  presetId: string;
}

type ThemeDef = GradientTheme | CoverTheme | FlatTheme;

/** 解析后的 flat 主题:图组与纸样已展开成具体值 */
export interface FlatThemeResolved extends ThemeBase {
  layout: "flat";
  background: string;
  image: string;
  paper: CardPaper;
  ink: string;
  inkSoft: string;
}

/** 解析后的主题:flat 版式的 ink/inkSoft 恒取自生效纸样 */
export type CardTheme = GradientTheme | CoverTheme | FlatThemeResolved;

/** 图组(flat 版式图片带参数):图 + 纸底一体选择,每个图配一个纸底;与主题解耦,平铺主题下可任选 */
export interface FlatPreset {
  id: string;
  name: string;
  src: string;
  paperId: string;
  /** 图加载前与失败的兜底色 */
  fallbackBg: string;
}

export const FLAT_PRESETS: FlatPreset[] = [
  { id: "xingye", name: "星野", src: "/static/images/theme-starry.jpg", paperId: "nuanmi", fallbackBg: "#0c1020" },
  { id: "xueyuan", name: "雪原", src: "/static/images/theme-snowfield.jpg", paperId: "yuebai", fallbackBg: "#1e2834" },
  { id: "muhai", name: "暮海", src: "/static/images/theme-dusksea.jpg", paperId: "nuanmi", fallbackBg: "#182232" },
  { id: "chenguang", name: "晨光", src: "/static/images/theme-dawnfield.jpg", paperId: "nuanmi", fallbackBg: "#38261a" },
  { id: "jieshi", name: "街市", src: "/static/images/theme-citydusk.jpg", paperId: "xuanmo", fallbackBg: "#141628" },
  { id: "wulin", name: "雾林", src: "/static/images/theme-mistforest.jpg", paperId: "daiqing", fallbackBg: "#16221e" },
  { id: "yunshan", name: "云山", src: "/static/images/theme-cloudmount.jpg", paperId: "yuebai", fallbackBg: "#16202e" },
];

export function flatPresetById(id: string | null | undefined): FlatPreset | null {
  return FLAT_PRESETS.find((p) => p.id === id) ?? null;
}

import type { CSSProperties } from "react";

/** 卡片/主题卡共用的背景样式。
 * 恒用长写不用 background 简写:简写↔长写切换时 React style diff 先设新值再删旧简写,
 * 删除简写会连带清掉刚设的 backgroundImage(跨形态切换丢背景的根源) */
export function themeBackgroundStyle(t: CardTheme): CSSProperties {
  switch (t.layout) {
    case "gradient":
      return { backgroundImage: t.background };
    case "cover":
      return {
        backgroundColor: t.background,
        backgroundImage: [t.scrim, `url(${t.image})`].filter((l): l is string => l != null).join(", "),
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    case "flat":
      // flat 的卡面即纸底;图片带由模板单独渲染(见 Poem.tsx)
      return { backgroundColor: t.paper.bg };
  }
}

export const THEMES: ThemeDef[] = [
  {
    layout: "gradient",
    id: "monight",
    name: "墨夜",
    desc: "夜色心事 · 现代诗",
    sample: "夜深心事明",
    background: "linear-gradient(165deg, #1f2733 0%, #10151d 100%)",
    ink: "#f2f4f8",
    inkSoft: "#8b95a5",
    font: fontById("lxgw-wenkai"),
  },
  {
    layout: "gradient",
    id: "yuebai",
    name: "月白",
    desc: "素白极简 · 短句",
    sample: "素处以默",
    background: "linear-gradient(165deg, #fdfdfc 0%, #f2f1ee 100%)",
    ink: "#262626",
    inkSoft: "#9a968f",
    font: fontById("lxgw-wenkai"),
  },
  {
    layout: "gradient",
    id: "nuansha",
    name: "暖砂",
    desc: "温暖怀旧 · 手记",
    sample: "人间烟火",
    background: "linear-gradient(165deg, #f7f1e6 0%, #ead9c2 100%)",
    ink: "#3d3327",
    inkSoft: "#a08d72",
    font: fontById("lxgw-wenkai"),
  },
  {
    layout: "gradient",
    id: "daiqing",
    name: "黛青",
    desc: "古意书法 · 古体诗",
    sample: "笔墨见古意",
    background: "linear-gradient(165deg, #123c3b 0%, #0d1f26 100%)",
    ink: "#eef5f2",
    inkSoft: "#7fa39d",
    font: fontById("ma-shan-zheng"),
  },
  {
    layout: "gradient",
    id: "muzi",
    name: "暮紫",
    desc: "浪漫抒怀 · 情诗",
    sample: "暮色与你",
    background: "linear-gradient(165deg, #3b2b4d 0%, #1c1a2e 100%)",
    ink: "#f3eefb",
    inkSoft: "#9d8fb5",
    font: fontById("lxgw-wenkai"),
  },
  {
    layout: "gradient",
    id: "zhusha",
    name: "朱砂",
    desc: "热烈吉庆 · 祝辞",
    sample: "红泥小火炉",
    background: "linear-gradient(165deg, #8c201f 0%, #5c1210 100%)",
    ink: "#f5e6c8",
    inkSoft: "#c99a7a",
    font: fontById("ma-shan-zheng"),
  },
  {
    layout: "gradient",
    id: "yanzhi",
    name: "胭脂",
    desc: "少女心绪 · 情诗",
    sample: "心事胭脂色",
    background: "linear-gradient(165deg, #f9e8e8 0%, #f0cfd0 100%)",
    ink: "#6b2737",
    inkSoft: "#a9707c",
    font: fontById("lxgw-wenkai"),
  },
  {
    layout: "gradient",
    id: "cangqing",
    name: "藏青",
    desc: "沉静克制 · 格言",
    sample: "静水流深",
    background: "linear-gradient(165deg, #1a2a4a 0%, #0d1526 100%)",
    ink: "#e6ecf7",
    inkSoft: "#7c89a6",
    font: fontById("lxgw-wenkai"),
  },
  {
    layout: "gradient",
    id: "luoxia",
    name: "落霞",
    desc: "晚霞抒怀 · 随笔",
    sample: "落霞与孤鹜",
    background: "linear-gradient(165deg, #f2c9b8 0%, #d98e73 100%)",
    ink: "#53302a",
    inkSoft: "#9c6a5d",
    font: fontById("lxgw-wenkai"),
  },
  {
    layout: "gradient",
    id: "songyan",
    name: "松烟",
    desc: "禅意留白 · 短句",
    sample: "松风煮茶",
    background: "linear-gradient(165deg, #e9ece8 0%, #ccd3cb 100%)",
    ink: "#2f3a33",
    inkSoft: "#7f8a82",
    font: fontById("lxgw-wenkai"),
  },
  {
    layout: "gradient",
    id: "xuanzhi",
    name: "宣纸",
    desc: "日常手帐 · 诗笺",
    sample: "纸上日常",
    background: "linear-gradient(165deg, #faf6ef 0%, #efe7d8 100%)",
    ink: "#3b352c",
    inkSoft: "#a39a8a",
    font: fontById("lxgw-wenkai"),
  },
  // ---------- 图片主题 ----------
  // cover:图满铺做卡面(浅底纹理,深墨字);flat:平铺版式(标题 → 图片带 → 诗词),图与纸底是参数不足成主题,只留一个代表
  {
    layout: "flat",
    id: "photo",
    name: "图文",
    desc: "图片配诗 · 杂志式",
    sample: "图文并茂",
    presetId: "xingye",
    font: fontById("lxgw-wenkai"),
  },

  {
    layout: "cover",
    id: "niupizhi",
    name: "牛皮纸",
    desc: "旧信纸 · 手记",
    sample: "见字如面",
    background: "#b29b77",
    image: "/static/images/theme-kraft.jpg",
    inkLayer: "linear-gradient(rgba(51,38,26,0.92), rgba(51,38,26,0.92))",
    inkFlow: 8,
    ink: "#33261a",
    inkSoft: "#4a3a26",
    font: fontById("ma-shan-zheng"),
  },
  {
    layout: "cover",
    id: "muwen",
    name: "木纹",
    desc: "风化木板 · 拙朴",
    sample: "岁月留痕",
    background: "#6b4a33",
    image: "/static/images/theme-wood.jpg",
    scrim: "linear-gradient(180deg, rgba(48,31,20,0.30) 0%, rgba(48,31,20,0.12) 45%, rgba(48,31,20,0.34) 100%)",
    inkLayer: "linear-gradient(rgba(243,231,216,0.90), rgba(243,231,216,0.90))",
    inkFlow: 8,
    ink: "#f3e7d8",
    inkSoft: "#d3b89a",
    font: fontById("ma-shan-zheng"),
  },
  {
    layout: "cover",
    id: "jiutie",
    name: "旧铁",
    desc: "做旧铁皮 · 锈斑",
    sample: "斑厮岁月",
    background: "#c9d2d6",
    image: "/static/images/theme-metal.jpg",
    inkLayer: "linear-gradient(rgba(46,58,66,0.90), rgba(46,58,66,0.90))",
    inkFlow: 6,
    ink: "#2e3a42",
    inkSoft: "#5d6d77",
    font: fontById("ma-shan-zheng"),
  },
];

/** 选区着色的固定色组:饱和中明度,深浅底卡面都有基本对比 —— 不跟主题走(位置恒定,所见即所得) */
const FIXED_DOTS = ["#e05a4e", "#d9a441", "#4a90d9", "#6b8f3a", "#9a5fb5", "#e07a9e"];

/** 选区气泡色点:首位墨色(取主题 ink,改回正文色用)+ 固定色组 */
export function accentDots(t: CardTheme): string[] {
  return [t.ink, ...FIXED_DOTS];
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** 解析主题:flat 版式展开生效图组(预设覆盖优先,回退主题默认),墨色取自图组纸样 */
export function resolveTheme(id: string, presetId?: string): CardTheme {
  const def = THEMES.find((t) => t.id === id) ?? THEMES[0]!;
  if (def.layout !== "flat") return def;
  const preset = flatPresetById(presetId) ?? flatPresetById(def.presetId)!;
  const paper = paperById(preset.paperId);
  return {
    ...def,
    background: preset.fallbackBg,
    image: preset.src,
    paper,
    ink: paper.ink,
    inkSoft: paper.inkSoft,
  };
}

export function themeById(id: string): CardTheme {
  return resolveTheme(id);
}
