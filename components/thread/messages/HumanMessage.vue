<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Message } from '@langchain/langgraph-sdk';
import { getContentString } from '../utils';
import { cn } from '@/lib/utils';
import EditableContent from './EditableContent.vue';
import { useStream } from '~/composables/useStream';

const props = defineProps<{
  message: Message;
  isLoading: boolean;
}>();

const {stream: thread} = useStream();
const meta = computed(() => thread.getMessagesMetadata(props.message));
const parentCheckpoint = computed(() => meta.value?.firstSeenState?.parent_checkpoint);

const isEditing = ref(false);
const editValue = ref('');
const contentString = computed(() => getContentString(props.message.content));

function handleSetIsEditing(value: boolean) {
  isEditing.value = value;
  if (value) {
    editValue.value = contentString.value;
  }
}

function handleSubmitEdit() {
  isEditing.value = false;

  const newMessage = { 
    type: "human", 
    content: editValue.value 
  } as Message;
  
  thread.submit(
    { messages: [newMessage] },
    {
      checkpoint: parentCheckpoint.value,
      streamMode: ["values"],
      optimisticValues: (prev: any) => {
        const values = meta.value?.firstSeenState?.values;
        if (!values) return prev;

        return {
          ...values,
          messages: [...(values.messages ?? []), newMessage],
        };
      },
    },
  );
}
</script> 

<template>
  <div
    :class="[
      'flex items-center ml-auto gap-2 group',
      isEditing && 'w-full max-w-xl'
    ]"
  >
    <div :class="['flex flex-col gap-2', isEditing && 'w-full']">
      <EditableContent
        v-if="isEditing"
        v-model="editValue"
        @submit="handleSubmitEdit"
      />
      <p
        v-else
        class="text-right px-4 py-2 rounded-3xl bg-muted"
      >
        {{ contentString }}
      </p>

      <div
        :class="[
          'flex gap-2 items-center ml-auto transition-opacity',
          'opacity-0 group-focus-within:opacity-100 group-hover:opacity-100',
          isEditing && 'opacity-100'
        ]"
      >
        <!-- <BranchSwitcher
          :branch="meta?.branch"
          :branch-options="meta?.branchOptions"
          @select="(branch: string) => thread.setBranch(branch)"
          :is-loading="isLoading"
        />
        <CommandBar
          :is-loading="isLoading"
          :content="contentString"
          :is-editing="isEditing"
          @set-is-editing="handleSetIsEditing"
          @submit-edit="handleSubmitEdit"
          :is-human-message="true"
        /> -->
      </div>
    </div>
  </div>
</template>