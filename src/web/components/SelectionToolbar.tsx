/**
 * 选区气泡:卡片内选中文字时浮出于选区上方(fixed,portal 到 body)。
 * 色点(foreColor,随主题)+ 加粗/斜体/删除线。
 * 所有操作后折叠选区:后续输入恢复默认格式,气泡随之消失。
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Bold, Italic, Strikethrough } from "lucide-react";
import type { RefObject } from "react";

interface Pos {
  x: number;
  y: number;
}

export function SelectionToolbar({
  cardRef,
  accents,
}: {
  cardRef: RefObject<HTMLDivElement | null>;
  accents: string[];
}) {
  const [pos, setPos] = useState<Pos | null>(null);
  const [states, setStates] = useState({ bold: false, italic: false, strike: false });

  useEffect(() => {
    const onSelChange = () => {
      const sel = document.getSelection();
      const card = cardRef.current;
      if (sel == null || sel.isCollapsed || sel.rangeCount === 0 || card == null) {
        setPos(null);
        return;
      }
      const node = sel.anchorNode;
      if (node == null || !card.contains(node)) {
        setPos(null);
        return;
      }
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        setPos(null);
        return;
      }
      setPos({ x: rect.left + rect.width / 2, y: rect.top });
      setStates({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        strike: document.queryCommandState("strikeThrough"),
      });
    };
    document.addEventListener("selectionchange", onSelChange);
    // 滚动/缩放时选区坐标失效,直接隐藏
    const hide = () => setPos(null);
    window.addEventListener("scroll", hide, true);
    return () => {
      document.removeEventListener("selectionchange", onSelChange);
      window.removeEventListener("scroll", hide, true);
    };
  }, [cardRef]);

  if (pos == null) return null;

  const exec = (cmd: string, val?: string) => {
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand(cmd, false, val);
    // 收尾:折叠选区(继续输入恢复默认格式),气泡随 selectionchange 消失
    document.getSelection()?.collapseToEnd();
  };

  const iconBtn = (active: boolean) =>
    `w-7 h-7 rounded-full flex items-center justify-center ${active ? "bg-white/25" : "hover:bg-white/15"}`;

  return createPortal(
    <div
      style={{
        left: Math.min(Math.max(pos.x, 130), window.innerWidth - 130),
        top: pos.y - 88,
      }}
      className="fixed z-50 -translate-x-1/2 flex flex-col items-center gap-1 bg-ink text-canvas rounded-2xl shadow-md px-2 py-1.5 select-none"
    >
      {/* 两行:上色点下格式钮 —— 单行在窄屏选区靠边时会溢出屏幕 */}
      <div className="flex items-center gap-1">
        {accents.map((c) => (
          <button
            key={c}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec("foreColor", c)}
            className="w-6 h-6 rounded-full border border-white/40 hover:scale-110 transition-transform"
            style={{ background: c }}
          />
        ))}
      </div>
      <div className="flex items-center gap-1 border-t border-white/15 pt-1">
        <button onMouseDown={(e) => e.preventDefault()} onClick={() => exec("bold")} className={iconBtn(states.bold)} title="加粗">
          <Bold size={13} />
        </button>
        <button onMouseDown={(e) => e.preventDefault()} onClick={() => exec("italic")} className={iconBtn(states.italic)} title="斜体">
          <Italic size={13} />
        </button>
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("strikeThrough")}
          className={iconBtn(states.strike)}
          title="删除线"
        >
          <Strikethrough size={13} />
        </button>
      </div>
    </div>,
    document.body,
  );
}
