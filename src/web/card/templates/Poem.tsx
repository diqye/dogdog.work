/**
 * 现代诗横排模板:标题左上 / 正文垂直居中 / 落款右下。
 * 卡片为竖构图(3:4),文字横排(现代诗出版惯例)。
 * 就地编辑(onEdit 传入时):标题/正文 contentEditable 富文本,
 * React 不托管编辑区 DOM(ref + layoutEffect 单向同步),用户输入只回写 state,
 * state 与 DOM 恒等 → 光标不跳。
 */

import { useLayoutEffect, useRef, type CSSProperties, type ClipboardEvent, type KeyboardEvent } from "react";
import type { CardContent } from "../types";
import { CARD_H } from "../types";
import { themeById } from "../themes";

export type { FontSize, Align, SigPos } from "../types";
import type { FontSize, Align, SigPos } from "../types";

const BODY_FONT_SIZE: Record<FontSize, number> = { s: 40, m: 48, l: 56 };
const JUSTIFY: Record<Align, string> = { left: "flex-start", center: "center", right: "flex-end" };

export interface PoemProps {
  content: CardContent;
  themeId: string;
  fontSize: FontSize;
  align: Align;
  sigPos: SigPos;
  /** 多页模式下标题只进首页;默认 true(单卡全量渲染) */
  showTitle?: boolean;
  /** 传入即开启就地编辑,变更以 html 回调 */
  onEdit?: (patch: Partial<Pick<CardContent, "title" | "body">>) => void;
}

/** DOM 与 state 不一致才写,避免编辑中被重置丢光标 */
function useSyncHtml(ref: React.RefObject<HTMLElement | null>, html: string) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (el != null && el.innerHTML !== html) el.innerHTML = html;
  }, [ref, html]);
}

/** 粘贴强制纯文本,避免外部富文本结构入侵 */
function pastePlain(e: ClipboardEvent) {
  e.preventDefault();
  document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
}

export function Poem({ content, themeId, fontSize, align, sigPos, showTitle = true, onEdit }: PoemProps) {
  const theme = themeById(themeId);
  const bodyFs = BODY_FONT_SIZE[fontSize];
  const editable = onEdit != null;

  const titleRef = useRef<HTMLHeadingElement>(null);
  const bodyTextRef = useRef<HTMLDivElement>(null);
  useSyncHtml(titleRef, content.title);
  useSyncHtml(bodyTextRef, content.body);

  const base: CSSProperties = {
    width: "100%",
    minHeight: CARD_H,
    padding: 96,
    boxSizing: "border-box",
    background: theme.background,
    color: theme.ink,
    fontFamily: `${theme.font.family}, 'PingFang SC', serif`,
    display: "flex",
    flexDirection: "column",
  };

  /** 标题单行:Enter 换行禁用 */
  const titleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") e.preventDefault();
  };

  const sigStyle: CSSProperties = {
    fontSize: bodyFs * 0.55,
    lineHeight: 1.8,
    letterSpacing: "0.1em",
    color: theme.inkSoft,
  };
  const showSig = content.signature !== "" || content.date !== "";

  const sigLines = (
    <>
      {content.signature !== "" && <div>{content.signature}</div>}
      {content.date !== "" && <div>{content.date}</div>}
    </>
  );

  return (
    <div style={base}>
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
            fontSize: bodyFs * 1.35,
            fontWeight: 400,
            letterSpacing: "0.25em",
            lineHeight: 1.4,
            // 显式继承主题色:index.css 的 h1{color:var(--color-ink)} 会盖掉容器 color,暗色主题下不可见
            color: theme.ink,
            alignSelf: JUSTIFY[align],
          }}
        />
      )}

      {showSig && sigPos === "under-title" && (
        <div style={{ ...sigStyle, alignSelf: JUSTIFY[align], textAlign: align, marginBlockStart: 36 }}>{sigLines}</div>
      )}

      {/* data-export-*:导出时布局冻结用(SVG 渲染上下文 intrinsic 宽度不可靠,见 export.ts) */}
      <div data-export-stretch="" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: JUSTIFY[align] }}>
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
          }}
        >
          {sigLines}
        </footer>
      )}
    </div>
  );
}
