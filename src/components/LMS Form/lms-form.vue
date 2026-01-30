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
        <v-select v-model="selectedCategory" :items="categories" label="Training Category" />
      </v-col>
      <v-col cols="12" md="3">
        <v-select v-model="selectedTrainerType" :items="trainerTypes" label="Trainer Type" />
      </v-col>
      <v-col cols="12" md="3">
        <v-select v-model="selectedCountry" :items="countries" label="Country" />
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
          <v-card-text class="text-h5">₹ {{ formatToLakhsAndCrores(filteredTotalCost) }}</v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card elevation="2" class="pa-4">
          <v-card-title>Total AWE Points</v-card-title>
          <v-card-text class="text-h5">{{ formatToLakhsAndCrores(filteredTotalpoints) }}</v-card-text>
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


    <!-- <v-row class="mt-10">
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
   -->
  
  
  </v-container>


</template>
 
<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import * as XLSX from 'xlsx'
import ExcelJS from "exceljs";
import Chart from 'chart.js/auto'
 
// Refs
const barChart = ref(null)
const pieChart = ref(null)
const doughnutChart = ref(null)
const skillChart = ref(null)
const employeeSkillChart = ref(null)

let barInstance, pieInstance, doughnutInstance, skillInstance,employeeSkillInstance
// Filters
// const categories = ['All', 'Competency Dev', 'Demand Based']
// const trainerTypes = ['All', 'Internal', 'External']
// const countries = ['All', 'India', 'Americas']
// const monthOptions = ['All', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const categories = computed(() => ['All', ...new Set(allTrainings.value.map(t => t.category))])
const trainerTypes = computed(() => ['All', ...new Set(allTrainings.value.map(t => t.trainer))])
const countries = computed(() => ['All', ...new Set(allTrainings.value.map(t => t.country))])
const monthOptions = computed(() => ['All', ...new Set(allTrainings.value.map(t => t.month))])
 const employeeNames = computed(() => [...new Set(employeeData.value.map(e => e.employeeName))])
 
// const topTrainedEmployees = computed(() => {
//   const counts = {}
//   employeeData.value.forEach(emp => {
//     const key = emp.employeeId
//     if (!counts[key]) counts[key] = { employeeId: emp.employeeId, employeeName: emp.employeeName, trainingCount: 0 }
//     counts[key].trainingCount++
//   })
//   return Object.values(counts).sort((a, b) => b.trainingCount - a.trainingCount).slice(0, 10)
// })
 
// const multiSkillEmployees = computed(() => {
//   const skillMap = {}
//   employeeData.value.forEach(emp => {
//     const key = emp.employeeId
//     if (!skillMap[key]) skillMap[key] = { employeeId: emp.employeeId, employeeName: emp.employeeName, skills: new Set() }
//     skillMap[key].skills.add(emp.skill)
//   })
//   return Object.values(skillMap).filter(emp => emp.skills.size > 1).map(emp => ({ ...emp, skills: Array.from(emp.skills) }))
// })
 

const selectedEmployee = ref('All')
 
const selectedCategory = ref('All')
const selectedTrainerType = ref('All')
const selectedCountry = ref('All')
const selectedMonth = ref('All')
 
// Training data
const allTrainings = ref([])

const extractNomination = async (file, sheetCount = 1) =>{
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(file.arrayBuffer());
      const worksheet = workbook.worksheets[0];
      const worksheet1 = workbook.worksheets[1];
      let header = worksheet.getRow(1).values.slice(1)
      let data = [];
      worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
        if (rowNumber > 1) {
          data.push(row.values.slice(1));
        }
      });
      let filtered = JSON.stringify(
        data
          .filter((obj) => {
            return ![null, undefined, ""].includes(obj);
          })
          .filter((el) => {
            return typeof el != "object" || Object.keys(el).length > 0;
          })
      );

      let header1 = worksheet1.getRow(1).values.slice(1)
      let data1 = [];
      worksheet1.eachRow({ includeEmpty: true }, (row, rowNumber) => {
        if (rowNumber > 1) {
          data1.push(row.values.slice(1));
        }
      });
      let filtered1 = JSON.stringify(
        data1
          .filter((obj) => {
            return ![null, undefined, ""].includes(obj);
          })
          .filter((el) => {
            return typeof el != "object" || Object.keys(el).length > 0;
          })
      );




      
      let dataArray = JSON.parse(filtered);
      let dataArray1 = JSON.parse(filtered1);
      console.log("header",header)
      console.log("data",dataArray)
            console.log("data1",dataArray1)
      // const participants = [];
      // for (const item of dataArray) {
      //   const participant = {
      //     EMPID: item[0],
      //     NAME: item[1],
      //     PRESENTCOUNT: 0,
      //     SESSIONCOUNT: sheetCount,
      //   };
      //   participants.push(participant);
      // }
      return { header, body:dataArray ,header1,body1:dataArray1};
    }
        
function formatToLakhsAndCrores(amount) {
    if (amount >= 10000000) {
        return (amount / 10000000).toFixed(2) + " Cr";
    } else if (amount >= 100000) {
        return (amount / 100000).toFixed(2) + " Lakh";
    } else {
        return amount.toString();
    }
}

// Upload handler
const handleFileUpload = async (e) => {
  const file = e.target.files[0]
  console.log("file",file)
  if (!file || !(file instanceof Blob)) return
 
 const {header,body} = await extractNomination(file,1)
    // console.log(response)
 allTrainings.value = body.map(row =>
 ({
      month: row[17],
      attended: row[22] && !isNaN(parseInt(row[22])) ? parseInt(row[22]) : 0,
      cost: row[28] && !isNaN(parseFloat(row[28])) ? parseFloat(row[28]) : 0,
      points : row[34] && !isNaN(parseFloat(row[34])) ? parseFloat(row[34]) : 0,
      category: row[9],
      trainer: row[24],
      skill: row[31],
      country: row[14]
    }))
 
    // employeeData.value = employeeJson.map(row => ({
    //   employeeId: row.employeeId,
    //   employeeName: row.employeeName,
    //   skill: row.skill,
    //   trainingName: row.trainingName,
    //   month: row.month,
    //   awePoints: parseInt(row.awePoints) || 0
    // }))
    console.log("alltraining",allTrainings)
    updateCharts()
  

  // reader.readAsArrayBuffer(file)
}
 
// Filtered computed data
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
const filteredTotalpoints = computed(() => filteredData.value.reduce((sum, t) => sum + t.points, 0))
 
// Chart logic
const updateCharts = () => {
  const data = filteredData.value
const months = [...new Set(data.map(t => t.month))]
 
const attendedData = months.map(m => data.filter(t => t.month === m).reduce((s, t) => s + t.attended, 0))

const costData = months.map(m => data.filter(t => t.month === m).reduce((s, t) => s + t.cost, 0))
 
const pointsData = months.map(m => data.filter(t => t.month === m).reduce((s, t) => s + t.points, 0))

const catLabels = [...new Set(data.map(t => t.category))]
const catData = catLabels.map(cat => data.filter(t => t.category === cat).length)
 
const trainerLabels = [...new Set(data.map(t => t.trainer))]
const trainerData = trainerLabels.map(type => data.filter(t => t.trainer === type).length)
 
const skillLabels = [...new Set(data.map(t => t.skill))]
const skillCounts = skillLabels.map(skill => data.filter(t => t.skill === skill).length)
  // Destroy old
  barInstance?.destroy()
  pieInstance?.destroy()
  doughnutInstance?.destroy()
    skillInstance?.destroy()
 
  // Create charts
  barInstance = new Chart(barChart.value, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        { label: 'Awe Points(₹)', data: pointsData, backgroundColor: '#42A5F5' },
        { label: 'Cost (₹)', data: costData, backgroundColor: '#66BB6A' }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true } },
      plugins: { legend: { position: 'bottom' } }
    }
  })
 
  pieInstance = new Chart(pieChart.value, {
    type: 'pie',
    data: {
      labels: catLabels,
      datasets: [{ data: catData }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  })
 
  doughnutInstance = new Chart(doughnutChart.value, {
    type: 'doughnut',
    data: {
      labels: trainerLabels,
      datasets: [{ data: trainerData, backgroundColor: ['#AB47BC', '#26A69A'] }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  })
    skillInstance = new Chart(skillChart.value, {
    type: 'bar',
    data: {
      labels: skillLabels,
      datasets: [{ label: 'Trainings by Skill', data: skillCounts, backgroundColor: '#7E57C2' }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      scales: { x: { beginAtZero: true } }
    }
  })
}
 
// Watchers
watch([selectedCategory, selectedTrainerType, selectedCountry, selectedMonth], updateCharts)
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