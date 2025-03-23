<script lang="ts" setup>
import { ArrowDown } from "lucide-vue-next";

const scrollToBottom = () => {
  console.log("scrollToBottom");
};
</script>

<template>
  <Button
    variant="outline"
    @click="scrollToBottom"
  >
    <ArrowDown class="w-4 h-4" />
    <span>Scroll to bottom</span>
  </Button>
</template>

<style lang="scss">

</style>