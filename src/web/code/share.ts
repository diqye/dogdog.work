/**
 * 分享链接:代码卡全量参数编码进 ?c= 查询参数,打开即还原。
 * 与诗卡结构独立(distinct types),编解码底座共用 lib/codec。
 */

import { z } from "zod";
import { encodeParam, decodeParam } from "../lib/codec";
import { CODE_LANGS } from "./languages";
import { CODE_THEMES } from "./themes";

export const CODE_FONT_SIZES = ["s", "m", "l"] as const;
export type CodeFontSize = (typeof CODE_FONT_SIZES)[number];

export const CodeStateSchema = z.object({
  code: z.string(),
  lang: z.enum(CODE_LANGS.map((l) => l.id) as [string, ...string[]]),
  themeId: z.enum(CODE_THEMES.map((t) => t.id) as [string, ...string[]]),
  filename: z.string(),
  fontSize: z.enum(CODE_FONT_SIZES),
  ligatures: z.boolean(),
  wrap: z.boolean(),
});

export type CodeState = z.infer<typeof CodeStateSchema>;

export const encodeCodeState = (s: CodeState): string => encodeParam(s);
export const decodeCodeState = (code: string): CodeState | null => decodeParam(code, CodeStateSchema);
