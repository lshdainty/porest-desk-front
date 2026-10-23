// 파일 받기가 10초 멈추면 실패, 조금씩이라도 오면 끊기지 않는다(I-05 47).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Config = {
  signal: AbortSignal;
  onDownloadProgress: (e: { loaded: number }) => void;
};
const state = vi.hoisted(() => ({
  config: null as unknown,
  resolve: null as null | ((b: Blob) => void),
  reject: null as null | ((e: Error) => void),
}));

vi.mock("@/shared/api", () => ({
  apiClient: {
    post: (_url: string, _body: unknown, config: Config) => {
      state.config = config;
      return new Promise<Blob>((resolve, reject) => {
        state.resolve = resolve;
        state.reject = reject;
        config.signal.addEventListener("abort", () =>
          reject(new Error("canceled")),
        );
      });
    },
  },
}));

const { downloadExport, ExportStalledError, EXPORT_STALL_MS } =
  await import("./exportApi");

const body = {
  period: "THIS_MONTH" as const,
  types: ["EXPENSE" as const],
  format: "CSV" as const,
  mask: false,
};
const cfg = () => state.config as Config;

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("downloadExport — 받기 진행이 멈추면 실패", () => {
  it("기본 한도는 10초다", () => {
    expect(EXPORT_STALL_MS).toBe(10_000);
  });

  it("아무 바이트도 안 오고 10초가 지나면 ExportStalledError 로 끊는다", async () => {
    const p = downloadExport(body);
    const assertion = expect(p).rejects.toBeInstanceOf(ExportStalledError);
    await vi.advanceTimersByTimeAsync(9_999);
    expect(cfg().signal.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(2);
    await assertion;
    expect(cfg().signal.aborted).toBe(true);
  });

  it("바이트가 늘 때마다 시계를 다시 센다 — 조금씩 오면 끊기지 않는다", async () => {
    const p = downloadExport(body);
    for (let i = 1; i <= 5; i++) {
      await vi.advanceTimersByTimeAsync(8_000);
      cfg().onDownloadProgress({ loaded: i * 100 });
    }
    expect(cfg().signal.aborted).toBe(false);
    state.resolve!(new Blob(["x"]));
    await expect(p).resolves.toBeInstanceOf(Blob);
  });

  it("같은 바이트 수만 되풀이해서 오면 늘지 않은 것이다 — 끊는다", async () => {
    const p = downloadExport(body);
    const assertion = expect(p).rejects.toBeInstanceOf(ExportStalledError);
    cfg().onDownloadProgress({ loaded: 100 });
    await vi.advanceTimersByTimeAsync(6_000);
    cfg().onDownloadProgress({ loaded: 100 });
    await vi.advanceTimersByTimeAsync(5_000);
    await assertion;
  });

  it("서버 오류는 멈춤으로 바꾸지 않고 그대로 던진다", async () => {
    const p = downloadExport(body, 60_000);
    const assertion = expect(p).rejects.toThrow("boom");
    state.reject!(new Error("boom"));
    await assertion;
  });
});
