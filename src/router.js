// javascript
import { createRouter, createWebHashHistory } from 'vue-router'
import { getUser, isAuthenticated } from './services/auth' // adjust path as needed

const routes = [
  { path: '/', name: 'home', component: () => import('./components/Attendance Report/teams-attendance-extract.vue') },
  
  // { path: '/lmsform', name: 'lmsform', component: () => import('./components/LMS Form/lms-form.vue') },
  
  { path: '/prepost', name: 'prepost', component: () => import('./components/Attendance Report/teams-with-pre-post.vue'),
    meta: { requiresAuth: true }
   },
  { path: '/login', name: 'login', component: () => import('./components/Auth/Login.vue') },

  // Trainings route: wrapper chooses admin or user dashboard
  { 
    path: '/trainings', 
    name: 'trainings', 
    component: () => import('./components/Training/TrainingHome.vue'),
    meta: { requiresAuth: true }
  },

  // Admin-only edit route (optional)
  // {
  //   path: '/trainings/admin-edit/:id',
  //   name: 'admin-training-edit',
  //   component: () => import('@/components/Trainings/AdminEdit.vue'),
  //   meta: { requiresAuth: true, adminOnly: true },
  //   props: true
  // },

  // fallback (optional)
  // { path: '/:catchAll(.*)', name: 'not-found', component: () => import('@/components/ErrorBoundary/ErrorBoundary.vue') }

]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})


router.beforeEach((to, from, next) => {
  const requiresAuth = to.meta?.requiresAuth
  if (requiresAuth && !isAuthenticated()) {
    // if the target is already the login page, just allow it (no extra redirect param)
    if (to.name === 'login') {
      return next()
    }

    // otherwise send to login and preserve the original target
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }

  next()
})


export default router
