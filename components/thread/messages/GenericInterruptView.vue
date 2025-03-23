<template>
  <div class="border border-gray-200 rounded-lg overflow-hidden">
    <div class="bg-gray-50 px-4 py-2 border-b border-gray-200">
      <div class="flex items-center justify-between gap-2 flex-wrap">
        <h3 class="font-medium text-gray-900">Human Interrupt</h3>
      </div>
    </div>
    
    <div class="min-w-full bg-gray-100">
      <div class="p-3">
        <Transition 
          name="fade" 
          mode="out-in"
        >
          <div 
            :key="isExpanded ? 'expanded' : 'collapsed'"
            :style="{
              maxHeight: isExpanded ? 'none' : '500px',
              overflow: 'auto'
            }"
          >
            <table class="min-w-full divide-y divide-gray-200">
              <tbody class="divide-y divide-gray-200">
                <tr v-for="(item, argIdx) in displayEntries" :key="argIdx">
                  <td class="px-4 py-2 text-sm font-medium text-gray-900 whitespace-nowrap">
                    {{ getKeyFromItem(item, argIdx) }}
                  </td>
                  <td class="px-4 py-2 text-sm text-gray-500">
                    <code v-if="isComplexValue(getValueFromItem(item))" class="bg-gray-50 rounded px-2 py-1 font-mono text-sm">
                      {{ JSON.stringify(getValueFromItem(item), null, 2) }}
                    </code>
                    <template v-else>{{ String(getValueFromItem(item)) }}</template>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Transition>
      </div>
      
      <button 
        v-if="shouldShowExpandButton"
        @click="isExpanded = !isExpanded"
        class="w-full py-2 flex items-center justify-center border-t-[1px] border-gray-200 text-gray-500 hover:text-gray-600 hover:bg-gray-50 transition-all ease-in-out duration-200 cursor-pointer"
      >
        <ChevronUp v-if="isExpanded" />
        <ChevronDown v-else />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ChevronDown, ChevronUp } from 'lucide-vue-next';
import { isComplexValue } from './utils';

const props = defineProps<{
  interrupt: Record<string, any> | Record<string, any>[];
}>();

const isExpanded = ref(false);

const contentStr = computed(() => {
  return JSON.stringify(props.interrupt, null, 2);
});

const contentLines = computed(() => contentStr.value.split('\n'));
const shouldTruncate = computed(() => contentLines.value.length > 4 || contentStr.value.length > 500);

// Function to truncate long string values
function truncateValue(value: any): any {
  if (typeof value === 'string' && value.length > 100) {
    return value.substring(0, 100) + '...';
  }

  if (Array.isArray(value) && !isExpanded.value) {
    return value.slice(0, 2).map(truncateValue);
  }

  if (isComplexValue(value) && !isExpanded.value) {
    const strValue = JSON.stringify(value, null, 2);
    if (strValue.length > 100) {
      // Return plain text for truncated content instead of a JSON object
      return `Truncated ${strValue.length} characters...`;
    }
  }

  return value;
}

// Process entries based on expanded state
const displayEntries = computed(() => {
  if (Array.isArray(props.interrupt)) {
    return isExpanded.value ? props.interrupt : props.interrupt.slice(0, 5);
  } else {
    const entries = Object.entries(props.interrupt);
    if (!isExpanded.value && shouldTruncate.value) {
      // When collapsed, process each value to potentially truncate it
      return entries.map(([key, value]) => [key, truncateValue(value)]);
    }
    return entries;
  }
});

const shouldShowExpandButton = computed(() => {
  return (shouldTruncate.value || 
    (Array.isArray(props.interrupt) && props.interrupt.length > 5));
});

// Helper functions for handling array or object items
function getKeyFromItem(item: any, index: number): string {
  return Array.isArray(props.interrupt) ? index.toString() : item[0];
}

function getValueFromItem(item: any): any {
  return Array.isArray(props.interrupt) ? item : item[1];
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style> 