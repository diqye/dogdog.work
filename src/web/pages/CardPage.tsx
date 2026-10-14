/**
 * 诗卡工具页:单列居中流 —— 卡片(就地编辑)→ 页切换 → 导出/分享 → 主题色卡 → 次级控件。
 * 正文可分多页:单页即长图,多页发图文(每页高度自适应,标题进首页、落款进尾页)。
 * 分享把全量参数编码进 URL(?c=),打开链接即还原卡片。
 */

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { CARD_W, CARD_H, textToBodyHtml, stripHtml, parseCardText, FONT_SIZES, ALIGNS, SIG_POSITIONS, type CardContent } from "../card/types";
import { THEMES, themeById, themeBackgroundStyle, accentDots } from "../card/themes";
import { Poem, type Align, type FontSize, type SigPos } from "../card/templates/Poem";
import { exportCards } from "../card/export";
import { encodeCardState, decodeCardState, type CardState } from "../card/share";
import { SelectionToolbar } from "../components/SelectionToolbar";
import { AlignCenter, AlignLeft, AlignRight, ChevronLeft, ChevronRight, ClipboardPaste, Download, Link2, Plus, Trash2 } from "lucide-react";

const DEFAULT_TITLE = "哔";
const DEFAULT_BODY = `我大喊你的名字
在地下停车场里

除了我的回声
没有任何回应

鞋子不听话地乱跑
又喊一声—
小爱同学

哔！哔！
车灯亮了`;
const DEFAULT_SIGNATURE = "半块橡皮";

/** 打开分享链接还原状态;坏链/无参回退默认内容 */
const INITIAL = decodeCardState(new URLSearchParams(location.search).get("c") ?? "");

/* 设置持久化(localStorage):只存版式设置,内容(标题/正文)不存。
 * 读取优先级:url param > localStorage > 默认 —— 逐字段 ?? 链实现(url 命中时 INITIAL 字段全量存在);
 * 脏值(手改/旧版本结构)逐项合法性校验后采用 */
const LS_SETTINGS_KEY = "card-settings";

interface SavedSettings {
  themeId?: string;
  fontSize?: FontSize;
  align?: Align;
  sigPos?: SigPos;
  signature?: string;
  sigOn?: boolean;
  dateOn?: boolean;
}

const SAVED: SavedSettings = (() => {
  try {
    const s = JSON.parse(localStorage.getItem(LS_SETTINGS_KEY) ?? "{}") as Record<string, unknown>;
    return {
      themeId: THEMES.some((t) => t.id === s.themeId) ? (s.themeId as string) : undefined,
      fontSize: FONT_SIZES.includes(s.fontSize as FontSize) ? (s.fontSize as FontSize) : undefined,
      align: ALIGNS.includes(s.align as Align) ? (s.align as Align) : undefined,
      sigPos: SIG_POSITIONS.includes(s.sigPos as SigPos) ? (s.sigPos as SigPos) : undefined,
      signature: typeof s.signature === "string" && s.signature !== "" ? s.signature : undefined,
      sigOn: typeof s.sigOn === "boolean" ? s.sigOn : undefined,
      dateOn: typeof s.dateOn === "boolean" ? s.dateOn : undefined,
    };
  } catch {
    return {};
  }
})();

/** 预览缩放:跟随容器宽,卡片保持设计尺寸 */
function useFitScale(ref: RefObject<HTMLDivElement | null>) {
  const [scale, setScale] = useState(0.45);
  useEffect(() => {
    const el = ref.current;
    if (el == null) return;
    const update = () => setScale(el.clientWidth / CARD_W);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return scale;
}

const segBtn = (active: boolean) =>
  `flex-1 py-1 flex items-center justify-center ${active ? "bg-primary text-on-primary" : "bg-surface text-ink-soft"}`;

export function CardPage() {
  const [title, setTitle] = useState(INITIAL?.title ?? DEFAULT_TITLE);
  // 多页正文:页数用户管理,新增/删除见下方页切换条
  const [pages, setPages] = useState<string[]>(INITIAL?.pages ?? [textToBodyHtml(DEFAULT_BODY)]);
  const [cur, setCur] = useState(0);
  const [signature, setSignature] = useState(INITIAL?.signature ?? SAVED.signature ?? DEFAULT_SIGNATURE);
  const [sigOn, setSigOn] = useState(INITIAL?.sigOn ?? SAVED.sigOn ?? true);
  const [sigPos, setSigPos] = useState<SigPos>(INITIAL?.sigPos ?? SAVED.sigPos ?? "br");
  const [dateOn, setDateOn] = useState(INITIAL?.dateOn ?? SAVED.dateOn ?? true);
  const [themeId, setThemeId] = useState(INITIAL?.themeId ?? SAVED.themeId ?? THEMES[0]!.id);
  const [fontSize, setFontSize] = useState<FontSize>(INITIAL?.fontSize ?? SAVED.fontSize ?? "m");
  const [align, setAlign] = useState<Align>(INITIAL?.align ?? SAVED.align ?? "left");
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [hoverThemeId, setHoverThemeId] = useState<string | null>(null);

  const theme = themeById(themeId);
  // 左上角同步展示:hover 中的主题,否则当前主题(名称 · 字体 · 配色点)
  const infoTheme = themeById(hoverThemeId ?? themeId);

  const fitRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  // 离屏渲染层:全部页按设计尺寸真实渲染(字体分包按需加载也在此发生),导出从这里截图
  const exportWrapRef = useRef<HTMLDivElement>(null);
  const scale = useFitScale(fitRef);

  const last = pages.length - 1;

  /** 组装第 i 页内容:标题只进首页;落款(署名+日期)随 sigPos 归页——右下进尾页,题下跟标题进首页 */
  const contentAt = (i: number): CardContent => {
    const sigPage = sigPos === "under-title" ? 0 : last;
    return {
      title: i === 0 ? title : "",
      body: pages[i] ?? "",
      signature: i === sigPage && sigOn ? signature.trim() : "",
      date: i === sigPage && dateOn ? formatToday() : "",
    };
  };

  const content = useMemo(() => contentAt(cur), [title, pages, cur, sigPos, sigOn, signature, dateOn]);

  // 卡片实际高度(内容自适应):预览包裹层同步缩放后的高度
  const [cardH, setCardH] = useState(CARD_H);
  useEffect(() => {
    const el = cardRef.current;
    if (el == null) return;
    const ro = new ResizeObserver(() => setCardH(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 设置变化写回 localStorage(含 url 打开后的手动调整,下次无参打开时生效);
  // 空署名不持久化 —— 分享链常无署名,回写会把默认值永久清空
  useEffect(() => {
    const s: SavedSettings = { themeId, fontSize, align, sigPos, sigOn, dateOn, signature: signature === "" ? undefined : signature };
    localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(s));
  }, [themeId, fontSize, align, sigPos, signature, sigOn, dateOn]);

  // 错误提示弹几秒自动消失
  useEffect(() => {
    if (error == null) return;
    const t = setTimeout(() => setError(null), 3000);
    return () => clearTimeout(t);
  }, [error]);

  // 中性通知同样自动消失
  useEffect(() => {
    if (notice == null) return;
    const t = setTimeout(() => setNotice(null), 2500);
    return () => clearTimeout(t);
  }, [notice]);


  // 主题字体 css 按需挂载(系统字体零请求,切换时替换/摘除)
  useEffect(() => {
    let link = document.head.querySelector<HTMLLinkElement>("link[data-card-font]");
    if (theme.font.cssPath == null) {
      link?.remove();
      return;
    }
    if (link == null) {
      link = document.createElement("link");
      link.rel = "stylesheet";
      link.dataset.cardFont = "";
      document.head.append(link);
    }
    link.href = theme.font.cssPath;
  }, [theme]);

  // 主题示例卡需全部 web 字体(唯一字体集合,unicode-range 分包浏览器按需拉取)
  useEffect(() => {
    const seen = new Set<string>();
    for (const t of THEMES) {
      const { id, cssPath } = t.font;
      if (cssPath == null || seen.has(id)) continue;
      seen.add(id);
      if (document.head.querySelector(`link[data-theme-font="${id}"]`) != null) continue;
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.dataset.themeFont = id;
      link.href = cssPath;
      document.head.append(link);
    }
  }, []);

  /** 当前页后插入空页并切入,便于把长文后半段挪过去 */
  function addPage() {
    setPages((ps) => [...ps.slice(0, cur + 1), "", ...ps.slice(cur + 1)]);
    setCur(cur + 1);
  }

  function delPage() {
    if (pages.length <= 1) return;
    setPages((ps) => ps.filter((_, i) => i !== cur));
    setCur(Math.max(0, Math.min(cur, pages.length - 2)));
  }

  async function onExport() {
    const wrap = exportWrapRef.current;
    const nodes = wrap == null ? [] : ([...wrap.children] as HTMLElement[]);
    if (nodes.length === 0 || exporting) return;
    setExporting(true);
    setError(null);
    try {
      const result = await exportCards(nodes, stripHtml(title).trim() || "诗卡", theme.font.cssPath);
      // 分享未弹出(手势过期/环境不支持)转为下载时告知用户去向
      if (result === "downloaded") setNotice("已转为逐张下载");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setExporting(false);
    }
  }

  /** 分享链接写入地址栏并复制;复制失败(权限/非 https)时地址栏已是链接,提示手动复制 */
  async function onShare() {
    const state: CardState = { title, pages, signature, sigOn, sigPos, dateOn, themeId, fontSize, align };
    const url = `${location.origin}${location.pathname}?c=${encodeCardState(state)}`;
    history.replaceState(null, "", url);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("复制失败,请手动复制地址栏链接");
    }
  }

  /** 读剪贴板整段文本一键填卡(首行标题/末行落款),重置为单页长图,失败行内提示 */
  async function onPasteParse() {
    setError(null);
    let text: string;
    try {
      text = await navigator.clipboard.readText();
    } catch {
      setError("无法读取剪贴板,请检查浏览器授权");
      return;
    }
    const parsed = parseCardText(text);
    if (parsed == null) {
      setError("格式不符:首行为标题,末行需为「- 署名」");
      return;
    }
    setTitle(parsed.title);
    setPages([parsed.body]);
    setSignature(parsed.signature);
    setSigOn(true);
    setCur(0);
  }

  return (
    <div className="min-h-dvh bg-canvas">
      {/* 错误提示:顶部弹出,红色,自动消失 */}
      {error != null && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-surface border border-red-200 text-red-600 text-sm shadow-md">
          {error}
        </div>
      )}
      {notice != null && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-ink text-canvas text-sm shadow-md">{notice}</div>
      )}
      <header className="px-6 py-5 flex items-start justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-h3 font-semibold leading-none">诗卡</h1>
          <div className="flex items-center gap-2 text-xs text-ink-soft">
            <span>{infoTheme.name}</span>
            <span className="text-ink-faint">·</span>
            <span>{infoTheme.font.name}</span>
            <span className="flex items-center gap-1 ml-0.5">
              {accentDots(infoTheme).map((c) => (
                <i
                  key={c}
                  className="w-2.5 h-2.5 rounded-full border border-line/60"
                  style={{ background: c }}
                />
              ))}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a href="/changelog" target="_blank" rel="noreferrer" className="text-sm text-ink-faint hover:text-ink">
            更新日志
          </a>
          <span className="text-sm text-ink-faint">dogdog.work</span>
        </div>
      </header>

      {/* 大屏左右布局:左卡片主区 + 右控制列;移动单列流(卡片→导出→控件→主题) */}
      <main className="px-6 pb-16 flex flex-col lg:flex-row lg:items-start gap-8">
        {/* 卡片:点击即编辑;选中文字浮出气泡;下方页切换条(左列固定宽) */}
        <div className="w-full lg:w-[560px] shrink-0 flex flex-col items-center gap-3">
          <div className="w-full shadow-lg rounded-lg overflow-hidden">
          <div ref={fitRef} style={{ height: cardH * scale }}>
            <div
              ref={cardRef}
              style={{ width: CARD_W, transform: `scale(${scale})`, transformOrigin: "top left" }}
            >
              <Poem
                content={content}
                themeId={themeId}
                fontSize={fontSize}
                align={align}
                sigPos={sigPos}
                showTitle={cur === 0}
                onEdit={(patch) => {
                  if (patch.title !== undefined) setTitle(patch.title);
                  const html = patch.body;
                  if (html !== undefined) setPages((ps) => ps.map((p, i) => (i === cur ? html : p)));
                }}
              />
            </div>
          </div>
          </div>

          {/* 页切换条:◀ n/N ▶ + 新增(插当前页后)/删除(至少留一页) */}
          <div className="flex items-center gap-3 text-sm text-ink-soft">
            <div className="flex items-center rounded-lg border border-line overflow-hidden bg-surface">
              <button onClick={() => setCur(cur - 1)} disabled={cur === 0} className="px-2 py-1 hover:bg-canvas disabled:opacity-40">
                <ChevronLeft size={15} />
              </button>
              <span className="px-2 tabular-nums select-none">
                {cur + 1}/{pages.length}
              </span>
              <button onClick={() => setCur(cur + 1)} disabled={cur === last} className="px-2 py-1 hover:bg-canvas disabled:opacity-40">
                <ChevronRight size={15} />
              </button>
            </div>
            <button
              onClick={addPage}
              title="在当前页后新增一页"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-line bg-surface hover:bg-canvas"
            >
              <Plus size={15} />
              新增页
            </button>
            <button
              onClick={delPage}
              disabled={pages.length <= 1}
              title="删除当前页"
              className="flex items-center px-2.5 py-1 rounded-lg border border-line bg-surface hover:bg-canvas disabled:opacity-40"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        <SelectionToolbar cardRef={cardRef} accents={accentDots(theme)} />

        {/* 控制列:导出/分享 → 次级控件 → 主题网格(自适应占满剩余宽,主题 auto-fill 排列) */}
        <div className="w-full lg:flex-1 min-w-0 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <button
              onClick={onExport}
              disabled={exporting}
              className="w-full py-3 rounded-xl bg-primary text-on-primary text-base font-medium hover:bg-primary-hover disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm"
            >
              <Download size={18} />
              {exporting ? "导出中…" : pages.length > 1 ? `导出 ${pages.length} 张图` : "导出图片"}
            </button>
            <div className="flex gap-2">
              <button
                onClick={onShare}
                className="flex-1 py-2.5 rounded-xl border border-line bg-surface text-sm text-ink hover:bg-canvas flex items-center justify-center gap-2"
              >
                <Link2 size={16} />
                {copied ? "已复制 ✓" : "分享链接"}
              </button>
              <button
                onClick={onPasteParse}
                className="flex-1 py-2.5 rounded-xl border border-line bg-surface text-sm text-ink hover:bg-canvas flex items-center justify-center gap-2"
              >
                <ClipboardPaste size={16} />
                粘贴解析
              </button>
            </div>
          </div>

          {/* 次级控件:字号/对齐一行,复选框(署名/日期)单独一行 */}
          <div className="w-full flex flex-col gap-3">
            <div className="flex items-center justify-center gap-6 text-sm text-ink-soft">
            <div className="flex rounded-lg border border-line overflow-hidden w-28">
              {(["s", "m", "l"] as const).map((s) => (
                <button key={s} onClick={() => setFontSize(s)} className={segBtn(fontSize === s)}>
                  <span className={s === "s" ? "text-xs" : s === "m" ? "text-sm" : "text-base"}>A</span>
                </button>
              ))}
            </div>

            <div className="flex rounded-lg border border-line overflow-hidden w-28">
              {([
                ["left", AlignLeft],
                ["center", AlignCenter],
                ["right", AlignRight],
              ] as const).map(([a, Icon]) => (
                <button key={a} onClick={() => setAlign(a)} className={segBtn(align === a)}>
                  <Icon size={15} />
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 text-sm text-ink-soft">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={sigOn} onChange={(e) => setSigOn(e.target.checked)} className="accent-primary" />
              署名
              {sigOn && (
                <>
                  <input
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    className="w-20 border-b border-line bg-transparent text-ink text-sm px-1 focus:outline-none focus:border-primary"
                  />
                  <div className="flex rounded-lg border border-line overflow-hidden">
                    {(
                      [
                        ["br", "右下"],
                        ["under-title", "题下"],
                      ] as const
                    ).map(([p, label]) => (
                      <button
                        key={p}
                        onClick={() => setSigPos(p)}
                        className={`px-2 py-0.5 text-xs ${sigPos === p ? "bg-primary text-on-primary" : "bg-surface text-ink-soft"}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={dateOn} onChange={(e) => setDateOn(e.target.checked)} className="accent-primary" />
              日期
            </label>
          </div>
        </div>

          {/* 主题示例卡网格(控制列尾部):auto-fill 随容器宽自适应列数;渐变底 + 主题字体示例句 + 场景描述 */}
          <div className="w-full grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2.5">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onMouseEnter={() => setHoverThemeId(t.id)}
              onMouseLeave={() => setHoverThemeId(null)}
              onClick={() => setThemeId(t.id)}
              className={`flex flex-col rounded-xl overflow-hidden transition-transform hover:scale-[1.03] text-left ${
                themeId === t.id ? "ring-2 ring-primary ring-offset-2 ring-offset-canvas" : "border border-line shadow-sm"
              }`}
            >
              <div
                className="aspect-4/3 flex flex-col items-center justify-center px-1.5"
                style={{ ...themeBackgroundStyle(t), color: t.ink }}
              >
                <span className="text-md leading-none tracking-widest" style={{ fontFamily: t.font.family }}>
                  {t.sample}
                </span>
              </div>
              <div className="bg-surface px-2 py-1.5 flex flex-col">
                <span className="text-sm text-ink font-medium truncate">{t.name} · {t.font.name}</span>
                <span className="text-xs text-ink-faint leading-tight">{t.desc}</span>
              </div>
            </button>
          ))}
          </div>
        </div>
      </main>

      {/* 离屏导出层:全部页按设计尺寸渲染(无 scale/编辑态),导出逐张从此截取 */}
      <div
        aria-hidden
        ref={exportWrapRef}
        style={{ position: "fixed", left: -9999, top: 0, width: CARD_W, pointerEvents: "none" }}
      >
        {pages.map((_, i) => (
          <Poem key={i} content={contentAt(i)} showTitle={i === 0} themeId={themeId} fontSize={fontSize} align={align} sigPos={sigPos} />
        ))}
      </div>
    </div>
  );
}

function formatToday(): string {
  const d = new Date();
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}
