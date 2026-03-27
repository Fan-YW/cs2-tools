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

// Handle hash paths from 404 redirect
router.beforeEach((to, from, next) => {
  if (to.path === "/" && window.location.hash) {
    const hashPath = window.location.hash.substring(1);
    if (hashPath) {
      next(hashPath);
      return;
    }
  }
  next();
});
