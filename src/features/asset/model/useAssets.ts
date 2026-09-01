import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { assetKeys } from "@/shared/config";
import { assetApi } from "../api/assetApi";
import type { TransferListParams } from "../api/assetApi";
import type {
  AssetFormValues,
  AssetUpdateFormValues,
  AssetTransferFormValues,
  AssetTradeFormValues,
  ReorderItem,
} from "@/entities/asset";

export const useAssets = () => {
  return useQuery({
    queryKey: assetKeys.list(),
    queryFn: () => assetApi.getAssets(),
  });
};

export const useAsset = (id: number) => {
  return useQuery({
    queryKey: assetKeys.detail(id),
    queryFn: () => assetApi.getAsset(id),
    enabled: id > 0,
  });
};

export const useAssetSummary = (year?: number, month?: number) => {
  return useQuery({
    queryKey: assetKeys.summary(year, month),
    queryFn: () => assetApi.getAssetSummary(year, month),
  });
};

export const useNetWorthTrend = (months = 12) => {
  return useQuery({
    queryKey: assetKeys.netWorthTrend(months),
    queryFn: () => assetApi.getNetWorthTrend(months),
    enabled: months > 0,
  });
};

export const useAssetBalanceTrend = (assetId: number, weeks: number) => {
  return useQuery({
    queryKey: assetKeys.balanceTrend(assetId, weeks),
    queryFn: () => assetApi.getAssetBalanceTrend(assetId, weeks),
    enabled: assetId > 0 && weeks > 0,
    // 자산 잔액 추이는 자주 바뀌지 않으므로 5분간 fresh.
    // 탭(3개월/6개월/1년) 전환 시 이미 조회한 기간은 즉시 재사용.
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useCreateAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AssetFormValues) => assetApi.createAsset(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.all });
    },
  });
};

export const useUpdateAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AssetUpdateFormValues }) =>
      assetApi.updateAsset(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.all });
    },
  });
};

export const useDeleteAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => assetApi.deleteAsset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.all });
    },
  });
};

export const useCardBilling = (id: number) => {
  return useQuery({
    queryKey: assetKeys.billing(id),
    queryFn: () => assetApi.getCardBilling(id),
    enabled: id > 0,
  });
};

export const usePayCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, amount }: { id: number; amount?: number }) =>
      assetApi.payCard(id, amount),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: assetKeys.all });
      queryClient.invalidateQueries({ queryKey: assetKeys.billing(id) });
    },
  });
};

/** 카드 결제 취소 — 잔액·청구·가계부가 함께 되돌아가므로 셋 다 비운다. */
export const useCancelCardPayment = (cardRowId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (billingRowId: number) =>
      assetApi.cancelCardPayment(billingRowId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.all });
      queryClient.invalidateQueries({ queryKey: assetKeys.billing(cardRowId) });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
};

export const useReorderAssets = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (items: ReorderItem[]) => assetApi.reorderAssets(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.all });
    },
  });
};

export const useAssetTransfers = (params?: TransferListParams) => {
  return useQuery({
    queryKey: assetKeys.transfers(params),
    queryFn: () => assetApi.getTransfers(params),
  });
};

export const useCreateTransfer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AssetTransferFormValues) =>
      assetApi.createTransfer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.all });
      // 이자가 있는 이체는 지출 거래를 하나 만든다 — 가계부를 안 비우면 새로고침
      // 전까지 그 거래도, 월 지출 합계도 안 바뀐다.
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
};

/** 이체 수정 — 서버가 이자 지출·잔액 이력을 다시 만들므로 가계부도 함께 비운다. */
export const useUpdateTransfer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AssetTransferFormValues }) =>
      assetApi.updateTransfer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.all });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
};

/**
 * 매수·매도 등록 — 예수금·보유 수량·원가·실현손익이 함께 움직인다.
 * 실현손익이 거래로 잡히므로 가계부 쿼리까지 무효화한다.
 */
export const useCreateTrade = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AssetTradeFormValues) => assetApi.createTrade(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.all });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
};

/**
 * 매매 미리보기 — 실현손익·예수금 잔액을 서버에 물어본다.
 *
 * <p>화면에서 계산하지 않는다. 이동평균 매수원가 규칙이 웹·앱·서버에 각각 적혀 있으면
 * 하나만 고쳐도 갈라지고, JS 는 수를 double 로 다뤄 끝자리가 어긋난다.
 *
 * <p>입력할 때마다 부르지 않도록 호출부에서 값을 늦춰(debounce) 넘긴다.
 */
export const useTradePreview = (data: AssetTradeFormValues | null) =>
  useQuery({
    queryKey: [...assetKeys.all, "trade-preview", data],
    queryFn: () => assetApi.previewTrade(data as AssetTradeFormValues),
    enabled: data != null,
    // 같은 입력이면 다시 묻지 않는다 — 저장 전이라 서버 상태가 바뀔 일이 없다.
    staleTime: 30_000,
    // 미리보기가 실패해도 화면을 막지 않는다. 값을 안 보여 줄 뿐이다.
    retry: false,
  });

export const useAssetTrades = (assetRowId?: number) =>
  useQuery({
    queryKey: [...assetKeys.all, "trades", assetRowId],
    queryFn: () => assetApi.getTrades(assetRowId as number),
    enabled: assetRowId != null,
  });

export const useDeleteTrade = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => assetApi.deleteTrade(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.all });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
};

export const useDeleteTransfer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => assetApi.deleteTransfer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.all });
      // 이자 지출도 함께 사라진다 — 가계부를 안 비우면 유령처럼 남아 보인다.
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
};
