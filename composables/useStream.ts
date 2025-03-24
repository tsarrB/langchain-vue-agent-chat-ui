import { useRouter } from "#app";
import { type Message } from "@langchain/langgraph-sdk";
import { useStream as useLangChainStream } from "~/lib/stream";
import { useRoute } from "#app";
import { getApiKey } from "~/lib/api-key";
import { useThreads } from "./useTread";
import { toast } from "vue-sonner";
import { createSharedComposable, toReactive } from "@vueuse/core";

// --- UI Message types ---
export interface UIMessage {
  type: "ui";
  id: string;
  name: string;
  props: Record<string, unknown>;
  metadata: {
    run_id: string;
    message_id?: string;
    [key: string]: unknown;
  };
}

export interface RemoveUIMessage {
  type: "remove-ui";
  id: string;
}

// --- Stream state type ---
export type StateType = { messages: Message[]; ui?: UIMessage[] };

// --- UI Message handling ---
function uiMessageReducer(
  state: UIMessage[],
  update: UIMessage | RemoveUIMessage | (UIMessage | RemoveUIMessage)[]
) {
  const events = Array.isArray(update) ? update : [update];
  let newState = state.slice();
  for (const event of events) {
    if (event.type === "remove-ui") {
      newState = newState.filter((ui) => ui.id !== event.id);
      continue;
    }
    const index = state.findIndex((ui) => ui.id === event.id);
    if (index !== -1) {
      newState[index] = event;
    } else {
      newState.push(event);
    }
  }
  return newState;
}

// --- Utility functions ---
async function sleep(ms = 4000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkGraphStatus(
  apiUrl: string,
  apiKey: string | null
): Promise<boolean> {
  try {
    const res = await fetch(`${apiUrl}/info`, {
      ...(apiKey && {
        headers: {
          "X-Api-Key": apiKey,
        },
      }),
    });

    return res.ok;
  } catch (e) {
    console.error(e);
    return false;
  }
}

// --- API connection handling function ---
function useApiConnection() {
  const route = useRoute();

  const apiUrl = computed(() => route.query.apiUrl as string);
  const assistantId = computed(() => route.query.assistantId as string);
  const threadId = computed(() => route.query.threadId as string);

  // API key management
  const apiKey = ref<string | null>(getApiKey());

  const setApiKey = (key: string) => {
    window.localStorage.setItem("lg:chat:apiKey", key);
    apiKey.value = key;
  };

  // Check connection status
  const checkConnection = () => {
    watch(
      [apiUrl, apiKey],
      ([newApiUrl, newApiKey]) => {
        if (newApiUrl) {
          checkGraphStatus(newApiUrl, newApiKey).then((ok) => {
            if (!ok) {
              toast.error("Failed to connect to LangGraph server", {
                description: `Please ensure your graph is running at ${newApiUrl} and your API key is correctly set (if connecting to a deployed graph).`,
                duration: 10000,
                richColors: true,
                closeButton: true,
              });
            }
          });
        }
      },
      { immediate: true }
    );
  };

  return {
    apiUrl,
    apiKey,
    setApiKey,
    assistantId,
    threadId,
    checkConnection,
  };
}

// --- Thread ID handling function ---
function useThreadHandling() {
  const route = useRoute();
  const router = useRouter();
  const threadsManager = useThreads();

  const updateThreadId = (id: string) => {
    // Update the URL with the thread ID
    const newQuery = { ...route.query, threadId: id };
    router.push({ query: newQuery });

    // Refetch threads list when thread ID changes
    sleep().then(() => threadsManager.getThreads().catch(console.error));
  };

  return {
    updateThreadId,
    threadsManager,
  };
}

// --- Main shared composable ---
export const useStream = createSharedComposable(() => {
  // Connection handling
  const { apiUrl, apiKey, setApiKey, assistantId, threadId, checkConnection } =
    useApiConnection();

  // Thread handling
  const { updateThreadId } = useThreadHandling();

  // Check API connection
  checkConnection();

  // Create the stream with LangChain
  const streamValue = useLangChainStream({
    apiUrl: apiUrl.value,
    apiKey: apiKey.value ?? undefined,
    assistantId: assistantId.value,
    threadId: threadId.value ?? null,
    onCustomEvent: (event: UIMessage | RemoveUIMessage, options: any) => {
      options.mutate((prev: StateType) => {
        const ui = uiMessageReducer(prev.ui ?? [], event);
        return { ...prev, ui };
      });
    },
    onThreadId: updateThreadId,
  });

  watch(threadId, (newThreadId) => {
    streamValue.onThreadId(newThreadId);
  });

  // Return reactive stream interface
  return toReactive({
    apiUrl,
    apiKey,
    setApiKey,
    threadId,
    stream: toReactive(streamValue),
  });
});
