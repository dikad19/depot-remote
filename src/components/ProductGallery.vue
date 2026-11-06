<script setup>
import { computed, ref } from "vue";

const props = defineProps({ images: { type: Array, default: () => [] }, name: String });
const list = computed(() => [...props.images].sort((a, b) => a.position - b.position));
const i = ref(0);
const go = (d) => (i.value = (i.value + d + list.value.length) % list.value.length);
</script>

<template>
  <div>
    <div class="tw:relative tw:aspect-square tw:overflow-hidden tw:rounded-xl tw:bg-slate-100">
      <img
        v-if="list.length"
        :src="list[i].url"
        :alt="list[i].alt || `${name}, foto ${i + 1} dari ${list.length}`"
        class="tw:size-full tw:object-cover"
      />
      <div v-else class="tw:grid tw:size-full tw:place-items-center tw:text-slate-400">
        <UIcon name="i-lucide-store" class="tw:size-16" />
      </div>
      <template v-if="list.length > 1">
        <UButton icon="i-lucide-chevron-left" color="neutral" variant="solid" size="sm" aria-label="Foto sebelumnya"
          class="tw:absolute tw:left-2 tw:top-1/2 tw:-translate-y-1/2 tw:rounded-full" @click="go(-1)" />
        <UButton icon="i-lucide-chevron-right" color="neutral" variant="solid" size="sm" aria-label="Foto berikutnya"
          class="tw:absolute tw:right-2 tw:top-1/2 tw:-translate-y-1/2 tw:rounded-full" @click="go(1)" />
        <span class="tw:absolute tw:bottom-2 tw:right-2 tw:rounded-full tw:bg-slate-900/80 tw:px-2 tw:py-0.5 tw:text-xs tw:text-white">
          {{ i + 1 }}/{{ list.length }}
        </span>
      </template>
    </div>

    <ul v-if="list.length > 1" class="tw:mt-3 tw:flex tw:gap-2 tw:overflow-x-auto tw:pb-1">
      <li v-for="(img, n) in list" :key="img.id" class="tw:shrink-0">
        <button
          type="button"
          :aria-label="`Lihat foto ${n + 1}`"
          :aria-current="n === i"
          class="tw:block tw:size-16 tw:overflow-hidden tw:rounded-lg tw:border-2 tw:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-orange-600 tw:focus-visible:ring-offset-2"
          :class="n === i ? 'tw:border-slate-900' : 'tw:border-transparent tw:opacity-70 tw:hover:opacity-100'"
          @click="i = n"
        >
          <img :src="img.url" alt="" loading="lazy" class="tw:size-full tw:object-cover" />
        </button>
      </li>
    </ul>
  </div>
</template>