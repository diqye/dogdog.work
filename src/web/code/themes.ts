/**
 * 代码卡高亮主题登记表:bg/fg 为主题底色/前景色(静态写死,卡片底色不待引擎就绪)。
 * 懒加载 import 同语言表。
 */

export interface CodeTheme {
  id: string;
  name: string;
  /** 卡片底色 */
  bg: string;
  /** 卡片前景色(文件名/caret/占位) */
  fg: string;
  load: () => Promise<{ default: unknown }>;
}

export const CODE_THEMES: CodeTheme[] = [
  {
    id: "one-dark-pro",
    name: "One Dark",
    bg: "#282c34",
    fg: "#abb2bf",
    load: () => import("@shikijs/themes/one-dark-pro"),
  },
  {
    id: "github-dark",
    name: "GitHub Dark",
    bg: "#24292e",
    fg: "#e1e4e8",
    load: () => import("@shikijs/themes/github-dark"),
  },
  {
    id: "github-light",
    name: "GitHub Light",
    bg: "#ffffff",
    fg: "#24292e",
    load: () => import("@shikijs/themes/github-light"),
  },
  {
    id: "vitesse-light",
    name: "Vitesse Light",
    bg: "#ffffff",
    fg: "#393a34",
    load: () => import("@shikijs/themes/vitesse-light"),
  },
];

export function codeThemeById(id: string): CodeTheme {
  return CODE_THEMES.find((t) => t.id === id) ?? CODE_THEMES[0]!;
}
