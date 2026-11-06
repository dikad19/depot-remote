export const API = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export async function getJson(path, signal) {
  const res = await fetch(API + path, { signal });
  if (!res.ok) throw new Error("server menjawab " + res.status);
  return res.json();
}

export const rupiah = (n) => "Rp " + Number(n).toLocaleString("id-ID");

export function short(n) {
  const fmt = (v, s) =>
    v
      .toFixed(v >= 10 ? 0 : 1)
      .replace(/\.0$/, "")
      .replace(".", ",") + s;
  if (n >= 1e6) return fmt(n / 1e6, "jt");
  if (n >= 1e3) return fmt(n / 1e3, "rb");
  return String(n);
}

export const dateId = (d) =>
  new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(d));

function discountOf(price, v) {
  if (price < v.minSpend) return 0;
  const d =
    v.type === "PERCENT" ? Math.floor((price * v.value) / 100) : v.value;
  return Math.min(v.maxDiscount ?? d, d, price);
}

export function bestVoucher(price, vouchers = []) {
  const now = Date.now();
  let best = null;
  for (const v of vouchers) {
    if (now < new Date(v.startsAt) || now > new Date(v.endsAt)) continue;
    const discount = discountOf(price, v);
    if (discount > 0 && (!best || discount > best.discount))
      best = { ...v, discount };
  }
  return best;
}

const KEY = "toko:cart";
function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? [];
  } catch {
    return [];
  }
}
export function announceCart() {
  const count = read().reduce((s, i) => s + i.qty, 0);
  window.dispatchEvent(new CustomEvent("cart:updated", { detail: { count } }));
}
export function addToCart(item) {
  const items = read();
  const found = items.find(
    (i) => i.productId === item.productId && i.variantId === item.variantId,
  );
  if (found) found.qty += item.qty;
  else items.push(item);
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {}
  announceCart();
}
