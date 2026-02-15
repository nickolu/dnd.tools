"use client";

import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";

export const useMonsters = () =>
  useQuery({
    gcTime: 7 * 24 * 60 * 60 * 1000,
    queryFn: apiClient.getMonsters,
    queryKey: queryKeys.monsters,
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
  });

export const useMonster = (id: string) =>
  useQuery({
    enabled: Boolean(id),
    gcTime: 7 * 24 * 60 * 60 * 1000,
    queryFn: () => apiClient.getMonster(id),
    queryKey: queryKeys.monster(id),
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
  });
