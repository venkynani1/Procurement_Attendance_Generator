import { createRouter, createWebHashHistory } from 'vue-router'
import { isAuthenticated } from './services/auth'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () =>
      import('./components/Attendance Report/teams-attendance-extract.vue')
  },

  {
    path: '/prepost',
    name: 'prepost',
    component: () =>
      import('./components/Attendance Report/teams-with-pre-post.vue'),
    meta: { requiresAuth: true }
  },

  {
    path: '/login',
    name: 'login',
    component: () => import('./components/Auth/Login.vue')
  },

  {
    path: '/signup',
    name: 'signup',
    component: () => import('./components/Auth/signup.vue')
  },

  {
    path: '/trainings',
    name: 'trainings',
    component: () => import('./components/Training/TrainingHome.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  if (to.meta?.requiresAuth && !isAuthenticated()) {
    if (to.name === 'login' || to.name === 'signup') {
      return next()
    }

    return next({
      name: 'login',
      query: { redirect: to.fullPath }
    })
  }

  next()
})

export default router
