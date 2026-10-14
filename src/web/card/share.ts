/**
 * 分享链接:卡片全量参数(内容+排版设置)编码进 ?c= 查询参数,打开即还原。
 * 编码 JSON → encodeURIComponent → base64url(query 安全);
 * 解码走 zod 校验,链接被截断/手改坏一律静默回退默认内容。
 */

import { z } from "zod";
import { FONT_SIZES, ALIGNS, SIG_POSITIONS } from "./types";

export const CardStateSchema = z.object({
  /** 标题/每页正文均为富文本 html */
  title: z.string(),
  pages: z.array(z.string()).min(1),
  signature: z.string(),
  sigOn: z.boolean(),
  sigPos: z.enum(SIG_POSITIONS),
  dateOn: z.boolean(),
  themeId: z.string(),
  fontSize: z.enum(FONT_SIZES),
  align: z.enum(ALIGNS),
});

export type CardState = z.infer<typeof CardStateSchema>;

export function encodeCardState(s: CardState): string {
  // btoa 不认非 Latin1(中文/富文本),必须先 encodeURIComponent 再 base64
  const b64 = btoa(encodeURIComponent(JSON.stringify(s)));
  return b64.replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

export function decodeCardState(code: string): CardState | null {
  try {
    const b64 = code.replaceAll("-", "+").replaceAll("_", "/");
    return CardStateSchema.parse(JSON.parse(decodeURIComponent(atob(b64))));
  } catch {
    return null;
  }
}
