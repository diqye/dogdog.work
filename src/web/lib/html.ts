/** html 转义:跨域通用工具(诗卡富文本 / 代码卡纯文本 fallback 共用) */

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
