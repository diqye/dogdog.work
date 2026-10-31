/**
 * 现代诗横排模板,两种版式:
 * - 平铺(flat 主题):标题 → 图片带(定高 cover,可被上传图替换)→ 诗词(纸底)→ 落款;
 * - 满铺(gradient/cover 主题):标题左上 / 正文垂直居中 / 落款右下,文字压在卡面背景上。
 * 卡片为竖构图(3:4),文字横排(现代诗出版惯例)。根节点是主题色垫层(卡外四周 padding):
 * 圆角卡浮于其上,导出 PNG 四角不透明(同代码卡配方)。
 * 就地编辑(onEdit 传入时):标题/正文 contentEditable 富文本,
 * React 不托管编辑区 DOM(ref + layoutEffect 单向同步),用户输入只回写 state,
 * state 与 DOM 恒等 → 光标不跳。
 */

import { useId, useLayoutEffect, useRef, useState, type CSSProperties, type ClipboardEvent, type KeyboardEvent } from "react";
import type { CardContent } from "../types";
import { CARD_H, CARD_W, CARD_PAD, SHADOW_INK, shadowSpecs, shadowCss } from "../types";
import { resolveTheme, themeBackgroundStyle, type CardMat } from "../themes";
import { fontById } from "../fonts";

export type { FontSize, Align, SigPos } from "../types";
import type { FontSize, Align, SigPos } from "../types";

const BODY_FONT_SIZE: Record<FontSize, number> = { s: 40, m: 48, l: 56 };
const JUSTIFY: Record<Align, string> = { left: "flex-start", center: "center", right: "flex-end" };

/** 导出垫层(卡外四周)默认配色:中明度冷银灰(月白装裱);用户可选装裱色板 */
const PAD_BG = "#d7dade";
/** 纹理层钉死高度:字号增减/卡高变化时纹理不重缩放;等于最小卡高(内容超高时底部露出兜底色) */
const TEXTURE_PIN_H = CARD_H;
/** 平铺版式图片带高度:约卡宽 45%,与标题/正文区構成三段式 */
const FLAT_IMG_H = 480;

export interface PoemProps {
  content: CardContent;
  themeId: string;
  fontSize: FontSize;
  align: Align;
  sigPos: SigPos;
  /** 覆盖主题绑定字体(嫌主题字体不好看时手动换);不传 = 跟随主题。不进分享链/不持久化 */
  fontId?: string;
  /** 平铺版式图组覆盖(flat 主题):图 + 纸底一体;不传 = 主题默认图组 */
  presetId?: string;
  /** 平铺版式换图(任意图源含 dataURL,仅内存态):不传 = 主题预制图。不进分享链/不持久化 */
  imageOverride?: string;
  /** 装裱(卡外四周):垫层底色 + 配套投影墨色;不传 = 月灰。预览用,导出由 canvas 另行合成 */
  mat?: CardMat;
  /** 多页模式下标题只进首页;默认 true(单卡全量渲染) */
  showTitle?: boolean;
  /** 传入即开启就地编辑,变更以 html 回调 */
  onEdit?: (patch: Partial<Pick<CardContent, "title" | "body">>) => void;
}

/** DOM 与 state 不一致才写,避免编辑中被重置丢光标 */
function useSyncHtml(ref: React.RefObject<HTMLElement | null>, html: string) {
  // 不设依赖、每渲染都跑:相等性护栏保证不打光标;
  // 主题切换会重建编辑区 DOM(结构变化),ref.current 变了但依赖没变 → 固定依赖会漏灌内容(切主题字消失)
  useLayoutEffect(() => {
    const el = ref.current;
    if (el != null && el.innerHTML !== html) el.innerHTML = html;
  });
}

/** 粘贴强制纯文本,避免外部富文本结构入侵 */
function pastePlain(e: ClipboardEvent) {
  e.preventDefault();
  document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
}

export function Poem({ content, themeId, fontId, presetId, imageOverride, mat, fontSize, align, sigPos, showTitle = true, onEdit }: PoemProps) {
  const theme = resolveTheme(themeId, presetId);
  const flat = theme.layout === "flat";
  const cover = theme.layout === "cover" ? theme : null;
  const font = fontId != null ? fontById(fontId) : theme.font;
  const bodyFs = BODY_FONT_SIZE[fontSize];
  const editable = onEdit != null;

  const titleRef = useRef<HTMLHeadingElement>(null);
  const bodyTextRef = useRef<HTMLDivElement>(null);
  useSyncHtml(titleRef, content.title);
  useSyncHtml(bodyTextRef, content.body);

  // 纹理填字 + webfont swap:background-clip:text 在字体替换后不重绘(Chrome bug,首屏文字残缺/消失),
  // 字体就绪后重建文字层强制重画;内容由每渲染同步回灌,不丢
  const [fontSwapped, setFontSwapped] = useState(false);
  useLayoutEffect(() => {
    if (cover?.inkLayer == null) return;
    let alive = true;
    document.fonts.ready.then(() => {
      if (alive) setFontSwapped(true);
    });
    return () => {
      alive = false;
    };
  }, [cover?.inkLayer != null]);

  const base: CSSProperties = {
    width: CARD_W,
    minHeight: CARD_H,
    // 平铺版式各区自管 padding(图片带通顶通底满幅),其余版式卡面统一 96
    padding: flat ? 0 : 96,
    boxSizing: "border-box",
    ...(flat ? { backgroundColor: theme.paper.bg } : themeBackgroundStyle(theme)),
    // 纹理主题:图层钉死高度并锁定左上角(字号变化不动纹理);蒙层随卡拉满
    ...(!flat && cover ? { backgroundSize: `100% 100%, auto ${TEXTURE_PIN_H}px`, backgroundPosition: "top left" } : {}),
    color: theme.ink,
    fontFamily: `${font.family}, 'PingFang SC', serif`,
    display: "flex",
    flexDirection: "column",
  };

  /** 标题单行:Enter 换行禁用 */
  const titleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") e.preventDefault();
  };

  // 墨迹揉开:feDisplacementMap 把笔画边缘随噪声变形(写在粗糙表面的物理感);
  // 滤镜定义藏在卡内,导出克隆时一并带走(CSS filter:url 引用卡外节点会丢)
  const fid = useId().replace(/[:]/g, "");
  const flow = cover?.inkFlow;
  const textLayer: CSSProperties | null =
    cover?.inkLayer != null
      ? ({
          // 图层 = 调墨层 + 纹理(不含卡面蒙层:蒙层进笔画会发闷,它只管背景可读);
          // 尺寸钉死同卡面 —— 字内纹理与背景连续且字号变化不动
          backgroundImage: [cover.inkLayer, `url(${cover.image})`].join(", "),
          backgroundSize: `100% 100%, auto ${TEXTURE_PIN_H}px`,
          backgroundPosition: "top left",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          ...(flow != null ? { filter: `url(#${fid})` } : {}),
          // 纹理填字加粗(马善政单字重,浏览器合成粗体;笔画厚实才扛得住纹理与揉开)
          fontWeight: 700,
          // 字色透明(纹理透出);光标与占位符用真实墨色,否则不可见
          color: "transparent",
          caretColor: theme.ink,
          "--ph-color": theme.ink,
        } as CSSProperties)
      : null;

  const sigStyle: CSSProperties = {
    fontSize: bodyFs * 0.55,
    lineHeight: 1.8,
    letterSpacing: "0.1em",
    // 纹理填字模式:落款随标题一起填纹理(实色会脱节);普通模式用柔墨
    color: cover?.inkLayer != null ? "inherit" : theme.inkSoft,
  };
  const showSig = content.signature !== "" || content.date !== "";

  const sigLines = (
    <>
      {content.signature !== "" && <div>{content.signature}</div>}
      {content.date !== "" && <div>{content.date}</div>}
    </>
  );

  // 压图纹理主题:笔画内直接填卡面纹理(background-clip: text),调墨层叠出墨色 —— 字即是纹理;
  // 平铺/渐变主题普通压字
  const inner = (
    <>
        {showTitle && (editable || content.title !== "") && (
          <h1
            ref={titleRef}
            contentEditable={editable}
            suppressContentEditableWarning
            spellCheck={false}
            data-ph="点击输入标题"
            className={editable ? "card-editable" : undefined}
            onInput={editable ? (e) => onEdit({ title: e.currentTarget.innerHTML }) : undefined}
            onKeyDown={editable ? titleKeyDown : undefined}
            onPaste={editable ? pastePlain : undefined}
            style={{
              margin: 0,
              // 平铺版式卡面无统一 padding,标题自带上边距与图片带的呼吸间距
              ...(flat ? { padding: "80px 96px 56px" } : {}),
              fontSize: bodyFs * 1.35,
              fontWeight: cover?.inkLayer != null ? 700 : 400,
              letterSpacing: "0.25em",
              lineHeight: 1.4,
              // 显式继承主题色:index.css 的 h1{color:var(--color-ink)} 会盖掉容器 color,暗色主题下不可见;
              // 纹理填字模式随正文一起透明(纹理填笔画)
              color: cover?.inkLayer != null ? "transparent" : theme.ink,
              alignSelf: JUSTIFY[align],
            }}
          />
        )}

        {showSig && sigPos === "under-title" && (
          <div style={{ ...sigStyle, alignSelf: JUSTIFY[align], textAlign: align, marginBlockStart: 36, ...(flat ? { padding: "0 96px" } : {}) }}>
            {sigLines}
          </div>
        )}

        {/* 平铺版式图片带:满幅定高 cover;用户上传图(dataURL)优先于主题预制图
            注:用 background-image 而非 <img> —— WebKit 在 foreignObject 光栅化里 <img> 不渲染(iOS 导出丢图),
            background-image 同为纹理主题已验证可行的路径 */}
        {flat && (
          <div
            style={{
              width: "100%",
              height: FLAT_IMG_H,
              flexShrink: 0,
              backgroundImage: `url(${imageOverride ?? theme.image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundColor: theme.background,
            }}
          />
        )}

        {/* data-export-*:导出时布局冻结用(SVG 渲染上下文 intrinsic 宽度不可靠,见 export.ts) */}
        <div
          data-export-stretch=""
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: JUSTIFY[align],
            ...(flat ? { padding: "64px 96px 88px" } : {}),
          }}
        >
          <div data-export-mid="" style={{ display: "flex", flexDirection: "column" }}>
            <div
              ref={bodyTextRef}
              contentEditable={editable}
              suppressContentEditableWarning
              spellCheck={false}
              data-ph="点击输入正文"
              className={editable ? "card-editable" : undefined}
              onInput={editable ? (e) => onEdit({ body: e.currentTarget.innerHTML }) : undefined}
              onPaste={editable ? pastePlain : undefined}
              style={{ fontSize: bodyFs, lineHeight: 2, letterSpacing: "0.05em", textAlign: align, minWidth: "40%" }}
            />
          </div>
        </div>

        {showSig && sigPos === "br" && (
          <footer
            style={{
              ...sigStyle,
              alignSelf: "flex-end",
              textAlign: "right",
              ...(flat ? { padding: "0 96px 80px" } : {}),
            }}
          >
            {sigLines}
          </footer>
        )}
    </>
  );

  return (
    // 垫层:fit-content 恒等于卡宽+padding(卡面显式宽垫高 min-content,父容器可用宽压不进来)
    <div style={{ backgroundColor: mat?.bg ?? PAD_BG, padding: CARD_PAD, width: "fit-content" }}>
      <div data-export-card="" style={{ ...base, borderRadius: 48, boxShadow: shadowCss(shadowSpecs(mat?.shadow ?? SHADOW_INK)), ...(flat ? { overflow: "hidden" } : {}) }}>
        {/* 墨迹揉开滤镜:零尺寸 svg 不占版面;随卡克隆,导出不丢 */}
        {flow != null && (
          <svg aria-hidden="true" width="0" height="0" style={{ position: "absolute" }}>
            <filter id={fid} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
              {/* 分形噪声做位移场:频率低 = 大波段扭动,高 = 锯齿毛边 */}
              <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="7" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale={flow} xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </svg>
        )}
        {/* 压图纹理主题:文字整体与卡面纹理混合(印上去的融体感);平铺/渐变不混 */}
        {textLayer == null ? (
          inner
        ) : (
          <div
            key={fontSwapped ? "swapped" : "boot"}
            data-export-ink={textLayer != null ? theme.ink : undefined}
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              // 负外边距抵消卡面 padding:让本层边框盒 = 卡面盒,背景层与卡面像素级对齐(字内纹理与背景连续);
              // 内 padding 恢复文字版位
              margin: -CARD_PAD,
              padding: CARD_PAD,
              ...textLayer,
            }}
          >
            {inner}
          </div>
        )}
      </div>
    </div>
  );
}
