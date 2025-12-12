/* =========================
   Handy Box — Digital Tools JS (final)
   ========================= */

/* ===== JSON ↔ XML ===== */
function convertJsonXml() {
  const format = document.getElementById('jsonXmlFormat').value;
  const input = document.getElementById('jsonXmlInput').value.trim();
  const output = document.getElementById('jsonXmlOutput');

  try {
    if (format === 'jsonToXml') {
      const obj = JSON.parse(input);
      const xml = jsonToXml(obj);
      output.value = xml;
    } else {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(input, 'text/xml');
      if (xmlDoc.querySelector('parsererror')) throw new Error('bad xml');
      const json = xmlToJson(xmlDoc.documentElement);
      output.value = JSON.stringify(json, null, 2);
    }
  } catch {
    output.value = '❌ Invalid input format.';
  }
}

function jsonToXml(obj, rootName = 'root') {
  // Simple JSON → XML (supports nested objects/arrays)
  let xml = `<${rootName}>`;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      xml += jsonToXml(item, 'item');
    }
  } else if (obj !== null && typeof obj === 'object') {
    for (const key in obj) {
      xml += jsonToXml(obj[key], key);
    }
  } else {
    const safe = String(obj)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    xml += safe;
  }
  xml += `</${rootName}>`;
  return xml;
}

function xmlToJson(node) {
  // XML → JSON (collapses singletons; repeats become arrays)
  const obj = {};
  const hasElementChildren = Array.from(node.childNodes).some(n => n.nodeType === 1);
  if (!hasElementChildren) {
    const text = (node.textContent || '').trim();
    if (text) return text;
  }
  node.childNodes.forEach(child => {
    if (child.nodeType !== 1) return;
    const k = child.nodeName;
    const v = xmlToJson(child);
    if (k in obj) {
      if (!Array.isArray(obj[k])) obj[k] = [obj[k]];
      obj[k].push(v);
    } else {
      obj[k] = v;
    }
  });
  return obj;
}

/* ===== Base64 ===== */
function convertBase64() {
  const format = document.getElementById('base64Format').value;
  const input = document.getElementById('base64Input').value.trim();
  const output = document.getElementById('base64Output');

  try {
    // NOTE: btoa/atob تعمل مع ASCII. للنصوص غير الإنجليزية استخدمي encodeURIComponent/ decodeURIComponent + escape/unescape إن احتجتِ.
    output.value = (format === 'textToBase64') ? btoa(input) : atob(input);
  } catch {
    output.value = '❌ Invalid Base64 input.';
  }
}

/* =======================
   Binary Suite (Unified)
   modes (by #binUnifiedMode):
   - textToBinary, binaryToText
   - decToBin,   binToDec
   - intToBin,   binToInt
   ======================= */
function convertBinaryUnified(){
  const mode   = document.getElementById('binUnifiedMode').value;
  const input  = (document.getElementById('binUnifiedInput').value || '').trim();
  const outEl  = document.getElementById('binUnifiedOutput');

  try {
    if (mode === 'textToBinary'){
      outEl.value = textToBinaryUTF8(input);

    } else if (mode === 'binaryToText'){
      outEl.value = binaryToTextUTF8(input);

    } else if (mode === 'decToBin'){
      // Decimal (float) → binary string (up to 32 frac bits)
      outEl.value = decToBinFloat(input);

    } else if (mode === 'binToDec'){
      // Binary (with optional .) → decimal string
      outEl.value = binToDecFloat(input);

    } else if (mode === 'intToBin'){
      // Integer → Binary (fixed width)
      const bits   = clampInt(parseInt(document.getElementById('uIntBits').value, 10), 8, 64);
      const signed = !!document.getElementById('uIntSigned').checked;
      outEl.value  = intToBinFixed(input, bits, signed);

    } else if (mode === 'binToInt'){
      // Binary → Integer (fixed width)
      const bitsSel = document.getElementById('btiBits').value;
      const bits    = (bitsSel === 'auto') ? 'auto' : clampInt(parseInt(bitsSel,10), 8, 64);
      const signed  = !!document.getElementById('btiSigned').checked;
      outEl.value   = binToIntFixed(input, bits, signed);

    } else {
      outEl.value = '❌ Unknown mode.';
    }
  } catch (e){
    outEl.value = '❌ ' + (e && e.message ? e.message : 'Invalid input.');
  }
}

/* ---------- Text ↔ Binary (UTF-8) ---------- */
function textToBinaryUTF8(s){
  const enc = new TextEncoder();
  const bytes = enc.encode(s);
  return Array.from(bytes).map(b => b.toString(2).padStart(8,'0')).join(' ');
}
function binaryToTextUTF8(bin){
  const clean = bin.replace(/[^01]/g,'');
  if (clean.length === 0) return '';
  if (clean.length % 8 !== 0) throw new Error('Binary length must be multiple of 8.');
  const bytes = clean.match(/.{1,8}/g).map(b => parseInt(b,2));
  const dec = new TextDecoder();
  return dec.decode(new Uint8Array(bytes));
}

/* ---------- Decimal ↔ Binary (float, quick & simple) ---------- */
function decToBinFloat(s){
  if (!/^[+-]?(\d+(\.\d+)?|\.\d+)$/.test(s)) throw new Error('Not a decimal number.');
  const n = Number(s);
  if (!Number.isFinite(n)) throw new Error('Out of range.');

  const sign = (n < 0) ? '-' : '';
  let abs = Math.abs(n);

  const intPart  = Math.floor(abs);
  let fracPart   = abs - intPart;

  const intBin = intPart.toString(2);

  let fracBin = '';
  for (let i=0; i<32 && fracPart>0; i++){
    fracPart *= 2;
    if (fracPart >= 1){
      fracBin += '1';
      fracPart -= 1;
    } else {
      fracBin += '0';
    }
  }
  return fracBin ? (sign + intBin + '.' + fracBin) : (sign + intBin);
}

function binToDecFloat(bin){
  const s = bin.replace(/\s+/g,'').trim();
  if (!/^[+-]?[01]+(\.[01]+)?$/.test(s)) throw new Error('Invalid binary format.');
  const sign = (s[0] === '-') ? -1 : 1;
  const t = (s[0] === '+' || s[0] === '-') ? s.slice(1) : s;
  const [iPart, fPart=''] = t.split('.');

  let intVal = 0;
  for (let i=0; i<iPart.length; i++){
    intVal = intVal*2 + (iPart.charCodeAt(i)-48);
  }
  let fracVal = 0;
  for (let j=0; j<fPart.length; j++){
    if (fPart[j] === '1') fracVal += Math.pow(2, -(j+1));
  }
  return String(sign * (intVal + fracVal));
}

/* ---------- Integer ↔ Binary (fixed width, two’s complement optional) ---------- */
function intToBinFixed(input, bits, signed){
  input = (input || '').trim();
  if (!/^[-+]?\d+$/.test(input)) throw new Error('Integer required.');

  let n = BigInt(input);
  const B = BigInt(bits);

  if (!signed && n < 0n) throw new Error('Unsigned range: negative not allowed.');

  const min = signed ? -(1n << (B-1n)) : 0n;
  const max = signed ?  (1n << (B-1n)) - 1n : (1n << B) - 1n;
  if (n < min || n > max) throw new Error(`Out of range for ${bits}-bit ${signed?'signed':'unsigned'}.`);

  if (signed && n < 0n) n = (1n << B) + n; // two's complement
  let bin = n.toString(2).padStart(bits, '0');
  return groupBinary(bin, 8);
}

function binToIntFixed(input, bits, signed){
  let clean = input.replace(/[\s_]/g,'').trim();
  if (!/^[01]+$/.test(clean)) throw new Error('Binary must contain only 0/1.');

  let usedBits;
  if (bits === 'auto'){
    usedBits = Math.min(64, Math.max(8, Math.ceil(clean.length/8)*8));
  } else {
    usedBits = bits;
  }

  if (clean.length > usedBits) throw new Error(`Input has more than ${usedBits} bits.`);
  clean = clean.padStart(usedBits, '0');

  let x = BigInt('0b' + clean);

  if (signed){
    const B = BigInt(usedBits);
    const signBitSet = clean[0] === '1';
    if (signBitSet){
      const mod = 1n << B;
      x = x - mod; // negative BigInt
    }
  }
  return x.toString();
}

/* ---------- Utils ---------- */
function groupBinary(binStr, group=8){
  return binStr.replace(new RegExp(`(.{${group}})`, 'g'), '$1 ').trim();
}
function clampInt(n, lo, hi){
  if (!Number.isFinite(n)) throw new Error('Bad number');
  return Math.min(hi, Math.max(lo, n|0));
}

/* ===== Copy (shared) ===== */
function copyText(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.select();
  document.execCommand('copy');
  el.blur();
  const btn = event && event.target;
  if (btn) {
    const old = btn.textContent;
    btn.textContent = '✅ Copied!';
    setTimeout(()=> btn.textContent = old, 1200);
  }
}
