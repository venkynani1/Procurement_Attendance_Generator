<template>
  <form @submit.prevent="handleSubmit">
    <input type="file" id="nomination" required />
    <button type="submit">Submit</button>
  </form>

  <div>
    <div>
      <select v-if="trainingInfo.length > 0" v-model="selectedValue">
        <option v-for="data in filterOption" :key="data">{{ data }}</option>
      </select>
      <div>
        <p>Training Count:{{ trainingCount }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import ExcelJS from "exceljs";
import Papa from "papaparse";
export default {
  data() {
    return {
      trainingInfo: [],
      selectedValue: "ALL",
      filterOption: ["ALL", "INDIA", "AMERICAS"],
    };
  },
  computed: {
    trainingCount() {
        if(this.trainingInfo.length === 0){
            return 0
        }
      if (this.selectedValue !== "ALL") {
        console.log(
          this.trainingInfo.filter(
            (training) => training.Country.toUpperCase() === this.selectedValue
          ).length
        );
        return this.trainingInfo.filter(
          (training) => training.Country.toUpperCase() === this.selectedValue
        ).length;
      } else {
        console.log(
          this.trainingInfo.filter((training) => training.Country !== null)
            .length
        );
        return this.trainingInfo.filter((training) => training.Country !== null)
          .length;
      }
    },
  },
  methods: {
    async handleSubmit(e) {
      const file = e.target[0].files[0];
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        complete: function (results) {
          this.trainingInfo = results.data;
          //     this.filterOption = [
          //     ...new Set(
          //         results.data.map(
          //         (training) => training.Country ? training.Country.toLowerCase():
          //       )
          //     ),
          //   ];
          console.log(results.data);
        },
      });
    },
    async extractNomination(file) {
      const workbook = new ExcelJS.Workbook();
      await workbook.csv.read(file.arrayBuffer());
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

      console.log(dataArray);
      return dataArray;
    },
  },
};
</script>

<style></style>
