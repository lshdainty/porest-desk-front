import { apiClient } from "@/shared/api";
import type { ApiResponse } from "@/shared/types";
import type { MemoTag, MemoTagFormValues } from "@/entities/memo-tag";

// 경로·본문·응답이 `/todo-tag` 와 같은 모양이다(서버 MemoTagApiController 주석).
// 설정 화면이 두 태그를 나란히 놓으므로 클라이언트도 갈라 둘 이유가 없다.
export const memoTagApi = {
  createTag: async (data: MemoTagFormValues): Promise<MemoTag> => {
    const resp: ApiResponse<MemoTag> = await apiClient.post(
      "/v1/memo-tag",
      data,
    );
    return resp.data;
  },

  getTags: async (): Promise<MemoTag[]> => {
    const resp: ApiResponse<{ tags: MemoTag[] }> =
      await apiClient.get("/v1/memo-tags");
    return resp.data.tags;
  },

  updateTag: async (id: number, data: MemoTagFormValues): Promise<MemoTag> => {
    const resp: ApiResponse<MemoTag> = await apiClient.put(
      `/v1/memo-tag/${id}`,
      data,
    );
    return resp.data;
  },

  deleteTag: async (id: number): Promise<void> => {
    const resp: ApiResponse<void> = await apiClient.delete(
      `/v1/memo-tag/${id}`,
    );
    return resp.data;
  },
};
