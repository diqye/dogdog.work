/**
 * 首页:拉取 /api/hello 渲染(api → response → render 完整链路示例)。
 */

import { useEffect, useState } from "react";
import { api } from "../lib/api";

interface HelloResp {
  message: string;
  time: string;
}

export function HelloPage() {
  const [hello, setHello] = useState<HelloResp | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<HelloResp>("/api/hello")
      .then(setHello)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-display font-semibold tracking-tight">dogdog.work</h1>
      <p className="text-ink-soft">个人网站</p>

      <div className="bg-surface rounded-lg shadow-sm border border-line p-6 flex flex-col gap-3">
        {error != null ? (
          <p className="text-sm text-ink-soft">API 错误:{error}</p>
        ) : hello == null ? (
          <p className="text-sm text-ink-faint">加载中…</p>
        ) : (
          <>
            <p className="font-mono text-sm text-primary">{hello.message}</p>
            <p className="text-sm text-ink-faint">
              server time: {new Date(hello.time).toLocaleString("zh-CN")}
            </p>
          </>
        )}
      </div>
    </section>
  );
}
