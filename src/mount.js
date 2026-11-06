import "./assets/main.css";
import { createApp } from "vue";
import { createRouter, createMemoryHistory } from "vue-router";
import ui from "@nuxt/ui/vue-plugin";
import ProductCatalog from "./ProductCatalogue.vue";

export function mount(el) {
  el.style.isolation = "isolate";

  const app = createApp(ProductCatalog);
  app.use(createRouter({ routes: [], history: createMemoryHistory() }));
  app.use(ui);
  app.mount(el);

  return () => app.unmount();
}
