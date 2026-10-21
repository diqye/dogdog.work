/**
 * 卡片内容与规格:与视觉模板解耦(后期 code→image 复用导出管线)。
 * 标题/正文为富文本(html):行 = <div>,行内着色 = <span style="color:…">。
 */

/** 卡片逻辑尺寸:宽固定,高为最小高(内容多则撑高);预览 scale 适配,导出按实际尺寸 */
export const CARD_W = 1080;
export const CARD_H = 1440;

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

/** 整段文本的结构约定:首行=标题,末行 `- 署名`=落款,中间=正文 */
export type ParsedCardText = { title: string; body: string; signature: string };

/**
 * 剪贴板整段文本 → 卡片结构(标题为转义后单行 html,正文走 textToBodyHtml)。
 * 末行不匹配「- 署名」格式返回 null,由调用方提示。
 */
export function parseCardText(text: string): ParsedCardText | null {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 3) return null;
  const sig = lines.at(-1)!.match(/^-\s*(\S.*)$/);
  if (sig == null) return null;
  // 正文只去首尾空行,中间空行是分节结构要保留
  const bodyLines = lines.slice(1, -1);
  while (bodyLines.length > 0 && bodyLines[0]!.trim() === "") bodyLines.shift();
  while (bodyLines.length > 0 && bodyLines.at(-1)!.trim() === "") bodyLines.pop();
  return {
    title: escapeHtml(lines[0]!.trim()),
    body: textToBodyHtml(bodyLines.join("\n")),
    signature: sig[1]!.trim(),
  };
}
