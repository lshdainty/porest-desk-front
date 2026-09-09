import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateFor, todoTagKeys } from "@/shared/config";
import { todoTagApi } from "../api/todoTagApi";
import type { TodoTagFormValues } from "@/entities/todo-tag";

export const useTodoTags = () => {
  return useQuery({
    queryKey: todoTagKeys.list(),
    queryFn: () => todoTagApi.getTags(),
  });
};

export const useCreateTodoTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TodoTagFormValues) => todoTagApi.createTag(data),
    onSuccess: () => invalidateFor(queryClient, "todo-tag"),
  });
};

export const useUpdateTodoTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TodoTagFormValues }) =>
      todoTagApi.updateTag(id, data),
    onSuccess: () => invalidateFor(queryClient, "todo-tag-usage"),
  });
};

export const useDeleteTodoTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => todoTagApi.deleteTag(id),
    onSuccess: () => invalidateFor(queryClient, "todo-tag-usage"),
  });
};
