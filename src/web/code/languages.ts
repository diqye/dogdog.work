/**
 * 代码卡语言登记表:每项自带懒加载 import(build 静态分析可分片,首屏零成本)。
 * shiki JS 正则引擎对全部登记语言已验证可出 html。
 */

export interface CodeLang {
  id: string;
  name: string;
  load: () => Promise<{ default: unknown }>;
}

export const CODE_LANGS: CodeLang[] = [
  { id: "typescript", name: "TypeScript", load: () => import("@shikijs/langs/typescript") },
  { id: "tsx", name: "TSX", load: () => import("@shikijs/langs/tsx") },
  { id: "javascript", name: "JavaScript", load: () => import("@shikijs/langs/javascript") },
  { id: "rust", name: "Rust", load: () => import("@shikijs/langs/rust") },
  { id: "haskell", name: "Haskell", load: () => import("@shikijs/langs/haskell") },
  { id: "zig", name: "Zig", load: () => import("@shikijs/langs/zig") },
  { id: "sql", name: "SQL", load: () => import("@shikijs/langs/sql") },
  { id: "bash", name: "Bash", load: () => import("@shikijs/langs/bash") },
];

export function codeLangById(id: string): CodeLang {
  return CODE_LANGS.find((l) => l.id === id) ?? CODE_LANGS[0]!;
}
