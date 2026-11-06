<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { announceCart, getJson } from "./lib/shop";
import ProductCard from "./components/ProductCard.vue";
import ProductDetail from "./components/ProductDetail.vue";

const LIMIT = 20;
const SORTS = [
  { label: "Terbaru", value: "terbaru" },
  { label: "Terlaris", value: "terlaris" },
  { label: "Harga terendah", value: "termurah" },
  { label: "Harga tertinggi", value: "termahal" },
];

const categories = ref([]);
const hash = ref("");
const q = ref("");
const sort = ref("terbaru");
const products = ref([]);
const total = ref(0);
const page = ref(1);
const loading = ref(true);
const error = ref("");
let ctrl;
let loadedOnce = false;

// Rute lewat hash, supaya cocok dengan tautan menu di header (#fashion, #promo, ...)
//   #produk/12 -> detail produk, #<slug> -> kategori, #promo -> promo
const detailId = computed(() => {
  const m = hash.value.match(/^produk\/(\d+)$/);
  return m ? Number(m[1]) : null;
});
const isPromo = computed(() => hash.value === "promo");
const category = computed(() => categories.value.find((c) => c.slug === hash.value) ?? null);
const heading = computed(() =>
  q.value ? `Hasil untuk “${q.value}”` : isPromo.value ? "Promo" : (category.value?.name ?? "Katalog Produk"),
);
const filterKey = computed(() => [q.value, sort.value, category.value?.slug ?? "", isPromo.value].join("|"));
const hasMore = computed(() => products.value.length < total.value);

function readHash() {
  try {
    hash.value = decodeURIComponent(window.location.hash.slice(1));
  } catch {
    hash.value = "";
  }
}

// Header mengirim event ini saat pencarian disubmit
function onSearch(e) {
  if (detailId.value) {
    history.pushState(null, "", window.location.pathname + window.location.search);
    hash.value = "";
  }
  q.value = e.detail?.query ?? "";
}

async function load(more = false) {
  ctrl?.abort();
  const mine = (ctrl = new AbortController());
  const next = more ? page.value + 1 : 1;
  loading.value = true;
  error.value = "";
  try {
    const qs = new URLSearchParams({ sort: sort.value, page: String(next), limit: String(LIMIT) });
    if (q.value) qs.set("q", q.value);
    if (category.value) qs.set("category", category.value.slug);
    if (isPromo.value) qs.set("promo", "1");
    const data = await getJson(`/api/products?${qs}`, mine.signal);
    products.value = more ? [...products.value, ...data.items] : data.items;
    total.value = data.total;
    page.value = next;
    loadedOnce = true;
  } catch (e) {
    if (e.name !== "AbortError") error.value = e.message;
  } finally {
    if (mine === ctrl) loading.value = false;
  }
}

watch(filterKey, () => {
  if (!detailId.value) load();
});
watch(detailId, (id) => {
  window.scrollTo({ top: 0 });
  if (!id && !loadedOnce) load();
});

onMounted(async () => {
  readHash();
  window.addEventListener("hashchange", readHash);
  window.addEventListener("search:submit", onSearch);
  announceCart();
  try {
    categories.value = await getJson("/api/categories");
  } catch {
    // daftar kategori gagal dimuat: katalog tetap tampil tanpa filter
  }
  if (!detailId.value) load();
});
onBeforeUnmount(() => {
  ctrl?.abort();
  window.removeEventListener("hashchange", readHash);
  window.removeEventListener("search:submit", onSearch);
});
</script>

<template>
  <UApp>
    <div id="konten" class="tw:mx-auto tw:max-w-6xl tw:px-4 tw:py-6">
      <ProductDetail v-if="detailId" :id="detailId" />

      <section v-else>
        <div class="tw:mb-4 tw:flex tw:flex-wrap tw:items-end tw:justify-between tw:gap-3">
          <div>
            <h2 class="tw:text-xl tw:font-semibold">{{ heading }}</h2>
            <p v-if="!loading || products.length" class="tw:text-sm tw:text-slate-600">{{ total }} produk</p>
          </div>
          <USelect v-model="sort" :items="SORTS" aria-label="Urutkan produk" class="tw:w-48" />
        </div>

        <UAlert v-if="error" color="error" variant="subtle" title="Gagal memuat produk" :description="error" />

        <div v-else-if="loading && products.length === 0" class="tw:grid tw:grid-cols-2 tw:gap-3 tw:sm:grid-cols-3 tw:lg:grid-cols-4 tw:xl:grid-cols-5" aria-live="polite" aria-busy="true">
          <USkeleton v-for="n in 10" :key="n" class="tw:h-80 tw:rounded-xl" />
        </div>

        <div v-else-if="products.length === 0" class="tw:py-10 tw:text-center">
          <p>{{ q ? `Tidak ada produk untuk “${q}”.` : "Belum ada produk." }}</p>
          <UButton v-if="q" class="tw:mt-3" color="neutral" variant="outline" label="Hapus pencarian" @click="q = ''" />
        </div>

        <template v-else>
          <ul class="tw:grid tw:grid-cols-2 tw:gap-3 tw:sm:grid-cols-3 tw:lg:grid-cols-4 tw:xl:grid-cols-5 tw:transition-opacity" :class="loading && 'tw:opacity-60'">
            <li v-for="p in products" :key="p.id" class="tw:flex">
              <ProductCard :product="p" class="tw:w-full" />
            </li>
          </ul>
          <div v-if="hasMore" class="tw:mt-6 tw:text-center">
            <UButton :loading="loading" color="neutral" variant="outline" label="Muat lebih banyak" @click="load(true)" />
          </div>
        </template>
      </section>
    </div>
  </UApp>
</template>