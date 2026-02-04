<template>
  <div class="p-6 max-w-7xl mx-auto">
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-gray-800">My Training Effectiveness</h1>
        <p class="text-sm text-gray-500 mt-1">Search, filter, sort and export your trainings u{2014} client-side filtering for fast UX.</p>
      </div>

      <div class="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
        <div class="flex items-center gap-2 bg-white border rounded px-3 py-2 shadow-sm">
          <svg class="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 21l-4.35-4.35" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
            <circle cx="11" cy="11" r="6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></circle>
          </svg>

          <input
            v-model="trainingCodeInput"
            @keyup.enter="applyFilters"
            type="search"
            placeholder="Training code (press Enter or click Apply)"
            class="w-56 focus:outline-none text-sm"
            aria-label="Search training code"
            title="Type code and press Enter to apply search"
          />
        </div>

        <!-- <div class="bg-white border rounded px-2 py-1 shadow-sm flex items-center gap-2">
          <select v-model.number="monthInput" class="text-sm" aria-label="Filter by month">
            <option :value="0">All months</option>
            <option v-for="(m, idx) in months" :key="idx" :value="idx+1">{{ m }}</option>
          </select>

          <select v-model.number="yearInput" class="text-sm" aria-label="Filter by year">
            <option :value="0">All years</option>
            <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
          </select>
        </div> -->

        <div class="flex items-center gap-2 ml-auto sm:ml-0">
          <button
            v-if="hasPendingFilters"
            @click="applyFilters"
            class="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm shadow"
            aria-label="Apply filters"
          >
            Apply
          </button>

          <button
            v-else
            @click="resetFilters"
            class="px-3 py-2 border rounded bg-white hover:bg-gray-50 text-sm shadow"
            aria-label="Reset filters"
            title="Reset filters"
          >
            Reset
          </button>

          <div class="relative">
            <button @click="downloadReport" class="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm shadow">
              Export
            </button>
            <div class="absolute -right-2 -top-2 bg-indigo-600 text-white text-xs rounded-full px-2 py-0.5" v-if="Array.isArray(trainings)">
              {{ trainings.length }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="mb-4">
      <div v-if="loading" class="flex items-center gap-3 text-gray-600">
        <svg class="animate-spin h-5 w-5 text-gray-500" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-linecap="round" fill="none"></circle>
        </svg>
        Loading trainings...
      </div>

      <div v-else-if="error" class="text-sm text-red-600">{{ error }}</div>

      <div v-else-if="!loading && hasPendingFilters" class="text-sm text-yellow-700">
        Filters changed u{2014} press Enter or click Apply to run the search
      </div>
    </div>

    <div class="bg-white rounded shadow overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left">
                <button class="flex items-center gap-2" @click="toggleSort('trainingCode')">
                  Training Code
                  <SortIcon :col="'trainingCode'" :sortBy="sortBy" :sortDir="sortDir" />
                </button>
              </th>

              <th class="px-4 py-3 text-right">
                <button class="flex items-center gap-2 ml-auto" @click="toggleSort('trainingEffectivenessPercent')">
                  Effectiveness
                  <SortIcon :col="'trainingEffectivenessPercent'" :sortBy="sortBy" :sortDir="sortDir" />
                </button>
              </th>

              <th class="px-4 py-3 text-left hidden sm:table-cell">
                <button class="flex items-center gap-2" @click="toggleSort('createdAt')">
                  Created At
                  <SortIcon :col="'createdAt'" :sortBy="sortBy" :sortDir="sortDir" />
                </button>
              </th>

              <th class="px-4 py-3 text-left hidden md:table-cell">
                <button class="flex items-center gap-2" @click="toggleSort('updatedAt')">
                  Updated At
                  <SortIcon :col="'updatedAt'" :sortBy="sortBy" :sortDir="sortDir" />
                </button>
              </th>

              <th class="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="!loading && Array.isArray(trainings) && pagedItems.length === 0">
              <td colspan="5" class="px-6 py-10 text-center text-gray-500">
                <div class="mb-2">No trainings found for current filters.</div>
                <button @click="resetFilters" class="px-3 py-2 bg-indigo-50 text-indigo-700 border rounded">Clear filters</button>
              </td>
            </tr>

            <tr v-for="t in pagedItems" :key="t._id" class="border-t hover:bg-gray-50">
              <td class="px-4 py-3">
                <div class="font-mono text-sm text-gray-700 break-all">{{ t.trainingCode }}</div>
              </td>

              <td class="px-4 py-3 text-right">
                <span class="font-medium text-gray-800">{{ formatPercent(t.trainingEffectivenessPercent) }}</span>
              </td>

              <td class="px-4 py-3 hidden sm:table-cell">
                <div class="text-gray-600 text-sm">{{ formatDate(t.createdAt) }}</div>
              </td>

              <td class="px-4 py-3 hidden md:table-cell">
                <div class="text-gray-600 text-sm">{{ formatDate(t.updatedAt) }}</div>
              </td>

              <td class="px-4 py-3 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button @click="confirmDelete(t)" class="px-2 py-1 text-xs border rounded text-red-600 hover:bg-red-50">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex flex-col md:flex-row items-center justify-between gap-3 px-4 py-3 border-t bg-gray-50">
        <div class="text-xs text-gray-600">
          Showing <strong>{{ fromItem }}</strong> - <strong>{{ toItem }}</strong> of <strong>{{ filtered.length }}</strong> trainings
        </div>

        <div class="flex items-center gap-2">
          <label class="text-xs text-gray-600">Page size</label>
          <select v-model.number="pageSize" @change="onPageSizeChange" class="text-sm border rounded px-2 py-1">
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>

          <div class="flex items-center gap-2">
            <button @click="goToFirst" :disabled="currentPage === 1" class="px-2 py-1 border rounded disabled:opacity-50">«</button>
            <button @click="prevPage" :disabled="currentPage === 1" class="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
            <div class="px-3 py-1 border rounded text-sm bg-white">{{ currentPage }} / {{ totalPages }}</div>
            <button @click="nextPage" :disabled="currentPage === totalPages || totalPages === 0" class="px-3 py-1 border rounded disabled:opacity-50">Next</button>
            <button @click="goToLast" :disabled="currentPage === totalPages || totalPages === 0" class="px-2 py-1 border rounded disabled:opacity-50">»</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete confirmation -->
    <div v-if="deleteTarget" class="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
        <h4 class="text-lg font-semibold mb-3">Confirm Delete</h4>
        <p class="mb-4">Delete training <strong>{{ deleteTarget.trainingCode }}</strong>? This cannot be undone.</p>
        <div class="flex justify-end gap-2">
          <button @click="deleteTarget = null" class="px-3 py-1 border rounded">Cancel</button>
          <button @click="deleteTraining" :disabled="deleting" class="px-3 py-1 bg-red-600 text-white rounded">
            {{ deleting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute, onBeforeRouteUpdate } from 'vue-router'
import api from '../../services/axios'

const router = useRouter()
const route = useRoute()

// mark "not yet loaded" with null instead of empty array
const trainings = ref(null)
const loading = ref(true)
const error = ref('')

// client-side filter inputs
const trainingCodeInput = ref('')
const monthInput = ref(0)
const yearInput = ref(0)

// applied (for "Apply"/"Reset" UX)
const applied = ref({ trainingCode: '', month: 0, year: 0 })

const deleteTarget = ref(null)
const deleting = ref(false)

// paging + sorting (client-side)
const currentPage = ref(1)
const pageSize = ref(20)

const sortBy = ref('updatedAt')
const sortDir = ref('desc') // 'asc' | 'desc' | null

// month/year lists
const months = [
  'January','February','March','April','May','June','July','August','September','October','November','December'
]
const years = (() => {
  const y = new Date().getFullYear()
  const arr = []
  for (let i = 0; i <= 6; i++) arr.push(y - i)
  return arr
})()

const hasPendingFilters = computed(() => {
  return (String(trainingCodeInput.value || '').trim() !== String(applied.value.trainingCode || '').trim())
    || Number(monthInput.value || 0) !== Number(applied.value.month || 0)
    || Number(yearInput.value || 0) !== Number(applied.value.year || 0)
})

// fetch user's trainings (no server changes)
async function fetchTrainings() {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get(`${import.meta.env.VITE_API_URL}/api/trainings/mine`)
    trainings.value = Array.isArray(res.data) ? res.data : (res.data?.trainings || [])
  } catch (err) {
    console.error(err)
    if (err.response && err.response.status === 401) {
      router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } })
      return
    }
    error.value = 'Failed to load trainings'
    trainings.value = [] // mark loaded but empty to avoid indefinite null while still showing error UI
  } finally {
    loading.value = false
  }
}

// client-side filtered array (computed)
// if trainings not yet loaded, return empty array so downstream computed values remain safe
const filtered = computed(() => {
  if (!Array.isArray(trainings.value)) return []

  const code = (applied.value.trainingCode || '').trim().toLowerCase()
  const month = Number(applied.value.month || 0)
  const year = Number(applied.value.year || 0)
  return trainings.value.filter(t => {
    // trainingCode filter
    if (code) {
      if (!t.trainingCode || String(t.trainingCode).toLowerCase().indexOf(code) === -1) return false
    }
    // month/year filter on createdAt (or updatedAt if you prefer)
    if (year > 0) {
      const dt = t.createdAt ? new Date(t.createdAt) : null
      if (!dt) return false
      if (month > 0) {
        if (dt.getFullYear() !== year || (dt.getMonth() + 1) !== month) return false
      } else {
        if (dt.getFullYear() !== year) return false
      }
    } else if (month > 0) {
      // month with no year -> use current year
      const dt = t.createdAt ? new Date(t.createdAt) : null
      const nowYear = new Date().getFullYear()
      if (!dt) return false
      if (dt.getFullYear() !== nowYear || (dt.getMonth() + 1) !== month) return false
    }
    return true
  })
})

// client-side sorting applied to filtered list
const sorted = computed(() => {
  const arr = filtered.value.slice()
  if (!sortBy.value) return arr
  const dir = sortDir.value === 'asc' ? 1 : -1
  arr.sort((a, b) => {
    const va = a[sortBy.value]
    const vb = b[sortBy.value]
    // handle dates
    if (sortBy.value === 'createdAt' || sortBy.value === 'updatedAt') {
      const da = va ? new Date(va).getTime() : 0
      const db = vb ? new Date(vb).getTime() : 0
      return (da - db) * dir
    }
    // numbers
    if (typeof va === 'number' || typeof vb === 'number') {
      return ((va || 0) - (vb || 0)) * dir
    }
    // strings
    return String(va || '').localeCompare(String(vb || '')) * dir
  })
  return arr
})

// pagination derived
const totalPages = computed(() => Math.max(1, Math.ceil(sorted.value.length / pageSize.value)))
const fromItem = computed(() => sorted.value.length === 0 ? 0 : (currentPage.value - 1) * pageSize.value + 1)
const toItem = computed(() => Math.min(sorted.value.length, currentPage.value * pageSize.value))
const pagedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return sorted.value.slice(start, start + pageSize.value)
})

// actions
function applyFilters() {
  applied.value.trainingCode = (trainingCodeInput.value || '').trim()
  applied.value.month = Number(monthInput.value || 0)
  applied.value.year = Number(yearInput.value || 0)
  currentPage.value = 1
}

function resetFilters() {
  trainingCodeInput.value = ''
  monthInput.value = 0
  yearInput.value = 0
  applied.value = { trainingCode: '', month: 0, year: 0 }
  sortBy.value = 'updatedAt'
  sortDir.value = 'desc'
  currentPage.value = 1
}

let ownerApplyTimer = null
function onOwnerSelect() {
  // not applicable for user dashboard u{2014} kept to avoid accidental references
  clearTimeout(ownerApplyTimer)
}

// sorting toggle: cycles asc -> desc -> none
function toggleSort(col) {
  if (sortBy.value !== col) {
    sortBy.value = col
    sortDir.value = 'asc'
  } else {
    if (sortDir.value === 'asc') sortDir.value = 'desc'
    else if (sortDir.value === 'desc') {
      sortBy.value = null
      sortDir.value = null
    } else {
      sortDir.value = 'asc'
    }
  }
  currentPage.value = 1
}

// pagination controls
function prevPage() {
  if (currentPage.value > 1) currentPage.value--
}
function nextPage() {
  if (currentPage.value < totalPages.value) currentPage.value++
}
function goToFirst() {
  currentPage.value = 1
}
function goToLast() {
  currentPage.value = totalPages.value
}
function onPageSizeChange() {
  currentPage.value = 1
}

// delete
function confirmDelete(t) {
  deleteTarget.value = t
}

async function deleteTraining() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await api.delete(`${import.meta.env.VITE_API_URL}/api/trainings/${deleteTarget.value._id}`)
    trainings.value = Array.isArray(trainings.value) ? trainings.value.filter(x => x._id !== deleteTarget.value._id) : []
    deleteTarget.value = null
  } catch (err) {
    console.error(err)
    alert('Delete failed')
  } finally {
    deleting.value = false
  }
}

// export uses existing endpoint (server-side export for the user)
async function downloadReport() {
  const url = `${import.meta.env.VITE_API_URL}/api/report-excel/mine`
  if (window.confirm('Download full report as XLSX?')) {
    const token = localStorage.getItem('auth_token')
    if (token) {
      try {
        const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
        if (!resp.ok) throw new Error('Download failed')
        const blob = await resp.blob()
        const blobUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = blobUrl
        a.download = `training-report-mine-${Date.now()}.xlsx`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(blobUrl)
      } catch (e) {
        alert(e.message || 'Export failed')
      }
    } else {
      window.location.href = url
    }
  }
}

// helpers
function formatPercent(v) {
  return v == null ? '-' : Number(v).toFixed(2) + '%'
}
function formatDate(d) {
  if (!d) return '-'
  try { return new Date(d).toLocaleString() } catch { return d }
}

// initialize
onMounted(() => {
  fetchTrainings()
})

// reset and refetch when route changes so UI shows loading state
onBeforeRouteUpdate((to, from, next) => {
  // show loading while we refetch
  trainings.value = null
  loading.value = true
  fetchTrainings().finally(() => next())
})

// keep filter inputs in sync: if user edits inputs, UI shows Apply state
watch([trainingCodeInput, monthInput, yearInput], () => {
  // no-op; hasPendingFilters computed handles UI hint
})

/* SortIcon component */
import { defineComponent, h } from 'vue'
const SortIcon = defineComponent({
  name: 'SortIcon',
  props: { col: String, sortBy: [String, null], sortDir: [String, null] },
  setup(props) {
    return () => {
      if (props.sortBy !== props.col) {
        return h('svg', { class: 'w-3 h-3 text-gray-300', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor' }, [
          h('path', { d: 'M6 9l6-6 6 6', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })
        ])
      }
      if (props.sortDir === 'asc') {
        return h('svg', { class: 'w-3 h-3 text-indigo-600', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor' }, [
          h('path', { d: 'M6 15l6-6 6 6', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })
        ])
      }
      if (props.sortDir === 'desc') {
        return h('svg', { class: 'w-3 h-3 text-indigo-600', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor' }, [
          h('path', { d: 'M6 9l6 6 6-6', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })
        ])
      }
      return h('svg', { class: 'w-3 h-3 text-gray-300', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor' }, [
        h('path', { d: 'M6 9l6-6 6 6', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })
      ])
    }
  }
})
</script>

<style scoped>
table th, table td { padding: 0.75rem 1rem; vertical-align: middle; }
table th { font-weight: 600; color: #374151; }
.font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Helvetica Neue", monospace; }
</style>
