/**
 * 代码卡模板:窗口条(mac 三点 + 文件名)+ 高亮代码体。
 * 所见即所得编辑:高亮层(shiki html,inline style)流内撑高,textarea 透明前景
 * absolute inset-0 覆盖 —— 两者共享同一份排版样式对象(font/行高/折行/tab/连字),
 * 同一渲染引擎同规则 → 逐像素重合,光标即最终像素。
 * 根节点是主题色垫层(卡外四周 padding):圆角卡浮于其上,导出 PNG 四角不透明,
 * 宿主背景(微信/抖音聊天底图)不再从圆角缺口透出。
 * 宽度:自动换行关时长行不折,卡宽撑到内容宽(量 scrollWidth,最小 CODE_CARD_W);
 * 开时固定 CODE_CARD_W 内折行。导出层同逻辑,截图宽度随节点自身。
 */

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { escapeHtml } from "../lib/html";
import { CODE_FONT_SIZES, type CodeFontSize } from "./share";
import { codeLangById } from "./languages";
import { codeThemeById } from "./themes";

/** 卡片逻辑尺寸:宽随最长行自适应(min ~ max),高随内容自适应 */
export const CODE_CARD_W = 1080;
export const CODE_CARD_MIN_W = 480;
export const CODE_CARD_MAX_W = 1920;

const FONT_SIZE: Record<CodeFontSize, number> = { s: 22, m: 26, l: 30 };

/** 代码字体:等宽+连字 JetBrains Mono,中文(注释)回退霞鹜文楷;不做字体选择 */
const CODE_FONT_FAMILY = `"JetBrains Mono", "LXGW WenKai", monospace`;

/** 导出垫层(卡外四周)统一配色:中明度冷银灰(月白装裱),凸显圆角卡(同诗卡) */
const PAD_BG = "#d7dade";
/** 卡面投影(双墨:近影勾边+远影浮起):向下延伸(dy+blur)不得超垫层 padding 72,否则截图切边 */
const CARD_SHADOW = "0 6px 18px rgba(15, 23, 42, 0.12), 0 24px 48px rgba(15, 23, 42, 0.22)";

export interface CodeCardProps {
  code: string;
  /** 高亮 html(页面层异步算好传入;加载中传 plainPreHtml 的产物) */
  html: string;
  langId: string;
  themeId: string;
  filename: string;
  fontSize: CodeFontSize;
  /** 连字(JetBrains Mono 的 calt/liga 特性),关闭后 => 等保持字符原形 */
  ligatures: boolean;
  /** 自动换行:关 = 长行不折、卡宽撑到内容宽;开 = 固定宽内折行 */
  wrap: boolean;
  /** 传入即开启就地编辑(textarea 覆盖层);导出层不传 */
  editable?: boolean;
  onCodeChange?: (code: string) => void;
  onFilenameChange?: (name: string) => void;
}

/** 引擎/分包未就绪时的高亮层内容:无色纯文本,排版与着色后一致 */
export function plainPreHtml(code: string): string {
  return `<pre><code>${escapeHtml(code)}</code></pre>`;
}

export function CodeCard({
  code,
  html,
  langId,
  themeId,
  filename,
  fontSize,
  ligatures,
  wrap,
  editable = false,
  onCodeChange,
  onFilenameChange,
}: CodeCardProps) {
  const theme = codeThemeById(themeId);
  const fs = FONT_SIZE[fontSize];
  const bodyRef = useRef<HTMLDivElement>(null);
  const hlRef = useRef<HTMLDivElement>(null);
  const [cardW, setCardW] = useState(CODE_CARD_W);

  // 不折行时量内容宽撑卡:高亮层 width:max-content 收缩到最长行,量它自身
  // (scrollWidth 在内容不溢出时恒等于容器宽,会死锁在初始宽)
  useLayoutEffect(() => {
    const measure = () => {
      if (!wrap) {
        const w = hlRef.current?.offsetWidth ?? 0;
        setCardW(Math.min(CODE_CARD_MAX_W, Math.max(CODE_CARD_MIN_W, w + 40 * 2)));
      } else {
        setCardW(CODE_CARD_W);
      }
    };
    measure();
    // webfont 就绪前后字宽不同(等宽回退 vs JetBrains Mono),就绪后重量一次
    document.fonts.ready.then(measure);
  }, [code, html, wrap, fontSize, ligatures]);

  /** 高亮层与 textarea 共享的排版样式:任何一处漂移都会导致叠字错位,必须同源 */
  const typo: CSSProperties = {
    fontFamily: CODE_FONT_FAMILY,
    fontSize: fs,
    lineHeight: 1.7,
    letterSpacing: 0,
    tabSize: 4,
    // 开 = 与 textarea 默认折行规则(pre-wrap + break-word)对齐,折行点才能逐行重合;
    // 关 = pre 不折,textarea wrap=off,卡宽由上面量宽撑开,两侧都不会滚
    ...(wrap ? { whiteSpace: "pre-wrap" as const, overflowWrap: "break-word" as const } : { whiteSpace: "pre" as const }),
    fontKerning: "none",
    fontVariantLigatures: ligatures ? "contextual" : "none",
  };

  return (
    // 垫层:fit-content 收缩贴卡(父容器无宽,块级默认会撑满导出层视口)
    <div style={{ backgroundColor: PAD_BG, padding: 72, width: "fit-content" }}>
      <div
        style={{
          width: cardW,
          backgroundColor: theme.bg,
          color: theme.fg,
          padding: "24px 40px 36px",
          borderRadius: 32,
          boxShadow: CARD_SHADOW,
          position: "relative",
          // 字体就绪后的二次量宽平滑过渡(直接跳变会闪)
          transition: "width 0.25s ease",
        }}
      >
        {/* 语言名胶囊:钉死右上角,不随卡宽/文件名变化;窗口条留右 padding 防重叠 */}
        <span
          style={{
            position: "absolute",
            top: 24,
            right: 36,
            fontSize: fs * 0.62,
            lineHeight: 1,
            padding: `${fs * 0.18}px ${fs * 0.5}px`,
            borderRadius: 999,
            border: `1px solid ${theme.fg}88`,
            color: theme.fg,
            opacity: 0.85,
            whiteSpace: "nowrap",
            fontVariantLigatures: "none",
          }}
        >
          {codeLangById(langId).name}
        </span>

        {/* 窗口条:三点 + 文件名(可编辑);紧 Chrome 贴 macOS 窗口感 */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, paddingBlockEnd: 24, paddingRight: 190 }}>
          <span style={{ display: "flex", gap: 12 }}>
            {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
              <i key={c} style={{ width: 22, height: 22, borderRadius: "50%", backgroundColor: c }} />
            ))}
          </span>
          <input
            value={filename}
            onChange={editable ? (e) => onFilenameChange?.(e.target.value) : undefined}
            readOnly={!editable}
            spellCheck={false}
            style={{
              flex: 1,
              minWidth: 0,
              border: "none",
              outline: "none",
              background: "transparent",
              color: theme.fg,
              opacity: 0.75,
              fontSize: fs * 0.85,
              fontFamily: "inherit",
              padding: 0,
            }}
          />
        </div>

        {/* 代码体:高亮层流内撑高(空内容塌陷为 0 高会让 textarea 无处点击,minHeight 兑底一行),textarea 覆盖其上 */}
        <div ref={bodyRef} className="code-body" style={{ position: "relative", overflow: "hidden", minHeight: Math.ceil(fs * 1.7), ...typo }}>
          <div ref={hlRef} className="code-highlight" style={{ width: wrap ? "100%" : "max-content" }} dangerouslySetInnerHTML={{ __html: html }} />
          {editable && (
            <textarea
              className="code-input"
              wrap={wrap ? "soft" : "off"}
              value={code}
              onChange={(e) => onCodeChange?.(e.target.value)}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                margin: 0,
                padding: 0,
                border: "none",
                outline: "none",
                background: "transparent",
                resize: "none",
                overflow: "hidden",
                color: "transparent",
                caretColor: theme.fg,
                cursor: "text",
                ...typo,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
