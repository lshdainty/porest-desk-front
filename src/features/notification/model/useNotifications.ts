import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePendingIds } from "@/shared/lib/porest/use-pending-ids";
import { notificationKeys } from "@/shared/config";
import { notificationApi } from "../api/notificationApi";

export const useNotifications = () => {
  return useQuery({
    queryKey: notificationKeys.list(),
    queryFn: () => notificationApi.getNotifications(),
  });
};

export const useUnreadCount = () => {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => notificationApi.getUnreadCount(),
  });
};

export const useMarkRead = () => {
  const queryClient = useQueryClient();
  const { pendingIds, begin, end } = usePendingIds();

  const mutation = useMutation({
    mutationFn: (id: number) => notificationApi.markRead(id),
    onMutate: (id: number) => begin(id),
    onSettled: (_data, _error, id) => end(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
  /** 진행 중인 항목 id — 그 항목만 스피너·잠금. */
  return { ...mutation, pendingIds };
};

export const useMarkAllRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => notificationApi.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};
