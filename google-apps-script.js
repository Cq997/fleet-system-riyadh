// ============================================================
// Google Apps Script - Fleet Management System, Riyadh
// Version 6.0 - Safe Schema, Permanent Updates, Optional Alerts
// ============================================================
// IMPORTANT: Run setupSheetsSafe() only. It preserves all existing fleet data.

var SH_FLEET       = "\u0627\u0644\u0623\u0633\u0637\u0648\u0644";
var SH_TRACKING    = "\u0631\u0635\u062f \u0627\u0644\u0645\u0631\u0643\u0628\u0627\u062a";
var SH_ACCIDENTS   = "\u0627\u0644\u062d\u0648\u0627\u062f\u062b";
var SH_MAINTENANCE = "\u0627\u0644\u0635\u064a\u0627\u0646\u0629 \u0627\u0644\u0648\u0642\u0627\u0626\u064a\u0629";
var SH_OIL         = "\u062a\u063a\u064a\u064a\u0631 \u0627\u0644\u0632\u064a\u062a";

function schemas() {
  return {
    fleet: [
      "\u0631\u0642\u0645_\u0627\u0644\u0644\u0648\u062d\u0629", "\u0627\u0644\u0646\u0648\u0639", "\u0627\u0644\u0645\u0648\u062f\u064a\u0644", "\u0631\u0642\u0645_\u0627\u0644\u0634\u0627\u0635\u064a", "\u0627\u0644\u0642\u0637\u0627\u0639", "\u0627\u0644\u0645\u0631\u0643\u0632", "\u0627\u0644\u062d\u0627\u0644\u0629", "\u0622\u062e\u0631_\u0642\u0631\u0627\u0621\u0629_\u0639\u062f\u0627\u062f", "\u062a\u0627\u0631\u064a\u062e_\u0622\u062e\u0631_\u062a\u063a\u064a\u064a\u0631_\u0632\u064a\u062a", "\u0642\u0631\u0627\u0621\u0629_\u0639\u062f\u0627\u062f_\u0622\u062e\u0631_\u062a\u063a\u064a\u064a\u0631_\u0632\u064a\u062a", "\u0627\u0644\u0645\u0648\u0642\u0639", "\u0645\u0644\u0627\u062d\u0638\u0627\u062a"
    ],
    tracking: [
      "\u0631\u0642\u0645_\u0627\u0644\u0637\u0644\u0628", "\u0627\u0644\u062a\u0627\u0631\u064a\u062e", "\u0627\u0644\u0648\u0642\u062a", "\u0631\u0642\u0645_\u0627\u0644\u0644\u0648\u062d\u0629", "\u0627\u0644\u0646\u0648\u0639", "\u0627\u0644\u0645\u0648\u062f\u064a\u0644", "\u0627\u0644\u0642\u0637\u0627\u0639", "\u0627\u0644\u0645\u0631\u0643\u0632", "\u0627\u0644\u0645\u0648\u0642\u0639", "\u0627\u0644\u062d\u0627\u0644\u0629", "\u0642\u0631\u0627\u0621\u0629_\u0627\u0644\u0639\u062f\u0627\u062f", "\u0645\u0644\u0627\u062d\u0638\u0627\u062a", "\u062d\u0627\u0644\u0629_\u0627\u0644\u0625\u0646\u062c\u0627\u0632", "\u0648\u0642\u062a_\u0627\u0644\u0625\u062f\u062e\u0627\u0644", "\u062a\u0627\u0631\u064a\u062e_\u0627\u0644\u062a\u062d\u062f\u064a\u062b"
    ],
    accidents: [
      "\u0631\u0642\u0645_\u0627\u0644\u0637\u0644\u0628", "\u0627\u0644\u062a\u0627\u0631\u064a\u062e", "\u0627\u0644\u0648\u0642\u062a", "\u0631\u0642\u0645_\u0627\u0644\u0644\u0648\u062d\u0629", "\u0627\u0644\u0646\u0648\u0639", "\u0627\u0644\u0642\u0637\u0627\u0639", "\u0627\u0644\u0645\u0631\u0643\u0632", "\u0646\u0648\u0639_\u0627\u0644\u062d\u0627\u062f\u062b", "\u0648\u0635\u0641_\u0627\u0644\u062d\u0627\u062f\u062b", "\u0627\u0644\u0623\u0636\u0631\u0627\u0631", "\u0631\u0642\u0645_\u0627\u0644\u062a\u0642\u0631\u064a\u0631", "\u0627\u0644\u062c\u0647\u0629_\u0627\u0644\u0645\u0635\u062f\u0631\u0629", "\u0646\u0633\u0628\u0629_\u0627\u0644\u062e\u0637\u0623", "\u0627\u0644\u062d\u0627\u0644\u0629", "\u062d\u0627\u0644\u0629_\u0627\u0644\u0625\u0646\u062c\u0627\u0632", "\u0648\u0642\u062a_\u0627\u0644\u0625\u062f\u062e\u0627\u0644", "\u062a\u0627\u0631\u064a\u062e_\u0627\u0644\u062a\u062d\u062f\u064a\u062b"
    ],
    maintenance: [
      "\u0631\u0642\u0645_\u0627\u0644\u0637\u0644\u0628", "\u0627\u0644\u062a\u0627\u0631\u064a\u062e", "\u0631\u0642\u0645_\u0627\u0644\u0644\u0648\u062d\u0629", "\u0627\u0644\u0646\u0648\u0639", "\u0627\u0644\u0645\u0648\u062f\u064a\u0644", "\u0627\u0644\u0642\u0637\u0627\u0639", "\u0627\u0644\u0645\u0631\u0643\u0632", "\u0642\u0631\u0627\u0621\u0629_\u0627\u0644\u0639\u062f\u0627\u062f", "\u0646\u0648\u0639_\u0627\u0644\u0639\u0637\u0644", "\u0648\u0635\u0641_\u0627\u0644\u0639\u0637\u0644", "\u0642\u0637\u0639_\u0627\u0644\u063a\u064a\u0627\u0631", "\u0627\u0644\u0641\u0646\u064a_\u0627\u0644\u0645\u0633\u0624\u0648\u0644", "\u0627\u0644\u062a\u0643\u0644\u0641\u0629_\u0627\u0644\u062a\u0642\u062f\u064a\u0631\u064a\u0629", "\u062d\u0627\u0644\u0629_\u0627\u0644\u0625\u0646\u062c\u0627\u0632", "\u0645\u0644\u0627\u062d\u0638\u0627\u062a", "\u0648\u0642\u062a_\u0627\u0644\u0625\u062f\u062e\u0627\u0644", "\u062a\u0627\u0631\u064a\u062e_\u0627\u0644\u062a\u062d\u062f\u064a\u062b"
    ],
    oil: [
      "\u0631\u0642\u0645_\u0627\u0644\u0637\u0644\u0628", "\u0627\u0644\u062a\u0627\u0631\u064a\u062e", "\u0631\u0642\u0645_\u0627\u0644\u0644\u0648\u062d\u0629", "\u0627\u0644\u0646\u0648\u0639", "\u0627\u0644\u0645\u0648\u062f\u064a\u0644", "\u0627\u0644\u0642\u0637\u0627\u0639", "\u0627\u0644\u0645\u0631\u0643\u0632", "\u0642\u0631\u0627\u0621\u0629_\u0627\u0644\u0639\u062f\u0627\u062f", "\u0646\u0648\u0639_\u0627\u0644\u0632\u064a\u062a", "\u0627\u0644\u0641\u0646\u064a_\u0627\u0644\u0645\u0633\u0624\u0648\u0644", "\u0627\u0644\u0645\u0648\u0639\u062f_\u0627\u0644\u0642\u0627\u062f\u0645_\u0643\u0645", "\u0627\u0644\u0645\u0648\u0639\u062f_\u0627\u0644\u0642\u0627\u062f\u0645_\u062a\u0627\u0631\u064a\u062e", "\u0645\u0644\u0627\u062d\u0638\u0627\u062a", "\u062d\u0627\u0644\u0629_\u0627\u0644\u0625\u0646\u062c\u0627\u0632", "\u0648\u0642\u062a_\u0627\u0644\u0625\u062f\u062e\u0627\u0644", "\u062a\u0627\u0631\u064a\u062e_\u0627\u0644\u062a\u062d\u062f\u064a\u062b"
    ]
  };
}

function sheetMap() {
  return [
    {key: 'fleet', name: SH_FLEET, schema: schemas().fleet, color: '#1a472a'},
    {key: 'tracking', name: SH_TRACKING, schema: schemas().tracking, color: '#1a3a5c'},
    {key: 'accidents', name: SH_ACCIDENTS, schema: schemas().accidents, color: '#7b1a1a'},
    {key: 'maintenance', name: SH_MAINTENANCE, schema: schemas().maintenance, color: '#4a3500'},
    {key: 'oil', name: SH_OIL, schema: schemas().oil, color: '#1a4a4a'}
  ];
}

function doGet(e) {
  var p = e && e.parameter ? e.parameter : {};
  var action = p.action || 'getAll';
  var result;
  try {
    var data = p.data ? JSON.parse(p.data) : {};
    if (action === 'getAll') result = getAllData();
    else if (action === 'add') result = addRow(p.sheet, data);
    else if (action === 'update') result = updateRow(p.sheet, data);
    else if (action === 'updateFleet') result = updateFleet(data);
    else if (action === 'setup') result = setupSheetsSafe();
    else result = {status: 'error', message: 'Unknown action'};
  } catch (err) {
    result = {status: 'error', message: String(err)};
  }
  return output(result, p.callback || '');
}

function doPost(e) {
  try {
    var body = e && e.postData ? JSON.parse(e.postData.contents) : {};
    var action = body.action || 'add';
    var result = action === 'getAll' ? getAllData() : action === 'update' ? updateRow(body.sheet, body.data || {}) : action === 'updateFleet' ? updateFleet(body.data || {}) : addRow(body.sheet, body.data || {});
    return output(result, '');
  } catch (err) {
    return output({status: 'error', message: String(err)}, '');
  }
}

function output(result, callback) {
  var json = JSON.stringify(result);
  return ContentService.createTextOutput(callback ? callback + '(' + json + ')' : json)
    .setMimeType(callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
}

function getAllData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var out = {status: 'success', timestamp: new Date().toISOString()};
  sheetMap().forEach(function(info) {
    var sh = ss.getSheetByName(info.name);
    out[info.key] = sh ? readSheet(sh) : [];
  });
  return out;
}

function readSheet(sheet) {
  if (sheet.getLastRow() < 2 || sheet.getLastColumn() < 1) return [];
  var values = sheet.getDataRange().getValues();
  var headers = values[0].map(function(x) { return String(x).trim(); });
  return values.slice(1).filter(function(row) { return row.some(function(cell) { return cell !== ''; }); }).map(function(row) {
    var obj = {};
    headers.forEach(function(header, i) {
      var value = row[i];
      if (Object.prototype.toString.call(value) === '[object Date]') value = Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      obj[header] = value;
    });
    return obj;
  });
}

function ensureSheet(name) {
  var map = sheetMap();
  var info = map.filter(function(item) { return item.name === name; })[0];
  if (!info) throw new Error('Unknown sheet');
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  var existing = sheet.getLastColumn() ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(x) { return String(x).trim(); }) : [];
  if (!existing.length || !existing.some(function(v) { return v; })) {
    sheet.getRange(1, 1, 1, info.schema.length).setValues([info.schema]);
    existing = info.schema.slice();
  } else {
    var missing = info.schema.filter(function(header) { return existing.indexOf(header) === -1; });
    if (missing.length) {
      sheet.getRange(1, existing.length + 1, 1, missing.length).setValues([missing]);
      existing = existing.concat(missing);
    }
  }
  var range = sheet.getRange(1, 1, 1, existing.length);
  range.setBackground(info.color).setFontColor('#ffffff').setFontWeight('bold').setHorizontalAlignment('center');
  sheet.setFrozenRows(1);
  sheet.setRightToLeft(true);
  return sheet;
}

function addRow(sheetName, data) {
  var sheet = ensureSheet(sheetName);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  sheet.appendRow(headers.map(function(header) { return data.hasOwnProperty(header) ? data[header] : ''; }));
  return {status: 'success', action: 'add', row: sheet.getLastRow()};
}

function updateRow(sheetName, data) {
  var sheet = ensureSheet(sheetName);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var idField = headers.indexOf('\u0631\u0642\u0645_\u0627\u0644\u0637\u0644\u0628') !== -1 ? '\u0631\u0642\u0645_\u0627\u0644\u0637\u0644\u0628' : '\u0631\u0642\u0645_\u0627\u0644\u0644\u0648\u062d\u0629';
  if (!data[idField]) return {status: 'error', message: 'Missing record id'};
  var idIndex = headers.indexOf(idField);
  var values = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues() : [];
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][idIndex]) === String(data[idField])) {
      var row = values[i];
      headers.forEach(function(header, col) { if (data.hasOwnProperty(header)) row[col] = data[header]; });
      sheet.getRange(i + 2, 1, 1, headers.length).setValues([row]);
      return {status: 'success', action: 'update', row: i + 2};
    }
  }
  return {status: 'error', message: 'Record not found'};
}

function updateFleet(data) {
  return updateRow(SH_FLEET, data);
}

function setupSheetsSafe() {
  sheetMap().forEach(function(info) { ensureSheet(info.name); });
  return {status: 'success', message: 'Safe setup complete'};
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Fleet System')
    .addItem('Safe setup (preserve data)', 'setupSheetsSafe')
    .addItem('Test data connection', 'testGetAll')
    .addToUi();
}

function testGetAll() {
  Logger.log(JSON.stringify(getAllData()));
}
