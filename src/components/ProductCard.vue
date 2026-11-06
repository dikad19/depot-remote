<script setup>
import { computed } from "vue";
import { bestVoucher, rupiah, short } from "../lib/shop";
import StarRating from "./StarRating.vue";

const props = defineProps({ product: { type: Object, required: true } });
const p = computed(() => props.product);

const STORE = {
  OFFICIAL: { label: "Resmi", icon: "i-lucide-shield-check", cls: "tw:bg-slate-900" },
  ORIGINAL: { label: "Ori", icon: "i-lucide-badge-check", cls: "tw:bg-teal-700" },
};
const store = computed(() => STORE[p.value.seller?.type]);
const soldOut = computed(() => p.value.stock <= 0);
const lowStock = computed(() => p.value.stock > 0 && p.value.stock <= 5);
const percentOff = computed(() =>
  p.value.originalPrice > p.value.price
    ? Math.round((1 - p.value.price / p.value.originalPrice) * 100)
    : 0,
);
const voucher = computed(() =>
  soldOut.value ? null : bestVoucher(p.value.price, p.value.vouchers),
);
const eta = computed(() =>
  p.value.etaMinDays === p.value.etaMaxDays
    ? `${p.value.etaMinDays} hari`
    : `${p.value.etaMinDays}–${p.value.etaMaxDays} hari`,
);
</script>

<template>
  <article
    class="tw:group tw:relative tw:flex tw:flex-col tw:overflow-hidden tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white tw:transition-shadow tw:hover:shadow-md tw:focus-within:ring-2 tw:focus-within:ring-orange-600 tw:focus-within:ring-offset-2"
  >
    <div class="tw:relative tw:aspect-square tw:bg-slate-100">
      <img v-if="p.thumbnailUrl" :src="p.thumbnailUrl" alt="" loading="lazy" class="tw:size-full tw:object-cover" />
      <div v-else class="tw:grid tw:size-full tw:place-items-center tw:text-slate-400">
        <UIcon name="i-lucide-store" class="tw:size-10" />
      </div>

      <span
        v-if="store"
        class="tw:absolute tw:left-0 tw:top-2 tw:inline-flex tw:items-center tw:gap-1 tw:rounded-r-md tw:py-0.5 tw:pl-1.5 tw:pr-2 tw:text-xs tw:font-semibold tw:text-white"
        :class="store.cls"
      >
        <UIcon :name="store.icon" class="tw:size-3.5" />{{ store.label }}
      </span>
      <span
        v-if="percentOff"
        class="tw:absolute tw:right-0 tw:top-0 tw:rounded-bl-lg tw:bg-orange-700 tw:px-2 tw:py-1 tw:text-xs tw:font-bold tw:text-white"
      >−{{ percentOff }}%</span>
      <div v-if="soldOut" class="tw:absolute tw:inset-0 tw:grid tw:place-items-center tw:bg-white/70">
        <span class="tw:rounded-full tw:bg-slate-900 tw:px-3 tw:py-1 tw:text-sm tw:font-semibold tw:text-white">Stok habis</span>
      </div>
    </div>

    <div class="tw:flex tw:flex-1 tw:flex-col tw:p-3">
      <h3 class="tw:line-clamp-2 tw:min-h-10 tw:text-sm tw:leading-5 tw:text-slate-900">
        <a :href="`#produk/${p.id}`" class="tw:outline-none tw:after:absolute tw:after:inset-0 tw:after:content-['']">{{ p.name }}</a>
      </h3>
      <p v-if="p.category" class="tw:mt-0.5 tw:truncate tw:text-xs tw:text-slate-500">{{ p.category.name }}</p>

      <p class="tw:mt-2 tw:flex tw:flex-wrap tw:items-baseline tw:gap-x-2">
        <span class="tw:text-lg tw:font-bold tw:text-orange-700">{{ rupiah(p.price) }}</span>
        <s v-if="percentOff" class="tw:text-xs tw:text-slate-500">{{ rupiah(p.originalPrice) }}</s>
      </p>

      <p v-if="voucher" class="tw:mt-1 tw:flex tw:flex-wrap tw:items-center tw:gap-x-2 tw:gap-y-1 tw:text-xs">
        <span
          :title="voucher.minSpend ? `Min. belanja ${rupiah(voucher.minSpend)}` : undefined"
          class="tw:rounded tw:border tw:border-dashed tw:border-orange-600 tw:bg-orange-50 tw:px-1.5 tw:py-0.5 tw:font-semibold tw:text-orange-700"
        >Voucher −Rp {{ short(voucher.discount) }}</span>
        <span class="tw:text-slate-600">jadi <b class="tw:text-slate-900">{{ rupiah(p.price - voucher.discount) }}</b></span>
      </p>

      <p class="tw:mt-2 tw:flex tw:items-center tw:gap-1.5 tw:text-xs tw:text-slate-600">
        <template v-if="p.ratingCount > 0">
          <StarRating :value="1" size="tw:text-sm" />
          <span class="tw:font-medium tw:text-slate-900">{{ p.rating.toFixed(1).replace(".", ",") }}</span>
          <span>({{ short(p.ratingCount) }})</span>
        </template>
        <span v-else>Belum ada ulasan</span>
        <template v-if="p.soldCount > 0">
          <span aria-hidden="true" class="tw:text-slate-300">|</span>
          <span>Terjual {{ short(p.soldCount) }}{{ p.soldCount >= 1000 ? "+" : "" }}</span>
        </template>
      </p>
      <p v-if="lowStock" class="tw:mt-1 tw:text-xs tw:font-medium tw:text-red-700">Sisa {{ p.stock }}</p>

      <div class="tw:mt-auto tw:space-y-1 tw:pt-3 tw:text-xs tw:text-slate-600">
        <p class="tw:flex tw:flex-wrap tw:items-center tw:gap-x-3 tw:gap-y-1">
          <span v-if="p.instant" class="tw:inline-flex tw:items-center tw:gap-1 tw:font-medium tw:text-emerald-700">
            <UIcon name="i-lucide-zap" class="tw:size-3.5" />Instan · hari ini
          </span>
          <span v-else class="tw:inline-flex tw:items-center tw:gap-1">
            <UIcon name="i-lucide-truck" class="tw:size-3.5" />{{ eta }}
          </span>
          <span v-if="p.freeShipping" class="tw:font-medium tw:text-teal-700">Gratis ongkir</span>
        </p>
        <p v-if="p.seller" class="tw:flex tw:items-center tw:gap-1">
          <UIcon name="i-lucide-map-pin" class="tw:size-3.5 tw:shrink-0" />
          <span class="tw:truncate">{{ p.seller.city }}</span>
        </p>
      </div>
    </div>
  </article>
</template>