

<script setup lang="ts">
import { v4 as uuidv4 } from "uuid";
import type { Message, Checkpoint } from "@langchain/langgraph-sdk";
import { ref } from "vue";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import HumanMessage from "~/components/thread/messages/HumanMessage.vue";
import AssistantMessage from "~/components/thread/messages/ai.vue";
// import AssistantMessage from "~/components/thread/messages/AssistantMessage.vue";


const input = ref("");
const isLoading = ref(false);

const { stream} = useStream();

const messages = computed(() => stream.messages);


const handleRegenerate = (
    parentCheckpoint: Checkpoint | null | undefined,
  ) => {
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

  // const toolMessages = ensureToolCallsHaveResponses(stream.messages);

  stream.submit(
    { messages: [newHumanMessage] },
    // { messages: [...toolMessages, newHumanMessage] },
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
    },
  );

  input.value = "";
};
</script>

<template>
    <div class="h-screen w-screen pb-24">
      <div class="flex h-full flex-col">
      <!-- Messages -->
      <div class="flex-1 overflow-y-auto bg-muted/50">
        <div
          v-if="messages?.length"
          class="container mx-auto max-w-3xl py-8"
        >
          <div class="space-y-8">
            <template v-for="(message, index) in messages"
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

            <div
              v-if="isLoading"
              class="flex items-center gap-2 text-muted-foreground"
            >
              <Icon name="lucide:loader-2" class="h-4 w-4 animate-spin" />
              <span class="text-sm">AI is thinking...</span>
            </div>
          </div>
        </div>

        <div v-else class="flex h-full flex-col items-center justify-center">
          <div class="flex flex-col items-center gap-4">
            <div
              class="flex h-16 w-16 items-center justify-center rounded-full bg-muted"
            >
              <Icon
                name="lucide:message-square"
                class="h-8 w-8 text-muted-foreground"
              />
            </div>
            <div class="text-center">
              <h2 class="text-xl font-semibold text-foreground">Chatbot UI</h2>
              <p class="mt-2 text-sm text-muted-foreground">
                Start a conversation or select a chat from the sidebar.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Input -->
      <div class="border-t border-border bg-background">
        <div class="container mx-auto max-w-3xl px-4 py-4">
          <div class="relative">
            <Textarea
              v-model="input"
              placeholder="Send a message..."
              :rows="1"
              class="min-h-[60px] resize-none pr-12"
              @keydown.enter.exact.prevent="handleSubmit"
            />
            <Button
              class="absolute bottom-3 right-3"
              size="icon"
              :disabled="!input.trim()"
              @click="handleSubmit"
            >
              <Icon name="lucide:send" class="h-4 w-4" />
              <span class="sr-only">Send message</span>
            </Button>
          </div>
          <div class="mt-2 text-xs text-muted-foreground">
            <span>Model: GPT-4</span>
            <span class="mx-2">·</span>
            <button class="hover:underline">Customize</button>
          </div>
        </div>
      </div>
    </div>
    </div>
</template>
