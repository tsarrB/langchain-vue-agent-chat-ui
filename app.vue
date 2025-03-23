<script setup>
import { Toaster } from '~/components/ui/sonner'
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>

  <ClientOnly>
    <Toaster />
  </ClientOnly>
</template>

<style lang="scss">
</style>