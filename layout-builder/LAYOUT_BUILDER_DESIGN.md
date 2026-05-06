# Spatial Root Layout Builder — Design Documentation

## Overview

The Spatial Root Layout Builder is a browser-based HTML/JavaScript utility for creating, editing, validating, previewing, and exporting speaker layout JSON files for Spatial Root.

Spatial Root is a layout-agnostic spatial audio playback engine. The layout builder should be hosted separately from the C++ runtime, likely on the CULT DSP website.

**Key principle:** Spatial Root supports nonlinear speaker layouts. The builder must not enforce a simplified channel model that Spatial Root no longer requires.

---

## Architecture

### Module Structure

```
layout-builder/
├── index.html              ← Main page shell
├── styles.css              ← All styles (CSS variables + components)
├── src/
│   ├── layoutModel.js      ← Core data model (speakers, subwoofers, conversions)
│   ├── validation.js       ← Three-level validation (info, warning, error)
│   ├── importExport.js     ← JSON import/export, degree/radian conversion
│   ├── preview2d.js        ← 2D polar preview canvas renderer
│   └── app.js              ← Main app orchestration and UI binding
├── examples/
│   ├── layout_template.json        ← Minimal 4-speaker example
│   ├── translab-sono-layout.json   ← 12 speakers + subwoofer
│   └── allosphere_layout.json      ← Nonlinear layout (test case)
└── README.md (future)      ← User guide
```

Each module is designed to be standalone and testable. No build step required—plain browser JavaScript.

---

## Data Model

### LayoutModel

The `LayoutModel` class manages the layout state and coordinate conversions.

#### Speaker Object (Internal)

```javascript
{
  id: 0,                    // Internal unique ID (UI only)
  channel: 0,               // Device output channel (export target)
  azimuthDeg: 0.0,          // Azimuth in degrees (display/edit)
  elevationDeg: 0.0,        // Elevation in degrees (display/edit)
  radiusMeters: 1.0,        // Distance from listener (display/edit)
  enabled: true,            // Whether to include in export
  type: 'speaker'           // For UI distinction
}
```

#### Subwoofer Object (Internal)

```javascript
{
  id: 1000,                 // Internal unique ID (UI only)
  channel: 47,              // Device output channel (export target)
  enabled: true,            // Whether to include in export
  type: 'subwoofer'         // For UI distinction
}
```

#### Exported Speaker (Radians)

```json
{
  "channel": 0,
  "az": 0.0,
  "el": 0.0,
  "radius": 1.0
}
```

#### Exported Subwoofer

```json
{
  "channel": 47
}
```

### Key Conversions

- **Internal display:** degrees, meters
- **Exported:** radians, meters
- **Conversion factors:**
  - `RAD_TO_DEG = 180 / π`
  - `DEG_TO_RAD = π / 180`

---

## Validation Rules

### Three Severity Levels

#### Info (Neutral Summaries)
- "Imported 56 speakers and 1 subwoofer."
- "Highest device channel is 59."
- "Minimum required output bus size is 60 channels."

#### Warning (Allowed but Notable)
- Non-contiguous device channels detected. Allowed.
- Subwoofer channel sits inside speaker range. Allowed.
- Highest channel much larger than speaker count.
- Layout appears one-based; confirm if intentional.
- Speaker order differs from channel order.
- Notes mention uncertain mapping.

#### Error (Export-Blocking)
- Duplicate active device channels.
- Non-integer device channel.
- Non-finite azimuth, elevation, or radius.
- Radius is zero or negative.
- Missing required fields.

**Errors block export. Warnings do not.**

### Critical Rules

1. **Nonlinear layouts are allowed.** Gaps in device channel numbers are not errors.
   - Example: Channels 0–7, 16–23, 32–45 is valid.
   - Generates a warning to confirm hardware routing, but allows export.

2. **Subwoofers inside speaker range are allowed.**
   - Example: Speakers use channels 0–47; subwoofer uses channel 47.
   - Generates a warning to confirm hardware routing, but allows export.

3. **Duplicate active channels are errors.**
   - Two speakers (or a speaker and subwoofer) cannot use the same device channel.
   - Blocks export until resolved.

---

## UI Structure

### Four Main Areas

1. **Speaker/Subwoofer Tables**
   - Add, duplicate, delete, enable/disable rows
   - Inline editing of channel, azimuth, elevation, radius
   - Sort by channel or azimuth
   - Display in degrees for human readability

2. **Visual Preview (Top-Down Polar)**
   - Listener at center
   - Speakers positioned by azimuth (0° = front) and radius
   - Subwoofers shown distinctly at corner
   - Elevation indicated by ring color
   - Toggle label mode (channel vs. internal ID)

3. **Validation Panel**
   - Displays info, warning, and error messages
   - Grouped by severity
   - Actionable guidance (e.g., "confirm hardware routing")

4. **Export/Import Panel**
   - Generate JSON (converts degrees → radians)
   - Copy to clipboard
   - Download file
   - Import JSON file
   - Load example layouts

---

## Import/Export Behavior

### Import

1. User selects a JSON file or pastes JSON text.
2. Parser validates JSON structure.
3. `LayoutModel.fromRadians()` converts radians to degrees and loads data.
4. Internal IDs and enabled state are reset (import as-is, no auto-fix).
5. Validation runs immediately.
6. Summary displayed to user.

### Export

1. User clicks "Generate JSON" or "Download."
2. Only **active** (enabled=true) speakers and subwoofers are included.
3. Degrees are converted to radians.
4. Notes are preserved if present.
5. UI-only fields (id, enabled, azimuthDeg, etc.) are excluded.
6. Pretty-printed JSON for readability.

### Example Export

```json
{
  "speakers": [
    {
      "channel": 0,
      "az": 0.0,
      "el": 0.0,
      "radius": 1.0
    }
  ],
  "subwoofers": [
    {
      "channel": 47
    }
  ],
  "notes": [
    "Example layout"
  ]
}
```

---

## Design Tokens & Visual Direction

### Colors
- **Primary:** Dark blue (#2e5090) — Spatial Root visual identity
- **Accents:** Light blue (#4a90e2), red (#e24a4a), orange (#f57c00)
- **Neutral:** Gray tones for text and borders
- **Background:** Light surfaces (#f8f9fa, white)

### Typography
- **Sans-serif:** System fonts (Segoe UI, Roboto, etc.)
- **Monospace:** Monaco, Courier New — for channel numbers and JSON
- **Size scale:** 11px–24px

### Components
- Rounded corners (4px–12px)
- Soft shadows
- Light borders
- Spacious padding
- Clean, minimal layout

### Tone
- Technical but approachable
- Clear visual hierarchy
- Emphasis on clarity over density
- No overly complex 3D or animated visualizations (MVP)

---

## Known Constraints

1. **No build step.** Plain HTML/CSS/JavaScript, browser-native.
2. **No backend.** All processing client-side.
3. **No complex 3D.** 2D polar preview MVP only.
4. **No runtime integration.** Layout builder is authoring tool, not playback engine.
5. **Preserve Spatial Root semantics.** Do not simplify or renumber channels automatically.

---

## Testing Strategy

### Test Cases

1. **Minimal template (layout_template.json)**
   - 4 speakers in a square, zero-based channels 0–3
   - Validates basic import, display, and export

2. **TransLAB layout (translab-sono-layout.json)**
   - 12 speakers in a ring at 30° intervals
   - 1 subwoofer on channel 12 (outside speaker range)
   - Tests subwoofer integration and warnings

3. **AlloSphere nonlinear (allosphere_layout.json)**
   - 30 speakers across channels 0–7, 16–23, 32–45
   - 1 subwoofer on channel 47 (inside speaker range)
   - Tests nonlinear layout handling, gap warnings, and subwoofer-inside-range warnings

### Validation Test Matrix

| Scenario | Expected Outcome |
|----------|------------------|
| Import template | ✓ No errors, 4 speakers displayed |
| Import TransLAB | ✓ No errors, 12 speakers + sub, no warnings |
| Import AlloSphere | ✓ No errors, 30 speakers, 2+ warnings (nonlinear + subwoofer inside) |
| Export with duplicates | ✗ Error blocks export |
| Enable/disable speakers | ✓ Disabled speakers excluded from export |
| Sort by channel | ✓ Table reorders, preview updates |
| Edit azimuth in degrees | ✓ Export converts to radians |
| Delete speaker | ✓ Row removed, validation updates |

---

## Future Enhancements (Not in MVP)

- **CSV import/export** for batch editing (importExport.js has hooks)
- **Elevation preview** (3D view if framework added)
- **Preset library** (common layouts: surround, Atmos, etc.)
- **Hardware device detection** (suggest bus size based on max channel)
- **ADM cross-validation** (if Spatial Root ADM support added)
- **Layout versioning** (save history)
- **Batch channel offset tool** (UI placeholder exists)
- **One-based ↔ zero-based conversion tool** (UI placeholder exists)

---

## Implementation Notes

### Degree/Radian Conversions

All user-facing values use degrees. Conversion happens at import/export boundaries only:

- **Import:** radians → degrees (stored in model as degrees)
- **Display:** degrees (as-is)
- **Edit:** degrees (as-is)
- **Export:** degrees → radians

This avoids accumulated floating-point error and keeps the mental model simple for users.

### Disabled Rows

Clicking the checkbox in a table row disables a speaker/subwoofer:

- **Disabled elements are not exported.**
- **Disabled elements do not appear in validation errors** (e.g., duplicate channels).
- **Disabled rows appear semi-transparent in the table.**
- **Visual preview hides disabled elements.**

This allows users to experiment without deleting data.

### Label Modes

The preview canvas supports two label modes:

- **Device Channel** (default): Shows the hardware output channel (export target)
- **Internal ID** (alt): Shows the internal model ID (for debugging)

Toggle with the "Label Mode" dropdown.

### Validation Message Grouping

Validation messages are displayed in order:

1. Info messages (summaries, statistics)
2. Error messages (export-blocking issues)
3. Warning messages (allowed but notable)

Users see all three types, but only errors prevent export.

---

## File Size & Performance

- `layoutModel.js` ~6 KB
- `validation.js` ~7 KB
- `importExport.js` ~4 KB
- `preview2d.js` ~8 KB
- `app.js` ~12 KB
- `styles.css` ~10 KB
- **Total:** ~50 KB (unminified, single-file capable)

Loads instantly in any modern browser. No external dependencies.

---

## Accessibility & Usability

- All tables use semantic HTML (`<table>`, `<thead>`, `<tbody>`)
- Labels paired with inputs via `<label>`
- Keyboard-navigable buttons and inputs
- Clear, high-contrast colors for validation messages
- Responsive layout (stacks on mobile)
- Error messages include actionable guidance

---

## Maintenance & Handoff

### When to Update This Document

- Schema changes (add/remove fields)
- Validation rule changes
- Import/export behavior changes
- New UI panels
- New assumptions about Spatial Root

### Related Documents

- `agents.md` — Agent onboarding (constraints, first principles, pit falls)
- `README.md` — User guide (getting started, features, examples)
- `CHANGELOG.md` — Release notes (features added, bugs fixed)

### Code Comments

Each module includes a header comment with purpose and usage. Functions have JSDoc-style comments.

---

## Version History

- **v0.1.0** (May 2026) — MVP released
  - Core table editing
  - Validation with three severity levels
  - JSON import/export with radian/degree conversion
  - 2D polar preview
  - Three example layouts for testing
