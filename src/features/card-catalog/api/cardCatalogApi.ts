import { apiClient } from "@/shared/api";
import type { ApiResponse } from "@/shared/types";
import type {
  CardCatalogSummary,
  CardCatalogDetail,
  CardCatalogSearchParams,
  PageResponse,
} from "@/entities/card";

export const cardCatalogApi = {
  search: async (
    params?: CardCatalogSearchParams,
  ): Promise<PageResponse<CardCatalogSummary>> => {
    const resp: ApiResponse<PageResponse<CardCatalogSummary>> =
      await apiClient.get("/v1/card-catalogs", { params });
    return resp.data;
  },

  getDetail: async (id: number): Promise<CardCatalogDetail> => {
    const resp: ApiResponse<CardCatalogDetail> = await apiClient.get(
      `/v1/card-catalogs/${id}`,
    );
    return resp.data;
  },
};
