'use strict';

function mustReplace(html, oldStr, newStr, label) {
  const count = html.split(oldStr).length - 1;
  if (count === 0) {
    throw new Error(`[${label}] old string not found (search text drifted from source?)`);
  }
  if (count > 1) {
    throw new Error(`[${label}] old string matched ${count} times, expected exactly 1`);
  }
  return html.split(oldStr).join(newStr);
}

function extractBetween(text, startMarker, endMarker, label) {
  const startIdx = text.indexOf(startMarker);
  if (startIdx === -1) {
    throw new Error(`[${label}] start marker not found: ${JSON.stringify(startMarker.slice(0, 60))}`);
  }
  const from = startIdx + startMarker.length;
  const endIdx = text.indexOf(endMarker, from);
  if (endIdx === -1) {
    throw new Error(`[${label}] end marker not found: ${JSON.stringify(endMarker.slice(0, 60))}`);
  }
  return text.slice(from, endIdx);
}

module.exports = { mustReplace, extractBetween };
