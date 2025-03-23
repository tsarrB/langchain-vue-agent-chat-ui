<template>
  <AssistantMessage 
    v-if="!isLoading" 
    :message="message" 
    :is-loading="isLoading" 
    @regenerate="handleRegenerate"
  />
  <AssistantMessageLoading v-else />
</template>

<script setup lang="ts">
import { type Message, type Checkpoint } from '@langchain/langgraph-sdk';
import AssistantMessage from './AssistantMessage.vue';
import AssistantMessageLoading from './AssistantMessageLoading.vue';

const props = defineProps<{
  message: Message;
  isLoading: boolean;
}>();

const emit = defineEmits<{
  (e: 'regenerate', parentCheckpoint: Checkpoint | null | undefined): void;
}>();

function handleRegenerate(parentCheckpoint: Checkpoint | null | undefined) {
  emit('regenerate', parentCheckpoint);
}
</script> 