// 완료 토글 요청은 silent 다 — 실패 알림은 훅이 자기 글로 낸다(I-10 14).
import { describe, expect, it, vi } from "vitest";

const patch = vi.hoisted(() =>
  vi.fn(async () => ({ data: { isPinned: "N" } })),
);
vi.mock("@/shared/api", () => ({ apiClient: { patch } }));

const { todoApi } = await import("./todoApi");

describe("todoApi.toggleTodoStatus", () => {
  it("silent 로 보낸다", async () => {
    await todoApi.toggleTodoStatus(7);
    expect(patch).toHaveBeenCalledWith("/v1/todo/7/status", undefined, {
      silent: true,
    });
  });
});
