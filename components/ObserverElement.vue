<script lang="ts" setup>
import { useIntersectionObserver } from "@vueuse/core";

const root = useTemplateRef<HTMLElement>("root");

const isVisible = ref(false);

const { stop } = useIntersectionObserver(root, ([entry]) => {
  isVisible.value = entry?.isIntersecting || false;
});

onUnmounted(() => {
  stop();
});
</script>

<template>
  <div ref="root" class="root">
    <slot :isVisible="isVisible" />
  </div>
</template>

<style lang="scss"></style>
