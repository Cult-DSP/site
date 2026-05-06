# Spatial Root Layout Builder Design Doc

## 1. Purpose

The Spatial Root Layout Builder is a browser-based utility for creating, editing, validating, and exporting loudspeaker layout JSON files for Spatial Root. It should be hosted as a lightweight HTML/JavaScript tool on the CULT DSP website rather than embedded inside the C++ Spatial Root application.

The goal is to keep Spatial Root focused on playback, rendering, and runtime control, while providing users with a practical authoring tool for venue-specific speaker layouts and device channel assignments.

The builder should make it easy to create valid Spatial Root layout files for simple rings, layered arrays, irregular research spaces, and nonlinear hardware channel layouts.

## 2. Core Design Principle

Spatial Root layout authoring must distinguish between three concepts:

1. Visual speaker identity  
   A human-facing label such as S01, S02, Height 01, or Sub 1.

2. Runtime speaker entry order  
   The order of speaker objects in the exported JSON file.

3. Device output channel  
   The actual output channel used by the audio device or routing backend.

Spatial Root now supports nonlinear speaker layouts. Therefore, exported speaker channels do not need to be contiguous, and subwoofer channels may sit inside the broader device channel range. These conditions should be flagged as useful warnings, not blocking validation errors.

## 3. Current Spatial Root Layout Format

The current exported layout format should remain compatible with the existing Spatial Root runtime format:

```json
{
  "speakers": [
    {
      "channel": 0,
      "az": 1.3554386270971586,
      "el": 0.5699542990454679,
      "radius": 5.929404714372819
    }
  ],
  "subwoofers": [
    {
      "channel": 47
    }
  ],
  "notes": [
    "mapping notes here"
  ]
}

The builder may use a richer internal representation, but the default export should preserve the existing speakers, subwoofers, and notes structure.

4. Internal Builder Model

The browser UI should use a friendlier internal model than the exported runtime JSON.

Suggested internal representation:

{
  "layoutName": "Example Layout",
  "units": "meters",
  "angleDisplay": "degrees",
  "channelIndexing": "zero-based",
  "speakers": [
    {
      "id": "S01",
      "type": "speaker",
      "deviceChannel": 0,
      "azimuthDeg": 77.66,
      "elevationDeg": 32.66,
      "radiusMeters": 5.93,
      "enabled": true
    }
  ],
  "subwoofers": [
    {
      "id": "Sub 1",
      "type": "subwoofer",
      "deviceChannel": 47,
      "enabled": true
    }
  ],
  "notes": []
}

On export, the builder should convert degrees to radians and write the current Spatial Root-compatible format.

5. Required MVP Features

The first version should include:

Upload existing Spatial Root layout JSON.
Edit speaker data in a table.
Add, duplicate, delete, enable, and disable speakers.
Add, duplicate, delete, enable, and disable subwoofers.
Show azimuth and elevation in degrees by default.
Allow radians view for technical inspection.
Validate layout structure.
Show warnings and errors clearly.
Export pretty-printed Spatial Root JSON.
Copy exported JSON to clipboard.
Provide several starter templates.
6. Starter Templates

The MVP should include these presets:

Empty layout
8-speaker horizontal ring
16-speaker horizontal ring
Two-layer ring
TransLAB-style compact array
AlloSphere-style irregular layout

The AlloSphere-style preset is important because it demonstrates nonlinear device channels and gaps in the hardware channel sequence. The builder must support this without attempting to “fix” the channel numbers.

7. Layout Editing UI

The UI should be organized into four main panels.

7.1 Layout Setup Panel

Fields:

Layout name
Description
Notes
Angle display: degrees or radians
Distance unit: meters
Import channel indexing: zero-based or one-based
Optional hardware output channel count

The optional hardware channel count is used only for validation warnings. If omitted, the builder should infer the minimum required output bus size from the highest device channel.

7.2 Speaker Table Panel

The speaker table should include:

Field	Description
ID	Human-facing speaker label
Device Channel	Actual output channel
Azimuth	Horizontal angle
Elevation	Vertical angle
Radius	Distance from listener/origin
Type	Speaker or subwoofer
Enabled	Whether this entry is included in export

Actions:

Add speaker
Add subwoofer
Duplicate selected
Delete selected
Sort by channel
Sort by azimuth
Reverse order
Offset selected channels
Convert one-based to zero-based
Convert zero-based to one-based

The table should never silently renumber channels. Any channel renumbering must be explicit.

7.3 Visual Preview Panel

The preview should include at minimum:

Top-down polar view
Listener at center
Azimuth around the listener
Radius as distance from center
Speaker labels as device channel numbers or IDs
Subwoofers visually distinct from main speakers
Elevation view
Elevation angle on vertical axis
Approximate radius/depth on horizontal axis
Useful for detecting accidentally inverted height layers

A full 3D view can be added later, but the MVP should prioritize clarity and low implementation complexity.

7.4 Validation and Export Panel

This panel should show:

Validation status
Error count
Warning count
Minimum required output channel count
Speaker count
Subwoofer count
Export button
Copy JSON button
Optional diagnostic report export
8. Validation Rules

Validation should distinguish between errors and warnings.

Errors block export only when the layout would be structurally invalid or ambiguous.

Warnings provide useful information but should not block export.

8.1 Errors

The following should be errors:

Missing speakers array.
A speaker is missing channel.
A speaker is missing az.
A speaker is missing el.
A speaker is missing radius.
A speaker channel is not an integer.
A subwoofer channel is not an integer.
Duplicate active device channels across speakers and subwoofers.
Azimuth is not a finite number.
Elevation is not a finite number.
Radius is not a finite positive number.
Elevation is outside a reasonable spherical range, such as below -π/2 or above π/2.
Export JSON cannot be generated.

Duplicate channels should be errors because the same device output cannot safely represent two active layout entries unless Spatial Root later introduces explicit channel sharing semantics.

8.2 Warnings

The following should be warnings only:

Non-contiguous device channels detected.
Missing channel ranges detected.
Highest device channel implies a larger output bus than the number of speakers.
Subwoofer channel sits inside the broader main speaker channel range.
Subwoofer channel appears before, between, or after main speaker channels.
Speaker order differs from channel order.
Very small radius.
Very large radius.
Layout appears one-based and may need conversion.
Layout contains notes suggesting uncertain mapping.
Optional hardware channel count is lower than highest channel plus one.

Important: non-contiguous channels are valid in Spatial Root. They should not be treated as errors. Spatial Root supports nonlinear speaker layouts by separating internal render-bus indexing from device output channel mapping.

Example warning wording:

⚠️ Non-contiguous device channels detected: 12–15 and 46 are unused. This is allowed. Spatial Root supports nonlinear speaker layouts, but the output device must expose enough channels for the highest device channel.

Example subwoofer warning wording:

⚠️ Subwoofer channel 47 sits inside the broader device channel range used by the main layout. This is allowed. Confirm that the hardware routing intentionally sends LFE/sub content to this output.
9. Spatial Root Mapping Assumption

The builder should assume Spatial Root uses the exported channel field as a device output channel, not as a required contiguous speaker index.

Spatial Root may internally build a contiguous render bus for DBAP or other spatialization algorithms, then scatter or remap those internal channels to the declared device output channels.

Because of this, the builder should never force a user to collapse or renumber a nonlinear layout.

10. Import Behavior

When importing JSON:

Parse the uploaded file.
Detect current Spatial Root format.
Convert radians to degrees for display.
Preserve original channel values.
Preserve notes.
Run validation.
Show import summary.

Import summary example:

Imported 56 speakers and 1 subwoofer.
Highest device channel: 59.
Detected nonlinear channel layout. This is supported.
No duplicate active channels found.

If the layout appears to be one-based, warn but do not automatically convert:

⚠️ The lowest channel is 1. This may be a one-based layout. Use “Convert to zero-based” only if your hardware routing expects zero-based channel numbering.
11. Export Behavior

The default export should produce Spatial Root-compatible JSON:

{
  "speakers": [
    {
      "channel": 0,
      "az": 1.3554386270971586,
      "el": 0.5699542990454679,
      "radius": 5.929404714372819
    }
  ],
  "subwoofers": [
    {
      "channel": 47
    }
  ],
  "notes": [
    "Generated with Spatial Root Layout Builder"
  ]
}

Export options:

Pretty JSON
Compact JSON
Copy to clipboard
Download .json
Export validation report as .md

The builder should not include UI-only fields such as id, enabled, azimuthDeg, or radiusMeters in the default runtime export.

12. Optional Future Export Format

Later, a richer v2 layout schema may be useful:

{
  "version": "spatialroot-layout-2.0",
  "metadata": {
    "name": "Example Layout",
    "units": "meters",
    "angleUnit": "radians"
  },
  "speakers": [
    {
      "id": "S01",
      "deviceChannel": 0,
      "az": 1.3554386270971586,
      "el": 0.5699542990454679,
      "radius": 5.929404714372819
    }
  ],
  "subwoofers": [
    {
      "id": "Sub 1",
      "deviceChannel": 47
    }
  ]
}

Do not implement this as the default unless Spatial Root runtime support is updated.

13. Procedural Layout Generation

The builder should eventually support procedural generation.

13.1 Ring Generator

Inputs:

Number of speakers
Radius
Elevation
Starting azimuth
Clockwise or counterclockwise order
First device channel
Channel step

Outputs:

A circular speaker ring
13.2 Layered Ring Generator

Inputs:

Number of layers
Speakers per layer
Radius per layer
Elevation per layer
Starting channel per layer
Starting azimuth per layer
Azimuth offset per layer

Outputs:

Multi-ring layout suitable for height arrays, domes, and irregular immersive spaces.
13.3 Cartesian Import

Future feature:

Import x, y, z
Convert to az, el, radius
Preview before committing
Allow axis convention selection

This is important because venue measurements are often collected as Cartesian coordinates.

14. Rotation and Transform Tools

Future transform tools:

Rotate layout around vertical axis
Mirror left/right
Scale all radii
Offset all channels
Normalize radius
Convert degrees/radians
Convert one-based/zero-based channels

Rotation should be explicit and previewable. The builder should show before/after warnings if the transform changes channel order or speaker orientation.

15. Visual Design

The layout builder should match the CULT DSP / Spatial Root design language:

Clean Apple-style light interface
Rounded cards
Subtle shadows
Soft blue accent color
Spacious table layout
Large visual preview
Minimal technical typography
Clear warning and error states
No unnecessary visual clutter

The tool should feel like a precise technical instrument, not a generic form generator.

16. Suggested File Structure

For a static website implementation:

layout-builder/
  index.html
  styles.css
  src/
    app.js
    layoutModel.js
    importExport.js
    validation.js
    generators.js
    transforms.js
    preview2d.js
    presets.js
  examples/
    layout_template.json
    translab-sono-layout.json
    allosphere_layout.json

If the CULT DSP site already uses a framework, adapt the structure to that framework, but keep the layout builder modular.

17. Implementation Priorities

Priority 1:

Static UI
Import JSON
Speaker table editing
Validation
Export JSON

Priority 2:

Top-down visual preview
Presets
Channel offset tools
Degrees/radians toggle

Priority 3:

Layer generator
Cartesian import
Elevation view
Markdown diagnostic export

Priority 4:

Full 3D preview
Shareable encoded layout URLs
Richer v2 schema support
18. Non-Goals

The layout builder should not:

Modify Spatial Root C++ runtime behavior.
Require a backend server.
Require users to install anything.
Force contiguous channel layouts.
Silently renumber device channels.
Treat AlloSphere-style nonlinear device routing as invalid.
Become a replacement for the Spatial Root runtime app.
Attempt to solve audio routing outside of layout JSON generation.
19. Summary

The Spatial Root Layout Builder should be a small, precise browser utility for authoring runtime layout JSON. Its most important job is not only drawing speakers, but helping users understand the relationship between venue geometry and device output routing.

The builder should validate aggressively, but it must not over-constrain valid nonlinear layouts. Non-contiguous device channels, skipped ranges, and subwoofer channels inside the broader device channel range are normal conditions for some Spatial Root deployments and should remain warnings only.
```
