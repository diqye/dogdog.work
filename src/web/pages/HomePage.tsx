/**
 * 首页:两个工具入口(诗卡 / 代码卡)。
 * 示例渲染全静态(诗卡卡用默认主题渐变+已注入的 web 字体;代码卡手写少量着色 span),
 * 不加载 shiki 引擎,首屏零额外成本。
 */

import { THEMES, themeBackgroundStyle } from "../card/themes";

/** 代码卡示例:手写着色(one-dark 配色),只为传达视觉,不跑高亮引擎 */
const CODE_SAMPLE = (
  <>
    <span style={{ color: "#c678dd" }}>const</span> <span style={{ color: "#61afef" }}>dog</span> = {"{"}{" "}
    <span style={{ color: "#d19a66" }}>3</span> {"}"};
    <br />
    <span style={{ color: "#c678dd" }}>fn</span> <span style={{ color: "#61afef" }}>main</span>() {"{"}
    <br />
    &nbsp;&nbsp;<span style={{ color: "#e06c75" }}>println!</span>(<span style={{ color: "#98c379" }}>"汪汪"</span>);
    <br />
    {"}"}
  </>
);

export function HomePage() {
  const poemTheme = THEMES[0]!;
  return (
    <div className="min-h-dvh bg-canvas flex flex-col">
      <header className="px-4 sm:px-6 py-5 flex items-center justify-between">
        <span className="text-sm font-semibold text-ink">dogdog.work</span>
        <a href="/changelog" target="_blank" rel="noreferrer" className="text-sm text-ink-faint hover:text-ink">
          更新日志
        </a>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center gap-8 sm:gap-10 px-4 sm:px-6 pb-16 sm:pb-20">
        <div className="text-center">
          <h1 className="text-display font-semibold tracking-tight">把文字变成图</h1>
          <p className="mt-3 text-ink-soft">诗与代码,都值得好好发出去</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-5 w-full max-w-2xl">
          {/* 诗卡入口 */}
          <a
            href="/poem"
            className="flex-1 flex flex-col rounded-2xl overflow-hidden border border-line shadow-md hover:scale-[1.02] transition-transform bg-surface"
          >
            <div
              className="aspect-4/3 flex flex-col items-center justify-center gap-2"
              style={{ ...themeBackgroundStyle(poemTheme), color: poemTheme.ink }}
            >
              <span className="text-xl tracking-widest" style={{ fontFamily: poemTheme.font.family }}>
                {poemTheme.sample}
              </span>
              <span className="text-xs" style={{ color: poemTheme.inkSoft }}>
                {poemTheme.desc}
              </span>
            </div>
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-base font-medium text-ink">诗卡</span>
              <span className="text-sm text-ink-faint">写一首,发出去 →</span>
            </div>
          </a>

          {/* 代码卡入口 */}
          <a
            href="/code"
            className="flex-1 flex flex-col rounded-2xl overflow-hidden border border-line shadow-md hover:scale-[1.02] transition-transform bg-surface"
          >
            <div
              className="aspect-4/3 flex flex-col justify-center px-5 gap-1.5"
              style={{ backgroundColor: "#282c34", color: "#abb2bf" }}
            >
              <span className="flex gap-1.5 pb-1">
                {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
                  <i key={c} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c }} />
                ))}
              </span>
              <code className="text-[13px] leading-relaxed" style={{ fontFamily: "var(--font-mono)" }}>
                {CODE_SAMPLE}
              </code>
            </div>
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-base font-medium text-ink">代码卡</span>
              <span className="text-sm text-ink-faint">贴一段,亮起来 →</span>
            </div>
          </a>
        </div>
      </main>
    </div>
  );
}
