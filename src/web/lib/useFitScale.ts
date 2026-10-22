/**
 * 预览缩放 hook:容器宽 / 设计宽 = scale,上限 1 不放大;
 * 传入 designH 时同时受视口高度约束(卡整屏可见,页面不出滚动条)。
 */

import { useLayoutEffect, useState, type RefObject } from "react";

/** 视口高度预留:header + 工具条 + 页边距 */
const VIEWPORT_H_RESERVE = 300;

export function useFitScale(ref: RefObject<HTMLDivElement | null>, designW: number, designH?: number) {
  const [scale, setScale] = useState(0.45);
  useLayoutEffect(() => {
    const el = ref.current;
    if (el == null) return;
    const update = () => {
      let s = Math.min(1, el.clientWidth / designW);
      if (designH != null && designH > 0) s = Math.min(s, (window.innerHeight - VIEWPORT_H_RESERVE) / designH);
      setScale(s);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [ref, designW, designH]);
  return scale;
}
