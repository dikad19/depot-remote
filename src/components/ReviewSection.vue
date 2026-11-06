<script setup>
import { computed, ref } from "vue";
import { dateId, getJson, short } from "../lib/shop";
import StarRating from "./StarRating.vue";

const PAGE = 10;
const props = defineProps({
  productId: { type: Number, required: true },
  rating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  breakdown: { type: Object, default: () => ({}) },
  initial: { type: Array, default: () => [] },
});

const items = ref([...props.initial]);
const nextCursor = ref(props.initial.length === PAGE ? props.initial.at(-1).id : null);
const star = ref(0);
const loading = ref(false);
const error = ref("");

const total = computed(
  () => Object.values(props.breakdown).reduce((s, n) => s + n, 0) || props.ratingCount,
);

async function load(reset) {
  loading.value = true;
  error.value = "";
  try {
    const qs = new URLSearchParams({ limit: String(PAGE) });
    if (star.value) qs.set("star", star.value);
    if (!reset && nextCursor.value) qs.set("cursor", nextCursor.value);
    const data = await getJson(`/api/products/${props.productId}/reviews?${qs}`);
    items.value = reset ? data.items : [...items.value, ...data.items];
    nextCursor.value = data.nextCursor;
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}
function pick(s) {
  star.value = star.value === s ? 0 : s;
  load(true);
}
</script>

<template>
  <section id="ulasan" aria-labelledby="h-ulasan" class="tw:scroll-mt-24">
    <h2 id="h-ulasan" class="tw:text-lg tw:font-bold">Ulasan pembeli</h2>
    <p v-if="ratingCount === 0" class="tw:mt-3 tw:text-sm tw:text-slate-600">Belum ada ulasan untuk produk ini.</p>

    <div v-else class="tw:mt-4 tw:grid tw:gap-6 tw:md:grid-cols-[14rem_1fr]">
      <div>
        <p class="tw:text-4xl tw:font-bold">
          {{ rating.toFixed(1).replace(".", ",") }}<span class="tw:text-lg tw:font-medium tw:text-slate-500"> / 5</span>
        </p>
        <StarRating :value="rating" size="tw:text-xl" />
        <p class="tw:mt-1 tw:text-sm tw:text-slate-600">{{ short(ratingCount) }} ulasan</p>

        <ul class="tw:mt-4 tw:space-y-1">
          <li v-for="s in [5, 4, 3, 2, 1]" :key="s">
            <button
              type="button"
              :aria-pressed="star === s"
              class="tw:flex tw:w-full tw:items-center tw:gap-2 tw:rounded tw:px-1 tw:py-0.5 tw:text-xs tw:outline-none tw:hover:bg-slate-100 tw:focus-visible:ring-2 tw:focus-visible:ring-orange-600"
              :class="star === s && 'tw:bg-slate-100 tw:font-semibold'"
              @click="pick(s)"
            >
              <span class="tw:w-6">{{ s }}<span class="tw:text-amber-400">★</span></span>
              <span class="tw:h-2 tw:flex-1 tw:overflow-hidden tw:rounded-full tw:bg-slate-200">
                <span class="tw:block tw:h-full tw:rounded-full tw:bg-amber-400" :style="{ width: total ? `${((breakdown[s] ?? 0) / total) * 100}%` : '0%' }" />
              </span>
              <span class="tw:w-8 tw:text-right tw:tabular-nums tw:text-slate-600">{{ short(breakdown[s] ?? 0) }}</span>
            </button>
          </li>
        </ul>
      </div>

      <div>
        <p v-if="star" class="tw:mb-2 tw:text-sm tw:text-slate-600" aria-live="polite">
          Menampilkan ulasan bintang {{ star }}.
          <button type="button" class="tw:font-medium tw:text-orange-700 tw:hover:underline" @click="pick(star)">Tampilkan semua</button>
        </p>
        <UAlert v-if="error" color="error" variant="subtle" title="Gagal memuat ulasan" :description="error" class="tw:mb-3" />
        <p v-if="!loading && items.length === 0" class="tw:text-sm tw:text-slate-600">Belum ada ulasan dengan bintang {{ star }}.</p>

        <ul class="tw:divide-y tw:divide-slate-200">
          <li v-for="r in items" :key="r.id" class="tw:py-4 tw:first:pt-0">
            <div class="tw:flex tw:items-center tw:gap-3">
              <span class="tw:grid tw:size-9 tw:place-items-center tw:rounded-full tw:bg-slate-200 tw:text-sm tw:font-semibold tw:text-slate-700" aria-hidden="true">
                {{ r.userName.charAt(0).toUpperCase() }}
              </span>
              <div>
                <p class="tw:text-sm tw:font-medium">{{ r.userName }}</p>
                <div class="tw:flex tw:items-center tw:gap-2 tw:text-xs tw:text-slate-600">
                  <StarRating :value="r.rating" size="tw:text-sm" />
                  <time :datetime="new Date(r.createdAt).toISOString()">{{ dateId(r.createdAt) }}</time>
                </div>
              </div>
            </div>
            <p v-if="r.variantLabel" class="tw:mt-2 tw:text-xs tw:text-slate-500">Pilihan dibeli: {{ r.variantLabel }}</p>
            <p v-if="r.comment" class="tw:mt-2 tw:max-w-prose tw:whitespace-pre-line tw:text-sm tw:leading-6 tw:text-slate-800">{{ r.comment }}</p>
            <ul v-if="r.photos?.length" class="tw:mt-3 tw:flex tw:gap-2">
              <li v-for="(ph, n) in r.photos" :key="n">
                <img :src="ph" :alt="`Foto dari ${r.userName}, ${n + 1}`" loading="lazy" class="tw:size-16 tw:rounded-lg tw:object-cover" />
              </li>
            </ul>
            <div v-if="r.sellerReply" class="tw:mt-3 tw:rounded-lg tw:border-l-2 tw:border-orange-600 tw:bg-slate-50 tw:p-3 tw:text-sm">
              <p class="tw:font-semibold">Balasan penjual</p>
              <p class="tw:mt-1 tw:text-slate-700">{{ r.sellerReply }}</p>
            </div>
            <p v-if="r.helpfulCount > 0" class="tw:mt-3 tw:inline-flex tw:items-center tw:gap-1 tw:text-xs tw:text-slate-500">
              <UIcon name="i-lucide-thumbs-up" class="tw:size-3.5" />{{ r.helpfulCount }} orang terbantu
            </p>
          </li>
        </ul>

        <UButton v-if="nextCursor" :loading="loading" color="neutral" variant="outline" class="tw:mt-4" @click="load(false)">
          Muat ulasan lainnya
        </UButton>
      </div>
    </div>
  </section>
</template>