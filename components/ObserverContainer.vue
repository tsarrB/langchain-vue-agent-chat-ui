<script lang="ts" setup>
import { useIntersectionObserver } from "@vueuse/core";

const root = useTemplateRef<HTMLElement>("root");
const target = useTemplateRef<HTMLElement>("target");

const isAtBottom = ref(false);

const { stop } = useIntersectionObserver(target, ([entry]) => {
  isAtBottom.value = entry?.isIntersecting || false;
}, {
  root,
});

const scrollToBottom = () => {
  root.value?.scrollTo({
    top: root.value?.scrollHeight,
    behavior: "smooth",
  });
};

onUnmounted(() => {
  stop();
});
</script>

<template>
  <div ref="root">
    <slot :isAtBottom="isAtBottom" :scrollToBottom="scrollToBottom" />

    <div ref="target" />
  </div>
</template>

<style lang="scss"></style>
