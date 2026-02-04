<template>
  <v-container fluid>
    <!-- File Upload -->
    <v-row class="mb-4">
      <v-col cols="12" md="6">
        <v-file-input
          label="Upload Excel Training File"
          accept=".xlsx"
          @change="handleFileUpload"
          prepend-icon="mdi-upload"
          show-size
        />
      </v-col>
    </v-row>
 
    <!-- Filters -->
    <v-row class="mb-4">
      <v-col cols="12" md="3">
        <v-select v-model="selectedCategory" :items="dynamicCategories" label="Training Category" />
      </v-col>
      <v-col cols="12" md="3">
        <v-select v-model="selectedTrainerType" :items="dynamicTrainerTypes" label="Trainer Type" />
      </v-col>
      <v-col cols="12" md="3">
        <v-select v-model="selectedCountry" :items="dynamicCountries" label="Country" />
      </v-col>
      <v-col cols="12" md="3">
        <v-select v-model="selectedMonth" :items="monthOptions" label="Month" />
      </v-col>
    </v-row>
 
    <!-- Summary Cards -->
    <v-row>
      <v-col cols="12" md="3">
        <v-card elevation="2" class="pa-4">
          <v-card-title>Total Trainings</v-card-title>
          <v-card-text class="text-h5">{{ filteredTotalTrainings }}</v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card elevation="2" class="pa-4">
          <v-card-title>Total Attended</v-card-title>
          <v-card-text class="text-h5">{{ filteredTotalAttended }}</v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card elevation="2" class="pa-4">
          <v-card-title>Total Cost</v-card-title>
          <v-card-text class="text-h5">₹ {{ filteredTotalCost }}</v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card elevation="2" class="pa-4">
          <v-card-title>Total AWE Points</v-card-title>
          <v-card-text class="text-h5">{{ filteredTotalAWE }}</v-card-text>
        </v-card>
      </v-col>
    </v-row>
 
    <!-- Charts Section -->
    <v-row class="mt-6">
      <v-col cols="12" md="6">
        <v-card class="pa-4">
          <v-card-title>Month-wise Training Summary</v-card-title>
          <v-card-text>
            <div class="chart-container"><canvas ref="barChart"></canvas></div>
          </v-card-text>
        </v-card>
      </v-col>
 
      <v-col cols="12" md="6">
        <v-row>
          <v-col cols="12">
            <v-card class="pa-4 mb-4">
              <v-card-title>Category Split</v-card-title>
              <v-card-text>
                <div class="chart-container"><canvas ref="pieChart"></canvas></div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12">
            <v-card class="pa-4">
              <v-card-title>Trainer Type Split</v-card-title>
              <v-card-text>
                <div class="chart-container"><canvas ref="doughnutChart"></canvas></div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
 
    <!-- Skill-wise Chart -->
    <v-row class="mt-6">
      <v-col cols="12">
        <v-card class="pa-4">
          <v-card-title>Skill-wise Distribution</v-card-title>
          <v-card-text>
            <div class="chart-container"><canvas ref="skillChart"></canvas></div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
 
    <!-- Employee Chart and Filter -->
    <v-row class="mt-10">
      <v-col cols="12" md="4">
        <v-select v-model="selectedEmployee" :items="['All', ...employeeNames]" label="Filter by Employee" />
      </v-col>
    </v-row>
 
    <v-row>
      <v-col cols="12" md="6">
        <v-card class="pa-4">
          <v-card-title>Top 10 Trained Employees</v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item v-for="emp in topTrainedEmployees" :key="emp.employeeId">
                <v-list-item-content>
                  <v-list-item-title>{{ emp.employeeName }} ({{ emp.trainingCount }} trainings)</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
 
      <v-col cols="12" md="6">
        <v-card class="pa-4">
          <v-card-title>Employees Trained in Multiple Skills</v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item v-for="emp in multiSkillEmployees" :key="emp.employeeId">
                <v-list-item-content>
                  <v-list-item-title>{{ emp.employeeName }} - {{ emp.skills.join(', ') }}</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
 
    <v-row class="mt-6">
      <v-col cols="12">
        <v-card class="pa-4">
          <v-card-title>Skill Count by Employee</v-card-title>
          <v-card-text>
            <div class="chart-container"><canvas ref="employeeSkillChart"></canvas></div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
 
<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import * as XLSX from 'xlsx'
import Chart from 'chart.js/auto'
 
const barChart = ref(null)
const pieChart = ref(null)
doughnutChart = ref(null)
skillChart = ref(null)
employeeSkillChart = ref(null)
 
let barInstance, pieInstance, doughnutInstance, skillInstance, employeeSkillInstance
 
const selectedCategory = ref('All')
const selectedTrainerType = ref('All')
const selectedCountry = ref('All')
const selectedMonth = ref('All')
const selectedEmployee = ref('All')
 
const monthOptions = ['All', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
 
const allTrainings = ref([])
const employeeData = ref([])
 
const dynamicCategories = computed(() => ['All', ...new Set(allTrainings.value.map(t => t.category))])
const dynamicTrainerTypes = computed(() => ['All', ...new Set(allTrainings.value.map(t => t.trainer))])
const dynamicCountries = computed(() => ['All', ...new Set(allTrainings.value.map(t => t.country))])
const employeeNames = computed(() => [...new Set(employeeData.value.map(e => e.employeeName))])
 
const topTrainedEmployees = computed(() => {
  const counts = {}
  employeeData.value.forEach(emp => {
    const key = emp.employeeId
    if (!counts[key]) counts[key] = { employeeId: emp.employeeId, employeeName: emp.employeeName, trainingCount: 0 }
    counts[key].trainingCount++
  })
  return Object.values(counts).sort((a, b) => b.trainingCount - a.trainingCount).slice(0, 10)
})
 
const multiSkillEmployees = computed(() => {
  const skillMap = {}
  employeeData.value.forEach(emp => {
    const key = emp.employeeId
    if (!skillMap[key]) skillMap[key] = { employeeId: emp.employeeId, employeeName: emp.employeeName, skills: new Set() }
    skillMap[key].skills.add(emp.skill)
  })
  return Object.values(skillMap).filter(emp => emp.skills.size > 1).map(emp => ({ ...emp, skills: Array.from(emp.skills) }))
})
 
const filteredData = computed(() =>
  allTrainings.value.filter(t =>
    (selectedCategory.value === 'All' || t.category === selectedCategory.value) &&
    (selectedTrainerType.value === 'All' || t.trainer === selectedTrainerType.value) &&
(selectedCountry.value === 'All' || t.country === selectedCountry.value) &&
    (selectedMonth.value === 'All' || t.month === selectedMonth.value)
  )
)
 
const filteredTotalTrainings = computed(() => filteredData.value.length)
const filteredTotalAttended = computed(() => filteredData.value.reduce((sum, t) => sum + t.attended, 0))
const filteredTotalCost = computed(() => filteredData.value.reduce((sum, t) => sum + t.cost, 0))
const filteredTotalAWE = computed(() => filteredData.value.reduce((sum, t) => sum + t.awePoints, 0))
 
const handleFileUpload = (file) => {
  if (!file || !(file instanceof Blob)) return
  const reader = new FileReader()
  reader.onload = (e) => {
const data = new Uint8Array(e.target.result)
const workbook = XLSX.read(data, { type: 'array' })
    const trainingSheet = workbook.Sheets[workbook.SheetNames[0]]
    const employeeSheet = workbook.Sheets[workbook.SheetNames[1]]
    const jsonData = XLSX.utils.sheet_to_json(trainingSheet)
    const employeeJson = employeeSheet ? XLSX.utils.sheet_to_json(employeeSheet) : []
 
allTrainings.value = jsonData.map(row => ({
      month: row.month,
      attended: parseInt(row.attended),
      cost: parseFloat(row.cost),
      category: row.category,
      trainer: row.trainer,
country: row.country,
      skill: row.skill,
      awePoints: parseInt(row.awePoints) || 0
    }))
 
employeeData.value = employeeJson.map(row => ({
      employeeId: row.employeeId,
      employeeName: row.employeeName,
      skill: row.skill,
      trainingName: row.trainingName,
      month: row.month,
      awePoints: parseInt(row.awePoints) || 0
    }))
 
    updateCharts()
  }
  reader.readAsArrayBuffer(file)
}
 
const updateCharts = () => {
  const data = filteredData.value
 
  // Employee Skill Chart
  const empFilter = selectedEmployee.value
  const filteredEmpData = empFilter === 'All' ? employeeData.value : employeeData.value.filter(e => e.employeeName === empFilter)
const empSkillLabels = [...new Set(filteredEmpData.map(e => e.skill))]
const empSkillCounts = empSkillLabels.map(skill => filteredEmpData.filter(e => e.skill === skill).length)
 
  employeeSkillInstance?.destroy()
  employeeSkillInstance = new Chart(employeeSkillChart.value, {
    type: 'bar',
    data: {
      labels: empSkillLabels,
      datasets: [{ label: 'Skill Count', data: empSkillCounts, backgroundColor: '#FFB300' }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true } },
      plugins: { legend: { display: false } }
    }
  })
}
 
watch([selectedCategory, selectedTrainerType, selectedCountry, selectedMonth, selectedEmployee], updateCharts)
onMounted(updateCharts)
</script>
 
<style scoped>
.chart-container {
  position: relative;
  height: 300px;
  width: 100%;
}
canvas {
  max-width: 100%;
  height: 100% !important;
}
</style>