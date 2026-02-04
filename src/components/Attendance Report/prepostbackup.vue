<template>
  <form
    @submit.prevent="handleExcel"
    class="w-full mx-auto max-w-sm rounded overflow-hidden shadow-lg mt-6"
    id="attendance-form"
    ref="attendanceForm"
  >
    <h1 class="text-center font-bold" style="background-color: #F0E7D8;padding: 8px;font-size: 19px;">Attendance Report Generator</h1>
    <div style="padding: 20px 30px;display: flex;gap: 20px;flex-direction: column;" v-if="!exportReady">
    <div class="form-control">
      <label for="formAttendance">Teams Attendance</label>
      <input type="file" id="formAttendance" multiple />
    </div>
    <div class="form-control">
      <label for="">Have Nomination Sheet</label>
      <div style="display: flex;gap: 20px;align-items: center;">
      <div style="display: flex;gap: 20px;align-items: center;flex-direction: row-reverse;">
        <label for="nominationConfirmation1">Yes</label>
        <input type="radio"   id="nominationConfirmation1" value="Yes" v-model="selectOption" name="nominationConfirmation"/>
      </div>
      <div style="display: flex;gap: 20px;align-items: center;flex-direction: row-reverse;">
        <label for="nominationConfirmation2">No</label>
        <input type="radio" id="nominationConfirmation2" value="No" v-model="selectOption" name="nominationConfirmation"/>
      </div>
    </div>
    </div>
    <div class="form-control" v-if="selectOption !== 'No'">
      <label for="nomination">Nominations</label>
      <input type="file" id="nomination" required />
    </div>
    <div class="form-control">
      <label for="dhr">DHR Report</label>
      <input type="file" id="dhr"/>
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
    
    <div class="form-control">
      <label for="formAttendance">Minimum Stay</label>
      <select v-model="minDurationStay">
        <option value="0">0 mins</option>
        <option value="15">15 mins</option>
        <option value="30">30 mins</option>
        <option value="45">45 mins</option>
        <option value="60">1 hour</option>
      </select>
    </div>
  </div>
<div class="extract-result" v-if="exportReady" style="padding: 20px;">
  <p><span style="min-width: 150px;display:inline-block;">Total Nomination </span>: {{ selectOption === 'Yes' ? finalAttendanceWithNomination.length + finalAttendancedifference.length : finalAttendance.length }}</p> 
  <p><span style="min-width: 150px;display:inline-block;">Attended </span>: {{selectOption === 'Yes' ? finalAttendanceWithNomination.filter((employee)=>((employee.PRESENTCOUNT / employee.SESSIONCOUNT) * 100).toFixed(0) >= 50).length + finalAttendancedifference.filter((employee)=>((employee.PRESENTCOUNT / employee.SESSIONCOUNT) * 100).toFixed(0) >= 50).length : finalAttendance.filter((employee)=>((employee.PRESENTCOUNT / employee.SESSIONCOUNT) * 100).toFixed(0) >= 50).length }} </p>
  <p><span style="min-width: 150px;display:inline-block;">Not Attended </span>: {{selectOption === 'Yes' ? finalAttendanceWithNomination.filter((employee)=>((employee.PRESENTCOUNT / employee.SESSIONCOUNT) * 100).toFixed(0) < 50).length + finalAttendancedifference.filter((employee)=>(((employee.PRESENTCOUNT === undefined ? 0 : employee.PRESENTCOUNT) / employee.SESSIONCOUNT) * 100).toFixed(0) < 50).length : finalAttendance.filter((employee)=>((employee.PRESENTCOUNT / employee.SESSIONCOUNT) * 100).toFixed(0) < 50).length }} </p>
</div>

    <div class="form-button" v-if="!loading" style="padding-bottom: 20px;">
      <button type="submit" v-if="finalAttendance.length === 0">Extract</button>
      <button @click="clearAttendance" v-else>Resubmit</button>
      <button v-if="exportReady" @click="exportExcel">Export</button>
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
export default {
  data() {
    return {
      finalAttendanceWithNomination:[],
      finalAttendancedifference:[],
      selectOption:'No',
      exportReady: false,
      loading: false,
      minDurationStay: 0,
      dynamicNomination: [],
      finalAttendance: [],
      trainingInformation: [],
      unknownEmpIDPersist:[]
    }
  },
  methods: {
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
      const files = e.target[0].files;
      const totalSheet = files.length;
      const trainingDetails = {
        trainingName: null,
        trainingParticipant: [],
        dateCount: totalSheet,
      };
      try {
        for (let file of files) {
          if (file) {
            let copyFormat = file.name.replace(/ \(\d+\)/g, "");
            const pattern =
              /^(.*) - Attendance report (\d{1,2}-\d{1,2}-\d{2})\.csv$/;
            const match = copyFormat.match(pattern);
            if (match) {
              if (!trainingDetails.trainingName)
                trainingDetails.trainingName = match[1];
            }


            await Papa.parse(file, {
              header: true,
              dynamicTyping: true,
              complete: (results) => {
                console.log(results)
                trainingDetails.trainingParticipant.push({
                  date: match[2],
                  participants: this.extractFromTeamsAttendance(results.data,trainingDetails.trainingName),
                });
                trainingDetails.trainingParticipant.sort((a, b) => new Date(a.date) - new Date(b.date));
                console.log("training",trainingDetails,results)
              },
            });
          }
        }
        let DHRJson = []
        let PreJson = []
        let PostJson = []
        let prefeedbackJson = []
        if(this.selectOption!=='No'){
          const nominationfile = e.target[3].files[0];
          const nominationSheet = await this.extractNomination(
            nominationfile,
            totalSheet
          );
          this.finalAttendanceWithNomination =  this.prepareFinalAttendance(
            nominationSheet,
            trainingDetails
          );
          if(e.target[4].files[0]){
          const Dfile = e.target[4].files[0];
          DHRJson = await this.DHRExtract(Dfile);
          const prefile = e.target[5].files[0];
          PreJson = await this.PreAssessment(prefile,DHRJson);
          const postfile = e.target[6].files[0];
          PostJson = await this.PostAssessment(postfile,DHRJson);
          if(e.target[7].files[0]){
          const prefeedback = e.target[7].files[0];
          prefeedbackJson = await this.PreManager(prefeedback);
          }
          }
        }
        else{
          // const Dfile = e.target[3].files[0];
          // DHRJson = await this.DHRExtract(Dfile);
          if(e.target[4].files[0]){
           const Dfile = e.target[3].files[0];
           DHRJson = await this.DHRExtract(Dfile);
            const prefile = e.target[4].files[0];
            PreJson = await this.PreAssessment(prefile,DHRJson);
            const postfile = e.target[5].files[0];
            PostJson = await this.PostAssessment(postfile,DHRJson);
         
          
          }
            if(e.target[6].files[0]){  
            const prefeedback = e.target[6].files[0];
          prefeedbackJson = await this.PreManager(prefeedback);
           }
        }
        console.log(PreJson)
        setTimeout(()=>{
          const uniqueArray = this.setNominationSheet(trainingDetails);
          this.finalAttendance =  this.prepareFinalAttendance(
          uniqueArray,
          trainingDetails
        );
        if(this.selectOption !== 'No'){
          let attendancefull =JSON.parse(JSON.stringify(this.finalAttendance))
          this.finalAttendancedifference = attendancefull.filter(
          (obj1) => !this.finalAttendanceWithNomination.some((obj2) => obj2.EMPID == obj1.EMPID)  
          );

            console.log('finalAttendancedifference',this.finalAttendancedifference)
          }
          
        this.trainingInformation = trainingDetails;
        this.exportReady = true;
        this.loading = false;       

console.log("final",this.finalAttendanceWithNomination.filter((employee)=>((employee.PRESENTCOUNT / employee.SESSIONCOUNT) * 100).toFixed(0) < 50).length, this.finalAttendancedifference.filter((employee)=>(((employee.PRESENTCOUNT === undefined ? 0 : employee.PRESENTCOUNT) / employee.SESSIONCOUNT) * 100).toFixed(0) < 50).length)

console.log("final",this.finalAttendance)

console.log("pre",PreJson)
if(prefeedbackJson.length > 0){
   if(this.finalAttendance.length === 0){
    this.finalAttendanceWithNomination  =  this.finalAttendanceWithNomination.map(employee => {
  const match = prefeedbackJson.find(item => item.EMP_ID == employee.EMPID);
  if (match) {
    return { ...employee, MANAGER_FEEDBACK: match.MANAGER_FEEDBACK }; // Add 'status' if there's a match
  }
  return { ...employee, MANAGER_FEEDBACK: "NA" }; // Add 'NA' if no match
})

    this.finalAttendancedifference = this.finalAttendancedifference.map(employee => {
  const match = prefeedbackJson.find(item => item.EMP_ID == employee.EMPID);
      // Test_Score: item[10],
      //     Candidate_Score: item[11],
      //     Percentage: item[12]
  if (match) {
    return { ...employee, MANAGER_FEEDBACK: match.MANAGER_FEEDBACK }; // Add 'status' if there's a match
  }
  return { ...employee, MANAGER_FEEDBACK: "NA" }; // Add 'NA' if no match
})
  }else{
     this.finalAttendance = this.finalAttendance.map(employee => {
  const match = prefeedbackJson.find(item => item.EMP_ID === employee.EMPID);
      // Test_Score: item[10],
      //     Candidate_Score: item[11],
      //     Percentage: item[12]
  if (match) {
    return { ...employee, MANAGER_FEEDBACK: match.MANAGER_FEEDBACK }; // Add 'status' if there's a match
  }
  return { ...employee, MANAGER_FEEDBACK: "NA" }; // Add 'NA' if no match
});
  }

}


if(PreJson.length>0){
  if(this.finalAttendance.length === 0){
    this.finalAttendanceWithNomination  =  this.finalAttendanceWithNomination.map(employee => {
  const match = PreJson.find(item => item.EMP_ID === employee.EMPID);
  if (match) {
    return { ...employee, PREASSESSMENT_PERCENT: match.Percentage }; // Add 'status' if there's a match
  }
  return { ...employee, PREASSESSMENT_PERCENT: "NA" }; // Add 'NA' if no match
})

    this.finalAttendancedifference = this.finalAttendancedifference.map(employee => {
  const match = PreJson.find(item => item.EMP_ID === employee.EMPID);
      // Test_Score: item[10],
      //     Candidate_Score: item[11],
      //     Percentage: item[12]
  if (match) {
    return { ...employee, PREASSESSMENT_PERCENT: match.Percentage }; // Add 'status' if there's a match
  }
  return { ...employee, PREASSESSMENT_PERCENT: "NA" }; // Add 'NA' if no match
})
  }

  this.finalAttendance = this.finalAttendance.map(employee => {
  const match = PreJson.find(item => item.EMP_ID === employee.EMPID);
      // Test_Score: item[10],
      //     Candidate_Score: item[11],
      //     Percentage: item[12]
  if (match) {
    return { ...employee, PREASSESSMENT_PERCENT: match.Percentage }; // Add 'status' if there's a match
  }
  return { ...employee, PREASSESSMENT_PERCENT: "NA" }; // Add 'NA' if no match
});

}

if(PostJson.length>0){
  if(this.finalAttendance.length === 0){
    this.finalAttendanceWithNomination  =  this.finalAttendanceWithNomination.map(employee => {
  const match = PreJson.find(item => item.EMP_ID === employee.EMPID);
  if (match) {
    return { ...employee, PREASSESSMENT_PERCENT: match.Percentage }; // Add 'status' if there's a match
  }
  return { ...employee, PREASSESSMENT_PERCENT: "NA" }; // Add 'NA' if no match
})

    this.finalAttendancedifference = this.finalAttendancedifference.map(employee => {
  const match = PreJson.find(item => item.EMP_ID === employee.EMPID);
      // Test_Score: item[10],
      //     Candidate_Score: item[11],
      //     Percentage: item[12]
  if (match) {
    return { ...employee, PREASSESSMENT_PERCENT: match.Percentage }; // Add 'status' if there's a match
  }
  return { ...employee, PREASSESSMENT_PERCENT: "NA" }; // Add 'NA' if no match
})
  }
  this.finalAttendance = this.finalAttendance.map(employee => {
  const match = PostJson.find(item => item.EMP_ID === employee.EMPID);
      // Test_Score: item[10],
      //     Candidate_Score: item[11],
      //     Percentage: item[12]
  if (match) {
    return { ...employee, POSTASSESSMENT_PERCENT: match.Percentage }; // Add 'status' if there's a match
  }
  return { ...employee, POSTASSESSMENT_PERCENT: "NA" }; // Add 'NA' if no match
});

}



console.log("final",this.finalAttendance)

        },2000)
        
      } catch (err) {
        console.error(err);
      }
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
      let data = JSON.parse(
        JSON.stringify(this.trainingInformation.trainingParticipant)
      );
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
      data.forEach((date, index) => {
        const dateString = date.date;
        const parsedDate = moment.utc(dateString).startOf("day").toDate();
        headers.push({ header: parsedDate, key: `date${index + 1}` });
        headers.push({ header: "Duration", key: `duration${index + 1}` });
      });
      headers.push(
        { header: "No_of_Sessions", key: "session" },
        { header: "No_of_Days_Present", key: "days" },
        { header: "Attendance in %", key: "attendance" },

      );
      
      if(finalAttendance[0].PREASSESSMENT_PERCENT)
               headers.push(     { header: "Pre-Assessment Percentage", key: "Preassessment" })
      if(finalAttendance[0].POSTASSESSMENT_PERCENT)
               headers.push(      { header: "Post-Assessment Percentage", key: "Postassessment" })
     
     if(finalAttendance[0].MANAGER_FEEDBACK)
         headers.push(      { header: "Pre-training Manager Feedback", key: "PretrainingManagersFeedback" })
               
      worksheet.columns = headers;
      let excelDateLocate = [];

      for (let i = 0; i < data.length; i++) {
        worksheet.getColumn(`date${i + 1}`).numFmt = "dd-mmm-yy";
        excelDateLocate.push(worksheet.getColumn(`date${i + 1}`).letter);
      }
      finalAttendance.forEach((employee) => {
        const row = [
          employee.EMPID ? employee.EMPID : "",
          employee.NAME,
        ];
        data.forEach((date) => {
          row.push(employee.Attendance[date.date]);
          row.push(employee.Duration[date.date]);
        });
        row.push(
          employee.SESSIONCOUNT,
          employee.PRESENTCOUNT,
          ((employee.PRESENTCOUNT / employee.SESSIONCOUNT) * 100).toFixed(0) +
            "%"
        );

        if(employee.PREASSESSMENT_PERCENT)
          row.push(employee.PREASSESSMENT_PERCENT);
        if(employee.POSTASSESSMENT_PERCENT)
        row.push(employee.POSTASSESSMENT_PERCENT);
        if(employee.MANAGER_FEEDBACK)
        row.push(employee.MANAGER_FEEDBACK)

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

              if(finalAttendance[0].PREASSESSMENT_PERCENT){
      worksheet.getColumn("Preassessment").eachCell((cell, rowNumber) => {
        if (rowNumber !== 1) {
          cell.alignment = { horizontal: "center", vertical: "middle" };
        }
      });
    }
       if(finalAttendance[0].POSTASSESSMENT_PERCENT){
      worksheet.getColumn("Postassessment").eachCell((cell, rowNumber) => {
        if (rowNumber !== 1) {
          cell.alignment = { horizontal: "center", vertical: "middle" };
        }
      });
    }
        if(finalAttendance[0].MANAGER_FEEDBACK){
      worksheet.getColumn("PretrainingManagersFeedback").eachCell((cell, rowNumber) => {
        if (rowNumber !== 1) {
          cell.alignment = { horizontal: "center", vertical: "middle" };
        }
      });
    }
          worksheet.getColumn("session").eachCell((cell, rowNumber) => {
        if (rowNumber !== 1) {
          cell.alignment = { horizontal: "center", vertical: "middle" };
        }
      });
      worksheet.getColumn("emp_id").eachCell((cell, rowNumber) => {
        if (rowNumber !== 1) {
          cell.alignment = { horizontal: "left", vertical: "middle" };
        }
      });
      worksheet.getColumn("days").eachCell((cell, rowNumber) => {
        if (rowNumber !== 1) {
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
        if (rowNumber !== 1) {
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

      const headerRow = worksheet.getRow(1);
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
      const dataRows = worksheet.getRows(2, finalAttendance.length);
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

      const blob = await workbook.xlsx.writeBuffer();
      // Create a blob URL
      const blobUrl = window.URL.createObjectURL(
        new Blob([blob], { type: "application/octet-stream" })
      ); // Create a download link
      const downloadLink = document.createElement("a");
      downloadLink.href = blobUrl;
      downloadLink.setAttribute(
        "download",
        `${this.trainingInformation.trainingName} Attendance Report.xlsx`
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
    async PreManager(file){
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
        const employee = {
          EMP_ID: item[5],
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
