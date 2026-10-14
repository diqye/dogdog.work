/**
 * 生成字体 css 到 static/fonts/(仓库资产,git 提交):
 * - css 源自 npm 分包包,但其中的 woff2 引用改写为 npmmirror CDN 绝对 URL
 *   (国内节点 ~0.1s,自托管服务器境外 ~1s;CORS 回显 Origin 已验证)。
 * - woff2 分包文件不再拷入 static(原 20MB → 数百 KB css)。
 * - 导出嵌入(card/export.ts)fetch css 后按绝对 URL 取 woff2,CORS 允许,链路不变。
 * 新字体 = bun add -d <分包包> + 下面登记 + bun run sync-fonts + card/fonts.ts 登记。
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";

const PACKAGES: Record<string, { pkg: string; css: string }> = {
  "lxgw-wenkai": { pkg: "lxgw-wenkai-webfont", css: "lxgwwenkai-regular.css" },
  "ma-shan-zheng": { pkg: "@fontsource/ma-shan-zheng", css: "400.css" },
  "zhi-mang-xing": { pkg: "@fontsource/zhi-mang-xing", css: "400.css" },
  "long-cang": { pkg: "@fontsource/long-cang", css: "400.css" },
};

for (const [id, { pkg, css }] of Object.entries(PACKAGES)) {
  const srcDir = `node_modules/${pkg}`;
  const version = JSON.parse(await readFile(`${srcDir}/package.json`, "utf8")).version as string;
  let text = await readFile(`${srcDir}/${css}`, "utf8");

  // url(./files/x.woff2) → CDN 绝对 URL(npmmirror 包内路径含 files/,故 files/files/)
  const cdn = `https://registry.npmmirror.com/${pkg}/${version}/files`;
  let count = 0;
  text = text.replace(/url\((['"]?)(\.?\/?files\/[^'")]+)\1\)/g, (_m, _q, rel: string) => {
    count++;
    return `url(${cdn}/${rel.replace(/^\.\//, "")})`;
  });

  await mkdir(`static/fonts/${id}`, { recursive: true });
  await writeFile(`static/fonts/${id}/${css}`, text);
  console.log(`static/fonts/${id}/${css} <- ${pkg}@${version}(${count} 个 woff2 指向 CDN)`);
}
