<template>
  <form
    @submit.prevent="handleExcel"
    class="w-full mx-auto max-w-sm rounded overflow-hidden shadow-lg mt-6"
    id="attendance-form"
    ref="attendanceForm"
  >
    <h1 class="text-center font-bold" style="background-color: #F0E7D8;padding: 8px;font-size: 19px;">Effectiveness Report Generator</h1>
    <div style="padding: 20px 30px;display: flex;gap: 20px;flex-direction: column;" v-if="!exportReady">
    <div class="form-control" >
      <label for="formAttendance">Attendance Report</label>
      <input type="file" id="formAttendance" />
    </div>
    <div class="form-control">
      <label for="dhr">DHR Report</label>
      <input type="file" id="dhr" @change="handleFileChange" :disabled="isLoading"/>
      <div v-if="isLoading">
         <div class="dots" role="status" aria-live="polite">
      <div class="dot" aria-hidden="true"></div>
      <div class="dot" aria-hidden="true"></div>
      <div class="dot" aria-hidden="true"></div>
      <div class="label">Processing file, please wait...</div>
    </div>
      </div>
    </div>
      <div class="form-control">
      <label for="preassessment">Preassessment</label>
      <input type="file" id="preassessment"/>
    </div>
      <div class="form-control">
      <label for="postassessment">Postassessment</label>
      <input type="file" id="postassessment"/>
    </div>
     <div class="form-control">
      <label for="premanager">Pre Manager Feedback</label>
      <input type="file" id="premanager"/>
    </div>
    <div class="form-control" >
      <label for="trainingCode">Training Class Code</label>
      <input v-model="trainingCode" type="text" id="trainingCode" />
    </div>
  </div>
<div class="extract-result" v-if="exportReady" style="padding: 20px;">
  <p><span style="min-width: 150px;display:inline-block;">Total Nomination </span>: {{ selectOption === 'Yes' ? finalAttendanceWithNomination.length + finalAttendancedifference.length : finalAttendance.length }}</p> 
  <p><span style="min-width: 150px;display:inline-block;">Attended </span>: {{selectOption === 'Yes' ? finalAttendanceWithNomination.filter((employee)=>((employee.PRESENTCOUNT / employee.SESSIONCOUNT) * 100).toFixed(0) >= 50).length + finalAttendancedifference.filter((employee)=>((employee.PRESENTCOUNT / employee.SESSIONCOUNT) * 100).toFixed(0) >= 50).length : finalAttendance.filter((employee)=>((employee.PRESENTCOUNT / employee.SESSIONCOUNT) * 100).toFixed(0) >= 50).length }} </p>
  <p><span style="min-width: 150px;display:inline-block;">Not Attended </span>: {{selectOption === 'Yes' ? finalAttendanceWithNomination.filter((employee)=>((employee.PRESENTCOUNT / employee.SESSIONCOUNT) * 100).toFixed(0) < 50).length + finalAttendancedifference.filter((employee)=>(((employee.PRESENTCOUNT === undefined ? 0 : employee.PRESENTCOUNT) / employee.SESSIONCOUNT) * 100).toFixed(0) < 50).length : finalAttendance.filter((employee)=>((employee.PRESENTCOUNT / employee.SESSIONCOUNT) * 100).toFixed(0) < 50).length }} </p>
  <!-- <input v-model="trainingCode" type="text" /> -->
</div>

    <div class="form-button" v-if="!loading" style="padding-bottom: 20px;">
      <button type="submit" v-if="finalAttendance.length === 0" :disabled="isLoading">{{isLoading ? "Please wait" : "Extract" }}</button>
      <button @click="clearAttendance" v-else>Resubmit</button>
      <button v-if="exportReady" @click="exportExcel">Save & Export</button>
    </div>
    <div style="padding-bottom: 20px;" v-else >
      <p>Loading...</p>
    </div>

  
  </form>
</template>

<script>
import ExcelJS from "exceljs";
import Papa from "papaparse";
import moment from "moment";
import { getToken } from "../../services/auth";
export default {
  data() {
    return {
      trainingCode:"",
      trainingName:"default",
      finalAttendanceWithNomination:[],
      finalAttendancedifference:[],
      selectOption:'No',
      selectOptionReport:'No',
      exportReady: false,
      loading: false,
      minDurationStay: 0,
      dynamicNomination: [],
      finalAttendance: [],
      trainingInformation: [],
      unknownEmpIDPersist:[],
      isLoading:false,
      dhrData:null
    }
  },
  methods: {
    handleFileChange(event) {
      const file = event.target.files[0];
      if (file) {
        this.isLoading = true; // Show the loader
        console.log("working",import.meta.url)
        // Create a new worker instance
        const worker = new Worker(new URL('../../workers/dataProcessor.js', import.meta.url), { type: 'module' });
 
        // Listen for messages from the worker
        worker.onmessage = (event) => {
          const { status, data } = event.data;
          if (status === 'success') {
            this.dhrData = data;
            console.log('File processed successfully',data);
          }
                  console.log(status,event);
          this.isLoading = false; // Hide the loader
          worker.terminate();
        };
 
        worker.onmessageerror = (e) => {
  console.error('worker messageerror', e);
};

worker.onerror = (e) => {
  console.error('worker error', e.message, e.filename, e.lineno, e.colno);
};
        // Send the file to the worker
        worker.postMessage(file);
      }
    },
    clearAttendance() {
      this.exportReady = false;
      this.dynamicNomination = [];
      this.finalAttendance = [];
      this.finalAttendanceWithNomination = []
      this.finalAttendancedifference = []
      this.trainingInformation = [];
      this.$refs.attendanceForm.reset();
      this.selectOption ='No';
      this.minDurationStay = 0;
      
    },
 async handleExcel(e) {
      this.loading = true;
      console.log(e)
      const files = e.target[0].files[0];
       const attendanceFile = e.target[0]?.files?.[0];
  if (!attendanceFile) {
    this.loading = false;
    alert('Attendance file is required.');
    return;
  }
      const regex = /^(?:.*?-\s*)?(.*?)\s+Attendance\s+Report\b.*$/i;
      const match = files.name.match(regex);
      this.trainingName = match ? match[1].trim() : files.name.replace(/\s+Attendance\s+Report.*$/i, '').replace(/.*?-\s*/,'').trim();
    
     


  // Validate mandatory files: preassessment (index 2), postassessment (index 3), pre-manager feedback (index 4)
  if (!e.target?.[2]?.files?.[0] || !e.target?.[3]?.files?.[0]) {
    this.loading = false;
    alert('Preassessment, Postassessment are mandatory.');
    return;
  }
      try{
        let PreJson = []
        let PostJson = []
        let prefeedbackJson = []
        this.finalAttendance = await this.handleFileUpload(files)
         if(e.target[2].files[0]){
            const prefile = e.target[2].files[0];
            PreJson = await this.PreAssessment(prefile,this.dhrData);
            const postfile = e.target[3].files[0];
            PostJson = await this.PostAssessment(postfile,this.dhrData);
          }
            if(e.target?.[4]?.files?.[0]){  
            const prefeedback = e.target?.[4]?.files?.[0];
            prefeedbackJson = await this.PreManager(prefeedback,this.dhrData);
           }


if(PreJson.length>0){
  this.finalAttendance = this.finalAttendance.map(employee => {
  const match = PreJson.find(item => item.EMP_ID === employee.EMPID);
  if (match) {
    return { ...employee, PREASSESSMENT_PERCENT: match.Percentage }; // Add 'status' if there's a match
  }
  return { ...employee, PREASSESSMENT_PERCENT: 0 }; // Add 'NA' if no match
});

}

if(PostJson.length>0){ 
  this.finalAttendance = this.finalAttendance.map(employee => {
  const match = PostJson.find(item => item.EMP_ID === employee.EMPID);
  if (match) {
    return { ...employee, POSTASSESSMENT_PERCENT: match.Percentage }; // Add 'status' if there's a match
  }
  return { ...employee, POSTASSESSMENT_PERCENT: 0 }; // Add 'NA' if no match
});
}

if(prefeedbackJson.length > 0){
  this.finalAttendance = this.finalAttendance.map(employee => {
  const match = prefeedbackJson.find(item => item.EMP_ID === employee.EMPID);
  if (match && match.MANAGER_FEEDBACK) {
    return { ...employee, MANAGER_FEEDBACK: match.MANAGER_FEEDBACK }; // Add 'status' if there's a match
  }
  return { ...employee, MANAGER_FEEDBACK: "NA" }; // Add 'NA' if no match
})

}

        this.exportReady = true;
        this.loading = false;       

console.log("Final Attendance",this.finalAttendance)
      }
      catch(err){
  console.log(err)
      }
    // }
    },
    async handleFileUpload(file) {
  if (!file) return []

  const workbook = new ExcelJS.Workbook()
  const reader = new FileReader()

  return new Promise((resolve, reject) => {
    reader.onerror = (err) => reject(err)

    reader.onload = async (e) => {
      try {
        const buffer = e.target.result
        await workbook.xlsx.load(buffer)

        const worksheet = workbook.worksheets[0]
        const headers = []
        const results = []

        worksheet.getRow(1).eachCell((cell, colNumber) => {
          headers[colNumber] = cell.value
        })

        const isDateHeader = (h) => {
          if (!h) return false
          if (h instanceof Date) return true
          const s = String(h)
          return /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)/i.test(s)
            || /GMT/.test(s)
            || /\d{1,2}[-/]\w+[-/]\d{2,4}/.test(s)
            || /^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/.test(s)
        }

        const parseHeaderToDate = (h) => {
          if (h instanceof Date) return h
          const s = String(h).trim()
          const parsed = new Date(s)
          if (!isNaN(parsed)) return parsed

          const m = s.match(/^(\d{1,2})[-/](\w+)[-/](\d{2,4})$/)
          if (m) {
            const day = parseInt(m[1], 10)
            let mon = m[2]
            let year = m[3]
            const monthMap = {
              jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,sept:8,oct:9,nov:10,dec:11
            }
            if (/^\d+$/.test(mon)) {
              const mm = parseInt(mon,10) - 1
              year = (year.length === 2) ? ('20' + year) : year
              return new Date(parseInt(year,10), mm, day)
            } else {
              const k = mon.toLowerCase().slice(0,3)
              if (monthMap.hasOwnProperty(k)) {
                year = (year.length === 2) ? ('20' + year) : year
                return new Date(parseInt(year,10), monthMap[k], day)
              }
            }
          }
          return new Date('invalid')
        }

        const formatKey = (dt) => {
          if (!(dt instanceof Date) || isNaN(dt)) return String(dt)
          const mo = dt.getMonth() + 1
          const day = dt.getDate()
          const yy = String(dt.getFullYear()).slice(-2)
          return `${mo}-${day}-${yy}`
        }

        const findHeaderIndex = (regex) => {
          for (let i = 1; i < headers.length; i++) {
            const h = headers[i]
            if (!h) continue
            if (regex.test(String(h))) return i
          }
          return -1
        }

        const empCol = findHeaderIndex(/emp[_s]?id/i)
        const nameCol = findHeaderIndex(/^name$/i)
        const sessionsCol = findHeaderIndex(/no[_s]?of[_s]?sessions/i)

        const dateCols = []
        for (let i = 1; i < headers.length; i++) {
          if (isDateHeader(headers[i])) dateCols.push(i)
        }

        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return
          const out = {
            EMPID: null,
            NAME: null,
            SESSIONCOUNT: null,
            PRESENTCOUNT: 0,
            Duration: {},
            Attendance: {}
          }

          if (empCol > 0) out.EMPID = row.getCell(empCol).value
          if (nameCol > 0) {
            let val = row.getCell(nameCol).value
            if (typeof val === 'string') val = val.replace(/^"(.*)"$/, '$1')
            out.NAME = val
          }

          if (sessionsCol > 0) {
            const v = row.getCell(sessionsCol).value
            out.SESSIONCOUNT = (typeof v === 'number') ? v : (v ? Number(v) : null)
          }

          if (!out.SESSIONCOUNT) out.SESSIONCOUNT = dateCols.length

          dateCols.forEach((colIndex) => {
            const hdr = headers[colIndex]
            const dt = parseHeaderToDate(hdr)
            const key = formatKey(dt)

            let attendanceCell = row.getCell(colIndex).value
            if (attendanceCell && typeof attendanceCell === 'object' && attendanceCell.hasOwnProperty('text')) {
              attendanceCell = attendanceCell.text
            }
            if (attendanceCell && typeof attendanceCell !== 'string') attendanceCell = String(attendanceCell)

            let duration = null
            const nextHdr = headers[colIndex + 1]
            if (nextHdr && /duration/i.test(String(nextHdr))) {
              duration = row.getCell(colIndex + 1).value
            } else {
              const c1 = row.getCell(colIndex + 1).value
              const c0 = row.getCell(colIndex - 1).value
              if (c1 && /h|m|s/.test(String(c1))) duration = c1
              else if (c0 && /h|m|s/.test(String(c0))) duration = c0
            }

            if (attendanceCell === undefined || attendanceCell === null) attendanceCell = ''
            if (duration === undefined || duration === null) duration = ''

            out.Attendance[key] = String(attendanceCell).trim()
            out.Duration[key] = String(duration).trim()

            if (String(out.Attendance[key]).toUpperCase() === 'P') out.PRESENTCOUNT++
          })

          results.push(out)
        })

        resolve(results)
      } catch (err) {
        reject(err)
      }
    }

    reader.readAsArrayBuffer(file)
  })
},
    extractFromTeamsAttendance(dataArray,name) {
      let isEnable = false;
      let result = [];
      let isCheck = false
      let initial = true;
      for (let teams of dataArray) {
        let participant = {
          EMPID: null,
          NAME: null,
          DURATION: null,
          EMAIL: null,
          DATE: null,
        };
        for (let key in teams) {
          if (teams[key] == "2. Participants") {
            isEnable = true;
            continue;
          }
          if (teams[key] === null) isEnable = false;
          if (isEnable) {
            if(initial){
              isCheck = teams[key].length > 2
            }
            console.log("key",key,teams[key])
            console.log("name",name)
            if(true){
              
              console.log("true",teams[key])
              if(teams[key] && teams[key] !== "Name"){
                if(!isCheck){

                          if (typeof teams[key] === "string"){
                              participant.NAME = teams[key].split("\t")[0].replace(/[0-9/]/g, '');
                              participant.DATE = teams[key].split("\t")[1]
                              continue
                            }else{
                              console.log("stuck",teams[key][1])
                              if(teams[key][1]){
                              let extractedData = teams[key][1].split("\t")

                              participant.DURATION = extractedData[1]
                              participant.EMAIL = extractedData[2]
                              if (extractedData[3] && extractedData[3].includes("@hexaware"))
                                  participant.EMPID = Number(extractedData[3].replace(/\D/g, ""));
                              else 
                                  participant.EMPID = participant.NAME;
                              }
                            }
                            }
                            else{
                              if (typeof teams[key] === "string"){
                                 participant.NAME = teams[key].replace(/[0-9/]/g, '')
                              }
                              else{
                                participant.DURATION = teams[key][2]
                                participant.EMAIL = teams[key][3]
                                  if (teams[key][4] && teams[key][4].includes("@hexaware"))
                                    participant.EMPID = Number(teams[key][4].replace(/\D/g, ""));
                                  else 
                                    participant.EMPID = participant.NAME;
                              }
                              }
                              
                            }
                if(participant.NAME && participant.DURATION){ 
                  result.push(participant);
                }
              }
            
            else{
              console.log("false")
            if (
              teams[key] === "Name" ||
              (teams[key] &&
                teams[key].length > 0 &&
                teams[key][0] === "First Join")
            )
              continue;
            if (typeof teams[key] === "string" && teams[key] !== "Name")
              participant.NAME = teams[key];
            if (
              typeof teams[key] !== "string" &&
              teams[key] &&
              teams[key].length > 0 &&
              teams[key][0] !== "First Join"
            ) {
              participant.DATE = teams[key][0].split(",")[0];
              participant.DURATION = teams[key][2];
              participant.EMAIL = teams[key][3];
              if (teams[key][4] && teams[key][4].includes("@hexaware"))
                participant.EMPID = Number(teams[key][4].replace(/\D/g, ""));
              else {
                // console.log("participants",participant.NAME)
                participant.EMPID = participant.NAME;
              }

              result.push(participant);
            }
            
          }
          
          
          }
        }
      }
      console.log('Teams',result)
      return result;
    },
    setNominationSheet(trainingDetails) {
      let nomination = trainingDetails.trainingParticipant.map(
        (data) => data.participants
      );
      let mergedArray = nomination.flat();
      const uniqueMap = new Map();
      mergedArray.forEach((item) => {
        const key =
          item.EMPID !== null ? `empid-${item.EMPID}` : `name-${item.NAME}`;
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, item);
        }
      });
      const uniqueArray = Array.from(uniqueMap.values());
      this.dynamicNomination = uniqueArray.map(({ EMPID, NAME }) => ({
        EMPID:EMPID,
        NAME,
      }));
      return this.dynamicNomination;
    },
    prepareFinalAttendance(uniqueArray, trainingDetails) {
      let finalAttendanceSheet = JSON.parse(JSON.stringify(uniqueArray));
      let delay = this.minDurationStay;
      let totalSession = trainingDetails.trainingParticipant.length;
      for (let data of trainingDetails.trainingParticipant) {
        let wholeData = data.participants;
        let filteredData = this.filterParticipants(data.participants, delay);
        let currentDate = data.date;
        finalAttendanceSheet.forEach((employee) => {
          const filterEmployee = filteredData.find(
            (data) => data.EMPID == employee.EMPID
          );
          const employeeData = wholeData.find(
            (data) => data.EMPID == employee.EMPID
          );
          if (filterEmployee) {
            if (!employee.PRESENTCOUNT) {
              employee.SESSIONCOUNT = totalSession;
              employee.PRESENTCOUNT = 0;
            }
            if (!employee.Attendance) {
              employee.Duration = {};
              employee.Attendance = {};
            }
            employee.Duration[currentDate] =
              filterEmployee && filterEmployee.DURATION !== undefined && filterEmployee.DURATION !== null
                ? filterEmployee.DURATION
                : "0s";
            employee.Attendance[currentDate] = "P";
            employee.PRESENTCOUNT++;
          } else {
            if (!employee.SESSIONCOUNT) {
              employee.SESSIONCOUNT = totalSession;
            }
            if (!employee.Attendance) {
              employee.Attendance = {};
              employee.Duration = {};
            }
            employee.Duration[currentDate] =
              employeeData && employeeData.DURATION !== undefined
                ? employeeData.DURATION
                : "0s";
            employee.Attendance[currentDate] = "A";
          }
        });
      }

      console.log('prepare',finalAttendanceSheet)
      return finalAttendanceSheet;
    },
    filterParticipants(data, delay = 0) {
      
      console.log("filter",data)
      const filteredParticipants = data.filter((participant) => {
        const durationStr = participant.DURATION;
        let hours = 0;
        let minutes = 0;
        let seconds = 0;
        let totalMinutes = 0;
        if(durationStr){
        const components = durationStr.split(" ");
      
        for (const component of components) {
          if (component.includes("h")) {
            hours = parseInt(component);
          } else if (component.includes("m")) {
            minutes = parseInt(component);
          } else if (component.includes("s")) {
            seconds = parseInt(component);
          }
        }
      }
        totalMinutes = hours * 60 + minutes + seconds / 60;
        return totalMinutes > delay;
      });
      return filteredParticipants;
    },
    sortMixedArray(array) {
      const numbers = array.filter(item => typeof item.EMPID === 'number');
      const strings = array.filter(item => typeof item.EMPID === 'string');
      numbers.sort((a, b) => a - b);
      strings.sort();
      return [...numbers, ...strings];
    },
    async exportExcel() {
      this.loading = true
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Gautam Rangan P";
      workbook.lastModifiedBy = "Bot";
      const worksheet = workbook.addWorksheet("Attendance");
      const headers = [
        { header: "Emp_Id", key: "emp_id" },
        { header: "Name", key: "name" },
      ];
      // let data = JSON.parse(
      //   JSON.stringify(this.trainingInformation.trainingParticipant)
      // );
      let finalAttendance = []
       console.log('selectOption',this.selectOption)
      if(this.selectOption !== 'Yes'){
        finalAttendance = this.sortMixedArray(JSON.parse(JSON.stringify(this.finalAttendance)));
      }
      else{
        finalAttendance = JSON.parse(JSON.stringify(this.finalAttendance))
        console.log('finalAttendanceWithNomination',this.finalAttendanceWithNomination)
        console.log('finalAttendancedifference',this.finalAttendancedifference)
        console.log('finalAttendance',finalAttendance)
      }
      console.log('export',finalAttendance)








      let data = Object.keys(this.finalAttendance[0].Attendance)
      data.forEach((date, index) => {
        const dateString = date;
        const parsedDate = moment.utc(dateString).startOf("day").toDate();
        headers.push({ header: parsedDate, key: `date${index + 1}` });
        headers.push({ header: "Duration", key: `duration${index + 1}` });
      });
      headers.push(
        { header: "No_of_Sessions", key: "session" },
        { header: "No_of_Days_Present", key: "days" },
        { header: "Attendance in %", key: "attendance" },

      );
      
    //  if(finalAttendance[0].PREASSESSMENT_PERCENT)
         headers.push({ header: "Pre-Assessment Percentage", key: "Preassessment" })
    //  if(finalAttendance[0].POSTASSESSMENT_PERCENT)
         headers.push({ header: "Post-Assessment Percentage", key: "Postassessment" })
     if(finalAttendance[0].MANAGER_FEEDBACK)
         headers.push({ header: "Pre-training Manager Feedback", key: "PretrainingManagersFeedback" }) 
    //  if(finalAttendance[0].PREASSESSMENT_PERCENT && finalAttendance[0].POSTASSESSMENT_PERCENT){
         headers.push({ header: "Delta", key: "Delta" })
         headers.push({ header: "Effectiveness", key: "Effectiveness" })
         headers.push({ header: "Overall Training Completion (Attendance >= 50% & Post Assessment >= 60%)", key: "Overall Training Completion" })
      // }

        

      worksheet.columns = headers;
      let excelDateLocate = [];

      for (let i = 0; i < data.length; i++) {
        worksheet.getColumn(`date${i + 1}`).numFmt = "dd-mmm-yy";
        excelDateLocate.push(worksheet.getColumn(`date${i + 1}`).letter);
      }


      
      let effectiveCount = 0
      let nonEffectiveCount = 0
      let preAssessmentCount = 0
      let postAssessmentCount = 0

     const isValidPercent = (v) =>
  v === "NA" || v == 0 ||
  (v !== null &&
    v !== undefined &&
    String(v).trim() !== "" &&
    Number.isFinite(Number(v)));


    
const isNumberGE0 = (v) => {
  if (v === null || v === undefined || v === "NA") return false;
  if (typeof v === 'boolean') return false; // exclude booleans
  const n = Number(String(v).trim());
  return Number.isFinite(n) && n > 0;
};


      finalAttendance.forEach((employee) => {

         // javascript


let sub = 0;

// compute difference only when both values are valid (0 allowed)
if (isValidPercent(employee.PREASSESSMENT_PERCENT) && isValidPercent(employee.POSTASSESSMENT_PERCENT)) {
  sub = Number(employee.POSTASSESSMENT_PERCENT) - Number(employee.PREASSESSMENT_PERCENT);
} else {
  sub = 0;
}

// increment counts only when the values are valid (so 0 counts)
if (isNumberGE0(employee.PREASSESSMENT_PERCENT)) {
  preAssessmentCount++;
}
if (isNumberGE0(employee.POSTASSESSMENT_PERCENT)) {
  postAssessmentCount++;
}

// determine effective vs non-effective
if (sub > 0 || Number(employee.POSTASSESSMENT_PERCENT) === 100) {
  effectiveCount++;
} else {
  nonEffectiveCount++;
}

     
     
        })

  
      const totalCount = finalAttendance.length;
const effectivenessPercent = totalCount > 0
  ? Number(((effectiveCount / postAssessmentCount) * 100).toFixed(2))
  : 0;
      
// javascript
// const newRow = worksheet.insertRow(1, [
//   "Total Effectiveness Percent",
//   null, // store as number (e.g. 0.45)
//   " ",
//   "Total Effective Count",
//   null,
//   " ",
//   "Total Non Effective Count",
//   null,
//   " ",
//   "Post Assessment Participant Count",
//   null
// ]);

const row1 = [
  'Total Effectiveness Percent',
  null, // percent cell (will set below)
  ' ',
  'Pre Assessment Count',
  preAssessmentCount
];

const row2 = [
  'Total Effective Count',
  effectiveCount,
  ' ',
  'Post Assessment Count',
  postAssessmentCount
];

const row3 = [
  'Total Non Effective Count',
  nonEffectiveCount
];



console.log('effectiveCount:', effectiveCount);
console.log('nonEffectiveCount:', nonEffectiveCount);
console.log('effectivenessPercent:', effectivenessPercent + '%');

 
worksheet.insertRow(1, row2);
worksheet.insertRow(1, row1);

     
      finalAttendance.forEach((employee) => {
        const row = [
          employee.EMPID ? employee.EMPID : "",
          employee.NAME,
        ];
        data.forEach((date) => {
          row.push(employee.Attendance[date]);
          row.push(employee.Duration[date]);
        });
        row.push(
          employee.SESSIONCOUNT,
          employee.PRESENTCOUNT,
          ((employee.PRESENTCOUNT / employee.SESSIONCOUNT) * 100).toFixed(0) +
            "%"
        );

   
        if (isValidPercent(employee.PREASSESSMENT_PERCENT)) { // catches both null and undefined
          row.push(employee.PREASSESSMENT_PERCENT);
        }
        if (isValidPercent(employee.POSTASSESSMENT_PERCENT)) { // catches both null and undefined
          row.push(employee.POSTASSESSMENT_PERCENT);
        }
        if(employee.MANAGER_FEEDBACK)
          row.push(employee.MANAGER_FEEDBACK)

         let sub 
            if(isValidPercent(employee.PREASSESSMENT_PERCENT) && isValidPercent(employee.POSTASSESSMENT_PERCENT)){
              if(employee.PREASSESSMENT_PERCENT !== "NA" && employee.POSTASSESSMENT_PERCENT !== "NA" ){
                sub = Number(employee.POSTASSESSMENT_PERCENT) - Number(employee.PREASSESSMENT_PERCENT)
                row.push(sub)
              }
              // else if(employee.PREASSESSMENT_PERCENT === "NA" && employee.POSTASSESSMENT_PERCENT !== "NA" ){
              //   sub = Number(employee.POSTASSESSMENT_PERCENT)
              //   row.push(sub)
              // }
              // else if(employee.PREASSESSMENT_PERCENT !== "NA" && employee.POSTASSESSMENT_PERCENT === "NA" ){
              //   sub = Number(employee.PREASSESSMENT_PERCENT)
              //   row.push(sub)
              // }
              else{
                sub = 0
                row.push(sub)
              }
            }
             
            
          if(sub > 0 || employee.POSTASSESSMENT_PERCENT == 100 ){
            row.push("Training was Effective")
        
          }
          else{
            row.push("Training Not Effective")
          
          }



          if( ((employee.PRESENTCOUNT / employee.SESSIONCOUNT) * 100).toFixed(0) >= 50 && typeof(employee.POSTASSESSMENT_PERCENT) !== "string" && employee.POSTASSESSMENT_PERCENT >= 60)
            row.push("Attended")
          else
            row.push("Not Attended")

        worksheet.addRow(row);
      });

      for (let i = 0; i < data.length; i++) {
        worksheet.getColumn(`date${i + 1}`).eachCell((cell, rowNumber) => {
          if (cell.value === "A") {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFFF0000" },
            };
          }
          cell.alignment = { horizontal: "center", vertical: "middle" };
        });
      }

      if(isValidPercent(finalAttendance[0].PREASSESSMENT_PERCENT)){
        worksheet.getColumn("Preassessment").eachCell((cell, rowNumber) => {
            if (rowNumber !== 1 && rowNumber !== 2 && rowNumber !== 3) {
          cell.alignment = { horizontal: "center", vertical: "middle" };
        }
      });
    }
      if(isValidPercent(finalAttendance[0].POSTASSESSMENT_PERCENT)){
        worksheet.getColumn("Postassessment").eachCell((cell, rowNumber) => {
         if (rowNumber !== 1 && rowNumber !== 2 && rowNumber !== 3)  {
          cell.alignment = { horizontal: "center", vertical: "middle" };
        }
      });
        worksheet.getColumn("Delta").eachCell((cell, rowNumber) => {
      if (rowNumber !== 1 && rowNumber !== 2 && rowNumber !== 3 )  {
          cell.alignment = { horizontal: "center", vertical: "middle" };
        }
      });

    }
        if(finalAttendance[0].MANAGER_FEEDBACK){
      worksheet.getColumn("PretrainingManagersFeedback").eachCell((cell, rowNumber) => {
           if (rowNumber !== 1 && rowNumber !== 2 && rowNumber !== 3 )  {
          cell.alignment = { horizontal: "center", vertical: "middle" };
        }
      });
    }
          worksheet.getColumn("session").eachCell((cell, rowNumber) => {
      if (rowNumber !== 1 && rowNumber !== 2 && rowNumber !== 3 )  {
          cell.alignment = { horizontal: "center", vertical: "middle" };
        }
      });
      worksheet.getColumn("emp_id").eachCell((cell, rowNumber) => {
 if (rowNumber !== 1 && rowNumber !== 2 && rowNumber !== 3 )  {
          cell.alignment = { horizontal: "left", vertical: "middle" };
        }
      });
      worksheet.getColumn("days").eachCell((cell, rowNumber) => {
       if (rowNumber !== 1 && rowNumber !== 2 && rowNumber !== 3)  {
          if (excelDateLocate.length > 1) {
            cell.value = {
              formula: `COUNTIFS(${excelDateLocate[0] + rowNumber}:${
                excelDateLocate[excelDateLocate.length - 1] + rowNumber
              },"P")`,
            };
          } else {
            cell.value = {
              formula: `COUNTIFS(${excelDateLocate[0] + rowNumber}:${
                excelDateLocate[0] + rowNumber
              },"P")`,
            };
          }
          cell.alignment = { horizontal: "center", vertical: "middle" };
        }
      });

      let excelTotalDays = worksheet.getColumn("session").letter;
      let excelDaysPresent = worksheet.getColumn("days").letter;
      worksheet.getColumn("attendance").eachCell((cell, rowNumber) => {
       if (rowNumber !== 1 && rowNumber !== 2 && rowNumber !== 3) {
          cell.value = {
            formula: `ROUND(${excelDaysPresent + rowNumber}/${
              excelTotalDays + rowNumber
            }*100,0)`,
          };
        }
      });

      worksheet.columns.forEach((column) => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell) => {
          if (cell.value instanceof Date) {
            maxLength = 10;
          } else {
            const length = cell.value ? cell.value.toString().length : 15;
            if (length > maxLength) {
              maxLength = length;
            }
          }
        });
        column.width = maxLength < 15 ? 15 : maxLength;
      });

      const headerRow = worksheet.getRow(3);
      headerRow.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: "thin", color: { argb: "000000" } },
          left: { style: "thin", color: { argb: "000000" } },
          bottom: { style: "thin", color: { argb: "000000" } },
          right: { style: "thin", color: { argb: "000000" } },
        };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "B7D1F1" },
        };
      });
      const dataRows = worksheet.getRows(4, finalAttendance.length);
      console.log('col',this.finalAttendanceWithNomination.length,finalAttendance.length,this.finalAttendancedifference.length)
      dataRows.forEach((row,rowNumber) => {
        row.eachCell((cell, colNumber) => {
          // console.log('row',rowNumber,this.finalAttendanceWithNomination.length,finalAttendance.length,this.finalAttendancedifference)
        
          if(this.finalAttendanceWithNomination.length > 0 && rowNumber >= this.finalAttendanceWithNomination.length - 1 && rowNumber <= finalAttendance.length){
     
            cell.border = {
            top: { style: "thin", color: { argb: "FFFF0000" } },
            left: { style: "thin", color: { argb: "FFFF0000" } },
            bottom: { style: "thin", color: { argb: "FFFF0000" } },
            right: { style: "thin", color: { argb: "FFFF0000" } },
          };
          }
          else{
            cell.border = {
            top: { style: "thin", color: { argb: "000000" } },
            left: { style: "thin", color: { argb: "000000" } },
            bottom: { style: "thin", color: { argb: "000000" } },
            right: { style: "thin", color: { argb: "000000" } },
          };
          }
        });
      });
      let excelAttendance = worksheet.getColumn("attendance").letter;
      worksheet.addConditionalFormatting({
        ref: `${excelAttendance}2:${
          excelAttendance + (finalAttendance.length + 1)
        }`,
        rules: [
          {
            type: "dataBar",
            cfvo: [{ type: "num",value:0 }, { type: "num",value:100 }],
            color: { argb: "FFFF5050" },
          },
        ],
      });


      const styleBorder = {
  top:    { style: 'thin', color: { argb: 'FF000000' } },
  left:   { style: 'thin', color: { argb: 'FF000000' } },
  bottom: { style: 'thin', color: { argb: 'FF000000' } },
  right:  { style: 'thin', color: { argb: 'FF000000' } },
};

const labelFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDDEBF7' } }; // label background
const valueFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } }; // value background

const rowsToStyle = [1, 2];
rowsToStyle.forEach(rNum => {
  const r = worksheet.getRow(rNum);

  // style label cell in column 1 if present
  const labelCell = r.getCell(1);
  if (labelCell.value !== undefined && labelCell.value !== null && String(labelCell.value).trim() !== '') {
    labelCell.fill = labelFill;
    labelCell.border = styleBorder;
    labelCell.alignment = { vertical: 'middle', horizontal: 'left' };
    labelCell.font = { name: 'Calibri', size: 11, bold: true };
  }

  // style value cell in column 2 if present
  const valueCell = r.getCell(2);
  if (valueCell.value !== undefined && valueCell.value !== null && String(valueCell.value).trim() !== '') {
    valueCell.fill = valueFill;
    valueCell.border = styleBorder;
    valueCell.alignment = { vertical: 'middle', horizontal: 'center' };
    valueCell.font = { name: 'Calibri', size: 11 };
  }

  // style the right-side label (column 4) and its value (column 5) when present
  const rightLabel = r.getCell(4);
  if (rightLabel.value !== undefined && rightLabel.value !== null && String(rightLabel.value).trim() !== '') {
    rightLabel.fill = labelFill;
    rightLabel.border = styleBorder;
    rightLabel.alignment = { vertical: 'middle', horizontal: 'left' };
    rightLabel.font = { name: 'Calibri', size: 11, bold: true };
  }

  const rightValue = r.getCell(5);
  if (rightValue.value !== undefined && rightValue.value !== null && String(rightValue.value).trim() !== '') {
    rightValue.fill = valueFill;
    rightValue.border = styleBorder;
    rightValue.alignment = { vertical: 'middle', horizontal: 'center' };
    rightValue.font = { name: 'Calibri', size: 11 };
  }
});

// finally set the numeric formats explicitly for the specific cells:
// percent cell (row 1, col 2)
const pctCell = worksheet.getRow(1).getCell(2);
pctCell.value = effectivenessPercent / 100; // already decimal like 0.2683
pctCell.numFmt = '0.00%';
pctCell.fill = valueFill;
pctCell.border = styleBorder;
pctCell.alignment = { horizontal: 'center' };

// integers with thousand separators (rows 2 and 3 col 2, and row 1/2 col 5)
worksheet.getRow(2).getCell(2).value = Number(effectiveCount) || 0;
worksheet.getRow(2).getCell(2).numFmt = '#,##0';

// worksheet.getRow(3).getCell(2).value = Number(nonEffectiveCount) || 0;
// worksheet.getRow(3).getCell(2).numFmt = '#,##0';

worksheet.getRow(1).getCell(5).value = Number(preAssessmentCount) || 0;
worksheet.getRow(1).getCell(5).numFmt = '#,##0';
worksheet.getRow(2).getCell(5).value = Number(postAssessmentCount) || 0;
worksheet.getRow(2).getCell(5).numFmt = '#,##0';


const token = getToken()
const res = await fetch(`${import.meta.env.VITE_API_URL}/api/trainings`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  },
  body: JSON.stringify({
    trainingCode: this.trainingCode.trim(),
    trainingEffectivenessPercent: Number(effectivenessPercent)
  })
})

if (res.ok && res.status === 201) {
  const data = await res.json()
  // handle success
} else {
  const errBody = await res.json().catch(() => ({}))
  // use errBody.message or status to show error
}

// commit rows if using streaming writer or to be safe
[1,2].forEach(i => { const r = worksheet.getRow(i); if (typeof r.commit === 'function') r.commit(); });
      const blob = await workbook.xlsx.writeBuffer();
      // Create a blob URL
      const blobUrl = window.URL.createObjectURL(
        new Blob([blob], { type: "application/octet-stream" })
      ); // Create a download link
      const downloadLink = document.createElement("a");
      downloadLink.href = blobUrl;
      downloadLink.setAttribute(
        "download",
        `${this.trainingName} Effectiveness Report.xlsx`
      ); // Simulate a click event on the download link
      downloadLink.click(); // Clean up by revoking the blob URL
      window.URL.revokeObjectURL(blobUrl);
      this.loading = false
    },
    async DHRExtract(file){
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(file.arrayBuffer());
      const worksheet = workbook.worksheets[0];
      let header = worksheet.getRow(1).values.slice(1)
      console.log(header)
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
      let dataArray = JSON.parse(filtered);

    const employees = [];
      for (const item of dataArray) {
        const employee = {
          EMP_ID: item[0],
          NAME: item[2],
          EMAIL: item[39],
          MANAGER_EMP_ID: item[35],
          MANAGER_NAME: item[36],
        };
        if(item[39]){
        employees.push(employee);
        }
      }
      return employees;
    },
    async PreManager(file,allemployee){
      console.log("premanager",file)
const workbook = new ExcelJS.Workbook();
const arrayBuffer = await file.arrayBuffer();
const uint8Array = new Uint8Array(arrayBuffer);
await workbook.xlsx.load(uint8Array);
const worksheet = workbook.worksheets[0];
      let header = worksheet.getRow(1).values.slice(1)
      console.log(header)
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
      let dataArray = JSON.parse(filtered);
    const employees = [];
      for (const item of dataArray) {
          const employeeObject = allemployee.find(emp => emp.EMAIL.toLowerCase() === String(item[5]).toLowerCase());
          if(employeeObject){
          console.log("obj",employeeObject)
          }
        
          console.log("item5",item[5])
        const employee = {
          EMP_ID: employeeObject ? employeeObject.EMP_ID : Number(String(item[5]).replace(/\D/g, "")),
          MANAGER_FEEDBACK: item[6],
        };
        employees.push(employee);
        
      }
       console.log("premanager",employees)
      return employees;
    },
    
     async PreAssessment(file,allemployee){
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(file.arrayBuffer());
      const worksheet = workbook.worksheets[0];
      let header = worksheet.getRow(1).values.slice(1)
      console.log(header)
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
      let dataArray = JSON.parse(filtered);
      console.log("allemployee",allemployee)
      const employees = [];
      for (const item of dataArray) {
        const employeeObject = allemployee.find(emp => emp.EMAIL.toLowerCase() === item[4].toLowerCase());
       if(employeeObject){
        console.log("obj",employeeObject)
       }
        const employee = {
          EMP_ID: employeeObject ? employeeObject.EMP_ID : Number(item[4].replace(/\D/g, "")),
          NAME: item[3],
          EMAIL: item[4],
          Test_Score: item[10],
          Candidate_Score: item[11],
          Percentage: item[12]
        };
        employees.push(employee);
      }
      return employees;
    },
    async PostAssessment(file,allemployee){
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(file.arrayBuffer());
      const worksheet = workbook.worksheets[0];
      let header = worksheet.getRow(1).values.slice(1)
      console.log(header)
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
      let dataArray = JSON.parse(filtered);
      console.log("allemployee",allemployee)
      const employees = [];
      for (const item of dataArray) {
        const employeeObject = allemployee.find(emp => emp.EMAIL.toLowerCase() === item[4].toLowerCase());
       if(employeeObject){
        console.log("obj",employeeObject)
       }
        const employee = {
          EMP_ID: employeeObject ? employeeObject.EMP_ID : Number(item[4].replace(/\D/g, "")),
          NAME: item[3],
          EMAIL: item[4],
          Test_Score: item[10],
          Candidate_Score: item[11],
          Percentage: item[12]
        };
        employees.push(employee);
      }
      return employees;
    },
    async extractNomination(file, sheetCount) {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(file.arrayBuffer());
      const worksheet = workbook.worksheets[0];
      // let header = worksheet.getRow(1).values.slice(1)
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
      let dataArray = JSON.parse(filtered);
      const participants = [];
      for (const item of dataArray) {
        const participant = {
          EMPID: item[0],
          NAME: item[1],
          PRESENTCOUNT: 0,
          SESSIONCOUNT: sheetCount,
        };
        participants.push(participant);
      }
      return participants;
    },
  },
};
</script>

<style>
    .dots {
    display:inline-flex; gap:6px; align-items:center; font-family:system-ui,Segoe UI,Roboto;
  }
  .dot {
    width:10px; height:10px; background:#2b8aef; border-radius:50%;
    transform:translateY(0);
    animation:jump 1s ease-in-out infinite;
  }
  .dot:nth-child(2) { animation-delay:0.15s; }
  .dot:nth-child(3) { animation-delay:0.3s; }
  @keyframes jump {
    0%,100% { transform:translateY(0); opacity:0.9;}
    50% { transform:translateY(-8px); opacity:1;}
  }
#attendance-form {
  font-weight: 600;
}
#attendance-form button {
  padding: 6px 18px;
  background-color: rgb(48, 194, 87);
  border: none;
  color: white;
  font-weight: 600;
  cursor: pointer;
}
#attendance-form .form-button {
  display: flex;
  gap: 10px;
  justify-content: center;
}
#attendance-form input[type="file"],
#attendance-form input[type="text"],
#attendance-form select {
  /* background-color: black; */
  /* background-color: #AB9B96; */
  padding: 8px 16px;
  /* border-radius: 10px; */
  outline: 2px gray solid;
  /* color: white; */
}
#attendance-form select{
  padding: 8px 0px
}
.form-control {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
#attendance-form .form-control label {
  font-weight: bold;
}
</style>
