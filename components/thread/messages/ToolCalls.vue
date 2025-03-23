<template>
  <div v-if="toolCalls && toolCalls.length > 0" class="space-y-4 w-full max-w-4xl">
    <div 
      v-for="(tc, idx) in toolCalls" 
      :key="idx"
      class="border border-gray-200 rounded-lg overflow-hidden"
    >
      <div class="bg-gray-50 px-4 py-2 border-b border-gray-200">
        <h3 class="font-medium text-gray-900">
          {{ tc.name }}
          <code v-if="tc.id" class="ml-2 text-sm bg-gray-100 px-2 py-1 rounded">
            {{ tc.id }}
          </code>
        </h3>
      </div>
      
      <table v-if="hasArgs(tc)" class="min-w-full divide-y divide-gray-200">
        <tbody class="divide-y divide-gray-200">
          <tr v-for="([key, value], argIdx) in Object.entries(tc.args || {})" :key="argIdx">
            <td class="px-4 py-2 text-sm font-medium text-gray-900 whitespace-nowrap">
              {{ key }}
            </td>
            <td class="px-4 py-2 text-sm text-gray-500">
              <code v-if="isComplexValue(value)" class="bg-gray-50 rounded px-2 py-1 font-mono text-sm">
                {{ JSON.stringify(value, null, 2) }}
              </code>
              <template v-else>{{ String(value) }}</template>
            </td>
          </tr>
        </tbody>
      </table>
      
      <code v-else class="text-sm block p-3">{}</code>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AIMessage } from '@langchain/langgraph-sdk';
import { isComplexValue } from './utils';

defineProps<{
  toolCalls: AIMessage['tool_calls'];
}>();

function hasArgs(toolCall: any): boolean {
  return toolCall.args && Object.keys(toolCall.args).length > 0;
}
</script> 