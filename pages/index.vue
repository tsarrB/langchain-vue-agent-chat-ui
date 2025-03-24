<script setup lang="ts">
import Thread from "~/components/thread/Thread.vue";
import StreamProvider from "~/components/StreamProvider.vue";
</script>

<template>
  <div class="h-screen w-screen">
    <StreamProvider>
      <Thread />
    </StreamProvider>
  </div>
</template>
