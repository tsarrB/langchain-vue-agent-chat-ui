<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import type { Message, Checkpoint, AIMessage, ToolMessage } from '@langchain/langgraph-sdk';
import { getContentString } from '../utils';
import MarkdownText from './MarkdownText.vue';
import CustomComponent from './CustomComponent.vue';
import ToolCalls from './ToolCalls.vue';
import ToolResult from './ToolResult.vue';
import GenericInterruptView from './GenericInterruptView.vue';
import { parseAnthropicStreamedToolCalls } from './utils';
import { useStream } from '~/composables/useStream';
import { isAgentInboxInterruptSchema } from '@/lib/agent-inbox-interrupt';

const props = defineProps<{
  message: Message;
  isLoading: boolean;
}>();

const emit = defineEmits<{
  (e: 'regenerate', parentCheckpoint: Checkpoint | null | undefined): void;
}>();

const route = useRoute();
const hideToolCalls = computed(() => {
  return route.query.hideToolCalls === 'true';
});

const {stream: thread} = useStream();

const isLastMessage = computed(() => {
  const messages = thread.messages || [];
  return messages[messages.length - 1]?.id === props.message.id;
});

const meta = computed(() => thread.getMessagesMetadata(props.message));
const interrupt = computed(() => thread.interrupt);
const parentCheckpoint = computed(() => meta.value?.firstSeenState?.parent_checkpoint);

const anthropicStreamedToolCalls = computed(() => {
  if (Array.isArray(props.message.content)) {
    return parseAnthropicStreamedToolCalls(props.message.content);
  }
  return undefined;
});

const contentString = computed(() => getContentString(props.message.content));

const hasToolCalls = computed(() => {
  return 'tool_calls' in props.message && 
    props.message.tool_calls && 
    props.message.tool_calls.length > 0;
});

const toolCallsHaveContents = computed(() => {
  return hasToolCalls.value && 
    (props.message as AIMessage).tool_calls?.some(
      (tc) => tc.args && Object.keys(tc.args).length > 0
    );
});

const hasAnthropicToolCalls = computed(() => {
  return !!anthropicStreamedToolCalls.value?.length;
});

const isToolResult = computed(() => props.message.type === 'tool');

const isAgentInboxInterrupt = computed(() => {
  if (!interrupt.value?.value) return false;
  return isAgentInboxInterruptSchema(interrupt.value.value);
});

function handleRegenerate() {
  emit('regenerate', parentCheckpoint.value as Checkpoint | null | undefined);
}
</script> 

<template>
  <div class="flex items-start mr-auto gap-2 group">
    <ToolResult v-if="isToolResult" :message="(message as ToolMessage)" />
    
    <div v-else class="flex flex-col gap-2">
      <div v-if="contentString.length > 0" class="py-1">
        <MarkdownText :content="contentString" />
      </div>
      
      <template v-if="!hideToolCalls">
        <ToolCalls v-if="hasToolCalls && toolCallsHaveContents" :tool-calls="(message as AIMessage).tool_calls" />
        <ToolCalls v-else-if="hasAnthropicToolCalls" :tool-calls="anthropicStreamedToolCalls" />
        <ToolCalls v-else-if="hasToolCalls" :tool-calls="(message as AIMessage).tool_calls" />
      </template>
      
      <CustomComponent :message="message" :thread="thread" />
      
      <GenericInterruptView 
        v-if="interrupt?.value && !isAgentInboxInterrupt && isLastMessage" 
        :interrupt="interrupt.value" 
      />
    </div>
  </div>
</template>
