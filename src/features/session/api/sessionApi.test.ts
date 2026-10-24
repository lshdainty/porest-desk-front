// 목록 · 끊기 요청은 모두 silent — 실패는 화면이 알린다(I-12 29 · 31). 전역 토스트와 둘이 뜨지 않는다.
import { describe, expect, it, vi } from "vitest";

const calls = vi.hoisted(() => ({ get: vi.fn(), del: vi.fn() }));
vi.mock("@/shared/api", () => ({
  apiClient: { get: calls.get, delete: calls.del },
}));
const { sessionApi } = await import("./sessionApi");

describe("sessionApi silent", () => {
  it("list · revoke · revokeAll 모두 silent", async () => {
    calls.get.mockResolvedValue({ success: true, data: [] });
    calls.del.mockResolvedValue({ success: true });
    await sessionApi.list();
    await sessionApi.revoke("s1");
    await sessionApi.revokeAll();
    expect(calls.get.mock.calls[0]![1]).toMatchObject({ silent: true });
    for (const c of calls.del.mock.calls)
      expect(c[1]).toMatchObject({ silent: true });
    expect(calls.del).toHaveBeenCalledTimes(2);
  });
});
