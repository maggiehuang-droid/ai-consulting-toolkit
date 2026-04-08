import { createContext, useContext } from "react";

export interface SessionContextType {
  workshopId: string | null;
  groupId: string | null;
  groupName: string | null;
  workshopTitle: string | null;
  saveStep: (step: string, status: string, data: unknown) => Promise<void>;
}

export const SessionContext = createContext<SessionContextType>({
  workshopId: null,
  groupId: null,
  groupName: null,
  workshopTitle: null,
  saveStep: async () => {},
});

export const useSession = () => useContext(SessionContext);
