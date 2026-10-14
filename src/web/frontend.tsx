/**
 * 前端入口:挂载 root,渲染 App。
 */

import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./index.css";
import { FONTS } from "./card/fonts";
import { THEMES } from "./card/themes";

// 默认主题字体 css 在模块加载即注入(与 JS 并行,不等 React mount);CardPage 按 data-card-font 复用切换。
// 不写在 index.html:bun build 会把 <link> 解析为依赖打包,97 个 woff2 分包被 base64 内联(css 6.3MB 事故)。
if (THEMES[0]!.font.cssPath != null) {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.dataset.cardFont = "";
  link.href = THEMES[0]!.font.cssPath;
  document.head.append(link);
}

const elem = document.getElementById("root")!;
const app = <App />;

// https://bun.com/docs/bundler/hot-reloading#import-meta-hot-data
(import.meta.hot.data.root ??= createRoot(elem)).render(app);
