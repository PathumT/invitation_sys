import { useEffect, useState } from "react";
import { onSnapshot } from "firebase/firestore";
import { tenantCollection } from "../firebase/firestore";
import { starterTemplates } from "../services/templateService";
import type { Design } from "../types";
import { toast } from "sonner";
export function useTemplates() {
  const [custom, setCustom] = useState<
    {
      id: string;
      name: string;
      category: string;
      design: Design;
      createdAt?: { toMillis: () => number };
    }[]
  >([]);
  useEffect(
    () =>
      onSnapshot(
        tenantCollection("templates"),
        (s) =>
          setCustom(
            s.docs.map(
              (d) => ({ ...d.data(), id: d.id }) as (typeof custom)[number],
            ),
          ),
        (e) => toast.error(e.message),
      ),
    [],
  );
  return [
    ...starterTemplates.map((t) => ({
      ...t,
      createdAt: undefined as { toMillis: () => number } | undefined,
    })),
    ...custom,
  ];
}
