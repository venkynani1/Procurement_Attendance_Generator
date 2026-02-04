<template>
  <div class="trainings-home">
    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="spinner" aria-hidden="true"></div>
      <span class="ml-3 text-gray-600">Loading dashboard...</span>
    </div>

    <div v-else-if="error" class="p-6 text-center text-red-600">
      <p>{{ error }}</p>
      <button @click="reload" class="mt-4 px-3 py-2 bg-indigo-600 text-white rounded">Retry</button>
    </div>

    <component :is="dashboardComponent" v-else />
  </div>
</template>

<script setup>
import { ref, computed, defineAsyncComponent, onMounted } from 'vue'
import { getUser, isAuthenticated } from '../../services/auth' // adjust path if needed
import api from '../../services/axios' // axios instance that attaches Authorization header
import { useRouter } from 'vue-router'

// lazy-load dashboards
const AdminDashboard = defineAsyncComponent(() => import('./AdminDashboard.vue'))
const UserDashboard = defineAsyncComponent(() => import('./UserDashboard.vue'))

const loading = ref(true)
const error = ref('')
const user = ref(null)

const router = useRouter()

const dashboardComponent = computed(() => {
  if (!user.value) return UserDashboard // fallback (shouldn't happen)
  return user.value.role === 'admin' ? AdminDashboard : UserDashboard
})

async function fetchUser() {
  loading.value = true
  error.value = ''

  try {
    // Fast client-side token decode only (no /api/auth/me call)
    const tokenUser = getUser()

    // If no valid token payload or not authenticated, redirect to login
    if (!isAuthenticated() || !tokenUser) {
      router.replace({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } })
      return
    }

    // Use token payload for role-based UI
    user.value = tokenUser
  } catch (err) {
    console.error('TrainingsHome fetchUser error:', err)
    error.value = 'Failed to determine user role. Please login again.'
    // safe redirect to login after brief pause so user sees message
    setTimeout(() => {
      router.replace({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } })
    }, 800)
  } finally {
    loading.value = false
  }
}
function reload() {
  fetchUser()
}

onMounted(() => {
  fetchUser()
})
</script>

<style scoped>
.trainings-home .spinner {
  width: 28px;
  height: 28px;
  border-radius: 9999px;
  border: 3px solid rgba(0,0,0,0.08);
  border-top-color: rgba(59,130,246,0.9);
  animation: spin 0.9s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
