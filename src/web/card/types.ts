/**
 * 卡片内容与规格:与视觉模板解耦(后期 code→image 复用导出管线)。
 * 标题/正文为富文本(html):行 = <div>,行内着色 = <span style="color:…">。
 */

/** 卡片逻辑尺寸:宽固定,高为最小高(内容多则撑高);预览 scale 适配,导出按实际尺寸 */
export const CARD_W = 1080;
export const CARD_H = 1440;
/** 导出垫层 padding(卡外四周):预览缩放/导出尺寸计算都带它 */
export const CARD_PAD = 72;

/** 卡面投影规格:预览拼 CSS box-shadow;导出走 canvas shadow 合成
 * (WebKit 在 SVG foreignObject 里渲染 box-shadow 有 bug —— iOS 导出阴影右半发重,故导出不含 CSS 阴影) */
export interface ShadowSpec {
  x: number;
  y: number;
  blur: number;
  color: string;
}

/** 双墨投影几何:近影勾边 + 远影浮起;向下延伸(y+blur)不得超垫层 padding 72,否则合成时切边 */
const SHADOW_GEOMS = [
  { x: 0, y: 6, blur: 18, alpha: 0.12 },
  { x: 0, y: 24, blur: 48, alpha: 0.22 },
] as const;

/** 默认投影墨色:近黑的蓝灰(浅色垫层上用);深色垫层应配亮色(见装裱色板) */
export const SHADOW_INK = "#0f172a";

/** 投影墨色 → 完整投影规格:同一几何,颜色随装裱换 */
export function shadowSpecs(ink: string): ShadowSpec[] {
  return SHADOW_GEOMS.map((g) => ({ ...g, color: hexToRgba(ink, g.alpha) }));
}

export const shadowCss = (specs: ShadowSpec[]): string => specs.map((s) => `${s.x}px ${s.y}px ${s.blur}px ${s.color}`).join(", ");

function hexToRgba(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export interface CardContent {
  /** 单行富文本(html),空串 = 不渲染 */
  title: string;
  /** 多行富文本(html):行 = <div>,空行 = <div><br></div> */
  body: string;
  /** 落款署名(空 = 不渲染) */
  signature: string;
  /** 落款日期(空 = 不渲染) */
  date: string;
}

/** 富文本 → 纯文本(标签剥除) */
export function stripHtml(html: string): string {
  return html.replace(/<br\s*\/?>/gi, "\n").replace(/<\/div>/gi, "\n").replace(/<[^>]*>/g, "");
}

/** 字号/对齐/署名位:字面量单一来源(模板 prop 与分享链接 zod 校验共用) */
export const FONT_SIZES = ["s", "m", "l"] as const;
export type FontSize = (typeof FONT_SIZES)[number];
export const ALIGNS = ["left", "center", "right"] as const;
export type Align = (typeof ALIGNS)[number];
export const SIG_POSITIONS = ["br", "under-title"] as const;
export type SigPos = (typeof SIG_POSITIONS)[number];

/** 纯文本行 → 正文 html */
export function textToBodyHtml(text: string): string {
  return text
    .split("\n")
    .map((line) => (line.trim() === "" ? "<div><br></div>" : `<div>${escapeHtml(line)}</div>`))
    .join("");
}

export { escapeHtml } from "../lib/html";
import { escapeHtml } from "../lib/html";

/** 粘贴解析结果:字段只在命中时存在,调用方按需覆盖,未命中项不动现有内容 */
export type ParsedCardText = { title?: string; body: string; signature?: string };

/**
 * 剪贴板整段文本 → 卡片结构(标题为转义后单行 html,正文走 textToBodyHtml)。
 * 末行命中「- 署名」→ 完整三段(首行标题/中间正文/署名);
 * 否则只覆盖正文(全部文本进正文,标题与署名不动)。空文本返回 null 由调用方提示。
 */
export function parseCardText(text: string): ParsedCardText | null {
  const trimmed = text.trim();
  if (trimmed === "") return null;
  const lines = trimmed.split(/\r?\n/);
  const sig = lines.length >= 3 ? lines.at(-1)!.match(/^-\s*(\S.*)$/) : null;
  const bodyLines = sig != null ? lines.slice(1, -1) : lines;
  // 正文只去首尾空行,中间空行是分节结构要保留
  while (bodyLines.length > 0 && bodyLines[0]!.trim() === "") bodyLines.shift();
  while (bodyLines.length > 0 && bodyLines.at(-1)!.trim() === "") bodyLines.pop();
  return {
    ...(sig != null ? { title: escapeHtml(lines[0]!.trim()) } : {}),
    body: textToBodyHtml(bodyLines.join("\n")),
    ...(sig != null ? { signature: sig[1]!.trim() } : {}),
  };
}

/** html 片段 → 纯文本:剥标签 + 还原实体(escapeHtml 的逆) */
function htmlToText(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

/** 正文 html → 纯文本行:行 = <div>,边界即换行(stripHtml 会把空行翻倍,复制走这条) */
function bodyHtmlToText(html: string): string {
  return html
    .split(/<\/div>/i)
    .map((chunk) => htmlToText(chunk))
    .join("\n")
    .replace(/\n+$/, "");
}

/**
 * 卡片 → 整段文本(粘贴解析的逆操作):标题 + 正文行 + 末行「- 署名」。
 * 多页正文以空行相连(回贴为单页长图);标题行保留占位(空标题回贴不吞正文首行);署名空则省略末行。
 */
export function cardToText(title: string, bodies: string[], signature: string): string {
  const bodyText = bodies.map(bodyHtmlToText).filter((t) => t.trim() !== "").join("\n\n");
  const t = htmlToText(title).trim();
  const parts: string[] = [];
  if (t !== "" || bodyText !== "") parts.push(t, bodyText);
  const sig = signature.trim();
  if (sig !== "") parts.push(`- ${sig}`);
  return parts.join("\n");
}
