import { useEffect, useState } from "react";
import {
  discardOutboxItem,
  getSyncSnapshot,
  refreshOutboxSnapshot,
  retryFailedItem,
  subscribeSyncState,
  syncOutboxNow,
  type OfflineSyncSnapshot,
} from "@/lib/offline/syncEngine";

export function useOfflineSync() {
  const [state, setState] = useState<OfflineSyncSnapshot>(() => getSyncSnapshot());

  useEffect(() => {
    const unsubscribe = subscribeSyncState(setState);
    void refreshOutboxSnapshot();
    return unsubscribe;
  }, []);

  return {
    ...state,
    syncNow: (includeFailed = true) => syncOutboxNow({ includeFailed }),
    retryItem: retryFailedItem,
    discardItem: discardOutboxItem,
  };
}
