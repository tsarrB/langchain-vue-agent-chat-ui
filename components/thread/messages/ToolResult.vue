<template>
  <div class="border border-gray-200 rounded-lg overflow-hidden">
    <div class="bg-gray-50 px-4 py-2 border-b border-gray-200">
      <div class="flex items-center justify-between gap-2 flex-wrap">
        <h3 v-if="message.name" class="font-medium text-gray-900">
          Tool Result: 
          <code class="bg-gray-100 px-2 py-1 rounded">
            {{ message.name }}
          </code>
        </h3>
        <h3 v-else class="font-medium text-gray-900">Tool Result</h3>
        
        <code v-if="message.tool_call_id" class="ml-2 text-sm bg-gray-100 px-2 py-1 rounded">
          {{ message.tool_call_id }}
        </code>
      </div>
    </div>
    
    <div class="min-w-full bg-gray-100">
      <div class="p-3">
        <Transition 
          name="fade" 
          mode="out-in"
        >
          <div :key="isExpanded ? 'expanded' : 'collapsed'">
            <table v-if="isJsonContent" class="min-w-full divide-y divide-gray-200">
              <tbody class="divide-y divide-gray-200">
                <tr 
                  v-for="(item, argIdx) in displayEntries" 
                  :key="argIdx"
                >
                  <td class="px-4 py-2 text-sm font-medium text-gray-900 whitespace-nowrap">
                    {{ Array.isArray(parsedContent) ? argIdx : item[0] }}
                  </td>
                  <td class="px-4 py-2 text-sm text-gray-500">
                    <code v-if="isComplexValue(getItemValue(item))" class="bg-gray-50 rounded px-2 py-1 font-mono text-sm">
                      {{ JSON.stringify(getItemValue(item), null, 2) }}
                    </code>
                    <template v-else>{{ String(getItemValue(item)) }}</template>
                  </td>
                </tr>
              </tbody>
            </table>
            <code v-else class="text-sm block">{{ displayedContent }}</code>
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
import type { ToolMessage } from '@langchain/langgraph-sdk';
import { ChevronDown, ChevronUp } from 'lucide-vue-next';
import { isComplexValue } from './utils';

const props = defineProps<{
  message: ToolMessage;
}>();

const isExpanded = ref(false);

const parsedContent = computed(() => {
  if (typeof props.message.content !== 'string') {
    return props.message.content;
  }
  
  try {
    return JSON.parse(props.message.content);
  } catch {
    // Content is not JSON, use as is
    return props.message.content;
  }
});

const isJsonContent = computed(() => {
  return typeof parsedContent.value !== 'string';
});

const contentStr = computed(() => {
  if (isJsonContent.value) {
    return JSON.stringify(parsedContent.value, null, 2);
  }
  return String(parsedContent.value);
});

const contentLines = computed(() => contentStr.value.split('\n'));

const shouldTruncate = computed(() => {
  return contentLines.value.length > 4 || contentStr.value.length > 500;
});

const displayedContent = computed(() => {
  if (shouldTruncate.value && !isExpanded.value) {
    if (contentStr.value.length > 500) {
      return contentStr.value.slice(0, 500) + '...';
    }
    return contentLines.value.slice(0, 4).join('\n') + '\n...';
  }
  return contentStr.value;
});

const displayEntries = computed(() => {
  if (Array.isArray(parsedContent.value)) {
    return isExpanded.value 
      ? parsedContent.value 
      : parsedContent.value.slice(0, 5);
  }
  return Object.entries(parsedContent.value);
});

const shouldShowExpandButton = computed(() => {
  return (shouldTruncate.value && !isJsonContent.value) || 
         (isJsonContent.value && Array.isArray(parsedContent.value) && parsedContent.value.length > 5);
});

function getItemValue(item: any) {
  // For arrays, the item is the direct value
  // For objects, item is [key, value] tuple
  return Array.isArray(parsedContent.value) ? item : item[1];
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