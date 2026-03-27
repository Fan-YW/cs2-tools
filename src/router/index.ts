import { createRouter, createWebHistory } from "vue-router";
import HomeView from "@/views/HomeView.vue";
import MapRangeView from "@/views/MapRangeView.vue";
import WeaponRangeView from "@/views/WeaponRangeView.vue";

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", name: "home", component: HomeView },
    { path: "/map-range", name: "map-range", component: MapRangeView },
    { path: "/weapon-range", name: "weapon-range", component: WeaponRangeView },
  ],
});
