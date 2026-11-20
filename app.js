'use strict';

const columns = 'fecha_hora,tanque_id,temp_c,ph_raw,turbidez_raw,ph_estable,turb_estable';
const demoCsv = `${columns}
2026-11-18 10:42:05,04C2A71B,22.81,1912,768,1,1
2026-11-18 10:35:17,7610AB29,23.38,2041,1264,1,0
2026-11-18 10:22:46,04C2A71B,22.75,1908,783,1,1
2026-11-18 10:14:52,3AF11708,21.94,1976,985,1,1
2026-11-18 10:02:13,7610AB29,,2034,1210,0,1`;

function parseSamples(csv) {
  const lines = csv.replace(/^\uFEFF/, '').trim().split(/\r?\n/);
  if (lines.shift()?.trim() !== columns) {
    throw new Error('El encabezado debe coincidir con el CSV exportado por el ESP32.');
  }

  const samples = [];
  for (const [index, line] of lines.entries()) {
    if (!line.trim()) continue;
    const fields = line.split(',').map((value) => value.trim());
    const [date, rfid, temperature, ph, turbidity, phStable, turbidityStable] = fields;
    const valid = fields.length === 7 && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(date)
      && /^(?:[a-f0-9]{2}){1,10}$/i.test(rfid)
      && (temperature === '' || /^-?\d+(?:\.\d+)?$/.test(temperature) && Number.isFinite(Number(temperature)))
      && [ph, turbidity].every((value) => /^\d{1,4}$/.test(value) && Number(value) <= 4095)
      && [phStable, turbidityStable].every((value) => /^[01]$/.test(value));
    if (!valid) throw new Error(`La fila ${index + 2} contiene valores con un formato incompatible.`);
    fields[1] = rfid.toUpperCase();
    samples.push(fields);
  }
  return samples.sort((first, second) => second[0].localeCompare(first[0]));
}

const byId = (id) => document.getElementById(id);
const dashboard = byId('dashboard');
const tank = byId('tank');
const rows = byId('rows');
const count = byId('count');
const source = byId('source');
const message = byId('message');
const demo = byId('demo');
const cloud = byId('cloud');
const file = byId('file');
const importButton = byId('import');
const download = byId('download');
const temperatureFormat = new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

let samples = [];
let visibleSamples = [];
let sourceKind = '';
let cloudSamples;

function render() {
  visibleSamples = tank.value ? samples.filter((sample) => sample[1] === tank.value) : samples;
  const fragment = document.createDocumentFragment();
  for (const sample of visibleSamples) {
    const [date, rfid, temperature, ph, turbidity, phStable, turbidityStable] = sample;
    const row = document.createElement('tr');
    const dateCell = document.createElement('th');
    dateCell.scope = 'row';
    dateCell.textContent = date;
    row.append(dateCell);
    for (const value of [rfid, temperature === '' ? 'Sin dato' : temperatureFormat.format(Number(temperature)), ph, turbidity]) {
      row.insertCell().textContent = value;
    }
    for (const value of [phStable, turbidityStable]) {
      const status = document.createElement('span');
      status.className = value === '1' ? 'row-status' : 'row-status unstable';
      status.textContent = value === '1' ? 'Sí' : 'No';
      row.insertCell().append(status);
    }
    fragment.append(row);
  }
  if (!visibleSamples.length) {
    const row = document.createElement('tr');
    const emptyCell = row.insertCell();
    emptyCell.colSpan = 7;
    emptyCell.textContent = 'El archivo aún no contiene muestras.';
    fragment.append(row);
  }
  rows.replaceChildren(fragment);
  count.textContent = `${visibleSamples.length} ${visibleSamples.length === 1 ? 'muestra' : 'muestras'}`;
  download.disabled = !visibleSamples.length;
}

function showSamples(data, kind, label) {
  samples = data;
  sourceKind = kind;
  source.textContent = label;
  demo.hidden = kind === 'demo';
  cloud.hidden = !cloudSamples || kind === 'cloud';
  message.hidden = true;
  const ids = [...new Set(samples.map((sample) => sample[1]))].sort();
  tank.replaceChildren(new Option('Todos los recipientes', ''), ...ids.map((id) => new Option(id, id)));
  tank.disabled = !ids.length;
  render();
}

const showDemo = () => showSamples(parseSamples(demoCsv), 'demo', 'Datos de demostración');
const showCloud = () => showSamples(cloudSamples, 'cloud', 'Datos publicados');

tank.addEventListener('change', render);
demo.addEventListener('click', showDemo);
cloud.addEventListener('click', showCloud);
importButton.addEventListener('click', () => file.click());

file.addEventListener('change', async () => {
  const selected = file.files[0];
  if (!selected) return;

  importButton.disabled = true;
  try {
    showSamples(parseSamples(await selected.text()), 'file', `Archivo local · ${selected.name}`);
  } catch (error) {
    message.textContent = `No se pudo importar el CSV. ${error.message}`;
    message.hidden = false;
  } finally {
    file.value = '';
    importButton.disabled = false;
  }
});

download.addEventListener('click', () => {
  const csv = [columns, ...visibleSamples.map((sample) => sample.join(','))].join('\r\n') + '\r\n';
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = sourceKind === 'demo' ? 'muestras-demo.csv' : 'muestras.csv';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

showDemo();
dashboard.hidden = false;

// Pages sirve este archivo cuando se publica una copia del CSV del instrumento.
async function loadPublishedSamples() {
  try {
    const response = await fetch('muestras.csv', { cache: 'no-cache' });
    if (response.status === 404) return;
    if (!response.ok) throw new Error('El servidor no respondió correctamente.');
    cloudSamples = parseSamples(await response.text());
    if (sourceKind === 'demo' && !file.files.length && !tank.value) showCloud();
    else cloud.hidden = false;
  } catch (error) {
    message.textContent = `No se pudo leer el archivo publicado. ${error.message}`;
    message.hidden = false;
  }
}

if (['http:', 'https:'].includes(location.protocol)) loadPublishedSamples();
