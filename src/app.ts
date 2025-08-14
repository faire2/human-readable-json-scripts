// TypeScript DOM code for JSON ⇄ Readable Script editor

const $ = (sel: string) => document.querySelector(sel) as HTMLElement;
const jsonInput = document.getElementById('jsonInput') as HTMLTextAreaElement;
const scriptArea = document.getElementById('scriptArea') as HTMLTextAreaElement;
const loadBtn = document.getElementById('loadBtn') as HTMLButtonElement;
const applyBtn = document.getElementById('applyBtn') as HTMLButtonElement;
const formatJsonBtn = document.getElementById('formatJsonBtn') as HTMLButtonElement;
const copyJsonBtn = document.getElementById('copyJsonBtn') as HTMLButtonElement;
const copyScriptBtn = document.getElementById('copyScriptBtn') as HTMLButtonElement;

let lastParsedObject: any = null;

function fixCommonJsonIssues(text: string): string {
  let fixed = text.trim();

  // Fix Czech/Unicode quotation marks to standard ASCII quotes
  // This is needed because JSON requires standard ASCII double quotes
  fixed = fixed.replace(/[„""]/g, '"');  // Replace Czech quotes with standard quotes
  fixed = fixed.replace(/['']/g, "'");   // Replace smart single quotes

  // Remove trailing commas before closing braces or brackets
  fixed = fixed.replace(/,(\s*[}\]])/g, '$1');

  // Handle the case where the JSON ends with }, (suggesting it's part of a larger structure)
  // Remove the trailing comma after the closing brace
  if (fixed.endsWith('},')) {
    fixed = fixed.slice(0, -1); // Remove the trailing comma
  }

  // Handle other trailing comma cases
  fixed = fixed.replace(/,(\s*)$/, '$1');

  return fixed;
}

function safeParseJson(text: string) {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (err) {
    // Try to fix common issues and parse again
    try {
      const fixedText = fixCommonJsonIssues(text);
      return { ok: true, value: JSON.parse(fixedText), fixed: true };
    } catch (secondErr) {
      // If standard fixes don't work, try a more aggressive approach for script content
      try {
        const aggressivelyFixed = aggressiveJsonFix(text);
        return { ok: true, value: JSON.parse(aggressivelyFixed), fixed: true, aggressiveFix: true };
      } catch (thirdErr) {
        const error = err as Error;
        let errorMessage = error.message;

        // Provide more helpful error messages for common JSON issues
        if (errorMessage.includes('unexpected non-whitespace character after JSON data')) {
          errorMessage += '\n\nTip: This usually means there\'s a trailing comma after the last property in an object or array. Check for extra commas at the end of your JSON.';
        } else if (errorMessage.includes('Unexpected token') || errorMessage.includes('Expected double-quoted property name')) {
          errorMessage += '\n\nTip: Check for missing quotes around property names, trailing commas, or special characters like Czech quotation marks („") that need to be escaped.';
        }

        return { ok: false, error: errorMessage };
      }
    }
  }
}

function aggressiveJsonFix(text: string): string {
  let fixed = fixCommonJsonIssues(text);

  // More aggressive Unicode quote fixing
  fixed = fixed.replace(/[„""]/g, '\\"');  // Replace Czech quotes with escaped quotes
  fixed = fixed.replace(/['']/g, "\\'");   // Replace smart single quotes with escaped quotes

  // Fix other problematic Unicode characters that might appear in Czech text
  fixed = fixed.replace(/[–—]/g, '-');     // Replace em/en dashes with regular hyphens
  fixed = fixed.replace(/[…]/g, '...');    // Replace ellipsis with three dots

  return fixed;
}

/**
 * Convert literal escape sequences (e.g. "\n", "\t") into real characters so
 * the script textarea shows actual line breaks and tabs for easier editing.
 *
 * This is intentionally conservative: if the string already contains real newlines,
 * they are preserved. We only replace *literal* backslash+char sequences.
 */
function unescapeLiteralSequences(s: string): string {
  if (typeof s !== 'string') return s;
  // Replace Windows-style first: literal backslash+r backslash+n -> CRLF
  if (s.indexOf('\\r\\n') !== -1) s = s.replace(/\\r\\n/g, '\r\n');
  if (s.indexOf('\\n') !== -1) s = s.replace(/\\n/g, '\n');
  if (s.indexOf('\\t') !== -1) s = s.replace(/\\t/g, '\t');
  if (s.indexOf('\\"') !== -1) s = s.replace(/\\"/g, '"');
  // finally, unescape double-backslashes into single backslashes
  if (s.indexOf('\\\\') !== -1) s = s.replace(/\\\\/g, '\\');
  return s;
}

/**
 * Convert real newlines back into literal "\n" sequences so the JSON stores the
 * escaped form. We deliberately only convert newlines here; JSON.stringify will
 * still perform proper escaping for quotes/backslashes as needed.
 */
function escapeNewlinesForJson(s: string): string {
  if (typeof s !== 'string') return s;
  // Normalize CRLF to LF first
  s = s.replace(/\r\n/g, '\n');

  // Only convert actual newlines to \n, but don't double-escape existing \n sequences
  // First, temporarily replace existing \n sequences with a placeholder
  const placeholder = '___EXISTING_NEWLINE_ESCAPE___';
  s = s.replace(/\\n/g, placeholder);

  // Convert actual newlines to \n
  s = s.replace(/\n/g, '\\n');

  // Restore the original \n sequences
  s = s.replace(new RegExp(placeholder, 'g'), '\\n');

  return s;
}

function loadJsonToPane() {
  const text = jsonInput.value.trim();
  if (!text) {
    alert('Please paste some JSON into the left editor first.');
    return;
  }

  const parsed = safeParseJson(text);
  if (!parsed.ok) {
    alert('JSON parse error:\n' + parsed.error);
    return;
  }

  // If JSON was automatically fixed, show a warning but don't update the original
  if ((parsed as any).fixed) {
    if ((parsed as any).aggressiveFix) {
      alert('Note: Your JSON had syntax issues (including special characters like Czech quotation marks) that were automatically handled for parsing. The original format in the editor is preserved.');
    } else {
      alert('Note: Your JSON had minor syntax issues (like trailing commas) that were automatically handled for parsing. The original format in the editor is preserved.');
    }
  }

  lastParsedObject = parsed.value;

  if (typeof lastParsedObject.script === 'string') {
    // If the stored script contains literal "\n" sequences, convert them to real newlines
    scriptArea.value = unescapeLiteralSequences(lastParsedObject.script);
  } else {
    scriptArea.value = '// No `script` string found in the JSON.\n// You can edit the whole JSON on the left or paste a script here and click "Apply edits" to add it.';
  }
}

function smartReplaceScriptInJson(originalJson: string, newScript: string): string | null {
  try {
    // Try to find and replace just the script field value while preserving formatting
    const scriptForJson = escapeNewlinesForJson(newScript);

    // Look for the script field and replace its value
    const scriptFieldRegex = /("script"\s*:\s*")([^"\\]*(\\.[^"\\]*)*)(")/;

    if (scriptFieldRegex.test(originalJson)) {
      // Replace just the script value, preserving the rest of the JSON structure
      const newScriptValue = JSON.stringify(scriptForJson).slice(1, -1); // Remove outer quotes
      return originalJson.replace(scriptFieldRegex, `$1${newScriptValue}$4`);
    }

    // If we can't find the script field, fall back to full JSON replacement
    return null;
  } catch (e) {
    return null;
  }
}

function applyScriptEditsToJson() {
  if (!lastParsedObject) {
    // try to parse current JSON
    const parsed = safeParseJson(jsonInput.value);
    if (!parsed.ok) {
      if (!confirm('The current JSON is invalid. Applying edits will create a new JSON object with only the `script` key. Continue?')) return;
      lastParsedObject = {};
    } else {
      lastParsedObject = parsed.value;
    }
  }

  // Try smart replacement first to preserve original formatting
  const smartReplaced = smartReplaceScriptInJson(jsonInput.value, scriptArea.value);

  if (smartReplaced) {
    // Verify the smart replacement worked by parsing it
    const verifyParsed = safeParseJson(smartReplaced);
    if (verifyParsed.ok) {
      jsonInput.value = smartReplaced;
      lastParsedObject = verifyParsed.value;
      return;
    }
  }

  // Fallback: full JSON reconstruction
  lastParsedObject.script = escapeNewlinesForJson(scriptArea.value);
  jsonInput.value = JSON.stringify(lastParsedObject, null, 2);
}

function formatJsonInEditor() {
  const parsed = safeParseJson(jsonInput.value);
  if (!parsed.ok) {
    alert('Cannot format invalid JSON:\n' + parsed.error);
    return;
  }
  jsonInput.value = JSON.stringify(parsed.value, null, 2);
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    return false;
  }
}

// Event listeners
loadBtn.addEventListener('click', (e) => {
  e.preventDefault();
  loadJsonToPane();
});

applyBtn.addEventListener('click', (e) => {
  e.preventDefault();
  applyScriptEditsToJson();
  // re-parse so we have canonical object
  try { lastParsedObject = JSON.parse(jsonInput.value); } catch {}
  alert('JSON updated from edited script.');
});

formatJsonBtn.addEventListener('click', (e) => {
  e.preventDefault();
  formatJsonInEditor();
});

copyJsonBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  const ok = await copyToClipboard(jsonInput.value);
  if (ok) alert('JSON copied to clipboard'); else alert('Copy failed (browser permission?)');
});

copyScriptBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  const ok = await copyToClipboard(scriptArea.value);
  if (ok) alert('Script copied to clipboard'); else alert('Copy failed (browser permission?)');
});

// Initialize with example JSON if the left editor is empty
(function insertExampleIfEmpty(){
  if (jsonInput.value.trim().length === 0) {
    const example = {
      script: "const createSystemPrompt = () => {\n  const header = `# AI asistentka Romana (O2)\\n\\n## Základní nastavení\\n- **Jméno**: Romana` ;\n  return header;\n};\n\nconst systemPromptTemplate = createSystemPrompt();\nreturn { success: true };"
    };
    jsonInput.value = JSON.stringify(example, null, 2);
  }
})();
