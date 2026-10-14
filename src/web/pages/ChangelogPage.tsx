/**
 * /changelog 页:拉取 /changelog.md(服务端读仓库根 CHANGELOG.md,发布 build 时快照)渲染。
 * md 结构固定(## 版本段 / ### 小节 / - 条目 / 段首副标题),自写行级解析,不引依赖。
 */

import { useEffect, useState } from "react";
import { Link } from "wouter";

interface VersionSection {
  title: string;
  date: string;
  intro: string;
  /** 小节名(如 New Features) → 条目列表 */
  groups: { name: string; items: string[] }[];
}

/** CHANGELOG 结构固定,行级解析足够;未识别行(空行/主标题)跳过 */
function parseChangelog(md: string): VersionSection[] {
  const sections: VersionSection[] = [];
  let cur: VersionSection | null = null;
  let curGroup: { name: string; items: string[] } | null = null;
  for (const line of md.split("\n")) {
    const m = line.match(/^## (?:\[Unreleased\]|v[\d.]+ \([^)]+\))/);
    if (m != null) {
      // 标题去日期后缀(单独展示);[Unreleased] 显示为「未发布」
      const ver = line.slice(3).split(" (")[0]!;
      cur = { title: ver === "[Unreleased]" ? "未发布" : ver, date: line.match(/\(([^)]+)\)/)?.[1] ?? "", intro: "", groups: [] };
      sections.push(cur);
      curGroup = null;
      continue;
    }
    if (cur == null) continue; // 主标题等版本段之前的内容
    const h3 = line.match(/^### (.+)$/);
    if (h3 != null) {
      curGroup = { name: h3[1]!, items: [] };
      cur.groups.push(curGroup);
      continue;
    }
    const li = line.match(/^- (.+)$/);
    if (li != null && curGroup != null) {
      curGroup.items.push(li[1]!);
      continue;
    }
    const text = line.trim();
    if (text !== "" && cur.intro === "" && cur.groups.length === 0) cur.intro = text;
  }
  return sections;
}

export function ChangelogPage() {
  const [sections, setSections] = useState<VersionSection[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/changelog.md")
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
      .then((md) => setSections(parseChangelog(md)))
      .catch(() => setError("加载失败,请刷新重试"));
  }, []);

  return (
    <div className="min-h-screen bg-canvas">
      <header className="px-6 py-5 flex items-center justify-between">
        <h1 className="text-h3 font-semibold">更新日志</h1>
        <Link href="/" className="text-sm text-ink-faint hover:text-ink">
          ← 诗卡
        </Link>
      </header>
      <main className="px-6 pb-16 flex flex-col gap-4">
        {error != null && <p className="text-red-600 text-sm">{error}</p>}
        {sections == null && error == null && <p className="text-sm text-ink-faint">加载中…</p>}
        {sections?.map((s) => (
          <section key={s.title} className="bg-surface border border-line rounded-2xl p-5">
            <h2 className="text-lg font-semibold">
              {s.title}
              {s.date !== "" && <span className="ml-2 text-xs text-ink-faint font-normal">{s.date}</span>}
            </h2>
            {s.intro !== "" && <p className="mt-1.5 text-sm text-ink-soft">{s.intro}</p>}
            {s.groups.map((g) => (
              <div key={g.name} className="mt-4">
                <h3 className="text-sm font-medium text-primary">{g.name}</h3>
                <ul className="mt-1.5 flex flex-col gap-1.5">
                  {g.items.map((item, i) => (
                    <li key={i} className="text-sm text-ink-soft leading-relaxed flex gap-2">
                      <span className="text-ink-faint shrink-0">·</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ))}
      </main>
    </div>
  );
}
