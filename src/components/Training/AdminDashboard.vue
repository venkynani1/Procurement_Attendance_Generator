<template>
  <div class="p-6 max-w-7xl mx-auto">
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-gray-800">All Trainings Effectiveness</h1>
        <p class="text-sm text-gray-500 mt-1"></p>
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

        <div class="bg-white border rounded px-2 py-1 shadow-sm">
          <select
            v-model="ownerIdInput"
            class="text-sm"
            @change="onOwnerSelect"
            aria-label="Filter by owner"
          >
            <option value="">All owners</option>
            <option v-for="o in owners" :key="o.id" :value="o.id">
              {{ o.name }}<span v-if="o.count"> ({{ o.count }})</span>
            </option>
          </select>
        </div>

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
            <button @click="downloadReportCurrent" class="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm shadow">
              Export
            </button>
            <div class="absolute -right-2 -top-2 bg-indigo-600 text-white text-xs rounded-full px-2 py-0.5" v-if="totalCount !== null">
              {{ totalCount }}
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
        Loading...
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
                <button class="flex items-center gap-2" @click="toggleSort('ownerName')">
                  Owner
                  <SortIcon :col="'ownerName'" :sortBy="sortBy" :sortDir="sortDir" />
                </button>
              </th>

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
            <tr v-if="!loading && Array.isArray(trainings) && trainings.length === 0">
              <td colspan="6" class="px-6 py-10 text-center text-gray-500">
                <div class="mb-2">No trainings found for current filters.</div>
                <button @click="resetFilters" class="px-3 py-2 bg-indigo-50 text-indigo-700 border rounded">Clear filters</button>
              </td>
            </tr>

            <tr v-for="t in trainings || []" :key="t._id" class="border-t hover:bg-gray-50">
              <td class="px-4 py-3">
                <div class="font-medium text-gray-800">{{ t.ownerName || '-' }}</div>
                <div class="text-xs text-gray-500">{{ t.owner || '' }}</div>
              </td>

              <td class="px-4 py-3">
                <div class="font-mono text-sm text-gray-700 break-all">{{ t.trainingCode }}</div>
              </td>

              <td class="px-4 py-3 text-right">
                <div class="text-right">
                  <span class="font-medium text-gray-800">{{ formatPercent(t.trainingEffectivenessPercent) }}</span>
                </div>
              </td>

              <td class="px-4 py-3 hidden sm:table-cell">
                <div class="text-gray-600 text-sm">{{ formatDate(t.createdAt) }}</div>
              </td>

              <td class="px-4 py-3 hidden md:table-cell">
                <div class="text-gray-600 text-sm">{{ formatDate(t.updatedAt) }}</div>
              </td>

              <td class="px-4 py-3 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button @click="viewTraining(t)" class="px-2 py-1 text-xs border rounded bg-white hover:bg-gray-50">View</button>
                  <button @click="confirmDelete(t)" class="px-2 py-1 text-xs border rounded text-red-600 hover:bg-red-50">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex flex-col md:flex-row items-center justify-between gap-3 px-4 py-3 border-t bg-gray-50">
        <div class="text-xs text-gray-600">
          Showing <strong>{{ fromItem }}</strong> - <strong>{{ toItem }}</strong> of <strong>{{ totalCountDisplay }}</strong> trainings
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
            <button
              @click="goToFirst"
              :disabled="currentPage === 1"
              class="px-2 py-1 border rounded disabled:opacity-50"
              title="First page"
            >«</button>

            <button
              @click="prevPage"
              :disabled="currentPage === 1"
              class="px-3 py-1 border rounded disabled:opacity-50"
            >Prev</button>

            <div class="px-3 py-1 border rounded text-sm bg-white">{{ currentPage }} / {{ totalPages }}</div>

            <button
              @click="nextPage"
              :disabled="currentPage === totalPages || totalPages === 0"
              class="px-3 py-1 border rounded disabled:opacity-50"
            >Next</button>

            <button
              @click="goToLast"
              :disabled="currentPage === totalPages || totalPages === 0"
              class="px-2 py-1 border rounded disabled:opacity-50"
              title="Last page"
            >»</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="deleteTarget" class="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
        <h4 class="text-lg font-semibold mb-3">Confirm Delete</h4>
        <p class="mb-4">Delete training <strong>{{ deleteTarget.trainingCode }}</strong>?</p>
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
import { ref, onMounted, computed, defineComponent, h } from 'vue'
import api from '../../services/axios'
import { useRouter, useRoute, onBeforeRouteUpdate } from 'vue-router'

const router = useRouter()
const route = useRoute()

const trainings = ref(null)   // null = not loaded yet
const loading = ref(true)
const error = ref('')

const owners = ref([])

const trainingCodeInput = ref('')
const ownerIdInput = ref('')

const monthInput = ref(0)
const yearInput = ref(0)

const applied = ref({
  trainingCode: '',
  ownerId: '',
  month: 0,
  year: 0
})

const deleteTarget = ref(null)
const deleting = ref(false)

const currentPage = ref(1)
const pageSize = ref(20)
const totalCount = ref(null) // null = not loaded yet

const sortBy = ref('updatedAt')
const sortDir = ref('desc')

const months = [
  'January','February','March','April','May','June','July','August','September','October','November','December'
]
const years = (() => {
  const y = new Date().getFullYear()
  const arr = []
  for (let i = 0; i <= 6; i++) arr.push(y - i)
  return arr
})()

const totalPages = computed(() => Math.max(1, Math.ceil(((totalCount.value || 0) / pageSize.value))))
const fromItem = computed(() => (totalCount.value ? (currentPage.value - 1) * pageSize.value + 1 : 0))
const toItem = computed(() => (totalCount.value ? Math.min(totalCount.value, currentPage.value * pageSize.value) : 0))
const totalCountDisplay = computed(() => (totalCount.value === null ? '—' : totalCount.value))

const hasPendingFilters = computed(() => {
  return (String(trainingCodeInput.value || '').trim() !== String(applied.value.trainingCode || '').trim())
    || (String(ownerIdInput.value || '') !== String(applied.value.ownerId || ''))
    || (Number(monthInput.value || 0) !== Number(applied.value.month || 0))
    || (Number(yearInput.value || 0) !== Number(applied.value.year || 0))
})

function formatPercent(v) {
  return v == null ? '-' : Number(v).toFixed(2) + '%'
}
function formatDate(d) {
  if (!d) return '-'
  try { return new Date(d).toLocaleString() } catch { return d }
}

async function loadOwners() {
  try {
    const res = await api.get(`${import.meta.env.VITE_API_URL}/api/trainings/owners`)
    const data = Array.isArray(res.data) ? res.data : (res.data?.owners || [])
    if (data.length && (data[0].id || data[0]._id) && data[0].name) {
      owners.value = data.map(o => ({ id: o.id || o._id, name: o.name, count: o.count || 0 }))
    } else {
      owners.value = []
    }
  } catch (err) {
    console.error('Failed to load owners for filter:', err)
    owners.value = []
  }
}

async function fetchTrainings({ page = currentPage.value, limit = pageSize.value } = {}) {
  loading.value = true
  error.value = ''
  try {
    const params = { page, limit }
    if (applied.value.ownerId) params.ownerId = applied.value.ownerId
    if (applied.value.trainingCode && applied.value.trainingCode.trim() !== '') params.trainingCode = applied.value.trainingCode.trim()
    if (applied.value.month && Number(applied.value.month) > 0) params.month = applied.value.month
    if (applied.value.year && Number(applied.value.year) > 0) params.year = applied.value.year
    if (sortBy.value) params.sortBy = sortBy.value
    if (sortDir.value) params.sortDir = sortDir.value

    const res = await api.get(`${import.meta.env.VITE_API_URL}/api/trainings`, { params })
    const data = res.data || {}
    trainings.value = data.trainings || []
    totalCount.value = typeof data.totalCount === 'number' ? data.totalCount : (Array.isArray(data.trainings) ? data.trainings.length : 0)
    currentPage.value = data.page || page
    pageSize.value = data.limit || limit
  } catch (err) {
    console.error(err)
    if (err.response && err.response.status === 401) {
      router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } })
      return
    }
    error.value = err?.response?.data?.message || 'Failed to load trainings'
    trainings.value = []
    totalCount.value = 0
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  applied.value.trainingCode = (trainingCodeInput.value || '').trim()
  applied.value.ownerId = ownerIdInput.value || ''
  applied.value.month = Number(monthInput.value || 0)
  applied.value.year = Number(yearInput.value || 0)
  currentPage.value = 1
  fetchTrainings({ page: 1 })
}

function resetFilters() {
  trainingCodeInput.value = ''
  ownerIdInput.value = ''
  monthInput.value = 0
  yearInput.value = 0
  applied.value.trainingCode = ''
  applied.value.ownerId = ''
  applied.value.month = 0
  applied.value.year = 0
  sortBy.value = 'updatedAt'
  sortDir.value = 'desc'
  currentPage.value = 1
  fetchTrainings({ page: 1 })
}

let ownerApplyTimer = null
function onOwnerSelect() {
  clearTimeout(ownerApplyTimer)
  if ((ownerIdInput.value || '') === (applied.value.ownerId || '')) return
  ownerApplyTimer = setTimeout(() => {
    applyFilters()
  }, 200)
}

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
  fetchTrainings({ page: 1 })
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--
    fetchTrainings({ page: currentPage.value })
  }
}
function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    fetchTrainings({ page: currentPage.value })
  }
}
function goToFirst() {
  if (currentPage.value !== 1) {
    currentPage.value = 1
    fetchTrainings({ page: 1 })
  }
}
function goToLast() {
  if (currentPage.value !== totalPages.value) {
    currentPage.value = totalPages.value
    fetchTrainings({ page: currentPage.value })
  }
}
function onPageSizeChange() {
  currentPage.value = 1
  fetchTrainings({ page: 1, limit: pageSize.value })
}

function viewTraining(t) {
  router.push({ name: 'training-view', params: { id: t._id } }).catch(() => {})
}

function confirmDelete(t) {
  deleteTarget.value = t
}

async function deleteTraining() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await api.delete(`${import.meta.env.VITE_API_URL}/api/trainings/${deleteTarget.value._id}`)
    if (Array.isArray(trainings.value)) {
      trainings.value = trainings.value.filter(x => x._id !== deleteTarget.value._id)
    } else {
      trainings.value = []
    }
    totalCount.value = Math.max(0, (totalCount.value || 0) - 1)
    deleteTarget.value = null
  } catch (err) {
    console.error(err)
    alert(err?.response?.data?.message || 'Delete failed')
  } finally {
    deleting.value = false
  }
}

async function downloadReportCurrent() {
  const params = new URLSearchParams()
  params.set('page', 1)
  params.set('limit', Math.min(totalCount.value || 1000000, 1000000))
  if (applied.value.ownerId) params.set('ownerId', applied.value.ownerId)
  if (applied.value.trainingCode) params.set('trainingCode', applied.value.trainingCode)
  if (applied.value.month && Number(applied.value.month) > 0) params.set('month', applied.value.month)
  if (applied.value.year && Number(applied.value.year) > 0) params.set('year', applied.value.year)
  if (sortBy.value) params.set('sortBy', sortBy.value)
  if (sortDir.value) params.set('sortDir', sortDir.value)

  const url = `${import.meta.env.VITE_API_URL}/api/report-excel?${params.toString()}`
  const token = localStorage.getItem('auth_token')
  if (token) {
    try {
      const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      if (!resp.ok) throw new Error('Export failed')
      const blob = await resp.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `training-report-${Date.now()}.xlsx`
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

onMounted(async () => {
  await loadOwners()
  trainingCodeInput.value = applied.value.trainingCode || ''
  ownerIdInput.value = applied.value.ownerId || ''
  monthInput.value = applied.value.month || 0
  yearInput.value = applied.value.year || 0
  await fetchTrainings()
})

onBeforeRouteUpdate((to, from, next) => {
  trainings.value = null
  totalCount.value = null
  loading.value = true
  // refresh owners as well in case they changed
  Promise.all([loadOwners(), fetchTrainings()]).finally(() => next())
})

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

@media (max-width: 640px) {
  .hidden.sm:table-cell { display: none; }
}
@media (max-width: 768px) {
  .hidden.md:table-cell { display: none; }
}
</style>
