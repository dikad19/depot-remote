<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { addToCart, bestVoucher, getJson, rupiah, short } from "../lib/shop";
import ProductGallery from "./ProductGallery.vue";
import ReviewSection from "./ReviewSection.vue";
import StarRating from "./StarRating.vue";

const props = defineProps({ id: { type: Number, required: true } });
const VARIANT_LABEL = { SHOE: "Nomor sepatu", CLOTHING: "Ukuran", NONE: "Pilihan" };

const data = ref(null);
const loading = ref(true);
const error = ref("");
const variantId = ref(null);
const qty = ref(1);
const warn = ref(false);
const added = ref(false);
let timer;

async function load() {
  loading.value = true;
  error.value = "";
  data.value = null;
  variantId.value = null;
  qty.value = 1;
  try {
    data.value = await getJson(`/api/products/${props.id}`);
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}
watch(() => props.id, load, { immediate: true });
onBeforeUnmount(() => clearTimeout(timer));

const p = computed(() => data.value?.product);
const variants = computed(() => p.value?.variants ?? []);
const variant = computed(() => variants.value.find((v) => v.id === variantId.value));
const unit = computed(() => variant.value?.price ?? p.value.price);
const stock = computed(() =>
  variant.value
    ? variant.value.stock
    : variants.value.length
      ? variants.value.reduce((s, v) => s + v.stock, 0)
      : p.value.stock,
);
const voucher = computed(() => bestVoucher(unit.value, p.value.vouchers));
const percentOff = computed(() =>
  p.value.originalPrice > unit.value
    ? Math.round((1 - unit.value / p.value.originalPrice) * 100)
    : 0,
);
const eta = computed(() =>
  p.value.etaMinDays === p.value.etaMaxDays
    ? `${p.value.etaMinDays} hari`
    : `${p.value.etaMinDays}–${p.value.etaMaxDays} hari`,
);
const label = computed(() => VARIANT_LABEL[p.value.sizeType]);
const storeBadge = computed(
  () =>
    ({
      OFFICIAL: { text: "Toko resmi", icon: "i-lucide-shield-check" },
      ORIGINAL: { text: "Penjual ori", icon: "i-lucide-badge-check" },
    })[p.value.seller?.type],
);

function pick(v) {
  variantId.value = v.id;
  qty.value = 1;
  warn.value = false;
}
function submit(buyNow) {
  if (variants.value.length && !variant.value) {
    warn.value = true;
    return;
  }
  addToCart({
    productId: p.value.id,
    variantId: variantId.value,
    variantLabel: variant.value?.label ?? null,
    qty: qty.value,
    name: p.value.name,
    price: unit.value,
  });
  if (buyNow) {
    window.dispatchEvent(new CustomEvent("cart:open"));
    return;
  }
  added.value = true;
  clearTimeout(timer);
  timer = setTimeout(() => (added.value = false), 2500);
}
</script>

<template>
  <div>
    <a href="#konten" class="tw:mb-4 tw:inline-flex tw:items-center tw:gap-1 tw:rounded tw:text-sm tw:text-slate-600 tw:hover:text-slate-900 tw:hover:underline">
      <UIcon name="i-lucide-chevron-left" class="tw:size-4" />Kembali ke katalog
    </a>

    <p v-if="loading" aria-live="polite">Memuat produk...</p>
    <UAlert v-else-if="error" color="error" variant="subtle" title="Gagal memuat produk" :description="error" />

    <template v-else-if="p">
      <div class="tw:grid tw:gap-8 tw:lg:grid-cols-[minmax(0,30rem)_1fr]">
        <ProductGallery :images="p.images" :name="p.name" />

        <div>
          <p v-if="p.category" class="tw:text-sm tw:text-slate-500">{{ p.category.name }}</p>
          <h1 class="tw:mt-1 tw:text-2xl tw:font-bold tw:leading-tight">{{ p.name }}</h1>

          <p class="tw:mt-2 tw:flex tw:flex-wrap tw:items-center tw:gap-x-3 tw:gap-y-1 tw:text-sm tw:text-slate-600">
            <a v-if="p.ratingCount > 0" href="#ulasan" class="tw:inline-flex tw:items-center tw:gap-1.5 tw:rounded">
              <StarRating :value="p.rating" />
              <span class="tw:font-medium tw:text-slate-900">{{ p.rating.toFixed(1).replace(".", ",") }}</span>
              <span>({{ short(p.ratingCount) }} ulasan)</span>
            </a>
            <span v-else>Belum ada ulasan</span>
            <span v-if="p.soldCount > 0">Terjual {{ short(p.soldCount) }}{{ p.soldCount >= 1000 ? "+" : "" }}</span>
          </p>

          <div class="tw:mt-4 tw:rounded-xl tw:bg-slate-50 tw:p-4">
            <p class="tw:flex tw:flex-wrap tw:items-baseline tw:gap-x-3">
              <span class="tw:text-3xl tw:font-bold tw:text-orange-700">{{ rupiah(unit) }}</span>
              <template v-if="percentOff">
                <s class="tw:text-sm tw:text-slate-500">{{ rupiah(p.originalPrice) }}</s>
                <span class="tw:rounded tw:bg-orange-700 tw:px-1.5 tw:py-0.5 tw:text-xs tw:font-bold tw:text-white">−{{ percentOff }}%</span>
              </template>
            </p>
            <p v-if="voucher" class="tw:mt-2 tw:flex tw:flex-wrap tw:items-center tw:gap-x-2 tw:gap-y-1 tw:text-sm">
              <span class="tw:rounded tw:border tw:border-dashed tw:border-orange-600 tw:bg-orange-50 tw:px-1.5 tw:py-0.5 tw:text-xs tw:font-semibold tw:text-orange-700">
                {{ voucher.code }}: −Rp {{ short(voucher.discount) }}
              </span>
              <span class="tw:text-slate-600">
                jadi <b class="tw:text-slate-900">{{ rupiah(unit - voucher.discount) }}</b><template v-if="voucher.minSpend > 0">, min. belanja {{ rupiah(voucher.minSpend) }}</template>
              </span>
            </p>
          </div>

          <fieldset v-if="variants.length" class="tw:mt-5">
            <div class="tw:flex tw:items-center tw:justify-between">
              <legend class="tw:text-sm tw:font-semibold">
                {{ label }}<span v-if="variant" class="tw:ml-2 tw:font-normal tw:text-slate-600">{{ variant.label }}</span>
              </legend>

              <USlideover v-if="p.sizeGuide" side="bottom" :title="p.sizeGuide.title" :description="p.sizeGuide.note ?? undefined">
                <UButton variant="link" color="primary" size="sm" icon="i-lucide-ruler" label="Panduan ukuran" />
                <template #body>
                  <div class="tw:overflow-x-auto">
                    <table class="tw:w-full tw:min-w-max tw:text-sm">
                      <thead>
                        <tr class="tw:border-b tw:border-slate-200 tw:text-left tw:text-slate-600">
                          <th scope="col" class="tw:py-2 tw:pr-6 tw:font-semibold">Ukuran</th>
                          <th v-for="c in p.sizeGuide.columns" :key="c" scope="col" class="tw:py-2 tw:pr-6 tw:font-semibold">{{ c }}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="r in p.sizeGuide.rows" :key="r.size" class="tw:border-b tw:border-slate-100">
                          <th scope="row" class="tw:py-2 tw:pr-6 tw:text-left tw:font-semibold">{{ r.size }}</th>
                          <td v-for="(val, n) in r.values" :key="n" class="tw:py-2 tw:pr-6 tw:tabular-nums">{{ val }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </template>
              </USlideover>
            </div>

            <div class="tw:mt-2 tw:flex tw:flex-wrap tw:gap-2">
              <label v-for="v in variants" :key="v.id">
                <input type="radio" name="variant" :value="v.id" :checked="variantId === v.id" :disabled="v.stock <= 0" class="tw:peer tw:sr-only" @change="pick(v)" />
                <span class="tw:grid tw:min-w-12 tw:cursor-pointer tw:place-items-center tw:rounded-lg tw:border tw:border-slate-300 tw:px-3 tw:py-2 tw:text-sm tw:font-medium tw:peer-checked:border-slate-900 tw:peer-checked:bg-slate-900 tw:peer-checked:text-white tw:peer-focus-visible:ring-2 tw:peer-focus-visible:ring-orange-600 tw:peer-focus-visible:ring-offset-2 tw:peer-disabled:cursor-not-allowed tw:peer-disabled:bg-slate-50 tw:peer-disabled:text-slate-400 tw:peer-disabled:line-through">{{ v.label }}</span>
              </label>
            </div>
            <p class="tw:mt-2 tw:min-h-5 tw:text-sm tw:text-red-700" role="alert">
              {{ warn && !variant ? `Pilih ${label.toLowerCase()} dulu.` : "" }}
            </p>
          </fieldset>

          <div class="tw:mt-3 tw:flex tw:items-center tw:gap-4">
            <div class="tw:flex tw:items-center tw:rounded-lg tw:border tw:border-slate-300">
              <UButton icon="i-lucide-minus" color="neutral" variant="ghost" aria-label="Kurangi jumlah" :disabled="qty <= 1" @click="qty--" />
              <span class="tw:w-10 tw:text-center tw:text-sm tw:font-medium tw:tabular-nums" aria-live="polite">{{ qty }}</span>
              <UButton icon="i-lucide-plus" color="neutral" variant="ghost" aria-label="Tambah jumlah" :disabled="qty >= stock" @click="qty++" />
            </div>
            <p class="tw:text-sm" :class="stock > 0 && stock <= 5 ? 'tw:font-medium tw:text-red-700' : 'tw:text-slate-600'">
              {{ stock > 0 ? `Stok ${stock}` : "Stok habis" }}
            </p>
          </div>

          <div class="tw:sticky tw:bottom-0 tw:z-10 tw:-mx-4 tw:mt-5 tw:flex tw:gap-3 tw:border-t tw:border-slate-200 tw:bg-white tw:p-3 tw:md:static tw:md:mx-0 tw:md:border-0 tw:md:p-0">
            <UButton color="primary" variant="outline" size="lg" block :disabled="stock <= 0" label="Tambah ke keranjang" @click="submit(false)" />
            <UButton color="primary" size="lg" block :disabled="stock <= 0" label="Beli sekarang" @click="submit(true)" />
          </div>
          <p class="tw:mt-2 tw:min-h-5 tw:text-sm tw:text-emerald-700" role="status">{{ added ? "Ditambahkan ke keranjang." : "" }}</p>

          <ul class="tw:mt-4 tw:space-y-3 tw:border-t tw:border-slate-200 tw:pt-5 tw:text-sm">
            <li class="tw:flex tw:items-start tw:gap-3">
              <UIcon :name="p.instant ? 'i-lucide-zap' : 'i-lucide-truck'" class="tw:mt-0.5 tw:size-4" :class="p.instant ? 'tw:text-emerald-700' : 'tw:text-slate-600'" />
              <span>
                <b>{{ p.instant ? "Pengiriman instan, tiba hari ini" : `Tiba dalam ${eta}` }}</b>
                <span v-if="p.freeShipping" class="tw:ml-2 tw:font-medium tw:text-teal-700">Gratis ongkir</span>
              </span>
            </li>
            <li v-if="p.seller" class="tw:flex tw:items-start tw:gap-3">
              <UIcon name="i-lucide-map-pin" class="tw:mt-0.5 tw:size-4 tw:text-slate-600" />
              <span>
                Dikirim dari <b>{{ p.seller.city }}</b> oleh {{ p.seller.name }}
                <span v-if="storeBadge" class="tw:ml-2 tw:inline-flex tw:items-center tw:gap-1 tw:font-medium tw:text-teal-700">
                  <UIcon :name="storeBadge.icon" class="tw:size-3.5" />{{ storeBadge.text }}
                </span>
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div class="tw:mt-10 tw:grid tw:gap-10 tw:border-t tw:border-slate-200 tw:pt-8">
        <section v-if="p.description" aria-labelledby="h-deskripsi">
          <h2 id="h-deskripsi" class="tw:text-lg tw:font-bold">Deskripsi produk</h2>
          <p class="tw:mt-3 tw:max-w-prose tw:whitespace-pre-line tw:text-sm tw:leading-6 tw:text-slate-700">{{ p.description }}</p>
        </section>

        <section v-if="p.specs.length" aria-labelledby="h-spek">
          <h2 id="h-spek" class="tw:text-lg tw:font-bold">Spesifikasi</h2>
          <dl class="tw:mt-3 tw:max-w-xl tw:divide-y tw:divide-slate-200 tw:text-sm">
            <div v-for="s in p.specs" :key="s.id" class="tw:grid tw:grid-cols-[9rem_1fr] tw:gap-4 tw:py-2">
              <dt class="tw:text-slate-500">{{ s.label }}</dt>
              <dd>{{ s.value }}</dd>
            </div>
          </dl>
        </section>

        <ReviewSection
          :key="p.id"
          :product-id="p.id"
          :rating="p.rating"
          :rating-count="p.ratingCount"
          :breakdown="data.ratingBreakdown"
          :initial="data.reviews"
        />
      </div>
    </template>
  </div>
</template>