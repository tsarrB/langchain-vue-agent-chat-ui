import { validate } from "uuid";
import { createGlobalState } from "@vueuse/core";
import type { Ref } from "vue";
import { type Thread } from "@langchain/langgraph-sdk";

import { getApiKey } from "~/lib/api-key";
import { createClient } from "~/providers/client";

interface ThreadContextType {
  getThreads: () => Promise<Thread[]>;
  threads: Ref<Thread[]>;
  threadsLoading: Ref<boolean>;
}

function getThreadSearchMetadata(
  assistantId: string,
): { graph_id: string } | { assistant_id: string } {
  if (validate(assistantId)) {
    return { assistant_id: assistantId };
  } else {
    return { graph_id: assistantId };
  }
}

export const useThreads = ((): ThreadContextType => {
  const route = useRoute();
  const apiUrl = computed(() => route.query.apiUrl as string);
  const assistantId = computed(() => route.query.assistantId as string);
  
  const threads = ref<Thread[]>([]);
  const threadsLoading = ref(false);

  const getThreads = async (): Promise<Thread[]> => {
    if (!apiUrl.value || !assistantId.value) return [];
    
    threadsLoading.value = true;
    
    try {
      const client = createClient(apiUrl.value, getApiKey() ?? undefined);
      
      const fetchedThreads = await client.threads.search({
        metadata: {
          ...getThreadSearchMetadata(assistantId.value),
        },
        limit: 100,
      });
      
      threads.value = fetchedThreads;
      return fetchedThreads;
    } catch (error) {
      console.error('Error fetching threads:', error);
      return [];
    } finally {
      threadsLoading.value = false;
    }
  };

  return {
    getThreads,
    threads,
    threadsLoading
  };
});

