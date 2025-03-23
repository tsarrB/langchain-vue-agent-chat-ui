export function useMediaQuery(query: string) {
  const matches = ref(false);

  const media = ref<MediaQueryList | null>(null);

  const matchHandler = (e: MediaQueryListEvent) => {
    matches.value = (e.matches);
  }

  onMounted(() => {
    media.value = window.matchMedia(query);
    matches.value = (media.value.matches);

    media.value.addEventListener("change", matchHandler);
  })

  onUnmounted(() => {
    media.value?.removeEventListener("change", matchHandler);
  })

  watch(() => query, (value) => {
    media.value = window.matchMedia(value);
    matches.value = (media.value.matches);
  })

  return matches;
}
