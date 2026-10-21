/**
 * URL 参数编解码:?c= 查询参数承载卡片全量状态(内容+排版设置)。
 * 编码 JSON → encodeURIComponent → base64url(query 安全);
 * 解码走 zod 校验,链接被截断/手改坏一律返回 null 由调用方回退默认。
 */

import type { z } from "zod";

export function encodeParam(s: unknown): string {
  // btoa 不认非 Latin1(中文),必须先 encodeURIComponent 再 base64
  const b64 = btoa(encodeURIComponent(JSON.stringify(s)));
  return b64.replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

export function decodeParam<T>(code: string, schema: z.ZodType<T>): T | null {
  try {
    const b64 = code.replaceAll("-", "+").replaceAll("_", "/");
    return schema.parse(JSON.parse(decodeURIComponent(atob(b64))));
  } catch {
    return null;
  }
}
