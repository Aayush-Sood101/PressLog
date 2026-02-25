const ExcelJS = require('exceljs');
const { format } = require('date-fns');

/**
 * Generate Excel report for monthly newspaper entries
 * @param {Array} entries - Array of newspaper entry objects
 * @param {string} universityName - Name of the university
 * @param {string} month - Month in YYYY-MM format
 * @returns {Promise<Buffer>} Excel file buffer
 */
async function generateMonthlyReport(entries, universityName, month) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Newspaper Report');

  // Set worksheet properties
  worksheet.properties.defaultRowHeight = 20;

  // Add title
  worksheet.mergeCells('A1:F1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = `Newspaper Delivery Report - ${universityName}`;
  titleCell.font = { size: 16, bold: true };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Add month info
  worksheet.mergeCells('A2:F2');
  const monthCell = worksheet.getCell('A2');
  monthCell.value = `Month: ${month}`;
  monthCell.font = { size: 12, bold: true };
  monthCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Add empty row
  worksheet.addRow([]);

  // Add headers
  const headerRow = worksheet.addRow([
    'Date',
    'Day',
    'Newspaper Rate',
    'Status',
    'Marked By',
    'Updated At'
  ]);

  // Style headers
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

  // Set column widths
  worksheet.columns = [
    { width: 15 }, // Date
    { width: 12 }, // Day
    { width: 15 }, // Rate
    { width: 15 }, // Status
    { width: 25 }, // Marked By
    { width: 20 }, // Updated At
  ];

  // Add data rows
  let totalReceived = 0;
  let totalNotReceived = 0;
  let totalUnmarked = 0;
  let totalAmount = 0;

  entries.forEach(entry => {
    const date = new Date(entry.date);
    const dayName = entry.newspapers?.day_of_week || '-';
    const rate = entry.newspapers?.rate ? parseFloat(entry.newspapers.rate) : 0;
    const status = entry.status || 'unmarked';
    const markedBy = entry.markedByEmail || '-';
    const updatedAt = entry.updated_at 
      ? format(new Date(entry.updated_at), 'yyyy-MM-dd HH:mm')
      : '-';

    // Count statuses
    if (status === 'received') totalReceived++;
    else if (status === 'not_received') totalNotReceived++;
    else totalUnmarked++;

    // Calculate total amount for received newspapers
    if (status === 'received') {
      totalAmount += rate;
    }

    const row = worksheet.addRow([
      format(date, 'yyyy-MM-dd'),
      dayName,
      rate.toFixed(2),
      status.replace('_', ' ').toUpperCase(),
      markedBy,
      updatedAt
    ]);

    // Color code status
    const statusCell = row.getCell(4);
    if (status === 'received') {
      statusCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFC6EFCE' } // Light green
      };
      statusCell.font = { color: { argb: 'FF006100' } }; // Dark green
    } else if (status === 'not_received') {
      statusCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFC7CE' } // Light red
      };
      statusCell.font = { color: { argb: 'FF9C0006' } }; // Dark red
    } else {
      statusCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFF2CC' } // Light yellow
      };
      statusCell.font = { color: { argb: 'FF9C6500' } }; // Dark yellow
    }

    // Center align status
    statusCell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // Add empty row
  worksheet.addRow([]);

  // Add summary
  const summaryStartRow = worksheet.lastRow.number + 1;
  
  worksheet.mergeCells(`A${summaryStartRow}:B${summaryStartRow}`);
  const summaryTitleCell = worksheet.getCell(`A${summaryStartRow}`);
  summaryTitleCell.value = 'Summary:';
  summaryTitleCell.font = { bold: true, size: 12 };

  worksheet.addRow(['Total Days:', entries.length]);
  worksheet.addRow(['Received:', totalReceived]);
  worksheet.addRow(['Not Received:', totalNotReceived]);
  worksheet.addRow(['Unmarked:', totalUnmarked]);
  worksheet.addRow(['Total Amount (Received):', `₹${totalAmount.toFixed(2)}`]);

  // Calculate delivery rate
  const deliveryRate = entries.length > 0 
    ? ((totalReceived / entries.length) * 100).toFixed(2)
    : 0;
  worksheet.addRow(['Delivery Rate:', `${deliveryRate}%`]);

  // Style summary section
  for (let i = summaryStartRow + 1; i <= worksheet.lastRow.number; i++) {
    const row = worksheet.getRow(i);
    row.getCell(1).font = { bold: true };
    row.getCell(2).alignment = { horizontal: 'left' };
  }

  // Add borders to all cells
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
  generateMonthlyReport,
};
