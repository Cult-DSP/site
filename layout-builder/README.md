# Spatial Root Layout Builder

A browser-based authoring tool for creating, editing, validating, and exporting speaker layout JSON files for Spatial Root.

## Features

✅ **Table-based editing**
- Add, duplicate, delete, and disable speakers and subwoofers
- Inline editing with real-time validation
- Sort by device channel or azimuth angle
- Support for non-contiguous (nonlinear) device channels

✅ **Visual preview**
- Top-down polar view from listener perspective
- Azimuth positioned around the listener (0° front, 90° right, etc.)
- Elevation indicated by ring color (blue = up, orange = down)
- Toggle label mode between device channel and internal ID

✅ **Three-level validation**
- ✓ **Info:** Import summaries and statistics
- ⚠ **Warnings:** Non-contiguous channels, subwoofer placement (allowed but notable)
- ✗ **Errors:** Duplicate channels, invalid data (blocks export)

✅ **Import/Export**
- Load existing Spatial Root layout JSON files
- Export with automatic degree → radian conversion
- Copy to clipboard or download as file
- Preserves notes and layout metadata

✅ **Example layouts**
- Minimal template (4 speakers)
- TransLAB-style (12 speakers + subwoofer)
- AlloSphere nonlinear (30 speakers, tests edge cases)

## Getting Started

### Open the Builder

```bash
# No build step required — just open in a browser
open index.html
```

Or host on a web server (Cloudflare Pages, GitHub Pages, etc.).

### Load an Example

1. Click **Template**, **TransLAB**, or **AlloSphere** to load a pre-built layout
2. Edit speakers/subwoofers in the table
3. View the polar preview to verify positions
4. Check validation messages for any warnings
5. Click **Generate JSON** and **Download JSON** to save

### Create a Layout from Scratch

1. Click **+ Add Speaker** to create new speakers
2. Set device channels, azimuths (degrees), elevations, and radius
3. Add a **+ Add Subwoofer** if needed
4. Use **Sort by Channel** to organize the list
5. Enable/disable rows as needed (disabled rows don't export)
6. Export when validation shows no errors

## Key Concepts

### Degrees vs. Radians

- **Edit and display:** Degrees (0–360° for azimuth, ±180° for elevation)
- **Export:** Radians (multiply by π/180)
- **Conversion happens automatically** at import/export boundaries

### Device Channels

- Each speaker and subwoofer has a **device channel** — the hardware output routing target
- Channels must be unique (no duplicates in active elements)
- Channels can be non-contiguous (Spatial Root supports nonlinear layouts)
- Example: Channels 0–7, 16–23, 32–45 is valid

### Nonlinear Layouts

Spatial Root supports speaker layouts with gaps in channel numbering:

- Channels don't need to be 0, 1, 2, 3, …
- Example: Channels 0, 2, 4, 6 (skipping odd channels)
- The builder warns about non-contiguous channels but allows export
- Confirm your hardware routing exposes enough output channels

### Subwoofers Inside Speaker Range

If your speaker channels span 0–45 but the subwoofer uses channel 47:
- The subwoofer is **outside** the speaker range (allowed, typical case)
- No warning needed

If the subwoofer uses channel 23 (and speakers span 0–45):
- The subwoofer is **inside** the speaker range (allowed but unusual)
- The builder warns to confirm hardware routing is intentional

### Disabled Rows

Click the **On** checkbox to disable a speaker or subwoofer:
- Disabled elements don't export
- Disabled elements don't trigger validation errors
- Useful for testing partial layouts without deletion

## Validation Rules

### Warnings (Allow Export)

- ✓ Non-contiguous device channels
- ✓ Subwoofer channel inside speaker channel range
- ✓ One-based channel numbering (likely 1, 2, 3, … instead of 0, 1, 2, …)
- ✓ Speaker order differs from channel order

### Errors (Block Export)

- ✗ Duplicate active device channels
- ✗ Non-integer device channel
- ✗ Non-finite azimuth, elevation, or radius
- ✗ Radius ≤ 0

## Export Format

The default export is Spatial Root layout JSON:

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
    "Optional mapping notes"
  ]
}
```

- Only **active** (enabled) speakers and subwoofers export
- Angles are in **radians**
- Notes are preserved if present
- All values are compatible with Spatial Root playback

## Project Structure

```
layout-builder/
├── index.html                   ← Open this in a browser
├── styles.css                   ← All styling
├── src/
│   ├── layoutModel.js           ← Data model and conversions
│   ├── validation.js            ← Validation engine
│   ├── importExport.js          ← JSON I/O
│   ├── preview2d.js             ← Canvas renderer
│   └── app.js                   ← UI orchestration
├── examples/
│   ├── layout_template.json
│   ├── translab-sono-layout.json
│   └── allosphere_layout.json
└── LAYOUT_BUILDER_DESIGN.md     ← Design document
```

## No Build Step

This tool is plain HTML/CSS/JavaScript. No dependencies. No build process. Works offline in any modern browser.

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers with viewport support

## Limitations

- Client-side only (all processing in the browser)
- No 3D visualization (top-down 2D preview only in MVP)
- No preset library yet (bring your own layouts or use examples)

## Future Enhancements

- CSV import/export for batch editing
- 3D elevation preview
- Preset library (common venues, standards)
- Batch channel offset tool
- Layout versioning and history

## Development

### Adding a New Validation Rule

Edit `src/validation.js`:

```javascript
// In Validator.warningMessages():
if (condition) {
  messages.push(
    new ValidationMessage(
      'warning',
      'Title',
      'Description shown to user.',
      'Optional technical details.'
    )
  );
}
```

### Adding a New UI Control

Edit `src/app.js` and `index.html`. All modules communicate through `LayoutModel`.

### Updating Styling

Edit `styles.css`. All design tokens are in `:root { }` at the top.

## Support

For issues or feature requests, see the Spatial Root project:

- GitHub: https://github.com/Cult-DSP/Spatial-Root
- Docs: See internalDocs/agents.md for onboarding

## License

Same as Spatial Root (see repository).
