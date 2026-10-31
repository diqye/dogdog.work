/**
 * 导出管线:modern-screenshot(SVG foreignObject 路线,相对 html-to-image 修复了
 * iOS Safari 的字体嵌入时序)。PNG 无损渐变(JPEG 压缩平滑渐变会出色带);
 * 固定 2x 出图(设计宽 1080 → 2448px,文字锐度与体积的平衡点)。
 * 截图源是离屏设计尺寸渲染层(无 transform/编辑态),字体嵌入一次全页共用。
 * 诗卡/代码卡共用:宽度随节点自身,字体可嵌多个 css(等宽+中文回退)。
 */

import { domToBlob } from "modern-screenshot";
import type { ShadowSpec } from "../card/types";

/** 出图倍率:设计尺寸 2x —— 文字锐度与体积的平衡点,不再按体积降档 */
const EXPORT_SCALE = 2;

/** 装裱合成规格:导出时卡面截图 + 垫层底色 + canvas 投影在离屏 canvas 里合成
 * (垫层与阴影不入截图源,绕开 WebKit foreignObject 的 box-shadow bug) */
export interface MatSpec {
  bg: string;
  pad: number;
  shadows: ShadowSpec[];
}

/**
 * 正文居中层布局冻结:flex + shrink-to-fit 的正文容器宽度恰等于内容宽(零余量),
 * SVG foreignObject 渲染上下文的字形度量有亚像素差异,末字会折行并与下行叠印。
 * 截图前按 HTML 量好的几何写死绝对定位并留宽度余量,截完恢复。
 * 余量按对齐方向分配(left 补右侧/center 补两侧/right 补左侧),文字视觉位置不变。
 */
function freezeBodyLayout(node: HTMLElement): () => void {
  const stretch = node.querySelector<HTMLElement>("[data-export-stretch]");
  const mid = node.querySelector<HTMLElement>("[data-export-mid]");
  if (stretch == null || mid == null) return () => {};
  const bak = [stretch.getAttribute("style"), mid.getAttribute("style")];
  const s = stretch.getBoundingClientRect();
  const m = mid.getBoundingClientRect();
  const align = getComputedStyle(mid.firstElementChild ?? mid).textAlign;
  const pad = 24;
  const dx = align === "center" ? -pad / 2 : align === "right" ? -pad : 0;
  stretch.setAttribute("style", `position:relative;height:${s.height}px;`);
  mid.setAttribute(
    "style",
    `position:absolute;left:${m.left - s.left + dx}px;top:${m.top - s.top}px;width:${m.width + pad}px;`,
  );
  return () => {
    for (const [el, css] of [
      [stretch, bak[0]],
      [mid, bak[1]],
    ] as const) {
      if (css != null) el.setAttribute("style", css);
      else el.removeAttribute("style");
    }
  };
}

/** unicode-range 声明 → 数值区间(支持 U+4E00-4FFF 与通配 U+4E?? 两种形态) */
function parseRanges(decl: string): [number, number][] {
  const ranges: [number, number][] = [];
  for (const part of decl.split(",")) {
    const m = part.trim().match(/^U\+([0-9a-f?]+)(?:-([0-9a-f]+))?$/i);
    if (m == null) continue;
    const lo = parseInt(m[1]!.replace(/\?/g, "0"), 16);
    const hi = m[2] != null ? parseInt(m[2], 16) : parseInt(m[1]!.replace(/\?/g, "f"), 16);
    ranges.push([lo, hi]);
  }
  return ranges;
}

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  // 分块防 spread 参数上限
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}

/**
 * 按需字体嵌入:截图库默认 fetch css 里全部 @font-face(97 个分包全量下载),
 * 这里只嵌"导出文本实际命中 unicode-range 的分包"(一首诗约命中几个)。
 * 多个 css(代码卡:等宽英文+中文回退)逐一扫描,命中分包全量合并嵌入。
 */
async function buildFontEmbedCSS(text: string, cssPaths: string[]): Promise<string> {
  const chunks: string[] = [];
  for (const cssPath of cssPaths) {
    chunks.push(await buildFontEmbedCSSFrom(cssPath, text));
  }
  return chunks.join("\n");
}

async function buildFontEmbedCSSFrom(cssPath: string, text: string): Promise<string> {
  const cssUrl = new URL(cssPath, location.origin).href;
  const css = await (await fetch(cssUrl)).text();
  const cps = new Set([...text].map((ch) => ch.codePointAt(0)!));
  const inRanges = (cp: number, ranges: [number, number][]) => ranges.some(([lo, hi]) => cp >= lo && cp <= hi);

  const faces = css.match(/@font-face\s*\{[^}]*\}/g) ?? [];
  const chunks: string[] = [];
  for (const face of faces) {
    // 值域吃到 ; 或 } 为止:lxgw 的 css 末条声明不带分号,要求分号会全军覆没
    const rangeDecl = face.match(/unicode-range:\s*([^;}]+)/)?.[1];
    const srcUrl = face.match(/url\((?:'([^']+)'|"([^"]+)"|([^'"][^)]*))\)/);
    const url = srcUrl?.[1] ?? srcUrl?.[2] ?? srcUrl?.[3];
    if (rangeDecl == null || url == null) continue;

    const ranges = parseRanges(rangeDecl);
    if (![...cps].some((cp) => inRanges(cp, ranges))) continue;

    const buf = await (await fetch(new URL(url, cssUrl)).catch(() => null))?.arrayBuffer();
    if (buf == null) continue;
    // 剔除 font-display:swap — SVG-as-image 渲染不等 webfont 解码,swap 会直接画回退字体
    chunks.push(
      face
        .replace(/url\([^)]*\)/, `url(data:font/woff2;base64,${toBase64(buf)})`)
        .replace(/font-display:[^;}]+[;}]?/g, ""),
    );
  }
  return chunks.join("\n");
}

/** WebKit(iOS/桌面 Safari)在 foreignObject 光栅化里画不出 background-clip:text 的纹理填字
 * (整层文字消失),CSS filter 引用的 SVG 滤镜同样不可靠;导出前降级为实色墨保可读。
 * 桌面 Chrome 不受影响(排除 Chromium 系 UA)。返回恢复函数,截完还原预览。 */
function degradeTextLayerForWebKit(card: HTMLElement): () => void {
  const ua = navigator.userAgent;
  if (!/WebKit/i.test(ua) || /Chrome|Chromium|Edg|OPR|Android/i.test(ua)) return () => {};
  const el = card.querySelector<HTMLElement>("[data-export-ink]");
  if (el == null) return () => {};
  // 降级范圍:容器 + 容器内 h1(h1 有自身显式 transparent 对抗全局样式,不一起改则标题仍不可见)
  const els = [el, ...Array.from(el.querySelectorAll<HTMLElement>("h1"))];
  const baks = els.map((e) => e.getAttribute("style"));
  el.style.filter = "none";
  el.style.backgroundImage = "none";
  el.style.backgroundClip = "";
  el.style.webkitBackgroundClip = "";
  for (const e of els) e.style.color = el.dataset.exportInk ?? "";
  return () => {
    for (const [e, css] of els.map((e, i) => [e, baks[i]] as const)) {
      if (css != null) e.setAttribute("style", css);
      else e.removeAttribute("style");
    }
  };
}

/**
 * 导出多页 PNG:多页时命名 `名-1.png/-2.png…`,单页保持 `名.png`。
 * 优先 Web Share(移动端 Safari 分享面板可「存储图像」进相册,a[download] 只进文件 App);
 * 手势过期/不支持则回退逐张下载。返回 shared(已弹分享) 或 downloaded(已下载)。
 */
export async function exportCards(
  nodes: HTMLElement[],
  baseName: string,
  fontCssPaths: string[] = [],
  mat?: MatSpec,
): Promise<"shared" | "downloaded"> {
  // 字体分包全部就绪再截,避免缺字回退系统字体;全页文本合并,嵌入命中分包
  const fontCss = await buildFontEmbedCSS(nodes.map((n) => n.innerText).join(""), fontCssPaths);
  // web 字体命中 0 个分包 = 字体加载链路断了(CDN 不可达等):
  // 静默回退会让导出整卡错字体,不如报错让用户重试
  if (fontCssPaths.length > 0 && fontCss === "") throw new Error("字体加载失败,请检查网络后重试");

  // 并行截各页:总耗时 ≈ 最慢一页 —— navigator.share 有数秒的用户手势窗口,
  // 串行多页截图必然超时,分享会静默变下载
  const blobs = await Promise.all(
    nodes.map(async (node) => {
      // 传 mat 时截图源只取卡面(垫层/阴影离屏合成);田卡向后兼容整节点截图
      const card = mat != null ? (node.querySelector<HTMLElement>("[data-export-card]") ?? node) : node;
      const unfreeze = freezeBodyLayout(node);
      // 卡面自带 CSS 投影仅限预览;导出的阴影由 canvas 合成,截前摘除
      const shadowBak = card.style.boxShadow;
      card.style.boxShadow = "none";
      const undegrade = degradeTextLayerForWebKit(card);
      try {
        const raw = await domToBlob(card, {
          height: card.offsetHeight,
          scale: EXPORT_SCALE,
          // 系统字体主题无 cssText,font:false 连文档字体扫描一并跳过
          font: fontCss === "" ? false : { cssText: fontCss },
        });
        return mat != null ? await composeMat(raw, mat) : raw;
      } finally {
        card.style.boxShadow = shadowBak;
        undegrade();
        unfreeze();
      }
    }),
  );

  const files = blobs.map((blob, i) => {
    const suffix = nodes.length > 1 ? `-${i + 1}` : "";
    return new File([blob], `${baseName}${suffix}.png`, { type: "image/png" });
  });

  if (navigator.canShare?.({ files }) === true) {
    try {
      await navigator.share({ files });
      return "shared";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return "shared"; // 用户取消
    }
  }

  // 回退下载:连点会被浏览器拦截,间隔放行
  for (const file of files) {
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    await new Promise((r) => setTimeout(r, 300));
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
  return "downloaded";
}

/** 卡面截图 → 装裱图:垫层底色铺满,投影用 canvas shadowBlur 逐层画(多层的画不清除前层,叠加即双墨) */
async function composeMat(cardBlob: Blob, mat: MatSpec): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("卡面截图合成失败"));
    el.src = URL.createObjectURL(cardBlob);
  });
  try {
  const pad = mat.pad * EXPORT_SCALE;
  const canvas = document.createElement("canvas");
  canvas.width = img.width + pad * 2;
  canvas.height = img.height + pad * 2;
  const ctx = canvas.getContext("2d");
  if (ctx == null) throw new Error("卡面截图合成失败");
  ctx.fillStyle = mat.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (const s of mat.shadows) {
    ctx.shadowColor = s.color;
    ctx.shadowBlur = s.blur * EXPORT_SCALE;
    ctx.shadowOffsetX = s.x * EXPORT_SCALE;
    ctx.shadowOffsetY = s.y * EXPORT_SCALE;
    ctx.drawImage(img, pad, pad);
  }
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.drawImage(img, pad, pad);
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b != null ? resolve(b) : reject(new Error("卡面截图合成失败"))), "image/png"),
  );
  } finally {
    URL.revokeObjectURL(img.src);
  }
}
