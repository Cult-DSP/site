````md
# Agent Onboarding and Self-Updating Prompt: Spatial Root Layout Builder

You are working on the Spatial Root Layout Builder, a browser-based HTML/JavaScript utility for creating, editing, validating, previewing, and exporting speaker layout JSON files for Spatial Root.

Spatial Root is a layout-agnostic spatial audio playback engine. The layout builder should be hosted separately from the C++ runtime, likely on the CULT DSP website. Do not add editor functionality to the Spatial Root C++ app unless explicitly instructed.

## 1. First Principles

Before making changes, internalize these rules:

1. The layout builder is an authoring utility, not the runtime.
2. The output must remain compatible with the current Spatial Root layout JSON format unless instructed otherwise.
3. The builder should make layout editing easier without changing Spatial Root playback semantics.
4. Device channel numbers are meaningful hardware routing values.
5. Never silently renumber channels.
6. Non-contiguous device channels are valid.
7. Subwoofer channels may sit inside the broader device channel range.
8. Nonlinear channel layouts should produce warnings, not errors.
9. Duplicate active channels should remain errors unless explicit channel sharing is later designed.
10. Keep the tool lightweight, static, and browser-native unless the existing site architecture requires otherwise.

## 2. Current Export Format

The default export format is:

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

Do not replace this with a richer schema unless explicitly asked. A richer internal model is allowed, but the default exported JSON should remain compatible with Spatial Root.

3. Key Spatial Root Channel Semantics

Spatial Root supports nonlinear speaker layouts.

This means the following are valid and must not block export:

Speakers use channels 0–11, then 16–45, then 48–59.
A subwoofer uses channel 47, while main speakers use channels around it.

These cases should generate warnings because the user should verify hardware routing, but they are not invalid.

Use wording like:

Warning: Non-contiguous device channels detected. This is allowed. Spatial Root supports nonlinear speaker layouts, but the output device must expose enough channels for the highest device channel.

Use wording like:

Warning: Subwoofer channel sits inside the broader device channel range. This is allowed. Confirm that the hardware routing intentionally sends subwoofer or LFE content to this output.

Do not write validation logic that treats these as hard failures.

4. Validation Severity Rules

Use three levels:

info
warning
error
Errors

Errors should block export only when the layout is structurally invalid or ambiguous.

Examples:

Missing speakers array.
Missing required speaker fields.
Non-integer device channel.
Duplicate active device channels.
Non-finite azimuth, elevation, or radius.
Radius is zero or negative.
Export JSON cannot be generated.
Warnings

Warnings should not block export.

Examples:

Non-contiguous device channels.
Missing channel ranges.
Highest device channel is much larger than speaker count.
Subwoofer channel sits inside main layout channel range.
Layout appears one-based.
Speaker order differs from channel order.
Optional hardware channel count appears too low.
Notes mention uncertain mapping.
Info

Info messages are neutral summaries.

Examples:

Imported 56 speakers and 1 subwoofer.
Highest device channel is 59.
Minimum required output bus size is 60 channels.
Layout uses radians internally and degrees in the UI.
5. UI Requirements

The layout builder should include four main areas:

Layout setup
Speaker/subwoofer table
Visual preview
Validation/export panel

The UI should prioritize clarity over complexity.

Use degrees by default for human editing, but export radians.

The table should allow:

Add speaker
Add subwoofer
Duplicate row
Delete row
Enable/disable row
Sort by channel
Sort by azimuth
Offset channels
Convert one-based to zero-based
Convert zero-based to one-based

All channel conversion tools must be explicit user actions.

6. Visual Preview Requirements

MVP preview:

Top-down polar view
Listener at center
Speakers positioned by azimuth and radius
Labels show either ID or device channel
Subwoofers visually distinct
Basic elevation view if practical

Do not overbuild the first version with a complex 3D engine unless specifically requested.

7. Import Requirements

When importing JSON:

Preserve original channel values.
Convert radians to degrees for display.
Preserve notes.
Detect speakers and subwoofers.
Run validation immediately.
Show a summary.
Do not automatically fix or renumber anything.

Import summary example:

Imported 56 speakers and 1 subwoofer.
Highest device channel: 59.
Detected nonlinear channel layout. This is supported by Spatial Root.
No duplicate active channels found.
8. Export Requirements

Default export:

Include active speakers only.
Include active subwoofers only.
Convert displayed degrees to radians.
Use channel, az, el, and radius for speakers.
Use channel for subwoofers.
Include notes if present.
Pretty-print by default.

Do not include UI-only fields in the default export.

UI-only fields include:

id
enabled
azimuthDeg
elevationDeg
radiusMeters
type
9. Design Style

Match the CULT DSP / Spatial Root visual direction:

Light interface
Rounded cards
Soft shadows
Subtle blue accent
Spacious layout
Clean table editing
Technical but minimal typography
Clear visual distinction between errors and warnings

Avoid a dense engineering dashboard look unless the user specifically requests it.

10. Recommended Implementation Structure

Prefer modular plain JavaScript unless the host website already uses a framework.

Suggested files:

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

If using React or another framework, preserve the same conceptual module boundaries.

11. Self-Updating Instructions

As you work, keep this project easy for the next agent or developer to continue.

After making meaningful changes, update the relevant documentation.

Maintain or create the following docs if they exist in the project:

LAYOUT_BUILDER_DESIGN.md
AGENTS.md
CHANGELOG.md
TODO.md
Update LAYOUT_BUILDER_DESIGN.md when:
The layout schema changes.
Validation severity changes.
Import/export behavior changes.
New UI panels are added.
New assumptions about Spatial Root runtime behavior are introduced.
Update AGENTS.md when:
Build commands change.
File structure changes.
Testing workflow changes.
Important constraints are discovered.
There are pitfalls future agents should avoid.
Update CHANGELOG.md when:
A user-visible feature is added.
Export behavior changes.
Validation behavior changes.
A bug is fixed.
Update TODO.md when:
You defer work.
You discover an issue but do not fix it.
You identify a future feature that should not be implemented yet.

Do not leave important discoveries only in chat or commit messages. Put durable project knowledge into docs.

12. Critical Pitfalls to Avoid

Do not:

Treat channel gaps as errors.
Treat subwoofer placement inside the device channel range as an error.
Collapse nonlinear layouts into contiguous channel order.
Silently convert one-based channels to zero-based.
Rename channel to deviceChannel in the default export unless Spatial Root supports that schema.
Export degrees where Spatial Root expects radians.
Add backend requirements for the MVP.
Add C++ runtime changes for a website layout editor task.
Change Spatial Root playback assumptions without checking the runtime code and docs.
13. Suggested First Development Pass

Start with:

Static page shell.
Hardcoded example layout.
Editable speaker table.
Validation function.
JSON export.
JSON import.
Warning handling for nonlinear channels.
Simple top-down preview.

Confirm that the following layouts import and export without blocking errors:

Minimal template layout.
TransLAB-style layout.
AlloSphere-style nonlinear layout.

The AlloSphere-style case is the most important validation test because it includes non-contiguous device channels and subwoofer routing that should be allowed.

14. Acceptance Criteria for MVP

The MVP is acceptable when:

A user can upload a Spatial Root layout JSON.
The table displays speakers and subwoofers correctly.
Angles are editable in degrees.
Exported JSON uses radians.
Non-contiguous channel layouts show warnings only.
Subwoofer channels inside the broader channel range show warnings only.
Duplicate active channels show errors.
The user can copy or download valid JSON.
The visual preview makes obvious mapping mistakes easier to see.
Documentation reflects the current implementation.
15. Final Reminder

The layout builder should help users understand and validate speaker geometry plus hardware routing. It should not enforce a simplified channel model that Spatial Root no longer requires.

Spatial Root supports nonlinear speaker layouts. Preserve that capability throughout the builder.
```
````
