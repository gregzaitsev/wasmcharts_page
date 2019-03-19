
const canvasRelHeight = 0.4
const previewRelHeight = 0.08
const buttonAreaRelHeight = 0.2
const pad = 20;
const hpad = 20;
const left = hpad;

// Data
var dataSet = 4;           // Data set from test file to use
var dataSeries;
var dataColNames = [];
var xIndex = 0;            // Index of column that contains x axis data
var minX;
var maxX;
var globalMinY;
var globalMaxY;
var seriesIndexByName = [];
var seriesEnabledByName = [];
var hoverLineX;
var seriesColorByName = [];
var selectedPoints = [];
var selectedIndex = -1;

// Axis marks
const minMarkSpace = 1/8.1; // as fraction of total width/height
const maxMarkSpace = 1/4;
var xLabels = [];
var yLabels = [];
console.log("data=", data);

// Wasm
let wasmInst; // WASM instance
let memory;
let initFunc;
let renderMainFunc;
let renderPrevFunc;
let setThemeFunc;
let addDataPointFunc;
let toggleSeriesFunc;
let setSeriesCountFunc;
let setVisibleRectFunc;
let setVisibleRectPrevFunc;
let addXMarkFunc;
let addYMarkFunc;
let removeXMarkFunc;
let removeYMarkFunc;
let resetMarksFunc;
let setSeriesColorFunc;
let getCanvasXFunc;
let getCanvasYFunc;

const wasmBlob = "";

// UI dimentions
const dpi = window.devicePixelRatio;
let viewPortWidth;
let viewPortHeight;
let allwidth; // All vertical components widths
let width;   // Main canvas size and coordinates
let height;
let ctop;
let pwidth;  // Preview canvas size and coordinates
let pheight;
let ptop;
let btop;    // Button area top

// Theme colors
var mode = 'Day';
const themes = {
  'Day': {
    back: '#FFFFFF',
    text: '#000000',
    backClass: 'dayBack',
    nextMode: 'Night',
    rangeSelector: '#eeeef5'
  },
  'Night': {
    back: '#000033',
    text: '#FFFFFF',
    backClass: 'nightBack',
    nextMode: 'Day',
    rangeSelector: '#333333'
  }
};
const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Range selector
const dragwidth = 10;
let rangeleft;   // Relative coordinates of slider
let rangeright;
let middleDragEl;
let pos1 = 0, pos3 = 0;
let currentMaxY;
let currentMinY;

//function decodeWasm(b64) {
//  const str = window.atob(b64);
//  const array = new Uint8Array(str.length);
//  for (let i = 0; i < str.length; i += 1) {
//    array[i] = str.charCodeAt(i);
//  }
//  return array.buffer;
//};
//const wasmBuf = new Uint8Array(decodeWasm(wasmBlob));

function setElementRect(elId, x, y, w, h) {
  const el = document.getElementById(elId);
  el.style.top = `${y}px`
  el.style.height = `${h}px`
  el.style.width = `${w}px`
  el.style.left = `${x}px`;
}

function setCanvasDimensions(canvId, left, top, width, height) {
  const canvas = document.getElementById(canvId)
  canvas.setAttribute('height', height);
  canvas.setAttribute('width', width);
  setElementRect(canvId, left, top, width, height);
  canvas.style.transform = 'scale('+(1/dpi)+','+(1/dpi)+')';
  canvas.style.transformOrigin = '0 0';
}

function hoverLookup(e) {
  var e = e || window.event;

  var xleft = minX + rangeleft * (maxX - minX)/ allwidth;
  var xright = minX + rangeright * (maxX - minX)/ allwidth;

  var x = xleft + (e.clientX - left) * (xright - xleft) / allwidth;
  // Find the closest data x
  var indMin = 0;
  var minDist = Number.MAX_VALUE;
  var pointCount = data[dataSet].columns[0].length-1;
  for (var i=0; i<pointCount; i++) {
    for (var j=0; j<data[dataSet].columns.length; j++) {
      if (j != xIndex) {
        var datax = data[dataSet].columns[xIndex][i+1];
        if (Math.abs(datax - x) < minDist) {
          minDist = Math.abs(datax - x);
          indMin = i+1;
        }
      }
    }
  }

  if (selectedIndex != indMin) {
    if (selectedPoints.length > 0)
      removeLookup();

    // Add a vertical line
    selectedIndex = indMin;
    addXMarkFunc(data[dataSet].columns[xIndex][indMin]);
    hoverLineX = data[dataSet].columns[xIndex][indMin];
    renderMain();

    // For each visible series draw a circle around datapoint at x
    for (var i=0; i<data[dataSet].columns.length; i++) {
      if (i != xIndex) {
        colName = data[dataSet].columns[i][0];
        if (seriesEnabledByName[colName]) {
          selectedPoints.push({
            x: hoverLineX,
            y:data[dataSet].columns[i][indMin],
            color: seriesColorByName[colName],
            label: data[dataSet].names[colName]
          });
        }
      }
    }

    for (var i=0; i<selectedPoints.length; i++) {
      var circle = document.createElement("div");
      circle.id = `circle${selectedPoints.label}`;
      circle.classList.add('circle');
      circle.style.left = `${getCanvasXFunc(selectedPoints[i].x)/dpi-4}px`;
      circle.style.top = `${getCanvasYFunc(selectedPoints[i].y)/dpi-4}px`;
      circle.style.borderColor = selectedPoints[i].color;
      circle.style.backgroundColor = themes[mode].back;
      document.getElementById('mo').appendChild(circle);
    }

    // Add a div overlay with date and values for each series
    var info = document.createElement("div");
    info.id = `info`;
    info.classList.add('info');
    info.style.left = `${getCanvasXFunc(hoverLineX)/dpi-20}px`;
    info.style.top = `${20}px`;
    info.style.backgroundColor = themes[mode].back;
    info.style.color = themes[mode].text;

    // Add date (x)
    var title = document.createElement("h3");
    var date = new Date(parseInt(hoverLineX));
    const month = date.toLocaleString('en-us', { month: 'long' }).substr(0,3);
    title.innerHTML = `<h3>${weekDays[date.getDay()]},&nbsp;${month}&nbsp;${date.getDate()}</h3>`;
    info.appendChild(title);

    // Add each selected data point for that x
    for (var i=0; i<selectedPoints.length; i++) {
      var datatab = document.createElement("div");
      datatab.classList.add('infodata');
      datatab.style.color = selectedPoints[i].color;
      var datanum = document.createElement("div");
      datanum.classList.add('infodatanum');
      datanum.innerHTML = `${selectedPoints[i].y}`;
      datatab.appendChild(datanum);
      var datatxt = document.createElement("div");
      datatxt.classList.add('infodatatxt');
      datatxt.innerHTML = `${selectedPoints[i].label}`;
      datatab.appendChild(datatxt);
      info.appendChild(datatab);
    }

    document.getElementById('mo').appendChild(info);

    // Add mouse out event listener to info
    info.addEventListener("mouseout", lookupMouseout);

    // Reposition info tab if it goes out of screen
    var infopos = info.getBoundingClientRect();
    if (infopos.right > allwidth)
      info.style.left = `${allwidth - infopos.width}px`;
  }
}

function isParent(refNode, otherNode) {
  if (!otherNode) return false;
	var parent = otherNode.parentNode;
	do {
    if (!parent) return false;
		if (refNode == parent) {
			return true;
		} else {
			parent = parent.parentNode;
		}
	} while (parent);
	return false;
}

function lookupMouseout(e) {
  var e = e || window.event;
  var target = e.toElement || e.target;
  var source = e.fromElement || e.srcElement;
  var container = document.getElementById('mo');
  if (target == source) return;
  if (isParent(container, target)) return;

  removeLookup();
  renderMain();
}

function resetLookup() {
  removeLookup();
  renderMain();
}

function removeLookup() {
  // Remove vertical line
  if (selectedIndex > 0) {
    removeXMarkFunc(hoverLineX);
  }

  // Remove circle around datapoint
  for (var i=0; i<selectedPoints.length; i++) {
    var id = `circle${selectedPoints.label}`;
    var circle = document.getElementById(id);
    if (circle)
      document.getElementById('mo').removeChild(circle);
  }

  // Remove info overlay
  var id = `info`;
  var info = document.getElementById(id);
  if (info)
    document.getElementById('mo').removeChild(info);

  hoverLineX = -1;
  selectedIndex = -1;
  selectedPoints = [];
}

function dragrangeStop() {
  document.onmouseup = null;
  document.onmousemove = null;
}

function calcDragMovement(e) {
  var e = e || window.event;
  e.preventDefault();

  // calculate the new cursor position:
  pos1 = pos3 - e.clientX;
  pos3 = e.clientX;
}

function leftSelectorDrag(e) {
  calcDragMovement(e);

  // Update range selector
  var rangewidth = rangeright - rangeleft;
  rangeleft = middleDragEl.offsetLeft - pos1 - left - dragwidth;
  if (rangeleft < 0) rangeleft = 0;
  if (rangeleft > rangeright - 7*dragwidth) rangeleft = rangeright - 7*dragwidth;
  setRangeSelector();
}

function rightSelectorDrag(e) {
  calcDragMovement(e);

  // Update range selector
  var rangewidth = rangeright - rangeleft;
  rangeright = middleDragEl.offsetLeft - pos1 - left - dragwidth + rangewidth;
  if (rangeright > allwidth) rangeright = allwidth;
  if (rangeleft > rangeright - 7*dragwidth) rangeright = rangeleft + 7*dragwidth;
  setRangeSelector();
}

function middleSelectorDrag(e) {
  calcDragMovement(e);

  // Update range selector
  var rangewidth = rangeright - rangeleft;
  rangeleft = middleDragEl.offsetLeft - pos1 - left - dragwidth;
  if (rangeleft < 0) rangeleft = 0;
  if (rangeleft > allwidth - rangewidth) rangeleft = allwidth - rangewidth;
  rangeright = rangeleft + rangewidth;
  setRangeSelector();
}

function startDragging(e) {
  var e = e || window.event;
  e.preventDefault();
  pos3 = e.clientX;
  pos4 = e.clientY;
  document.onmouseup = dragrangeStop;
}

function dragleftStart(e) {
  resetLookup();
  startDragging(e);
  document.onmousemove = leftSelectorDrag;
}

function dragrightStart(e) {
  resetLookup();
  startDragging(e);
  document.onmousemove = rightSelectorDrag;
}

function dragrangeStart(e) {
  startDragging(e);
  document.onmousemove = middleSelectorDrag;
}

function animateVisibleRange() {
  calculateVisibleRanges();
  var update = false;
  var delta = Math.abs(currentMaxY - (globalMaxY - globalMinY)*1.1) / 10;
  if (delta < 10) delta = 10;
  if (currentMaxY < (globalMaxY - globalMinY)*1.1 - delta) {
    currentMaxY += delta;
    update = true;
  }
  if (currentMaxY > (globalMaxY - globalMinY)*1.1 + delta) {
    currentMaxY -= delta;
    update = true;
  }
  requestAnimationFrame(() => {
    updateVisibleRange();
    updateMarks();
  });
  if (update) {
    setTimeout(animateVisibleRange, 30);
  }
}

function setElementBackground(id, color) {
  document.getElementById(id).style.backgroundColor = color;
}

function setRangeSelectorBackground() {
  setElementBackground('rsleft', themes[mode].rangeSelector);
  setElementBackground('rsright', themes[mode].rangeSelector);
}

function setRangeSelector() {
  var rangewidth = rangeright - rangeleft;
  var height = viewPortHeight * previewRelHeight + 1;
  const padh = 2;

  setElementRect('rsleft', left, ptop, rangeleft, height);
  setElementRect('rsright', left + rangeright, ptop, allwidth - rangeright, height);
  setElementRect('rstop', left + rangeleft, ptop, rangewidth, padh);
  setElementRect('rsbottom', left + rangeleft, ptop + height - padh, rangewidth, padh);
  setElementRect('rsleftdrag', left + rangeleft, ptop+padh, dragwidth, height-2*padh);
  setElementRect('rsrightdrag', left + rangeleft + rangewidth - dragwidth, ptop+padh, dragwidth, height-2*padh);
  setElementRect('rsmiddle', left + rangeleft + dragwidth, ptop+padh, rangewidth - 2*dragwidth, height-2*padh);

  setRangeSelectorBackground();

  // Aminate visible range update
  animateVisibleRange();
}

function setupCanvas() {
  viewPortWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
  viewPortHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  allwidth = viewPortWidth - 2*hpad;
  pwidth = width = parseInt(allwidth * dpi);
  height = parseInt(viewPortHeight * canvasRelHeight * dpi);
  pheight = parseInt(viewPortHeight * previewRelHeight * dpi);
  ctop = 3*pad;
  ptop = 2*hpad + ctop + viewPortHeight * canvasRelHeight;
  btop = pad + ptop + viewPortHeight * previewRelHeight;
  rangeleft = 0;
  rangeright = allwidth;

  // Setup main canvas
  setCanvasDimensions('c', left, ctop, width, height);

  // Setup main canvas overlay
  setElementRect('mo', left, ctop, allwidth, viewPortHeight * canvasRelHeight);

  // Setup preview canvas
  setCanvasDimensions('cp', left, ptop, pwidth, pheight);
  const preview = document.getElementById('cp')
  preview.style.border = '1px solid #555';

  // Setup preview canvas range selector
  middleDragEl = document.getElementById('rsmiddle');
  setRangeSelector();

  // Setup button area
  setElementRect('buttons', left, btop, allwidth, viewPortHeight * buttonAreaRelHeight);

  // Adjust theme changer when height is too small
  const themeChanger = document.getElementById('theme');
  if (themeChanger.style.bottom < btop + 60) {
    themeChanger.style.top = `0px`;
    themeChanger.style.height = '100px';
  }

  // Init canvas in wasm
  initFunc(width, height, pheight);
}

function seriesCheck(elid, dataCol) {
  if (document.getElementById(elid).checked) {
    toggleSeriesFunc(seriesIndexByName[dataCol], true);
    seriesEnabledByName[dataCol] = true;
  }
  else {
    // Limitation: Can't disable all
    var count = 0;
    dataColNames.forEach((dataCol) => {
      if (seriesEnabledByName[dataCol]) count++;
    });
    if (count == 1) {
      document.getElementById(elid).checked = true;
      return;
    }

    toggleSeriesFunc(seriesIndexByName[dataCol], false);
    seriesEnabledByName[dataCol] = false;
  }
  animateVisibleRange();
}

function setupSwitches() {
  const bdiv = document.getElementById('buttons');
  var html = '';
  var prevhtml = bdiv.innerHTML;

  dataColNames.forEach((dataCol) => {
    var colLabel = data[dataSet].names[dataCol];
    var id = `series${dataCol}`;
    var onCheckJS = `seriesCheck("${id}", "${dataCol}");`;
    html +=
      `<label class="checkbox tick" id='l${dataCol}' for='series${dataCol}'>${colLabel}<input type="checkbox" id='${id}' onchange='${onCheckJS}' checked="checked"/><div class="checkmark" style="background:${seriesColorByName[dataCol]}"></div></label>`;
  });
  bdiv.innerHTML = html + prevhtml;
}

async function initWebAsm() {
  const memSize = 256;
  memory = new WebAssembly.Memory({ initial: memSize, maximum: memSize });
  const imports = {
    env: {
      memory: memory,
    }
  };
  //const instance = new WebAssembly.Instance(new WebAssembly.Module(wasmBuf), imports); // embedded wasm way
  const {instance} = await WebAssembly.instantiateStreaming(fetch('main.wasm'), imports); // server way
  wasmInst = instance;

  // Setup wasm functions
  initFunc = wasmInst.exports.__Z4initiii;
  setThemeFunc = wasmInst.exports.__Z8setThemei;
  renderMainFunc = wasmInst.exports.__Z10renderMainv;
  renderPrevFunc = wasmInst.exports.__Z10renderPrevv;
  addDataPointFunc = wasmInst.exports.__Z12addDataPointidd;
  toggleSeriesFunc = wasmInst.exports.__Z12toggleSeriesib;
  setSeriesCountFunc = wasmInst.exports.__Z14setSeriesCounti;
  setVisibleRectFunc = wasmInst.exports.__Z14setVisibleRectdddd;
  setVisibleRectPrevFunc = wasmInst.exports.__Z18setVisibleRectPrevdddd;
  addXMarkFunc = wasmInst.exports.__Z8addXMarkd;
  addYMarkFunc = wasmInst.exports.__Z8addYMarkd;
  removeXMarkFunc = wasmInst.exports.__Z11removeXMarkd;
  removeYMarkFunc = wasmInst.exports.__Z11removeYMarkd;
  resetMarksFunc = wasmInst.exports.__Z10resetMarksv;
  setSeriesColorFunc = wasmInst.exports.__Z14setSeriesColoriiii;
  getCanvasXFunc = wasmInst.exports.__Z10getCanvasXd;
  getCanvasYFunc = wasmInst.exports.__Z10getCanvasYd;
}

// Calculate visible data ranges for each series
function calculateVisibleRanges() {

  var pointCount = data[dataSet].columns[0].length-1;

  // Determine x-range
  minX = Number.MAX_VALUE;
  maxX = Number.MIN_VALUE;
  for (var i=0; i<pointCount; i++) {
    var x = data[dataSet].columns[xIndex][i+1];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
  }
  var xleft = minX + rangeleft * (maxX - minX)/ allwidth;
  var xright = minX + rangeright * (maxX - minX)/ allwidth;

  // Determine y-range based on visible x-range
  var minY = [];
  var maxY = [];
  for (var j=0; j<data[dataSet].columns.length; j++) {
    if (j != xIndex) {
      var colName = data[dataSet].columns[j][0];
      minY[colName] = Number.MAX_VALUE;
      maxY[colName] = Number.MIN_VALUE;
    }
  }

  for (var i=0; i<pointCount; i++) {
    for (var j=0; j<data[dataSet].columns.length; j++) {
      if (j != xIndex) {
        var x = data[dataSet].columns[xIndex][i+1];

        // Update min max dictionaries
        var colName = data[dataSet].columns[j][0];
        if (seriesEnabledByName[colName]) {
          if ((x >= xleft) && (x <= xright)) {
            var y = data[dataSet].columns[j][i+1];
            if (y < minY[colName]) minY[colName] = y;
            if (y > maxY[colName]) maxY[colName] = y;
          }
        }
      }
    }
  }

  globalMinY = 0;
  globalMaxY = Number.MIN_VALUE;

  dataColNames.forEach((colName) => {
    if (seriesEnabledByName[colName]) {
      if (globalMaxY < maxY[colName]) globalMaxY = maxY[colName];
      if (globalMinY > minY[colName]) globalMinY = minY[colName];
    }
  });

  return {x1:xleft, x2:xright};
}

function updateVisibleRange() {
  const r = calculateVisibleRanges();
  if (currentMaxY) {
    setVisibleRectFunc(r.x1, 0, r.x2, currentMaxY);
    setVisibleRectPrevFunc(minX, 0, maxX, currentMaxY);
    renderMain();
    renderPrev();
  }
}

function setVisibleRanges() {
  const r = calculateVisibleRanges();

  currentMinY = globalMinY*0.9;
  currentMaxY = globalMaxY*1.1;
  setVisibleRectFunc(r.x1, currentMinY, r.x2, currentMaxY);
  setVisibleRectPrevFunc(minX, currentMinY, maxX, currentMaxY);
}

function setupData() {
  setSeriesCountFunc(data[dataSet].columns.length-1);
  var pointCount = data[dataSet].columns[0].length-1;

  // Determine which column is x and column names for the rest
  for (var i=0; i<data[dataSet].columns.length; i++) {
    if (data[dataSet].columns[i][0] == 'x') {
      xIndex = i;
    } else {
      dataColNames.push(data[dataSet].columns[i][0]);
    }
  }

  // Import data
  for (var i=0; i<pointCount; i++) {
    var series = 0;
    for (var j=0; j<data[dataSet].columns.length; j++) {
      if (j != xIndex) {
        var x = data[dataSet].columns[xIndex][i+1];
        var y = data[dataSet].columns[j][i+1];
        addDataPointFunc(series, x, y);
        series++;
      }
    }
  }

  // Set series colors from data
  var series = 0;
  dataColNames.forEach((dataCol) => {
    var color = data[dataSet].colors[dataCol];
    var rstr = color.substring(1,3);
    var gstr = color.substring(3,5);
    var bstr = color.substring(5,7);
    setSeriesColorFunc(series, parseInt(rstr, 16), parseInt(gstr, 16), parseInt(bstr, 16));
    seriesIndexByName[dataCol] = series;
    seriesEnabledByName[dataCol] = true;
    seriesColorByName[dataCol] = color;
    series++;
  });

}

function removeYMark(labelObj) {
  var ind = yLabels.indexOf(labelObj);
  if (ind == -1) return;
  yLabels.splice(ind, 1);
  var container = document.getElementById('mo');
  var label = document.getElementById(labelObj.id);
  if (label) container.removeChild(label);
}

function updateYMarks() {
  if (yLabels.length < 2) return;

  calculateVisibleRanges();

  // Reset used flag on marks
  for (var i=0; i<yLabels.length; i++) {
    yLabels[i].used = false;
  }

  // Extrapolate existing marks
  var markStepY = globalMaxY - globalMinY;
  for (var i=1; i<yLabels.length; i++)
    if (markStepY > Math.abs(yLabels[0].coord - yLabels[i].coord))
      markStepY = Math.abs(yLabels[0].coord - yLabels[i].coord);
  while (markStepY > maxMarkSpace * (globalMaxY - globalMinY)) markStepY /= 2;
  while (markStepY < minMarkSpace * (globalMaxY - globalMinY)) markStepY *= 2;

  var offsetY = yLabels[0].coord;
  while (offsetY < globalMinY) offsetY += markStepY;
  while (offsetY - markStepY > globalMinY) offsetY -= markStepY;
  var markY = offsetY;

  do {
    // If mark exists, move it
    var exists = false;
    for (var j=0; j<yLabels.length; j++) {
      if (Math.abs(markY - yLabels[j].coord) < 10.0) {
        var label = document.getElementById(yLabels[j].id);
        label.style.top = `${getCanvasYFunc(markY)/dpi-20}px`;
        exists = true;
        yLabels[j].used = true;
      }
    }
    // Else create a new mark
    if (!exists) {
      addYLabel(markY);
    }

    markY += markStepY;
  } while (markY < globalMaxY);

  // Check if we need to remove any marks
  for (var i=0; i<yLabels.length; i++) {
    if (yLabels[i].used === false) {
      removeYMarkFunc(yLabels[i].coord+1);
      var label = document.getElementById(yLabels[i].id);
      if (label) {
        label.style.opacity = 0;
        setTimeout(removeYMark, 250, yLabels[i]);
      }
    }
  }
}

function removeXMark(labelObj) {
  var ind = xLabels.indexOf(labelObj);
  if (ind == -1) return;
  xLabels.splice(ind, 1);
  var container = document.getElementById('mo');
  var label = document.getElementById(labelObj.id);
  if (label) container.removeChild(label);
}

function updateXMarks() {
  if (xLabels.length < 2) return;

  const r = calculateVisibleRanges();
  var xleft = r.x1;
  var xright = r.x2;

  // Reset used flag on marks
  for (var i=0; i<xLabels.length; i++) {
    xLabels[i].used = false;
  }

  // Extrapolate existing marks
  var markStepX = xright - xleft;
  for (var i=1; i<xLabels.length; i++)
    if (markStepX > Math.abs(xLabels[0].coord - xLabels[i].coord))
      markStepX = Math.abs(xLabels[0].coord - xLabels[i].coord);
  while (markStepX > maxMarkSpace * (xright-xleft)) markStepX /= 2;
  while (markStepX < minMarkSpace * (xright-xleft)) markStepX *= 2;

  var offsetX = xLabels[0].coord;
  while (offsetX < xleft) offsetX += markStepX;
  while (offsetX - markStepX > xleft) offsetX -= markStepX;
  var markX = offsetX;

  do {
    // If mark exists, move it
    var exists = false;
    for (var j=0; j<xLabels.length; j++) {
      if (Math.abs(markX - xLabels[j].coord) < 10.0) {
        var label = document.getElementById(xLabels[j].id);
        label.style.left = `${getCanvasXFunc(markX)/dpi - 15}px`;
        label.style.top = `${ptop - 70 - hpad}px`;
        exists = true;
        xLabels[j].used = true;
      }
    }
    // Else create a new mark
    if (!exists) {
      addXLabel(markX);
    }

    markX += markStepX;
  } while (markX < xright);

  // Check if we need to remove any marks
  for (var i=0; i<xLabels.length; i++) {
    if (xLabels[i].used === false) {
      //removeXMarkFunc(xLabels[i].coord);
      var label = document.getElementById(xLabels[i].id);
      if (label) {
        label.style.opacity = 0;
        setTimeout(removeXMark, 250, xLabels[i]);
      }
    }
  }
}

function updateMarks() {
  updateXMarks();
  updateYMarks();
}

function addYLabel(markY) {
  var label = document.createElement("span");
  label.id = `overlayLblY${markY}`;
  label.innerHTML = parseInt(markY);
  label.style.left = `${0}px`;
  label.style.top = `${getCanvasYFunc(markY)/dpi - 20}px`;
  label.style.opacity = 0.0;
  document.getElementById('mo').appendChild(label);
  setTimeout(() => {label.style.opacity = 1.0;}, 1);

  // Keep label IDs for updates and animation
  yLabels.push({id: label.id, coord: markY, used: true});

  addYMarkFunc(markY+1);
}

function addXLabel(markX) {
  var label = document.createElement("span");
  label.id = `overlayLblX${markX}`;
  const date = new Date(parseInt(markX));
  const month = date.toLocaleString('en-us', { month: 'long' }).substr(0,3);
  label.innerHTML = `${month}&nbsp;${date.getDate()}`;
  label.style.left = `${getCanvasXFunc(markX)/dpi - 15}px`;
  label.style.top = `${ptop - 70 - hpad}px`;
  label.style.opacity = 0.0;
  document.getElementById('mo').appendChild(label);
  setTimeout(() => {label.style.opacity = 1.0;}, 1);

  // Keep label IDs for updates and animation
  xLabels.push({id: label.id, coord: markX, used: true});

  //addXMarkFunc(markX);
}

function setupMarks() {
  var markCount = parseInt(2.0 / (minMarkSpace + maxMarkSpace));

  const r = calculateVisibleRanges();
  var xleft = r.x1;
  var xright = r.x2;

  var markStepY = (globalMaxY - globalMinY)/markCount;
  var markStepX = (xright - xleft)/markCount;
  var offsetX = markStepX/4;
  for (var i=0; i<markCount; i++) {
    var markY = i*markStepY;
    var markX = offsetX + xleft + i*markStepX;

    // Display Y text labels
    addYLabel(markY);

    // Display X text label
    addXLabel(markX);
  }
}

function renderMain() {
  // Get 2d drawing context
  const ctx = document.getElementById('c').getContext('2d');
  const pointer = renderMainFunc();
  const data = new Uint8ClampedArray(memory.buffer, pointer, width * height * 4);
  const img = new ImageData(data, width, height);
  ctx.putImageData(img, 0, 0);
}

function renderPrev() {
  // Get 2d drawing context
  const ctx = document.getElementById('cp').getContext('2d');
  const pointer = renderPrevFunc();
  const data = new Uint8ClampedArray(memory.buffer, pointer, pwidth * pheight * 4);
  const img = new ImageData(data, pwidth, pheight);
  ctx.putImageData(img, 0, 0);
}

async function switchMode() {
  const tchanger = document.getElementById('themeLabel');
  const mover = document.getElementById('mo');

  document.body.classList.remove(themes[mode].backClass);
  tchanger.innerHTML = `Switch to ${mode} Mode`;
  mode = themes[mode].nextMode;
  document.body.classList.add(themes[mode].backClass);
  labelTextColor = themes[mode].text;

  dataColNames.forEach((dataCol) => {
    document.getElementById(`l${dataCol}`).style.color = themes[mode].text;
  });
  document.getElementById('titleLabel').style.color = themes[mode].text;
  setRangeSelectorBackground();
}

async function main() {
  await initWebAsm();
  setupData();
  setupCanvas();
  setupSwitches();

  setVisibleRanges();
  setupMarks();

  renderMain();
  renderPrev();
}

function selectDataset() {
  var selected = document.getElementById('setselect').value;
  dataSet = selected;
  main();
  document.getElementById('step0').style.opacity = 0;
  setTimeout(() => { document.getElementById('step0').style.display = 'none'}, 1000);
}

window.onresize = async function(event) {
  requestAnimationFrame(() => {
    var saveL = rangeleft;
    var saveR = rangeright;
    var saveAW = allwidth;
    setupCanvas();

    rangeleft = saveL * allwidth/saveAW;
    rangeright = saveR * allwidth/saveAW;
    setRangeSelector();
  });
};
