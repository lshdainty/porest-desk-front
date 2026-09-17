import { apiClient } from "@/shared/api";
import type { ApiResponse } from "@/shared/types";

export interface ChangePasswordReq {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export type NotificationSound = "CHIME" | "DEFAULT" | "NONE";
export type EmailFrequency = "DAILY" | "WEEKLY" | "MONTHLY";

export interface UserPreferences {
  /** 마스터 토글 */
  pushEnabled: boolean;
  /** 결제 알림 */
  notifyPayment: boolean;
  /** 예산 알림 */
  notifyBudget: boolean;
  /** 자동 기록 알림 */
  notifyAutoRecord: boolean;
  /** 더치페이 알림 */
  notifyDutchPay: boolean;
  /** 일정 알림 */
  notifyCalendar: boolean;
  /** 주간 리포트 */
  notifyWeeklyReport: boolean;
  /** 월간 리포트 */
  notifyMonthlyReport: boolean;
  /** 예산 임계값 50~100 */
  budgetAlertThreshold: number;
  /** 방해 금지 사용 */
  quietHoursEnabled: boolean;
  /** 방해 금지 시작 "HH:mm" 24h */
  quietHoursStart: string;
  /** 방해 금지 종료 "HH:mm" 24h */
  quietHoursEnd: string;
  /** 알림음 */
  notificationSound: NotificationSound;
  /** 진동 */
  vibrationEnabled: boolean;
  /** 이메일 수신 */
  emailEnabled: boolean;
  /** 발송 주기 */
  emailFrequency: EmailFrequency;
  /** 표시 기준 지역 (IANA 타임존 ID) */
  timezone: string;
  /**
   * 새 자산·거래를 만들 때 먼저 골라 두는 통화 (KRW·USD·EUR·JPY).
   *
   * 종전엔 브라우저 `localStorage` 에만 있었고 **읽는 곳이 하나도 없었다**(QA #124) —
   * 고르면 저장된 것처럼 보이는데 폰에서도, 다른 브라우저에서도 아무 일이 없었다.
   * 계정에 딸린 값이므로 서버가 갖는다(desk-back #328).
   *
   * 서버는 컬럼 기본값 `'KRW'` 로 **항상 실어 준다.** 그래도 읽는 자리는
   * `?? DEFAULT_CURRENCY` 를 거친다 — 쿼리가 아직 안 왔을 때(`data === undefined`)가
   * 있고, 서버가 이 칸을 얹기 전 배포에서도 화면이 빈 채로 뜨면 안 된다.
   */
  defaultCurrency: string;
}

/**
 * 해지 전 점검 결과.
 *
 * <p>개수를 세어 오는 이유는 화면이 <b>무엇을 잃는지 숫자로</b> 보여 줘야 하기 때문이다 —
 * "모든 데이터가 삭제됩니다" 는 아무것도 알려 주지 않는다.
 */
export interface WithdrawalCheck {
  /** 막는 사유. 비어 있어야 해지할 수 있다. 지금은 `SUBSCRIPTION` 하나뿐. */
  blocked: string[];
  /**
   * 구독이 막고 있을 때 **언제부터 가능한지**(ISO, 서버 UTC).
   * 이 날짜를 보여 줘야 사용자가 기다릴지 지금 구독을 해지할지 정한다.
   */
  subscriptionPeriodEnd: string | null;
  /** 내가 만든 공유 캘린더 — 해지하면 삭제되고 멤버도 못 본다 */
  sharedCalendarsOwned: number;
  /** 남의 캘린더에 들어가 있는 수 — 거기서 빠진다 */
  calendarMemberships: number;
  /** 내가 만든 정산 — 삭제된다 */
  dutchPaysOwned: number;
  /** 남의 정산에 참가한 수 — "탈퇴한 사용자" 로 남는다 */
  dutchPayParticipations: number;
}

/** 해지를 막는 사유 코드. 서버 `CheckResult.blocked` 의 문자열과 같아야 한다. */
export const WITHDRAW_BLOCK_SUBSCRIPTION = "SUBSCRIPTION";

export const userApi = {
  changePassword: async (data: ChangePasswordReq): Promise<void> => {
    // 실패는 다이얼로그가 desk 문구로 보여준다 — 전역 토스트를 타면 desk-back 이
    // relay 한 **SSO 문장**("현재 비밀번호가 올바르지 않습니다")이 그대로 나간다
    // (QA #128). 아래 `verifyPassword` 와 같은 이유·같은 방식이다.
    const resp: ApiResponse = await apiClient.patch(
      "/v1/users/me/password",
      data,
      { silent: true } as import("axios").AxiosRequestConfig & {
        silent?: boolean;
      },
    );
    if (!resp.success) throw new Error(resp.message);
  },

  verifyPassword: async (password: string): Promise<void> => {
    // 실패(400)는 다이얼로그가 인라인으로 보여준다 — 전역 토스트까지 겹치지 않게 silent.
    const resp: ApiResponse = await apiClient.post(
      "/v1/users/me/verify-password",
      { password },
      { silent: true } as import("axios").AxiosRequestConfig & {
        silent?: boolean;
      },
    );
    if (!resp.success) throw new Error(resp.message);
  },

  withdrawalCheck: async (): Promise<WithdrawalCheck> => {
    const resp: ApiResponse<WithdrawalCheck> = await apiClient.get(
      "/v1/users/me/withdrawal-check",
    );
    return resp.data;
  },

  /**
   * 본인 메일로 재인증 코드 발송.
   *
   * 비밀번호가 없는 소셜 전용 계정을 위한 경로다 — 그 계정은 비밀번호 칸을 채울 수 없다.
   */
  sendReauthEmailCode: async (): Promise<void> => {
    const resp: ApiResponse = await apiClient.post(
      "/v1/users/me/reauth/email-code",
      {},
    );
    if (!resp.success) throw new Error(resp.message);
  },

  /**
   * 코드 확인 → 재인증 티켓.
   *
   * 실패(400)는 코드 칸 밑에 붙일 것이라 `silent` — 전역 토스트까지 겹치면 같은 말을
   * 두 번 하게 된다(`verifyPassword` 와 같은 이유).
   */
  verifyReauthEmailCode: async (code: string): Promise<string> => {
    const resp: ApiResponse<{ reauthToken: string }> = await apiClient.post(
      "/v1/users/me/reauth/email-code/verify",
      { code },
      { silent: true } as import("axios").AxiosRequestConfig & {
        silent?: boolean;
      },
    );
    if (!resp.success) throw new Error(resp.message);
    return resp.data.reauthToken;
  },

  /** 비밀번호 확인 → 재인증 티켓. 실패는 비밀번호 칸 밑에 붙인다. */
  verifyReauthPassword: async (password: string): Promise<string> => {
    const resp: ApiResponse<{ reauthToken: string }> = await apiClient.post(
      "/v1/users/me/reauth/password",
      { password },
      { silent: true } as import("axios").AxiosRequestConfig & {
        silent?: boolean;
      },
    );
    if (!resp.success) throw new Error(resp.message);
    return resp.data.reauthToken;
  },

  /**
   * desk 이용 해지. **되돌릴 수 없다.**
   *
   * `reauthToken` 은 방금 받은 10분·단회짜리 티켓이다 — 저장하지 말고 곧장 싣는다.
   */
  withdraw: async (reauthToken: string, reason?: string): Promise<void> => {
    const resp: ApiResponse = await apiClient.delete("/v1/users/me", {
      headers: { "X-Reauth-Token": reauthToken },
      data: reason ? { reason } : {},
    });
    if (!resp.success) throw new Error(resp.message);
  },

  getPreferences: async (): Promise<UserPreferences> => {
    const resp: ApiResponse<UserPreferences> = await apiClient.get(
      "/v1/users/me/preferences",
    );
    return resp.data;
  },

  updatePreferences: async (
    data: Partial<UserPreferences>,
  ): Promise<UserPreferences> => {
    const resp: ApiResponse<UserPreferences> = await apiClient.patch(
      "/v1/users/me/preferences",
      data,
    );
    return resp.data;
  },
};
