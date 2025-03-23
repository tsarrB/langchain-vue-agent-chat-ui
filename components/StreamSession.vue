<template>
  <slot></slot>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { toast } from 'vue-sonner';
import { getApiKey } from '~/lib/api-key';
import { useThreads } from '~/composables/useTread';

const props = defineProps<{
  apiUrl: string;
  assistantId: string;
}>();


const router = useRouter();
const threadsManager = useThreads();

const threadId = ref(router.currentRoute.value.query.threadId as string || null);
const apiKey = ref(getApiKey());

// This function would check if the LangGraph server is running
const checkGraphStatus = async (url: string, key: string | null): Promise<boolean> => {
  try {
    const res = await fetch(`${url}/info`, {
      ...(key && {
        headers: {
          "X-Api-Key": key,
        },
      }),
    });

    return res.ok;
  } catch (e) {
    console.error(e);
    return false;
  }
};

// Helper function for thread list refreshing
const sleep = async (ms = 4000) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// Verify connection to the server
onMounted(async () => {
  const isConnected = await checkGraphStatus(props.apiUrl, apiKey.value);
  if (!isConnected) {
    toast.error("Failed to connect to LangGraph server", {
      description: `Please ensure your graph is running at ${props.apiUrl} and your API key is correctly set (if connecting to a deployed graph).`,
      duration: 10000,
      richColors: true,
      closeButton: true,
    });
  }
});

// Watch for thread ID changes from the URL query
watch(
  () => router.currentRoute.value.query.threadId,
  async (newThreadId) => {
    threadId.value = newThreadId as string || null;
    
    // When thread ID changes, refresh the thread list
    if (newThreadId) {
      // Wait a bit to ensure the thread is created on the server
      await sleep();
      try {
        await threadsManager.getThreads();
      } catch (error) {
        console.error('Error fetching threads:', error);
      }
    }
  }
);
</script> 