/**
 * shiki 高亮:core 单例 + JS 正则引擎(无 WASM,浏览器端零胶水);
 * 全部依赖动态 import:core/引擎/语言/主题只在首次高亮时拉取,首屏零成本。
 * 调用方拿 html 自行渲染。
 */

import type { HighlighterCore } from "shiki/core";
import { codeLangById } from "./languages";
import { codeThemeById } from "./themes";

let core: Promise<HighlighterCore> | null = null;

function ensureCore(): Promise<HighlighterCore> {
  core ??= (async () => {
    const [{ createHighlighterCore }, { createJavaScriptRegexEngine }] = await Promise.all([
      import("shiki/core"),
      import("shiki/engine/javascript"),
    ]);
    return createHighlighterCore({
      themes: [import("@shikijs/themes/one-dark-pro")],
      langs: [import("@shikijs/langs/typescript")],
      engine: createJavaScriptRegexEngine(),
    });
  })();
  return core;
}

/** 代码 → 高亮 html(shiki inline style,截图免嵌主题 CSS);语言/主题未加载则先加载 */
export async function highlightCode(code: string, langId: string, themeId: string): Promise<string> {
  const core = await ensureCore();
  const lang = codeLangById(langId);
  const theme = codeThemeById(themeId);
  if (!core.getLoadedLanguages().includes(lang.id)) await core.loadLanguage(lang.load() as never);
  if (!core.getLoadedThemes().includes(theme.id)) await core.loadTheme(theme.load() as never);
  return core.codeToHtml(code, { lang: lang.id, theme: theme.id });
}
