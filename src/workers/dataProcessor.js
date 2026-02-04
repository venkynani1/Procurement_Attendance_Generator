// dataProcessor.js
import { read, utils } from 'xlsx';
 
self.onmessage = function(event) {
  const file = event.data;
  const reader = new FileReader();
 
  reader.onload = function(e) {
    const data = e.target.result;
    try {
      const workbook = read(data, { type: 'binary' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = utils.sheet_to_json(worksheet, { header: 1 });
      let headerBool = true
      const employees = [];
     for (const item of jsonData) {
        if(headerBool){
            headerBool = false;
            continue
        }
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
    
      self.postMessage({ status: 'success', data: employees });
    } catch (error) {
      self.postMessage({ status: 'error', message: 'Failed to parse file', error: error.message });
    }
  };
 
  reader.readAsBinaryString(file);
};