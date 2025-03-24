<template>
  <div v-if="customComponents && customComponents.length">
    <component
      v-for="customComponent in customComponents"
      :key="customComponent.id"
      :is="loadedComponents[customComponent.id]?.component"
      v-bind="loadedComponents[customComponent.id]?.props"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import type { Message } from "@langchain/langgraph-sdk";
import { useStream } from "~/composables/useStream";

const props = defineProps<{
  message: Message;
  thread: any; // StreamProvider type
}>();

const { stream } = useStream();
const loadedComponents = ref<Record<string, { component: any; props: any }>>(
  {}
);

const customComponents = computed(() => {
  return stream.values?.ui?.filter(
    (ui: any) => ui.metadata?.message_id === props.message.id
  );
});

// This would be replaced by your actual external component loading logic
// For now, it's a placeholder
onMounted(() => {
  if (customComponents.value?.length) {
    customComponents.value.forEach((component: any) => {
      // In Vue, you would need to dynamically import or register these components
      // This is a simplified placeholder
      loadedComponents.value[component.id] = {
        component: "div", // Placeholder
        props: {
          class: "bg-muted/50 p-4 rounded-md",
          innerHTML: `External component with ID: ${component.id}`,
        },
      };
    });
  }
});
</script>
