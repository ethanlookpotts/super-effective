import { useQuery } from "@tanstack/react-query";

export type LearnsetsMap = Readonly<Record<number, readonly string[]>>;

const LEARNSETS_KEY = ["learnsets"] as const;

async function fetchLearnsets(): Promise<LearnsetsMap> {
  const mod = await import("~/data/learnsets");
  return mod.LEARNSETS;
}

export function useLearnsets(): LearnsetsMap | undefined {
  const { data } = useQuery({
    queryKey: LEARNSETS_KEY,
    queryFn: fetchLearnsets,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });
  return data;
}
