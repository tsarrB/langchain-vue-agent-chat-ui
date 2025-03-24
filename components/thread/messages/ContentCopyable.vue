<script lang="ts" setup>
import { AnimatePresence, motion } from "motion-v";
import { Copy, CopyCheck } from "lucide-vue-next";

const { content, disabled } = defineProps<{
  content: string;
  disabled: boolean;
}>();

const copied = ref(false);

const handleCopy = (e: MouseEvent) => {
  e.stopPropagation();

  navigator.clipboard.writeText(content);
  copied.value = true;
  setTimeout(() => (copied.value = false), 2000);
};
</script>

<template>
  <TooltipIconButton
    @click="handleCopy"
    variant="ghost"
    tooltip="Copy content"
    :disabled="disabled"
  >
    <AnimatePresence mode="wait" :initial="false">
      <motion.div
        v-if="copied"
        key="check"
        :initial="{ opacity: 0, scale: 0.8 }"
        :animate="{ opacity: 1, scale: 1 }"
        :exit="{ opacity: 0, scale: 0.8 }"
        :transition="{ duration: 0.15 }"
      >
        <CopyCheck class="text-green-500" />
      </motion.div>

      <motion.div
        v-else
        key="copy"
        :initial="{ opacity: 0, scale: 0.8 }"
        :animate="{ opacity: 1, scale: 1 }"
        :exit="{ opacity: 0, scale: 0.8 }"
        :transition="{ duration: 0.15 }"
      >
        <Copy />
      </motion.div>
    </AnimatePresence>
  </TooltipIconButton>
</template>

<style lang="scss"></style>
