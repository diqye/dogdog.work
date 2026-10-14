/**
 * fetch 封装:统一 JSON 解析与错误识别。
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  // gpress 的 zod 校验失败回 200 + {code,message} 错误体,与 HTTP 状态码一并识别,
  // 避免错误体被当业务数据 set 进页面状态
  if (!res.ok || body.error != null || body.code != null) {
    throw new ApiError((body.error as string) ?? (body.message as string) ?? `HTTP ${res.status}`, res.status);
  }
  return body as T;
}
