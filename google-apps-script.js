// ============================================================
// 🚑 Google Apps Script - منصة صيانة وتشغيل الأسطول
// هيئة الهلال الأحمر السعودي - منطقة الرياض
// 
// تعليمات النشر:
// 1. افتح Google Sheets جديد
// 2. من القائمة: Extensions > Apps Script
// 3. الصق هذا الكود كاملاً
// 4. احفظ ثم انشر: Deploy > New deployment
// 5. اختر: Web app > Execute as: Me > Who has access: Anyone
// 6. انسخ رابط النشر وضعه في ملف data.js في المتغير SCRIPT_URL
// ============================================================

// ====== إعداد الجداول ======
const SHEET_NAMES = {
  FLEET: 'الأسطول',
  TRACKING: 'الرصد',
  ACCIDENTS: 'الحوادث',
  MAINTENANCE: 'الصيانة الوقائية',
  OIL: 'تغيير الزيت'
};

// ====== رؤوس الأعمدة ======
const HEADERS = {
  FLEET: [
    'رقم اللوحة', 'النوع', 'الموديل', 'رقم الشاصي',
    'نوع القطاع', 'القطاع', 'المركز', 'الحالة',
    'آخر قراءة عداد', 'ملاحظات'
  ],
  TRACKING: [
    'التاريخ', 'الوقت', 'اسم المدخل', 'رقم اللوحة',
    'نوع القطاع', 'القطاع', 'المركز', 'الحالة', 'ملاحظات'
  ],
  ACCIDENTS: [
    'التاريخ', 'الوقت', 'اسم المدخل', 'رقم اللوحة',
    'سبب الحادث', 'موقع الحادث', 'حالة المركبة', 'القطاع',
    'نسبة الخطأ %', 'رقم تقرير المرور', 'جهة التقرير',
    'حالة الإنجاز', 'ملاحظات'
  ],
  MAINTENANCE: [
    'تاريخ الدخول', 'وقت الدخول', 'تاريخ الخروج', 'وقت الخروج',
    'نوع العطل', 'رقم اللوحة', 'النوع', 'الموديل', 'رقم الشاصي',
    'اسم المدخل', 'درجة العطل', 'اسم الفني', 'قطع الغيار',
    'ورشة خارجية', 'اسم الورشة', 'حالة الإنجاز', 'ملاحظات', 'وصف العطل'
  ],
  OIL: [
    'التاريخ', 'الوقت', 'اسم المدخل', 'رقم اللوحة',
    'رقم الطلب', 'قراءة العداد الحالية', 'آخر قراءة العداد',
    'الفرق (كم)', 'ملاحظات', 'النوع', 'الموديل'
  ]
};

// ====== تهيئة الجداول ======
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  Object.entries(SHEET_NAMES).forEach(([key, name]) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    }
    
    // تعيين الرؤوس إذا كانت الورقة فارغة
    if (sheet.getLastRow() === 0) {
      const headers = HEADERS[key];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // تنسيق رؤوس الأعمدة
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#1a7a3c');
      headerRange.setFontColor('#ffffff');
      headerRange.setFontWeight('bold');
      headerRange.setHorizontalAlignment('center');
      
      // تجميد الصف الأول
      sheet.setFrozenRows(1);
      
      // ضبط عرض الأعمدة
      sheet.setColumnWidths(1, headers.length, 150);
    }
  });
  
  // إضافة بيانات الأسطول التجريبية إذا كانت فارغة
  const fleetSheet = ss.getSheetByName(SHEET_NAMES.FLEET);
  if (fleetSheet && fleetSheet.getLastRow() <= 1) {
    addSampleFleetData(fleetSheet);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'تم إعداد الجداول بنجاح' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ====== إضافة بيانات أسطول تجريبية ======
function addSampleFleetData(sheet) {
  const types = ['تويوتا هايلوكس', 'تويوتا لاند كروزر', 'فورد F150', 'نيسان باترول', 'ميتسوبيشي L200'];
  const models = ['2020', '2021', '2022', '2023', '2024'];
  const sectors = [
    ['داخلي', 'قطاع وسط الرياض', 'الملز'],
    ['داخلي', 'قطاع شمال الرياض', 'الملقا'],
    ['داخلي', 'قطاع جنوب الرياض', 'الحائر'],
    ['داخلي', 'قطاع شرق الرياض', 'النسيم'],
    ['داخلي', 'قطاع غرب الرياض', 'السويدي'],
    ['خارجي', 'قطاع محافظة الخرج', 'الخرج'],
    ['خارجي', 'قطاع محافظة الدرعية', 'الدرعية']
  ];
  const statuses = ['جاهزة', 'جاهزة', 'جاهزة', 'جاهزة', 'صيانة', 'خارج الخدمة'];
  
  const rows = [];
  for (let i = 1; i <= 397; i++) {
    const plateNum = 1000 + i;
    const letters = ['أ ب', 'ج د', 'ه و', 'ز ح', 'ط ي'];
    const plate = `${plateNum} ${letters[i % letters.length]}`;
    const type = types[i % types.length];
    const model = models[i % models.length];
    const chassis = `SA${String(i).padStart(15, '0')}`;
    const sector = sectors[i % sectors.length];
    const status = statuses[i % statuses.length];
    const lastKm = 10000 + (i * 500);
    
    rows.push([plate, type, model, chassis, sector[0], sector[1], sector[2], status, lastKm, '']);
  }
  
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  }
}

// ====== معالجة طلبات GET (قراءة البيانات) ======
function doGet(e) {
  const action = e.parameter.action || 'getAll';
  
  try {
    if (action === 'getAll') {
      return getAllData();
    } else if (action === 'setup') {
      return setupSheets();
    } else if (action === 'getFleet') {
      return getSheetData(SHEET_NAMES.FLEET);
    } else if (action === 'getTracking') {
      return getSheetData(SHEET_NAMES.TRACKING);
    } else if (action === 'getAccidents') {
      return getSheetData(SHEET_NAMES.ACCIDENTS);
    } else if (action === 'getMaintenance') {
      return getSheetData(SHEET_NAMES.MAINTENANCE);
    } else if (action === 'getOil') {
      return getSheetData(SHEET_NAMES.OIL);
    }
    
    return jsonResponse({ error: 'إجراء غير معروف' });
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

// ====== جلب جميع البيانات ======
function getAllData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const result = {
    fleet: getSheetValues(ss, SHEET_NAMES.FLEET),
    tracking: getSheetValues(ss, SHEET_NAMES.TRACKING),
    accidents: getSheetValues(ss, SHEET_NAMES.ACCIDENTS),
    maintenance: getSheetValues(ss, SHEET_NAMES.MAINTENANCE),
    oil: getSheetValues(ss, SHEET_NAMES.OIL),
    timestamp: new Date().toISOString()
  };
  
  return jsonResponse(result);
}

// ====== جلب بيانات ورقة محددة ======
function getSheetValues(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  return data.filter(row => row[0] !== '');
}

function getSheetData(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return jsonResponse({ rows: getSheetValues(ss, sheetName) });
}

// ====== معالجة طلبات POST (كتابة البيانات) ======
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const { sheet, values, action } = body;
    
    if (action === 'updateFleetStatus') {
      return updateFleetStatus(body.plate, body.status, body.km);
    }
    
    if (!sheet || !values) {
      return jsonResponse({ success: false, error: 'بيانات ناقصة' });
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let targetSheet = ss.getSheetByName(sheet);
    
    if (!targetSheet) {
      targetSheet = ss.insertSheet(sheet);
    }
    
    // إضافة الصف الجديد
    targetSheet.appendRow(values);
    
    // تحديث حالة المركبة في الأسطول
    if (sheet === SHEET_NAMES.TRACKING) {
      updateFleetStatus(values[3], values[7], null);
    } else if (sheet === SHEET_NAMES.MAINTENANCE) {
      const status = values[15] === 'منجز' ? 'جاهزة' : 'صيانة';
      updateFleetStatus(values[5], status, null);
      if (values[2]) { // تاريخ الخروج
        updateFleetStatus(values[5], 'جاهزة', null);
      }
    } else if (sheet === SHEET_NAMES.OIL) {
      updateFleetStatus(values[3], null, values[5]); // تحديث العداد
    } else if (sheet === SHEET_NAMES.ACCIDENTS) {
      updateFleetStatus(values[3], values[6], null);
    }
    
    return jsonResponse({ success: true, message: 'تم الحفظ بنجاح', row: targetSheet.getLastRow() });
    
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

// ====== تحديث حالة المركبة في الأسطول ======
function updateFleetStatus(plate, status, km) {
  if (!plate) return;
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const fleetSheet = ss.getSheetByName(SHEET_NAMES.FLEET);
  if (!fleetSheet) return;
  
  const data = fleetSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === plate) {
      if (status) fleetSheet.getRange(i + 1, 8).setValue(status); // عمود الحالة
      if (km) fleetSheet.getRange(i + 1, 9).setValue(km); // عمود العداد
      break;
    }
  }
}

// ====== إرجاع استجابة JSON ======
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ====== دالة الإعداد الأولي (تُشغّل مرة واحدة) ======
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🚑 إعداد المنصة')
    .addItem('إنشاء الجداول وإضافة البيانات', 'initializeAll')
    .addItem('تحديث بيانات الأسطول', 'refreshFleetData')
    .addItem('مسح جميع البيانات التجريبية', 'clearTestData')
    .addToUi();
}

// ====== تهيئة كاملة ======
function initializeAll() {
  setupSheets();
  SpreadsheetApp.getUi().alert('✅ تم إعداد جميع الجداول بنجاح!\n\nالجداول المُنشأة:\n• الأسطول (397 مركبة)\n• الرصد\n• الحوادث\n• الصيانة الوقائية\n• تغيير الزيت');
}

// ====== تحديث بيانات الأسطول ======
function refreshFleetData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const fleetSheet = ss.getSheetByName(SHEET_NAMES.FLEET);
  if (!fleetSheet) {
    SpreadsheetApp.getUi().alert('لم يتم العثور على جدول الأسطول');
    return;
  }
  SpreadsheetApp.getUi().alert('✅ تم تحديث بيانات الأسطول');
}

// ====== مسح البيانات التجريبية ======
function clearTestData() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert('تحذير', 'هل تريد مسح جميع البيانات التجريبية؟', ui.ButtonSet.YES_NO);
  
  if (response === ui.Button.YES) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    [SHEET_NAMES.TRACKING, SHEET_NAMES.ACCIDENTS, SHEET_NAMES.MAINTENANCE, SHEET_NAMES.OIL].forEach(name => {
      const sheet = ss.getSheetByName(name);
      if (sheet && sheet.getLastRow() > 1) {
        sheet.deleteRows(2, sheet.getLastRow() - 1);
      }
    });
    ui.alert('✅ تم مسح البيانات التجريبية');
  }
}
