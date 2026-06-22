import * as XLSX from 'xlsx';

export const exportToExcel = (data, filename = 'students_export.xlsx') => {
  if (!data || data.length === 0) return;
  
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
  XLSX.writeFile(workbook, filename);
};
