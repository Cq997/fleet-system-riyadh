// ============================================================
// Google Apps Script
// Fleet Maintenance Platform - SRCA Riyadh Region
// Developer: Ali 102459@srca.org.sa
// Supervisor: Thamer Ayyad Al-Harbi
// ============================================================

var SHEET_FLEET       = 'Fleet';
var SHEET_TRACKING    = 'Tracking';
var SHEET_ACCIDENTS   = 'Accidents';
var SHEET_MAINTENANCE = 'Maintenance';
var SHEET_OIL         = 'OilChange';

var HEADERS_FLEET = [
  'plate', 'type', 'model', 'chassis',
  'sectorType', 'sector', 'center', 'status',
  'lastKm', 'notes'
];

var HEADERS_TRACKING = [
  'date', 'time', 'user', 'plate',
  'sectorType', 'sector', 'center', 'status', 'notes'
];

var HEADERS_ACCIDENTS = [
  'date', 'time', 'user', 'plate',
  'cause', 'location', 'vehicleStatus', 'sector',
  'faultPercent', 'reportNum', 'reportAuthority',
  'completionStatus', 'notes'
];

var HEADERS_MAINTENANCE = [
  'entryDate', 'entryTime', 'exitDate', 'exitTime',
  'faultType', 'plate', 'type', 'model', 'chassis',
  'user', 'faultLevel', 'techName', 'spareParts',
  'externalWorkshop', 'workshopName', 'completionStatus',
  'notes', 'faultDesc'
];

var HEADERS_OIL = [
  'date', 'time', 'user', 'plate',
  'orderNum', 'currentKm', 'lastKm',
  'diff', 'notes', 'type', 'model'
];

// ============================================================
// setupSheets - Run this once to create all sheets
// ============================================================
function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  createSheet(ss, SHEET_FLEET,       HEADERS_FLEET);
  createSheet(ss, SHEET_TRACKING,    HEADERS_TRACKING);
  createSheet(ss, SHEET_ACCIDENTS,   HEADERS_ACCIDENTS);
  createSheet(ss, SHEET_MAINTENANCE, HEADERS_MAINTENANCE);
  createSheet(ss, SHEET_OIL,         HEADERS_OIL);

  var fleetSheet = ss.getSheetByName(SHEET_FLEET);
  if (fleetSheet && fleetSheet.getLastRow() <= 1) {
    addSampleFleetData(fleetSheet);
  }

  SpreadsheetApp.getUi().alert('All sheets created successfully.');
}

function createSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    var hRange = sheet.getRange(1, 1, 1, headers.length);
    hRange.setBackground('#1a7a3c');
    hRange.setFontColor('#ffffff');
    hRange.setFontWeight('bold');
    hRange.setHorizontalAlignment('center');
    sheet.setFrozenRows(1);
    sheet.setColumnWidths(1, headers.length, 150);
  }
  return sheet;
}

// ============================================================
// Add 397 sample vehicles
// ============================================================
function addSampleFleetData(sheet) {
  var types   = ['Toyota Hilux', 'Toyota Land Cruiser', 'Ford F150', 'Nissan Patrol', 'Mitsubishi L200'];
  var models  = ['2020', '2021', '2022', '2023', '2024'];
  var letters = ['A B', 'C D', 'E F', 'G H', 'I J'];
  var sectors = [
    ['Internal', 'Central Riyadh',    'Al-Malaz'],
    ['Internal', 'North Riyadh',      'Al-Malaqa'],
    ['Internal', 'South Riyadh',      'Al-Hair'],
    ['Internal', 'East Riyadh',       'Al-Naseem'],
    ['Internal', 'West Riyadh',       'Al-Suwaidi'],
    ['External', 'Kharj Governorate', 'Al-Kharj'],
    ['External', 'Diriyah',           'Diriyah']
  ];
  var statuses = ['Active', 'Active', 'Active', 'Active', 'Maintenance', 'Out of Service'];

  var rows = [];
  for (var i = 1; i <= 397; i++) {
    var plateNum = 1000 + i;
    var plate    = plateNum + ' ' + letters[i % letters.length];
    var type     = types[i % types.length];
    var model    = models[i % models.length];
    var chassis  = 'SA' + padLeft(String(i), 15, '0');
    var sector   = sectors[i % sectors.length];
    var status   = statuses[i % statuses.length];
    var lastKm   = 10000 + (i * 500);
    rows.push([plate, type, model, chassis, sector[0], sector[1], sector[2], status, lastKm, '']);
  }

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  }
}

function padLeft(str, len, ch) {
  while (str.length < len) { str = ch + str; }
  return str;
}

// ============================================================
// doGet - Read data (HTTP GET)
// ============================================================
function doGet(e) {
  var action = e.parameter.action || 'getAll';
  try {
    if (action === 'getAll')         return getAllData();
    if (action === 'setup')          { setupSheets(); return jsonOk('Setup complete'); }
    if (action === 'getFleet')       return getSheetData(SHEET_FLEET);
    if (action === 'getTracking')    return getSheetData(SHEET_TRACKING);
    if (action === 'getAccidents')   return getSheetData(SHEET_ACCIDENTS);
    if (action === 'getMaintenance') return getSheetData(SHEET_MAINTENANCE);
    if (action === 'getOil')         return getSheetData(SHEET_OIL);
    return jsonResponse({ error: 'Unknown action: ' + action });
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

function getAllData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return jsonResponse({
    fleet:       getSheetValues(ss, SHEET_FLEET),
    tracking:    getSheetValues(ss, SHEET_TRACKING),
    accidents:   getSheetValues(ss, SHEET_ACCIDENTS),
    maintenance: getSheetValues(ss, SHEET_MAINTENANCE),
    oil:         getSheetValues(ss, SHEET_OIL),
    timestamp:   new Date().toISOString()
  });
}

function getSheetValues(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  var result = [];
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] !== '') result.push(data[i]);
  }
  return result;
}

function getSheetData(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return jsonResponse({ rows: getSheetValues(ss, sheetName) });
}

// ============================================================
// doPost - Write data (HTTP POST)
// ============================================================
function doPost(e) {
  try {
    var body      = JSON.parse(e.postData.contents);
    var sheetName = body.sheet;
    var values    = body.values;
    var action    = body.action;

    if (action === 'updateFleetStatus') {
      updateFleetStatus(body.plate, body.status, body.km);
      return jsonOk('Status updated');
    }

    if (!sheetName || !values) {
      return jsonResponse({ success: false, error: 'Missing sheet or values' });
    }

    var ss          = SpreadsheetApp.getActiveSpreadsheet();
    var targetSheet = ss.getSheetByName(sheetName);
    if (!targetSheet) targetSheet = ss.insertSheet(sheetName);

    targetSheet.appendRow(values);

    // Auto-update fleet status
    if (sheetName === SHEET_TRACKING) {
      updateFleetStatus(values[3], values[7], null);

    } else if (sheetName === SHEET_MAINTENANCE) {
      var mStatus = (values[15] === 'Completed') ? 'Active' : 'Maintenance';
      updateFleetStatus(values[5], mStatus, null);

    } else if (sheetName === SHEET_OIL) {
      updateFleetStatus(values[3], null, values[5]);

    } else if (sheetName === SHEET_ACCIDENTS) {
      updateFleetStatus(values[3], values[6], null);
    }

    return jsonResponse({ success: true, message: 'Saved', row: targetSheet.getLastRow() });

  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

// ============================================================
// Update vehicle status in Fleet sheet
// ============================================================
function updateFleetStatus(plate, status, km) {
  if (!plate) return;
  var ss         = SpreadsheetApp.getActiveSpreadsheet();
  var fleetSheet = ss.getSheetByName(SHEET_FLEET);
  if (!fleetSheet) return;
  var data = fleetSheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(plate)) {
      if (status) fleetSheet.getRange(i + 1, 8).setValue(status);
      if (km)     fleetSheet.getRange(i + 1, 9).setValue(km);
      break;
    }
  }
}

// ============================================================
// Helpers
// ============================================================
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonOk(msg) {
  return jsonResponse({ success: true, message: msg });
}

// ============================================================
// onOpen menu
// ============================================================
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Fleet Platform')
    .addItem('Setup all sheets', 'setupSheets')
    .addItem('Clear test data',  'clearTestData')
    .addToUi();
}

function clearTestData() {
  var ui       = SpreadsheetApp.getUi();
  var response = ui.alert('Warning', 'Delete all test data?', ui.ButtonSet.YES_NO);
  if (response !== ui.Button.YES) return;
  var ss     = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = [SHEET_TRACKING, SHEET_ACCIDENTS, SHEET_MAINTENANCE, SHEET_OIL];
  for (var s = 0; s < sheets.length; s++) {
    var sheet = ss.getSheetByName(sheets[s]);
    if (sheet && sheet.getLastRow() > 1) {
      sheet.deleteRows(2, sheet.getLastRow() - 1);
    }
  }
  ui.alert('Test data cleared.');
}
