import { useEffect, useState } from "react";
import { onSnapshot, doc, collection } from "firebase/firestore";
import { tenantCollection } from "../firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import type { Invitation, Guest } from "../types";
import { toast } from "sonner";
export function useWorkspace() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Invitation[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!user || user.isAnonymous) {
      setLoading(false);
      return;
    }
    let inner: (() => void)[] = [];
    const fail = (e: Error) => {
      setError(e.message);
      setLoading(false);
      toast.error(e.message);
    };
    const stop = onSnapshot(
      tenantCollection("invitations"),
      { includeMetadataChanges: true },
      (snapshot) => {
        inner.forEach((f) => f());
        inner = [];
        const list = snapshot.docs
          .map((d) => ({ ...d.data(), id: d.id }) as Invitation)
          .sort(
            (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
          );
        setEvents(list);
        setLoading(false);
        const all = new Map<string, Guest[]>();
        const emit = () => setGuests(Array.from(all.values()).flat());
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
                },
                fail,
              ),
            );
          }
          const responseStops = new Map<string, () => void>();
          inner.push(() => responseStops.forEach((f) => f()));
          inner.push(
            onSnapshot(
              tenantCollection("invitations", event.id, "guests"),
              { includeMetadataChanges: true },
              (s) => {
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
                  )
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
                        },
                        fail,
                      ),
                    );
              },
              fail,
            ),
          );
        }
      },
      fail,
    );
    return () => {
      stop();
      inner.forEach((f) => f());
    };
  }, [user]);
  return { events, guests, loading, error };
}
