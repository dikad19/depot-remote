<script setup>
defineProps({ value: { type: Number, required: true }, size: { type: String, default: "tw:text-base" } });
</script>

<template>
  <span
    class="tw:inline-flex tw:leading-none"
    :class="size"
    role="img"
    :aria-label="`Rating ${value.toFixed(1).replace('.', ',')} dari 5`"
  >
    <span
      v-for="i in 5"
      :key="i"
      aria-hidden="true"
      :class="i <= Math.round(value) ? 'tw:text-amber-400' : 'tw:text-slate-200'"
    >★</span>
  </span>
</template>