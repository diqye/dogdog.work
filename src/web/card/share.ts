/**
 * 分享链接:诗卡全量参数(内容+排版设置)编码进 ?c= 查询参数,打开即还原。
 * 编解码底座在 lib/codec;此处只持诗卡 schema。
 */

import { z } from "zod";
import { encodeParam, decodeParam } from "../lib/codec";
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
  /** 平铺版式图组(flat 主题):图+纸底一体的预制组合,null/缺省 = 主题默认。上传图不进链接(预制图限定) */
  presetId: z.string().nullish(),
  /** 装裱垫层底色(卡外四周),全主题生效;null/缺省 = 月灰 */
  matId: z.string().nullish(),
  fontSize: z.enum(FONT_SIZES),
  align: z.enum(ALIGNS),
});

export type CardState = z.infer<typeof CardStateSchema>;

export const encodeCardState = (s: CardState): string => encodeParam(s);
export const decodeCardState = (code: string): CardState | null => decodeParam(code, CardStateSchema);
