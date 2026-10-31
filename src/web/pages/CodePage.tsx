/**
 * 代码卡工具页:上卡片(居中,大小随内容自适应只缩不放;textarea 覆盖高亮层,所见即所得)
 * + 下工具条(全部控件)。分享把全量参数编码进 URL(?c=),打开链接即还原(不做 localStorage 持久化,每次打开回默认)。
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CODE_CARD_W, CodeCard, plainPreHtml } from "../code/CodeCard";
import { CODE_LANGS } from "../code/languages";
import { CODE_THEMES } from "../code/themes";
import { highlightCode } from "../code/highlight";
import { CODE_FONT_SIZES, encodeCodeState, decodeCodeState, type CodeState, type CodeFontSize } from "../code/share";
import { exportCards } from "../lib/export";
import { SHADOW_INK, shadowSpecs } from "../card/types";
import { useFitScale } from "../lib/useFitScale";
import { ArrowLeft, Download, Link2 } from "lucide-react";

const DEFAULT_CODE = `type Dog = { name: string; age: number };

// 一只会写代码的狗
const dog: Dog = { name: "旺财", age: 3 };

function bark(d: Dog): string {
  return \`\${d.name} 汪汪 => != == ::\`;
}`;

const INITIAL = decodeCodeState(new URLSearchParams(location.search).get("c") ?? "");

/** 代码卡字体 css:等宽主体 + 中文回退;挂一次,重复挂由 data 标记挡住 */
const FONT_CSS_PATHS = ["/static/fonts/jetbrains-mono/400.css", "/static/fonts/lxgw-wenkai/lxgwwenkai-regular.css"];

/** 主题块预览:Haskell hello world(shiki 真高亮,逐主题后台跑,就绪前单色回退) */
const THEME_SAMPLE = `main :: IO ()\nmain = putStrLn "Hello, World!"`;

const segBtn = (active: boolean) =>
  `flex-1 py-1 flex items-center justify-center ${active ? "bg-primary text-on-primary" : "bg-surface text-ink-soft"}`;

export function CodePage() {
  const [code, setCode] = useState(INITIAL?.code ?? DEFAULT_CODE);
  const [lang, setLang] = useState(INITIAL?.lang ?? "typescript");
  const [themeId, setThemeId] = useState(INITIAL?.themeId ?? CODE_THEMES[0]!.id);
  const [filename, setFilename] = useState(INITIAL?.filename ?? "");
  const [fontSize, setFontSize] = useState<CodeFontSize>(INITIAL?.fontSize ?? "m");
  const [ligatures, setLigatures] = useState(INITIAL?.ligatures ?? true);
  const [wrap, setWrap] = useState(INITIAL?.wrap ?? false);
  const [html, setHtml] = useState(() => plainPreHtml(INITIAL?.code ?? DEFAULT_CODE));
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [themePreviews, setThemePreviews] = useState<Record<string, string>>({});

  const outerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  // 字体 css 挂载(等宽+霞鹜文楷,html link 去重)
  useEffect(() => {
    for (const [i, href] of FONT_CSS_PATHS.entries()) {
      if (document.head.querySelector(`link[data-code-font="${i}"]`) != null) continue;
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.dataset.codeFont = String(i);
      link.href = href;
      document.head.append(link);
    }
  }, []);

  // 高亮:先同步出无色文本(引擎首载/切换期间不空白),就绪后换着色 html;乱序丢弃(alive)
  useEffect(() => {
    let alive = true;
    setHtml(plainPreHtml(code));
    highlightCode(code, lang, themeId).then(
      (h) => {
        if (alive) setHtml(h);
      },
      () => {},
    );
    return () => {
      alive = false;
    };
  }, [code, lang, themeId]);

  // 主题块预览:同一引擎逐主题高亮示例(首块随编辑器同步就绪,其余后台补),乱序不覆盖已就绪项
  useEffect(() => {
    for (const t of CODE_THEMES) {
      highlightCode(THEME_SAMPLE, "haskell", t.id).then(
        (preview) => setThemePreviews((m) => (m[t.id] == null ? { ...m, [t.id]: preview } : m)),
        () => {},
      );
    }
  }, []);

  useEffect(() => {
    if (error == null) return;
    const t = setTimeout(() => setError(null), 3000);
    return () => clearTimeout(t);
  }, [error]);

  // 卡片实际尺寸(内容自适应):观察 CodeCard 垫层 —— 挂载即同步量(首帧绘制前,
  // 否则占位盒先按猜测尺寸渲染再跳变 = 入页闪烁);后续(字体就绪重测宽/编辑)由 RO 接管
  const [cardH, setCardH] = useState(600);
  const [cardW, setCardW] = useState(CODE_CARD_W);
  useLayoutEffect(() => {
    const el = cardRef.current?.firstElementChild;
    if (el == null) return;
    const measure = () => {
      setCardH((el as HTMLElement).offsetHeight);
      setCardW((el as HTMLElement).offsetWidth);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = useFitScale(outerRef, cardW, cardH);

  async function onExport() {
    const node = exportRef.current?.firstElementChild;
    if (!(node instanceof HTMLElement) || exporting) return;
    setExporting(true);
    setError(null);
    try {
      await exportCards([node], filename.trim() || "代码卡", FONT_CSS_PATHS, { bg: "#d7dade", pad: 72, shadows: shadowSpecs(SHADOW_INK) });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setExporting(false);
    }
  }

  async function onShare() {
    const state: CodeState = { code, lang, themeId, filename, fontSize, ligatures, wrap };
    const url = `${location.origin}/code?c=${encodeCodeState(state)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("复制失败,请检查浏览器授权");
    }
  }

  return (
    <div className="min-h-dvh bg-canvas flex flex-col">
      {error != null && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-surface border border-red-200 text-red-600 text-sm shadow-md">
          {error}
        </div>
      )}
      <header className="px-4 sm:px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/" aria-label="回首页" className="text-ink-faint hover:text-ink">
            <ArrowLeft size={20} />
          </a>
          <h1 className="text-h3 font-semibold leading-none">代码卡</h1>
        </div>
        <div className="flex items-center gap-3">
          <a href="/changelog" target="_blank" rel="noreferrer" className="text-sm text-ink-faint hover:text-ink">
            更新日志
          </a>
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-6 pb-10 flex flex-col gap-5">
        {/* 上:卡片居中,大小随内容(容器装不下才缩,不放大)。sizer 居中关键:
            transform 不改布局尺寸,占位若用设计宽,卡宽>容器时 flex 居中失效溢出靠左 */}
        <div ref={outerRef} className="w-full flex justify-center">
          <div style={{ width: cardW * scale, height: cardH * scale, transition: "width 0.25s ease, height 0.25s ease" }}>
            {/* transform 容器不设宽:width 钉死会阻断 RO 察觉 CodeCard 根的真实宽度 */}
            <div ref={cardRef} style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
              <CodeCard
                code={code}
                html={html}
                langId={lang}
                themeId={themeId}
                filename={filename}
                fontSize={fontSize}
                ligatures={ligatures}
                wrap={wrap}
                editable
                onCodeChange={setCode}
                onFilenameChange={setFilename}
              />
            </div>
          </div>
        </div>

        {/* 下:工具条(全部控件)。操作/设置分组,窄屏各自成行,宽屏合流一行 */}
        <div className="w-full bg-surface border border-line rounded-2xl shadow-sm px-4 py-3.5 flex flex-wrap items-center gap-x-5 gap-y-3">
          {/* 操作:导出/分享 */}
          <div className="flex gap-2">
            <button
              onClick={onShare}
              className="py-2 px-4 rounded-xl border border-line bg-surface text-sm text-ink hover:bg-canvas flex items-center gap-2"
            >
              <Link2 size={15} />
              {copied ? "已复制 ✓" : "分享链接"}
            </button>
            <button
              onClick={onExport}
              disabled={exporting}
              className="py-2 px-5 rounded-xl bg-primary text-on-primary text-sm font-medium hover:bg-primary-hover disabled:opacity-60 flex items-center gap-2 shadow-sm"
            >
              <Download size={16} />
              {exporting ? "导出中…" : "导出图片"}
            </button>
          </div>

          <span className="hidden lg:block w-px h-6 bg-line" />

          {/* 设置:语言/字号/连字/换行 */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            语言
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="px-2 py-1.5 rounded-lg border border-line bg-surface hover:bg-canvas"
            >
              {CODE_LANGS.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>

          <div className="flex rounded-lg border border-line overflow-hidden w-24">
            {CODE_FONT_SIZES.map((s) => (
              <button key={s} onClick={() => setFontSize(s)} className={segBtn(fontSize === s)}>
                <span className={s === "s" ? "text-xs" : s === "m" ? "text-sm" : "text-base"}>A</span>
              </button>
            ))}
          </div>

          <label className="flex items-center gap-1.5 cursor-pointer text-sm text-ink-soft">
            <input type="checkbox" checked={ligatures} onChange={(e) => setLigatures(e.target.checked)} className="accent-primary" />
            连字
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-sm text-ink-soft">
            <input type="checkbox" checked={wrap} onChange={(e) => setWrap(e.target.checked)} className="accent-primary" />
            自动换行
          </label>
          </div>

          {/* 主题块:代码卡同款外观(三点+左对齐代码)的缩略方块 */}
          <div className="w-full flex flex-wrap gap-x-3 gap-y-2 pt-1">
            {CODE_THEMES.map((t) => (
              <button key={t.id} onClick={() => setThemeId(t.id)} className="flex flex-col items-center gap-1">
                <span
                  className={`code-body w-45 h-16 rounded-lg overflow-hidden flex flex-col ${
                    themeId === t.id ? "ring-2 ring-primary ring-offset-2 ring-offset-surface" : "border border-line"
                  }`}
                  style={{ backgroundColor: t.bg, fontFamily: "var(--font-mono)", fontSize: 9, lineHeight: 1.4 }}
                >
                  <span className="flex gap-[5px] px-2 pt-2 pb-1">
                    {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
                      <i key={c} className="w-[7px] h-[7px] rounded-full" style={{ backgroundColor: c }} />
                    ))}
                  </span>
                  <span className="px-2 overflow-hidden text-left">
                    {themePreviews[t.id] != null ? (
                      <code
                        style={{ whiteSpace: "pre" }}
                        dangerouslySetInnerHTML={{ __html: themePreviews[t.id]!.replace(/^<pre[^>]*>|<\/pre>$/g, "") }}
                      />
                    ) : (
                      <code style={{ color: t.fg, whiteSpace: "pre" }}>{THEME_SAMPLE}</code>
                    )}
                  </span>
                </span>
                <span className={`text-xs ${themeId === t.id ? "text-ink font-medium" : "text-ink-faint"}`}>{t.name}</span>
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* 离屏导出层:同参数纯展示(无 textarea),导出从此截取 */}
      <div aria-hidden style={{ position: "fixed", left: -9999, top: 0, pointerEvents: "none" }}>
        <div ref={exportRef}>
          <CodeCard code={code} html={html} langId={lang} themeId={themeId} filename={filename} fontSize={fontSize} ligatures={ligatures} wrap={wrap} />
        </div>
      </div>
    </div>
  );
}
