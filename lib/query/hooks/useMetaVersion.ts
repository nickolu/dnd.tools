"use client";

import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";

export const useMetaVersion = () =>
  useQuery({
    gcTime: 7 * 24 * 60 * 60 * 1000,
    queryFn: apiClient.getMetaVersion,
    queryKey: queryKeys.metaVersion,
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
  });
