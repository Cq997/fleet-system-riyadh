// ============================================================
// Google Apps Script - Fleet Management System
// Saudi Red Crescent Authority - Riyadh Region
// Version: 4.0 - Arabic Sheets
// ============================================================
// HOW TO USE:
// 1. Open Google Sheets
// 2. Extensions > Apps Script
// 3. Delete all code, paste this file
// 4. Save (Ctrl+S)
// 5. Run: setupSheets()
// 6. Deploy > New deployment > Web App
//    Execute as: Me | Access: Anyone
// 7. Copy Web App URL to platform settings
// ============================================================

var SHEETS = {
  fleet:       "\u0627\u0644\u0623\u0633\u0637\u0648\u0644",
  tracking:    "\u0631\u0635\u062f \u0627\u0644\u0645\u0631\u0643\u0628\u0627\u062a",
  accidents:   "\u0627\u0644\u062d\u0648\u0627\u062f\u062b",
  maintenance: "\u0627\u0644\u0635\u064a\u0627\u0646\u0629 \u0627\u0644\u0648\u0642\u0627\u0626\u064a\u0629",
  oil:         "\u062a\u063a\u064a\u064a\u0631 \u0627\u0644\u0632\u064a\u062a"
};

var HEADERS = {};

HEADERS.fleet = [
  "\u0631\u0642\u0645_\u0627\u0644\u0644\u0648\u062d\u0629",
  "\u0627\u0644\u0646\u0648\u0639",
  "\u0627\u0644\u0645\u0648\u062f\u064a\u0644",
  "\u0631\u0642\u0645_\u0627\u0644\u0634\u0627\u0635\u064a",
  "\u0627\u0644\u0642\u0637\u0627\u0639",
  "\u0627\u0644\u0645\u0631\u0643\u0632",
  "\u0627\u0644\u062d\u0627\u0644\u0629",
  "\u0622\u062e\u0631_\u0642\u0631\u0627\u0621\u0629_\u0639\u062f\u0627\u062f",
  "\u062a\u0627\u0631\u064a\u062e_\u0622\u062e\u0631_\u062a\u063a\u064a\u064a\u0631_\u0632\u064a\u062a",
  "\u0642\u0631\u0627\u0621\u0629_\u0639\u062f\u0627\u062f_\u0622\u062e\u0631_\u062a\u063a\u064a\u064a\u0631_\u0632\u064a\u062a",
  "\u0645\u0644\u0627\u062d\u0638\u0627\u062a"
];

HEADERS.tracking = [
  "\u0631\u0642\u0645_\u0627\u0644\u0637\u0644\u0628",
  "\u0627\u0644\u062a\u0627\u0631\u064a\u062e",
  "\u0627\u0644\u0648\u0642\u062a",
  "\u0631\u0642\u0645_\u0627\u0644\u0644\u0648\u062d\u0629",
  "\u0627\u0644\u0646\u0648\u0639",
  "\u0627\u0644\u0642\u0637\u0627\u0639",
  "\u0627\u0644\u0645\u0631\u0643\u0632",
  "\u0627\u0644\u0645\u0648\u0642\u0639",
  "\u0627\u0644\u062d\u0627\u0644\u0629",
  "\u0642\u0631\u0627\u0621\u0629_\u0627\u0644\u0639\u062f\u0627\u062f",
  "\u0645\u0644\u0627\u062d\u0638\u0627\u062a",
  "\u062d\u0627\u0644\u0629_\u0627\u0644\u0625\u0646\u062c\u0627\u0632",
  "\u0648\u0642\u062a_\u0627\u0644\u0625\u062f\u062e\u0627\u0644"
];

HEADERS.accidents = [
  "\u0631\u0642\u0645_\u0627\u0644\u0637\u0644\u0628",
  "\u0627\u0644\u062a\u0627\u0631\u064a\u062e",
  "\u0627\u0644\u0648\u0642\u062a",
  "\u0631\u0642\u0645_\u0627\u0644\u0644\u0648\u062d\u0629",
  "\u0627\u0644\u0646\u0648\u0639",
  "\u0627\u0644\u0642\u0637\u0627\u0639",
  "\u0627\u0644\u0645\u0631\u0643\u0632",
  "\u0646\u0648\u0639_\u0627\u0644\u062d\u0627\u062f\u062b",
  "\u0648\u0635\u0641_\u0627\u0644\u062d\u0627\u062f\u062b",
  "\u0627\u0644\u0623\u0636\u0631\u0627\u0631",
  "\u0627\u0644\u062d\u0627\u0644\u0629",
  "\u062d\u0627\u0644\u0629_\u0627\u0644\u0625\u0646\u062c\u0627\u0632",
  "\u062a\u0627\u0631\u064a\u062e_\u0627\u0644\u062a\u062d\u062f\u064a\u062b",
  "\u0648\u0642\u062a_\u0627\u0644\u0625\u062f\u062e\u0627\u0644"
];

HEADERS.maintenance = [
  "\u0631\u0642\u0645_\u0627\u0644\u0637\u0644\u0628",
  "\u0627\u0644\u062a\u0627\u0631\u064a\u062e",
  "\u0631\u0642\u0645_\u0627\u0644\u0644\u0648\u062d\u0629",
  "\u0627\u0644\u0646\u0648\u0639",
  "\u0627\u0644\u0645\u0648\u062f\u064a\u0644",
  "\u0627\u0644\u0642\u0637\u0627\u0639",
  "\u0627\u0644\u0645\u0631\u0643\u0632",
  "\u0646\u0648\u0639_\u0627\u0644\u0639\u0637\u0644",
  "\u0648\u0635\u0641_\u0627\u0644\u0639\u0637\u0644",
  "\u0642\u0637\u0639_\u0627\u0644\u063a\u064a\u0627\u0631",
  "\u0627\u0644\u0641\u0646\u064a_\u0627\u0644\u0645\u0633\u0624\u0648\u0644",
  "\u0642\u0631\u0627\u0621\u0629_\u0627\u0644\u0639\u062f\u0627\u062f",
  "\u0627\u0644\u062a\u0643\u0644\u0641\u0629_\u0627\u0644\u062a\u0642\u062f\u064a\u0631\u064a\u0629",
  "\u062d\u0627\u0644\u0629_\u0627\u0644\u0625\u0646\u062c\u0627\u0632",
  "\u062a\u0627\u0631\u064a\u062e_\u0627\u0644\u0625\u0646\u062c\u0627\u0632",
  "\u0648\u0642\u062a_\u0627\u0644\u0625\u062f\u062e\u0627\u0644"
];

HEADERS.oil = [
  "\u0631\u0642\u0645_\u0627\u0644\u0637\u0644\u0628",
  "\u0627\u0644\u062a\u0627\u0631\u064a\u062e",
  "\u0631\u0642\u0645_\u0627\u0644\u0644\u0648\u062d\u0629",
  "\u0627\u0644\u0646\u0648\u0639",
  "\u0627\u0644\u0645\u0648\u062f\u064a\u0644",
  "\u0627\u0644\u0642\u0637\u0627\u0639",
  "\u0627\u0644\u0645\u0631\u0643\u0632",
  "\u0642\u0631\u0627\u0621\u0629_\u0627\u0644\u0639\u062f\u0627\u062f",
  "\u0646\u0648\u0639_\u0627\u0644\u0632\u064a\u062a",
  "\u0627\u0644\u0641\u0646\u064a_\u0627\u0644\u0645\u0633\u0624\u0648\u0644",
  "\u0627\u0644\u0645\u0648\u0639\u062f_\u0627\u0644\u0642\u0627\u062f\u0645_\u0643\u0645",
  "\u0627\u0644\u0645\u0648\u0639\u062f_\u0627\u0644\u0642\u0627\u062f\u0645_\u062a\u0627\u0631\u064a\u062e",
  "\u0645\u0644\u0627\u062d\u0638\u0627\u062a",
  "\u062d\u0627\u0644\u0629_\u0627\u0644\u0625\u0646\u062c\u0627\u0632",
  "\u0648\u0642\u062a_\u0627\u0644\u0625\u062f\u062e\u0627\u0644"
];

// ============================================================
// doGet - Main Web App Entry Point
// ============================================================
function doGet(e) {
  var params = e.parameter;
  var action = params.action || "get";
  var callback = params.callback || "";
  var result;

  try {
    if (action === "get") {
      var sName = params.sheet || SHEETS.fleet;
      result = getSheetData(sName);
    } else if (action === "add") {
      var sName2 = params.sheet || SHEETS.fleet;
      var dataStr = params.data || "{}";
      var dataObj = JSON.parse(dataStr);
      result = addRow(sName2, dataObj);
    } else if (action === "getAll") {
      result = getAllData();
    } else if (action === "setup") {
      setupSheets();
      result = { status: "success", message: "Setup complete" };
    } else {
      result = { status: "error", message: "Unknown action" };
    }
  } catch (err) {
    result = { status: "error", message: err.toString() };
  }

  var jsonStr = JSON.stringify(result);
  if (callback) {
    return ContentService.createTextOutput(callback + "(" + jsonStr + ")")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(jsonStr)
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// Get All Data from All Sheets
// ============================================================
function getAllData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var result = {};
  var keys = ["fleet", "tracking", "accidents", "maintenance", "oil"];

  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    var sheet = ss.getSheetByName(SHEETS[k]);
    if (sheet && sheet.getLastRow() > 1) {
      var data = sheet.getDataRange().getValues();
      var headers = data[0];
      var rows = [];
      for (var r = 1; r < data.length; r++) {
        var rowObj = {};
        for (var c = 0; c < headers.length; c++) {
          rowObj[headers[c]] = data[r][c];
        }
        rows.push(rowObj);
      }
      result[k] = rows;
    } else {
      result[k] = [];
    }
  }

  result.status = "success";
  result.timestamp = new Date().toISOString();
  return result;
}

// ============================================================
// Get Data from One Sheet
// ============================================================
function getSheetData(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    return { status: "error", message: "Sheet not found", data: [] };
  }
  if (sheet.getLastRow() <= 1) {
    return { status: "success", data: [], count: 0 };
  }
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var rows = [];
  for (var r = 1; r < data.length; r++) {
    var rowObj = {};
    for (var c = 0; c < headers.length; c++) {
      rowObj[headers[c]] = data[r][c];
    }
    rows.push(rowObj);
  }
  return { status: "success", data: rows, count: rows.length };
}

// ============================================================
// Add Row to Sheet
// ============================================================
function addRow(sheetName, dataObj) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) {
    return { status: "error", message: "Sheet has no headers" };
  }
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var row = [];
  for (var i = 0; i < headers.length; i++) {
    var h = headers[i];
    row.push(dataObj[h] !== undefined ? dataObj[h] : "");
  }
  sheet.appendRow(row);
  return { status: "success", message: "Row added", sheet: sheetName };
}

// ============================================================
// Setup All Sheets - Run Once
// ============================================================
function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var colors = {
    fleet:       "#1a472a",
    tracking:    "#1a3a5c",
    accidents:   "#7b1a1a",
    maintenance: "#4a3500",
    oil:         "#1a4a4a"
  };
  var keys = ["fleet", "tracking", "accidents", "maintenance", "oil"];
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    buildSheet(ss, SHEETS[k], HEADERS[k], colors[k]);
  }
  try {
    SpreadsheetApp.getUi().alert("Done! All 5 sheets created successfully.");
  } catch (e2) {
    Logger.log("Setup complete - all sheets created");
  }
}

function buildSheet(ss, name, headers, color) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  sheet.clearContents();
  var r = sheet.getRange(1, 1, 1, headers.length);
  r.setValues([headers]);
  r.setBackground(color || "#1a472a");
  r.setFontColor("#ffffff");
  r.setFontWeight("bold");
  r.setHorizontalAlignment("center");
  sheet.setFrozenRows(1);
  sheet.setRightToLeft(true);
  for (var i = 1; i <= headers.length; i++) {
    sheet.setColumnWidth(i, 160);
  }
  return sheet;
}

// ============================================================
// onOpen Menu
// ============================================================
function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu("Fleet System")
      .addItem("Setup Sheets", "setupSheets")
      .addToUi();
  } catch (e3) {
    Logger.log("onOpen: " + e3);
  }
}
