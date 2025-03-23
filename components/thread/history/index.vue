<template>
  <!-- Desktop version -->
  <div class="hidden lg:flex flex-col border-r-[1px] border-slate-300 items-start justify-start gap-6 h-screen w-[300px] shrink-0 shadow-inner-right">
    <div class="flex items-center justify-between w-full pt-1.5 px-4">
      <Button
        class="hover:bg-gray-100"
        variant="ghost"
        @click="chatHistoryOpen = !chatHistoryOpen"
      >
        <PanelRightOpen v-if="chatHistoryOpen" class="size-5" />
        <PanelRightClose v-else class="size-5" />
      </Button>
      <h1 class="text-xl font-semibold tracking-tight">
        Thread History
      </h1>
    </div>

    <div v-if="threadsLoading" class="h-full flex flex-col w-full gap-2 items-start justify-start overflow-y-scroll [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
      <Skeleton v-for="i in 30" :key="'skeleton-' + i" class="w-[280px] h-10" />
    </div>
    
    <div v-else class="h-full flex flex-col w-full gap-2 items-start justify-start overflow-y-scroll [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
      <div v-for="t in threads" :key="t.thread_id" class="w-full px-1">
        <Button
          variant="ghost"
          class="text-left items-start justify-start font-normal w-[280px]"
          @click="handleThreadClick(t)"
        >
          <p class="truncate text-ellipsis">
            {{ getDisplayText(t) }}
          </p>
        </Button>
      </div>
    </div>
  </div>

  <!-- Mobile version -->
  <div class="lg:hidden">
    <Sheet
      :open="!!chatHistoryOpen && !isLargeScreen"
      @update:open="updateChatHistoryOpen"
    >
      <SheetContent side="left" class="lg:hidden flex">
        <SheetHeader>
          <SheetTitle>Thread History</SheetTitle>
        </SheetHeader>
        <div class="h-full flex flex-col w-full gap-2 items-start justify-start overflow-y-scroll [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
          <div v-for="t in threads" :key="t.thread_id" class="w-full px-1">
            <Button
              variant="ghost"
              class="text-left items-start justify-start font-normal w-[280px]"
              @click="handleMobileThreadClick(t)"
            >
              <p class="truncate text-ellipsis">
                {{ getDisplayText(t) }}
              </p>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouteQuery } from '@vueuse/router';
import { Button } from "@/components/ui/button";
import { useThreads } from "~/composables/useTread";
import type { Thread } from "@langchain/langgraph-sdk";
import { getContentString } from "../utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { PanelRightOpen, PanelRightClose } from "lucide-vue-next";
import { useMediaQuery } from "~/composables/useMediaQuery";

// Media query for responsive design
const isLargeScreen = useMediaQuery("(min-width: 1024px)");

// Query parameters
const threadId = useRouteQuery('threadId');
const chatHistoryOpen = useRouteQuery(
  'chatHistoryOpen',
  'false',
  {
    transform: {
      get: (val: string) => val === 'true',
      set: (val: boolean) => val ? 'true' : 'false'
    }
  }
);

// Thread management
const { getThreads, threads, threadsLoading } = useThreads();

// Load threads when component is mounted
onMounted(async () => {
  try {
    await getThreads();
  } catch (error) {
    console.error(error);
  }
});

// Update chat history open state
const updateChatHistoryOpen = (open: boolean) => {
  if (isLargeScreen.value) return;
  chatHistoryOpen.value = open;
};

// Handle thread click 
const handleThreadClick = (thread: Thread) => {
  if (thread.thread_id === threadId.value) return;
  threadId.value = thread.thread_id;
};

// Handle thread click on mobile
const handleMobileThreadClick = (thread: Thread) => {
  handleThreadClick(thread);
  chatHistoryOpen.value = false;
};

// Get display text for thread
const getDisplayText = (thread: Thread): string => {
  let itemText = thread.thread_id;
  if (
    typeof thread.values === "object" &&
    thread.values &&
    "messages" in thread.values &&
    Array.isArray(thread.values.messages) &&
    thread.values.messages?.length > 0
  ) {
    const firstMessage = thread.values.messages[0];
    itemText = getContentString(firstMessage.content);
  }
  return itemText;
};
</script> 