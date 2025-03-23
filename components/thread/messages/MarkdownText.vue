<template>
  <div v-html="renderedMarkdown" class="markdown-text"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

const props = defineProps<{
  content: string;
}>();

const renderedMarkdown = computed(() => {
  if (!props.content) return '';
  
  // Parse markdown to HTML and sanitize
  const html = marked.parse(props.content, { breaks: true });
  return DOMPurify.sanitize(html as string);
});
</script>

<style scoped>
.markdown-text {
  word-break: break-word;
}

.markdown-text :deep(pre) {
  padding: 1rem;
  border-radius: 0.375rem;
  background-color: rgb(var(--color-muted-rgb) / 0.5);
  overflow-x: auto;
}

.markdown-text :deep(code) {
  padding: 0.2rem 0.4rem;
  border-radius: 0.25rem;
  background-color: rgb(var(--color-muted-rgb) / 0.5);
  font-family: monospace;
}

.markdown-text :deep(pre code) {
  padding: 0;
  background-color: transparent;
}

.markdown-text :deep(a) {
  color: rgb(var(--color-primary-rgb));
  text-decoration: underline;
}

.markdown-text :deep(ul),
.markdown-text :deep(ol) {
  padding-left: 1.5rem;
}

.markdown-text :deep(ul) {
  list-style-type: disc;
}

.markdown-text :deep(ol) {
  list-style-type: decimal;
}

.markdown-text :deep(h1),
.markdown-text :deep(h2),
.markdown-text :deep(h3),
.markdown-text :deep(h4),
.markdown-text :deep(h5),
.markdown-text :deep(h6) {
  font-weight: 600;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
}
</style> 