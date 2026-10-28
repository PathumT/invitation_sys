import { uiText } from "../i18n/uiText";
import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onSnapshot, doc, collection } from "firebase/firestore";
import { tenantCollection } from "../firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import type { Invitation, Guest } from "../types";
import { toast } from "sonner";
function useWorkspaceData() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Invitation[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    setEvents([]);
    setGuests([]);
    setError("");
    setLoading(true);
    if (!user || user.isAnonymous) {
      setLoading(false);
      return;
    }
    let inner: (() => void)[] = [];
    let active = true;
    let failed = false;
    let generation = 0;
    const fail = (e: Error) => {
      if (!active) return;
      failed = true;
      setError(e.message);
      setLoading(false);
      toast.error(e.message);
    };
    const stop = onSnapshot(
      tenantCollection("invitations"),
      { includeMetadataChanges: true },
      (snapshot) => {
        if (!active) return;
        const version = ++generation;
        inner.forEach((f) => f());
        inner = [];
        const list = snapshot.docs
          .map((d) => ({ ...d.data(), id: d.id }) as Invitation)
          .sort(
            (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
          );
        setEvents(list);
        const pending = new Set<string>();
        for (const item of list) {
          pending.add(item.id);
          if (item.publicShareId) pending.add(`${item.id}:public`);
        }
        const ready = (key: string) => {
          if (!active || version !== generation) return;
          pending.delete(key);
          setLoading(!failed && pending.size > 0);
        };
        setLoading(!failed && pending.size > 0);
        const all = new Map<string, Guest[]>();
        const emit = () => {
          if (active && version === generation)
            setGuests(Array.from(all.values()).flat());
        };
        emit();
        for (const event of list) {
          if (
            event.publicShareId &&
            !snapshot.docs.find((d) => d.id === event.id)?.metadata
              .hasPendingWrites
          ) {
            inner.push(
              onSnapshot(
                collection(
                  db,
                  "publicInvitations",
                  event.publicShareId,
                  "response",
                ),
                (responses) => {
                  if (!active || version !== generation) return;
                  all.set(
                    `${event.id}:public`,
                    responses.docs.map(
                      (d) =>
                        ({
                          id: `public-${d.id}`,
                          invitationId: event.id,
                          name: d.data().respondentName,
                          phoneNumber: "",
                          email: "",
                          guestCountAllowed: 1,
                          shareStatus: "public",
                          shareId: event.publicShareId,
                          source: "public",
                          ...d.data(),
                        }) as Guest,
                    ),
                  );
                  emit();
                  ready(`${event.id}:public`);
                },
                fail,
              ),
            );
          }
          if (
            event.publicShareId &&
            snapshot.docs.find((d) => d.id === event.id)?.metadata
              .hasPendingWrites
          )
            ready(`${event.id}:public`);
          const responseStops = new Map<string, () => void>();
          inner.push(() => responseStops.forEach((f) => f()));
          inner.push(
            onSnapshot(
              tenantCollection("invitations", event.id, "guests"),
              { includeMetadataChanges: true },
              (s) => {
                if (!active || version !== generation) return;
                for (const id of responseStops.keys())
                  pending.delete(`${event.id}:${id}`);
                responseStops.forEach((f) => f());
                responseStops.clear();
                const rows = s.docs.map(
                  (d) =>
                    ({
                      ...d.data(),
                      id: d.id,
                      invitationId: event.id,
                    }) as Guest,
                );
                all.set(event.id, rows);
                emit();
                for (const guest of rows)
                  if (
                    guest.shareId &&
                    !s.docs.find((d) => d.id === guest.id)?.metadata
                      .hasPendingWrites
                  ) {
                    const responseKey = `${event.id}:${guest.id}`;
                    pending.add(responseKey);
                    responseStops.set(
                      guest.id,
                      onSnapshot(
                        doc(
                          db,
                          "publicInvitations",
                          guest.shareId,
                          "response",
                          "current",
                        ),
                        (r) => {
                          if (!active || version !== generation) return;
                          if (r.exists()) {
                            const current = all.get(event.id) || [];
                            all.set(
                              event.id,
                              current.map((g) =>
                                g.id === guest.id ? { ...g, ...r.data() } : g,
                              ),
                            );
                            emit();
                          }
                          ready(responseKey);
                        },
                        fail,
                      ),
                    );
                  }
                ready(event.id);
              },
              fail,
            ),
          );
        }
      },
      fail,
    );
    return () => {
      active = false;
      stop();
      inner.forEach((f) => f());
    };
  }, [user, revision]);
  return {
    events,
    guests,
    loading,
    error,
    retry: () => setRevision((value) => value + 1),
  };
}
const WorkspaceContext = createContext<ReturnType<
  typeof useWorkspaceData
> | null>(null);
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const value = useWorkspaceData();
  return createElement(WorkspaceContext.Provider, { value }, children);
}
export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error(uiText("ui.46594024a4e8"));
  return value;
}
