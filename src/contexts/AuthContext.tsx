import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, configured } from "../firebase/config";
const Context = createContext<{ user: User | null; loading: boolean }>({
  user: null,
  loading: true,
});
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(configured);
  useEffect(() => {
    if (!configured) return;
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);
  return (
    <Context.Provider value={{ user, loading }}>{children}</Context.Provider>
  );
}
export const useAuth = () => useContext(Context);
