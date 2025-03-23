<template>
  <Textarea
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', String($event))"
    @keydown="handleKeyDown"
    class="focus-visible:ring-0"
  />
</template>

<script setup lang="ts">
import { Textarea } from "~/components/ui/textarea";

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'submit'): void;
}>();

const handleKeyDown = (e: KeyboardEvent) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
    e.preventDefault();
    emit('submit');
  }
};
</script> 