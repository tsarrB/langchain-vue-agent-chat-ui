<template>
  <div v-if="!apiUrl || !assistantId" class="flex items-center justify-center min-h-screen w-full p-4">
    <div class="animate-in fade-in-0 zoom-in-95 flex flex-col border bg-background shadow-lg rounded-lg max-w-3xl">
      <div class="flex flex-col gap-2 mt-14 p-6 border-b">
        <div class="flex items-start flex-col gap-2">
          <LangGraphLogo class="h-7" />
          <h1 class="text-xl font-semibold tracking-tight">
            Agent Chat
          </h1>
        </div>
        <p class="text-muted-foreground">
          Welcome to Agent Chat! Before you get started, you need to enter
          the URL of the deployment and the assistant / graph ID.
        </p>
      </div>
      <form
        @submit.prevent="handleSubmit"
        class="flex flex-col gap-6 p-6 bg-muted/50"
      >
        <div class="flex flex-col gap-2">
          <Label for="apiUrl">
            Deployment URL<span class="text-rose-500">*</span>
          </Label>
          <p class="text-muted-foreground text-sm">
            This is the URL of your LangGraph deployment. Can be a local, or
            production deployment.
          </p>
          <Input
            id="apiUrl"
            name="apiUrl"
            class="bg-background"
            :model-value="formData.apiUrl"
            @update:model-value="val => formData.apiUrl = String(val)"
            required
          />
        </div>

        <div class="flex flex-col gap-2">
          <Label for="assistantId">
            Assistant / Graph ID<span class="text-rose-500">*</span>
          </Label>
          <p class="text-muted-foreground text-sm">
            This is the ID of the graph (can be the graph name), or
            assistant to fetch threads from, and invoke when actions are
            taken.
          </p>
          <Input
            id="assistantId"
            name="assistantId"
            class="bg-background"
            :model-value="formData.assistantId"
            @update:model-value="val => formData.assistantId = String(val)"
            required
          />
        </div>

        <div class="flex flex-col gap-2">
          <Label for="apiKey">LangSmith API Key</Label>
          <p class="text-muted-foreground text-sm">
            This is <strong>NOT</strong> required if using a local LangGraph
            server. This value is stored in your browser's local storage and
            is only used to authenticate requests sent to your LangGraph
            server.
          </p>
          <Input
            id="apiKey"
            name="apiKey"
            class="bg-background"
            placeholder="lsv2_pt_..."
            :model-value="formData.apiKey"
            @update:model-value="val => formData.apiKey = String(val)"
          />
        </div>

        <div class="flex justify-end mt-2">
          <Button type="submit" size="lg">
            Continue
            <ArrowRight class="size-5" />
          </Button>
        </div>
      </form>
    </div>
  </div>
  
  <slot v-else></slot>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

import LangGraphLogo from '~/components/icons/langgraph.vue';
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { ArrowRight } from "lucide-vue-next";
import { getApiKey } from "~/lib/api-key";

const route = useRoute();
const router = useRouter();

const formData = reactive({
  apiUrl: "http://localhost:2024",
  assistantId: "agent",
  apiKey: getApiKey() || ""
});

// Access the query parameters
const apiUrl = computed(() => route.query.apiUrl as string || "");
const assistantId = computed(() => route.query.assistantId as string || "");

// Update form data with query params if available
onMounted(() => {
  if (apiUrl.value) {
    formData.apiUrl = apiUrl.value;
  }
  if (assistantId.value) {
    formData.assistantId = assistantId.value;
  }
});

const handleSubmit = () => {
  // Update query parameters
  router.push({
    query: {
      ...route.query,
      apiUrl: formData.apiUrl,
      assistantId: formData.assistantId
    }
  });
  
  // Save API key to local storage
  if (formData.apiKey) {
    window.localStorage.setItem("lg:chat:apiKey", formData.apiKey);
  }
};
</script> 