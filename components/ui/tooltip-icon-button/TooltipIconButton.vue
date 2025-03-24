<script setup lang="ts">
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { Button, type ButtonProps } from "~/components/ui/button";


const { side = 'bottom', tooltip, ...rest } = defineProps<ButtonProps & {
  tooltip: string;
  side?: "top" | "bottom" | "left" | "right";
}>();

</script>

<template>
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          v-bind="rest"
          variant="ghost"
          size="icon"
          class="size-6 p-1"
          ref={ref}
          @click="$emit('click', $event)"
        >
          <slot />
          <span class="sr-only">{{ tooltip }}</span>
        </Button>
      </TooltipTrigger>

      <TooltipContent :side="side">{{ tooltip }}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>