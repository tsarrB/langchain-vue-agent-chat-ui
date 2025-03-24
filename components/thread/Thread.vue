<script lang="ts" setup>
import { v4 as uuidv4 } from "uuid";
import { motion } from "motion-v";
import { useRouteQuery } from "@vueuse/router";
import type { Message, Checkpoint } from "@langchain/langgraph-sdk";
import { ref } from "vue";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import ThreadHistory from "~/components/thread/history/index.vue";
import HumanMessage from "~/components/thread/messages/HumanMessage.vue";
import { TooltipIconButton } from "~/components/ui/tooltip-icon-button";
import AssistantMessage from "~/components/thread/messages/AssistantMessage.vue";
import AssistantMessageLoading from "~/components/thread/messages/AssistantMessageLoading.vue";
import ScrollToBottom from "~/components/thread/ScrollToBottom.vue";
import { ensureToolCallsHaveResponses } from "~/lib/ensure-tool-responses";
import {
  PanelRightOpen,
  PanelRightClose,
  SquarePen,
  LoaderCircle,
} from "lucide-vue-next";
import LangGraphLogoSVG from "~/components/icons/langgraph.vue";
import { DO_NOT_RENDER_ID_PREFIX } from "~/lib/ensure-tool-responses";

const isLargeScreen = useMediaQuery("(min-width: 1024px)");
const chatHistoryOpen = useRouteQuery("chatHistoryOpen", "false", {
  transform: {
    get: (val: string) => val === "true",
    set: (val: boolean) => (val ? "true" : "false"),
  },
});
const hideToolCalls = useRouteQuery("hideToolCalls", "false", {
  transform: {
    get: (val: string) => val === "true",
    set: (val: boolean) => (val ? "true" : "false"),
  },
});

const input = ref("");
const firstTokenReceived = ref(false);

const threadId = useRouteQuery("threadId");

const { stream } = useStream();

const messages = computed(() => stream.messages);
const isLoading = computed(() => {
  console.log(stream.isLoading);
  return stream.isLoading;
});

const chatStarted = computed(() => {
  return !!threadId.value || !!messages.value.length;
});

const handleRegenerate = (parentCheckpoint: Checkpoint | null | undefined) => {
  // Do this so the loading state is correct
  // prevMessageLength.current = prevMessageLength.current - 1;
  // setFirstTokenReceived(false);
  // stream.submit(undefined, {
  //   checkpoint: parentCheckpoint,
  //   streamMode: ["values"],
  // });
};

const handleSubmit = async () => {
  console.log(stream);

  if (!input.value.trim()) return;

  const newHumanMessage: Message = {
    id: uuidv4(),
    type: "human",
    content: input.value,
  };

  const toolMessages = ensureToolCallsHaveResponses(stream.messages);

  stream.submit(
    { messages: [...toolMessages, newHumanMessage] },
    {
      streamMode: ["values"],
      optimisticValues: (prev) => ({
        ...prev,
        messages: [
          ...(prev.messages ?? []),
          // ...toolMessages,
          newHumanMessage,
        ],
      }),
    }
  );

  input.value = "";
};
</script>

<template>
  <div class="flex w-full h-screen overflow-hidden">
    <div class="relative lg:flex hidden">
      <motion.div
        class="absolute h-full border-r bg-white overflow-hidden z-20"
        style="width: 300px"
        :animate="
          isLargeScreen
            ? { x: chatHistoryOpen ? 0 : -300 }
            : { x: chatHistoryOpen ? 0 : -300 }
        "
        :initial="{ x: -300 }"
        :transition="
          isLargeScreen
            ? { type: 'spring', stiffness: 300, damping: 30 }
            : { duration: 0 }
        "
      >
        <div class="relative h-full" style="width: 300px">
          <ThreadHistory />
        </div>
      </motion.div>
    </div>

    <motion.div
      :class="
        cn(
          'flex-1 flex flex-col min-w-0 overflow-hidden relative',
          !chatStarted && 'grid-rows-[1fr]'
        )
      "
      :layout="isLargeScreen"
      :animate="{
        marginLeft: chatHistoryOpen ? (isLargeScreen ? 300 : 0) : 0,
        width: chatHistoryOpen
          ? isLargeScreen
            ? 'calc(100% - 300px)'
            : '100%'
          : '100%',
      }"
      :transition="
        isLargeScreen
          ? { type: 'spring', stiffness: 300, damping: 30 }
          : { duration: 0 }
      "
    >
      <div
        v-if="!chatStarted"
        class="absolute top-0 left-0 w-full flex items-center justify-between gap-3 p-2 pl-4 z-10"
      >
        <Button
          v-if="!chatHistoryOpen || !isLargeScreen"
          class="hover:bg-gray-100"
          variant="ghost"
          @click="chatHistoryOpen = !chatHistoryOpen"
        >
          <PanelRightOpen v-if="chatHistoryOpen" class="size-5" />
          <PanelRightClose v-else class="size-5" />
        </Button>
      </div>

      <div
        v-if="chatStarted"
        class="flex items-center justify-between gap-3 p-2 pl-4 z-10 relative"
      >
        <div class="flex items-center justify-start gap-2 relative">
          <div class="absolute left-0 z-10">
            <Button
              v-if="!chatHistoryOpen || !isLargeScreen"
              class="hover:bg-gray-100"
              variant="ghost"
              @click="chatHistoryOpen = !chatHistoryOpen"
            >
              <PanelRightOpen v-if="chatHistoryOpen" class="size-5" />
              <PanelRightClose v-else class="size-5" />
            </Button>
          </div>

          <motion.button
            class="flex gap-2 items-center cursor-pointer"
            @click="threadId = null"
            :animate="{
              marginLeft: !chatHistoryOpen ? 48 : 0,
            }"
            :transition="{
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }"
          >
            <LangGraphLogoSVG :width="32" :height="32" />
            <span class="text-xl font-semibold tracking-tight">
              Agent Chat
            </span>
          </motion.button>
        </div>

        <TooltipIconButton
          size="lg"
          class="p-4"
          tooltip="New thread"
          variant="ghost"
          @click="threadId = null"
        >
          <SquarePen class="size-5" />
        </TooltipIconButton>

        <div
          class="absolute inset-x-0 top-full h-5 bg-gradient-to-b from-background to-background/0"
        />
      </div>

      <!-- StickToBottom -->
      <div class="relative flex-1 overflow-hidden">
        <div
          style="width: 100%; height: 100%"
          :class="
            cn(
              'absolute inset-0 overflow-y-scroll [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent',
              !chatStarted && 'flex flex-col items-stretch mt-[25vh]',
              chatStarted && 'grid grid-rows-[1fr_auto]'
            )
          "
        >
          <div class="pt-8 pb-16  max-w-3xl mx-auto flex flex-col gap-4 w-full">
            <template
              v-for="(message, index) in messages.filter(
                (m) => !m.id?.startsWith(DO_NOT_RENDER_ID_PREFIX)
              )"
              :key="message.id || `${message.type}-${index}`"
            >
              <HumanMessage
                v-if="message.type === 'human'"
                :message="message"
                :isLoading="isLoading"
              />

              <AssistantMessage
                v-else
                :message="message"
                :isLoading="isLoading"
                :handleRegenerate="handleRegenerate"
              />
            </template>

            <AssistantMessageLoading v-if="isLoading && !firstTokenReceived" />
          </div>

          <div
            class="sticky flex flex-col items-center gap-8 bottom-0 px-4 bg-white"
          >
            <div v-if="!chatStarted" class="flex gap-3 items-center">
              <LangGraphLogoSVG class="flex-shrink-0 h-8" />
              <h1 class="text-2xl font-semibold tracking-tight">Agent Chat</h1>
            </div>

            <ScrollToBottom
              class="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 animate-in fade-in-0 zoom-in-95"
            />

            <div
              class="bg-muted rounded-2xl border shadow-xs mx-auto mb-8 w-full max-w-3xl relative z-10"
            >
              <form
                @submit.prevent="handleSubmit"
                class="grid grid-rows-[1fr_auto] gap-2 max-w-3xl mx-auto"
              >
                <textarea
                  v-model="input"
                  @keydown="(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && !e.metaKey) {
                        e.preventDefault();
                        const el = e.target as HTMLElement | undefined;
                        const form = el?.closest('form');
                        form?.requestSubmit();
                      }
                    }"
                  placeholder="Type your message..."
                  class="p-3.5 pb-0 border-none bg-transparent field-sizing-content shadow-none ring-0 outline-none focus:outline-none focus:ring-0 resize-none"
                />

                <div class="flex items-center justify-between p-2 pt-4">
                  <div>
                    <div class="flex items-center space-x-2">
                      <Switch
                        id="render-tool-calls"
                        :checked="hideToolCalls ?? false"
                        @checked-change="hideToolCalls = !hideToolCalls"
                      />
                      <Label
                        htmlFor="render-tool-calls"
                        class="text-sm text-gray-600"
                      >
                        Hide Tool Calls
                      </Label>
                    </div>
                  </div>
                  <Button
                    v-if="stream.isLoading"
                    key="stop"
                    @click="stream.stop()"
                  >
                    <LoaderCircle class="w-4 h-4 animate-spin" />
                    Cancel
                  </Button>

                  <Button
                    v-else
                    type="submit"
                    class="transition-all shadow-md"
                    :disabled="isLoading || !input.trim()"
                  >
                    Send
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  </div>
</template>

<style lang="scss"></style>
