<script lang="ts" setup>
import { XIcon, SendHorizontal, RefreshCcw, Pencil } from "lucide-vue-next";

import ContentCopyable from "./ContentCopyable.vue";

const {
  content,
  isHumanMessage,
  isAiMessage,
  handleSubmitEdit,
  handleRegenerate,
  isLoading,
} = defineProps<{
  content: string;
  isHumanMessage?: boolean;
  isAiMessage?: boolean;
  handleSubmitEdit?: () => void;
  handleRegenerate?: () => void;
  isLoading: boolean;
}>();

const isEditing = defineModel<boolean>('isEditing', { required: false });

onMounted(() => {
  if (isHumanMessage && isAiMessage) {
    throw new Error(
      "Can only set one of isHumanMessage or isAiMessage to true, not both."
    );
  }

  if (!isHumanMessage && !isAiMessage) {
    throw new Error(
      "One of isHumanMessage or isAiMessage must be set to true."
    );
  }
});

const showEdit = computed(
  () => isHumanMessage && isEditing !== undefined && !!handleSubmitEdit
);
</script>

<template>
  <div
    v-if="isHumanMessage && isEditing && !!handleSubmitEdit"
    class="flex items-center gap-2"
  >
    <TooltipIconButton
      :disabled="isLoading"
      tooltip="Cancel edit"
      variant="ghost"
      @click="isEditing = false"
    >
      <XIcon />
    </TooltipIconButton>

    <TooltipIconButton
      :disabled="isLoading"
      tooltip="Submit"
      variant="secondary"
      @click="handleSubmitEdit"
    >
      <SendHorizontal />
    </TooltipIconButton>
  </div>

  <div v-else class="flex items-center gap-2">
    <ContentCopyable :content="content" :disabled="isLoading" />

    <TooltipIconButton
      v-if="isAiMessage && !!handleRegenerate"
      :disabled="isLoading"
      tooltip="Refresh"
      variant="ghost"
      @click="handleRegenerate"
    >
      <RefreshCcw />
    </TooltipIconButton>

    <TooltipIconButton
      v-if="showEdit"
      :disabled="isLoading"
      tooltip="Edit"
      variant="ghost"
      @click="isEditing = true"
    >
      <Pencil />
    </TooltipIconButton>
  </div>
</template>

<style lang="scss"></style>
