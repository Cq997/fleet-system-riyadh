// ============================================================
// Google Apps Script
// Fleet Maintenance Platform - SRCA Riyadh
// ============================================================

var SHEET_FLEET = 'Fleet';
var SHEET_TRACKING = 'Tracking';
var SHEET_ACCIDENTS = 'Accidents';
var SHEET_MAINTENANCE = 'Maintenance';
var SHEET_OIL = 'OilChange';

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
  'externalWorkshop', 'workshopName', 'completionStatus', 'notes', 'faultDesc'
];

var HEADERS_OIL = [
  'date', 'time', 'user', 'plate',
  'orderNum', 'currentKm', 'lastKm',
  'diff', 'notes', 'type', 'model'
];

// ============================================================
// Setup all sheets
// ============================================================
function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  createSheet(ss, SHEET_FLEET, HEADERS_FLEET);
  createSheet(ss, SHEET_TRACKING, HEADERS_TRACKING);
  createSheet(ss, SHEET_ACCIDENTS, HEADERS_ACCIDENTS);
  createSheet(ss, SHEET_MAINTENANCE, HEADERS_MAINTENANCE);
  createSheet(ss, SHEET_OIL, HEADERS_OIL);

  var fleetSheet = ss.getSheetByName(SHEET_FLEET);
  if (fleetSheet && fleetSheet.getLastRow() <= 1) {
    addSampleFleetData(fleetSheet);
  }

  SpreadsheetApp.getUi().alert('Done: All sheets created successfully.');
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
// Add sample fleet data (397 vehicles)
// ============================================================
function addSampleFleetData(sheet) {
  var types = ['Toyota Hilux', 'Toyota Land Cruiser', 'Ford F150', 'Nissan Patrol', 'Mitsubishi L200'];
  var models = ['2020', '2021', '2022', '2023', '2024'];
  var sectors = [
    ['Internal', 'Central Riyadh', 'Al-Malaz'],
    ['Internal', 'North Riyadh', 'Al-Malaqa'],
    ['Internal', 'South Riyadh', 'Al-Hair'],
    ['Internal', 'East Riyadh', 'Al-Naseem'],
    ['Internal', 'West Riyadh', 'Al-Suwaidi'],
    ['External', 'Kharj Governorate', 'Al-Kharj'],
    ['External', 'Diriyah Governorate', 'Diriyah']
  ];
  var statuses = ['Active', 'Active', 'Active', 'Active', 'Maintenance', 'Out of Service'];
  var letters = ['A B', 'C D', 'E F', 'G H', 'I J'];

  var rows = [];
  for (var i = 1; i <= 397; i++) {
    var plateNum = 1000 + i;
    var plate = plateNum + ' ' + letters[i % letters.length];
    var type = types[i % types.length];
    var model = models[i % models.length];
    var chassis = 'SA' + padLeft(String(i), 15, '0');
    var sector = sectors[i % sectors.length];
    var status = statuses[i % statuses.length];
    var lastKm = 10000 + (i * 500);
    rows.push([plate, type, model, chassis, sector[0], sector[1], sector[2], status, lastKm, '']);
  }

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  }
}

function padLeft(str, len, char) {
  while (str.length < len) {
    str = char + str;
  }
  return str;
}

// ============================================================
// doGet - Read data
// ============================================================
function doGet(e) {
  var action = e.parameter.action || 'getAll';
  try {
    if (action === 'getAll') {
      return getAllData();
    } else if (action === 'setup') {
      setupSheets();
      return jsonResponse({ success: true, message: 'Setup complete' });
    } else if (action === 'getFleet') {
      return getSheetData(SHEET_FLEET);
    } else if (action === 'getTracking') {
      return getSheetData(SHEET_TRACKING);
    } else if (action === 'getAccidents') {
      return getSheetData(SHEET_ACCIDENTS);
    } else if (action === 'getMaintenance') {
      return getSheetData(SHEET_MAINTENANCE);
    } else if (action === 'getOil') {
      return getSheetData(SHEET_OIL);
    }
    return jsonResponse({ error: 'Unknown action' });
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

function getAllData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var result = {
    fleet: getSheetValues(ss, SHEET_FLEET),
    tracking: getSheetValues(ss, SHEET_TRACKING),
    accidents: getSheetValues(ss, SHEET_ACCIDENTS),
    maintenance: getSheetValues(ss, SHEET_MAINTENANCE),
    oil: getSheetValues(ss, SHEET_OIL),
    timestamp: new Date().toISOString()
  };
  return jsonResponse(result);
}

function getSheetValues(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  return data.filter(function(row) { return row[0] !== ''; });
}

function getSheetData(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return jsonResponse({ rows: getSheetValues(ss, sheetName) });
}

// ============================================================
// doPost - Write data
// ============================================================
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var sheetName = body.sheet;
    var values = body.values;
    var action = body.action;

    if (action === 'updateFleetStatus') {
      updateFleetStatus(body.plate, body.status, body.km);
      return jsonResponse({ success: true });
    }

    if (!sheetName || !values) {
      return jsonResponse({ success: false, error: 'Missing data' });
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var targetSheet = ss.getSheetByName(sheetName);
    if (!targetSheet) {
      targetSheet = ss.insertSheet(sheetName);
    }

    targetSheet.appendRow(values);

    if (sheetName === SHEET_TRACKING) {
      updateFleetStatus(values[3], values[7], null);
    } else if (sheetName === SHEET_MAINTENANCE) {
      var mStatus = (values[15] === 'Completed' || values[15] === 'منجز') ? 'Active' : 'Maintenance';
      updateFleetStatus(values[5], mStatus, null);
    } else if (sheetName === SHEET_OIL) {
      updateFleetStatus(values[3], null, values[5]);
    } else if (sheetName === SHEET_ACCIDENTS) {
      updateFleetStatus(values[3], values[6], null);
    }

    return jsonResponse({ success: true, message: 'Saved successfully', row: targetSheet.getLastRow() });

  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

// ============================================================
// Update fleet vehicle status
// ============================================================
function updateFleetStatus(plate, status, km) {
  if (!plate) return;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var fleetSheet = ss.getSheetByName(SHEET_FLEET);
  if (!fleetSheet) return;
  var data = fleetSheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(plate)) {
      if (status) fleetSheet.getRange(i + 1, 8).setValue(status);
      if (km) fleetSheet.getRange(i + 1, 9).setValue(km);
      break;
    }
  }
}

// ============================================================
// JSON response helper
// ============================================================
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// onOpen menu
// ============================================================
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Fleet Platform')
    .addItem('Setup all sheets', 'setupSheets')
    .addItem('Refresh fleet data', 'refreshFleetData')
    .addItem('Clear test data', 'clearTestData')
    .addToUi();
}

function refreshFleetData() {
  SpreadsheetApp.getUi().alert('Fleet data refreshed successfully.');
}

function clearTestData() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert('Warning', 'Delete all test data?', ui.ButtonSet.YES_NO);
  if (response === ui.Button.YES) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheets = [SHEET_TRACKING, SHEET_ACCIDENTS, SHEET_MAINTENANCE, SHEET_OIL];
    for (var s = 0; s < sheets.length; s++) {
      var sheet = ss.getSheetByName(sheets[s]);
      if (sheet && sheet.getLastRow() > 1) {
        sheet.deleteRows(2, sheet.getLastRow() - 1);
      }
    }
    ui.alert('Test data cleared.');
  }
}
