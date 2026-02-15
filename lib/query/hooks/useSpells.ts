"use client";

import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";

export const useSpells = () =>
  useQuery({
    gcTime: 7 * 24 * 60 * 60 * 1000,
    queryFn: apiClient.getSpells,
    queryKey: queryKeys.spells,
    refetchOnWindowFocus: false,
    staleTime: 24 * 60 * 60 * 1000,
  });

export const useSpell = (id: string) =>
  useQuery({
    enabled: Boolean(id),
    gcTime: 7 * 24 * 60 * 60 * 1000,
    queryFn: () => apiClient.getSpell(id),
    queryKey: queryKeys.spell(id),
    refetchOnWindowFocus: false,
    staleTime: 24 * 60 * 60 * 1000,
  });
