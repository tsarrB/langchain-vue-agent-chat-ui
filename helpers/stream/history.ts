import { Client } from "@langchain/langgraph-sdk";
import { ref, watch, onMounted } from "vue";
import type { Ref } from "vue";

/**
 * Fetches history for a thread from the LangGraph server
 */
export function fetchHistory(client: Client, threadId: string): Promise<any[]> {
  return client.threads.getHistory(threadId, { limit: 1000 });
}

export interface UseThreadHistoryOptions {
  mutate: (mutateId?: string) => Promise<any[]>;
  data: Ref<any[]>;
}

/**
 * Manages history for a thread, handling fetching and updating
 */
export function useThreadHistory(
  threadId: Ref<string | null>,
  client: Client,
  clearCallback: () => void,
  isSubmitting: Ref<boolean>
): UseThreadHistoryOptions {
  const history = ref<any[]>([]);

  const fetcher = (threadIdToFetch?: string | null): Promise<any[]> => {
    if (threadIdToFetch != null) {
      return fetchHistory(client, threadIdToFetch).then((historyData) => {
        history.value = historyData;
        return historyData;
      });
    }
    history.value = [];
    clearCallback();
    return Promise.resolve([]);
  };

  watch(
    () => threadId.value,
    (newThreadId) => {
      if (!isSubmitting.value) {
        fetcher(newThreadId);
      }
    }
  );

  onMounted(() => {
    if (!isSubmitting.value) {
      fetcher(threadId.value);
    }
  });

  return {
    data: history,
    mutate: (mutateId?: string) => fetcher(mutateId ?? threadId.value),
  };
}

export interface UseControllableThreadIdOptions {
  threadId?: MaybeRef<string | null>;
  onThreadId?: (threadId: string) => void;
}

/**
 * Manages a thread ID, handling both controlled and uncontrolled scenarios
 */
export function useControllableThreadId(
  options?: UseControllableThreadIdOptions
): [Ref<string | null>, (threadId: string) => void] {
  const threadId = toRef(options?.threadId);

  const localThreadId = ref<string | null>(threadId.value ?? null);
  const onThreadIdCallback = options?.onThreadId;

  const onThreadId = (threadId: string): void => {
    localThreadId.value = threadId;
    onThreadIdCallback?.(threadId);
  };

  watch(threadId, (newThreadId) => {
    localThreadId.value = newThreadId ?? null;
  });

  return [localThreadId, onThreadId];
}
