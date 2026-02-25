const ExcelJS = require('exceljs');
const { format, eachDayOfInterval, startOfMonth, endOfMonth } = require('date-fns');

/**
 * Generate Excel report in matrix format
 * Rows: Newspapers | Columns: Dates | Values: Amount (0 if not received, rate if received)
 * @param {Array} entries - Array of newspaper entry objects
 * @param {string} universityName - Name of the university
 * @param {string} month - Month in YYYY-MM format (e.g., "2026-02")
 * @returns {Promise<Buffer>} Excel file buffer
 */
async function generateMatrixReport(entries, universityName, month) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Newspaper Report');

  // Parse month to get all dates
  const [year, monthNum] = month.split('-');
  const monthStart = startOfMonth(new Date(year, monthNum - 1, 1));
  const monthEnd = endOfMonth(monthStart);
  const allDates = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Group entries by newspaper
  const newspaperMap = new Map();
  entries.forEach(entry => {
    const newspaperName = entry.newspapers?.name || 'Unknown';
    if (!newspaperMap.has(newspaperName)) {
      newspaperMap.set(newspaperName, {
        name: newspaperName,
        entries: new Map()
      });
    }
    const dateStr = entry.date;
    newspaperMap.get(newspaperName).entries.set(dateStr, entry);
  });

  // Add title
  const titleEndColumn = String.fromCharCode(66 + allDates.length); // B + number of dates
  worksheet.mergeCells(`A1:${titleEndColumn}1`);
  const titleCell = worksheet.getCell('A1');
  titleCell.value = `Newspaper Delivery Report - ${universityName}`;
  titleCell.font = { size: 16, bold: true };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Add month info
  worksheet.mergeCells(`A2:${titleEndColumn}2`);
  const monthCell = worksheet.getCell('A2');
  monthCell.value = `Month: ${format(monthStart, 'MMMM yyyy')}`;
  monthCell.font = { size: 12, bold: true };
  monthCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Add empty row
  worksheet.addRow([]);

  // Create header row (Newspaper | Date1 | Date2 | ... | Total)
  const headerRow = ['Newspaper'];
  allDates.forEach(date => {
    headerRow.push(format(date, 'd\nEEE').replace('\n', '\n')); // Day number + day name
  });
  headerRow.push('Total (₹)');

  const headerRowObj = worksheet.addRow(headerRow);
  
  // Style headers
  headerRowObj.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRowObj.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  headerRowObj.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  headerRowObj.height = 35;

  // Set column widths
  worksheet.getColumn(1).width = 25; // Newspaper name column
  for (let i = 2; i <= allDates.length + 1; i++) {
    worksheet.getColumn(i).width = 8; // Date columns
  }
  worksheet.getColumn(allDates.length + 2).width = 12; // Total column

  // Add data rows (one row per newspaper)
  let grandTotal = 0;
  newspaperMap.forEach((newspaperData, newspaperName) => {
    const rowData = [newspaperName];
    let newspaperTotal = 0;

    allDates.forEach(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const entry = newspaperData.entries.get(dateStr);

      if (entry) {
        const rate = parseFloat(entry.rate || 0);
        const amount = entry.status === 'received' ? rate : 0;
        rowData.push(amount);
        newspaperTotal += amount;
      } else {
        rowData.push('-');
      }
    });

    rowData.push(newspaperTotal.toFixed(2));
    grandTotal += newspaperTotal;

    const row = worksheet.addRow(rowData);
    
    // Style newspaper name cell
    row.getCell(1).font = { bold: true };
    row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };

    // Style amount cells
    for (let i = 2; i <= allDates.length + 1; i++) {
      const cell = row.getCell(i);
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      
      const value = rowData[i - 1];
      if (value === '-') {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF0F0F0' }
        };
        cell.font = { color: { argb: 'FFCCCCCC' } };
      } else if (value === 0) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFC7CE' } // Light red
        };
        cell.font = { color: { argb: 'FF9C0006' }, bold: true };
        cell.value = '0';
      } else {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFC6EFCE' } // Light green
        };
        cell.font = { color: { argb: 'FF006100' } };
        cell.numFmt = '0.00';
      }
    }

    // Style total cell
    const totalCell = row.getCell(allDates.length + 2);
    totalCell.font = { bold: true };
    totalCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE7E6E6' }
    };
    totalCell.numFmt = '0.00';
  });

  // Add empty row
  worksheet.addRow([]);

  // Add summary section
  const summaryStartRow = worksheet.lastRow.number + 1;
  
  // Calculate statistics
  const totalEntries = entries.length;
  const receivedEntries = entries.filter(e => e.status === 'received').length;
  const notReceivedEntries = entries.filter(e => e.status === 'not_received').length;
  const unmarkedEntries = entries.filter(e => e.status === 'unmarked').length;
  const deliveryRate = totalEntries > 0 ? ((receivedEntries / totalEntries) * 100).toFixed(2) : 0;

  worksheet.mergeCells(`A${summaryStartRow}:B${summaryStartRow}`);
  const summaryTitleCell = worksheet.getCell(`A${summaryStartRow}`);
  summaryTitleCell.value = 'Summary:';
  summaryTitleCell.font = { bold: true, size: 12 };

  const summaryData = [
    ['Total Newspaper-Days:', totalEntries],
    ['Received:', receivedEntries],
    ['Not Received:', notReceivedEntries],
    ['Unmarked:', unmarkedEntries],
    ['Delivery Rate:', `${deliveryRate}%`],
    ['Total Amount (Received):', `₹${grandTotal.toFixed(2)}`],
  ];

  summaryData.forEach(([label, value]) => {
    const row = worksheet.addRow([label, value]);
    row.getCell(1).font = { bold: true };
    row.getCell(2).alignment = { horizontal: 'left' };
  });

  // Add borders to all data cells
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 3) { // Skip title rows
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    }
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

module.exports = {
  generateMatrixReport,
};
