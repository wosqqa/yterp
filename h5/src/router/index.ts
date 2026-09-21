import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../pages/HomePage.vue'
import CampaignPage from '../pages/CampaignPage.vue'
import SorPage from '../pages/SorPage.vue'
import NotFoundPage from '../pages/NotFoundPage.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomePage,
  },
  {
    path: '/campaign/:slug',
    name: 'campaign',
    component: CampaignPage,
  },
  {
    path: '/sor/:id',
    name: 'sor',
    component: SorPage,
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundPage,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
