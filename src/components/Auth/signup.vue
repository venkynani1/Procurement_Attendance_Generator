<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { signup as apiSignup, setToken, setUser } from '../../services/auth.js'

const name = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const router = useRouter()
const route = useRoute()

async function submit() {
  error.value = ''
  loading.value = true

  try {
    const res = await apiSignup({
      name: name.value,
      email: email.value,
      password: password.value,
    })

    setToken(res.token)
    if (res.user) setUser(res.user)

    const redirect =
      route.query.redirect &&
      String(route.query.redirect).startsWith('/')
        ? String(route.query.redirect)
        : '/trainings'

    router.replace(redirect)
  } catch (err) {
    error.value =
      err?.response?.data?.message ||
      err?.message ||
      'Signup failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page min-h-screen flex items-center justify-center p-4">
    <div class="login-card w-full max-w-md bg-white rounded-lg shadow-md overflow-hidden">
      <div class="p-6">
        <h1 class="text-2xl font-semibold text-gray-800 mb-2">Create account</h1>
        <p class="text-sm text-gray-500 mb-6">
          Fill in the details below to get started.
        </p>

        <form @submit.prevent="submit" novalidate>
          <label class="block mb-3">
            <span class="text-sm font-medium text-gray-700">Name</span>
            <input
              v-model="name"
              type="text"
              required
              class="mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Your name"
              autocomplete="name"
            />
          </label>

          <label class="block mb-3">
            <span class="text-sm font-medium text-gray-700">Email</span>
            <input
              v-model="email"
              type="email"
              required
              class="mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="you@example.com"
              autocomplete="email"
            />
          </label>

          <label class="block mb-4">
            <span class="text-sm font-medium text-gray-700">Password</span>
            <input
              v-model="password"
              type="password"
              required
              class="mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="••••••••"
              autocomplete="new-password"
            />
          </label>

          <div v-if="error" class="mb-3 text-sm text-red-600">
            {{ error }}
          </div>

          <button
            :disabled="loading"
            type="submit"
            class="w-full inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-60"
            :aria-busy="loading"
          >
            <template v-if="!loading">Sign up</template>

            <template v-else>
              <svg
                class="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              Creating account…
            </template>
          </button>
        </form>

        <p class="text-sm text-gray-600 mt-4 text-center">
          Already have an account?
          <RouterLink to="/login" class="text-indigo-600 font-medium">
            Sign in
          </RouterLink>
        </p>
      </div>

      <div class="px-6 py-4 bg-gray-50 text-xs text-gray-600">
        By signing up, you agree to your project's terms.
      </div>
    </div>
  </div>
</template>
