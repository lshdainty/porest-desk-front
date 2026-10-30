import { describe, expect, it, vi } from "vitest";

const del = vi.hoisted(() => vi.fn());
vi.mock("@/shared/api", () => ({ apiClient: { delete: del } }));

const { savingGoalApi } = await import("./savingGoalApi");

describe("savingGoalApi.deleteSavingGoal 전역 오류 토스트(M5)", () => {
  it("silent — 호출처 스낵바가 실패를 알린다", async () => {
    del.mockResolvedValue({ data: undefined });
    await savingGoalApi.deleteSavingGoal(5);
    expect(del).toHaveBeenCalledWith("/v1/saving-goal/5", { silent: true });
  });
});
