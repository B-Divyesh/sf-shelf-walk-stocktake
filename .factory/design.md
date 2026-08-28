# Shelf Walk Stocktake — visual thesis

## Direction: brutalist concrete and moss

Shelf counting happens in unglamorous, physical places: block walls, dusty steel,
marker pen, taped shelf labels and occasional green growth at the loading-bay
edge. The interface treats that honesty as an advantage. It uses a pale concrete
field, hard black rules and high-visibility moss green instead of polished SaaS
gradients. Oversized location codes make the real-world shelf path impossible to
miss. The product should feel like a dependable clipboard that happens to have a
camera.

## Tokens

- Concrete `#E7E5DD`: light background.
- Chalk `#F8F7F2`: raised work surface.
- Carbon `#171A16`: primary text and structural rules.
- Steel `#5D625A`: secondary text (contrast 4.7:1 on concrete).
- Moss `#35682D`: primary action; white text is reserved for the darker
  `#254E20` interaction state (7.1:1).
- Lichen `#C9DC71`: selected/highlight field with carbon text.
- Amber `#9A5A00`: warnings with text, never colour alone.
- Oxide `#A33126`: destructive/error states with a written label.
- Night concrete `#1E211D`, night surface `#292D27`, night text `#F3F1E8`:
  explicit dark treatment selected by the device.

All controls use a 2px carbon edge. Shadows are short, opaque offsets—like a
label stuck above concrete—not soft floating-card shadows.

## Typography

- Headings and location codes: `Arial Black`, `Arial Narrow`, system sans. It is
  condensed, blunt and legible on a moving phone without downloading a font.
- Body and forms: `Arial`, `Helvetica`, system sans at 16–18px with 1.5 leading.
- Counts, SKUs and table values use tabular figures. The scale is 16, 18, 22,
  32 and clamp(40–72) px.

## Spacing and layout

An 8px base rhythm: 4, 8, 12, 16, 24, 32 and 48px. Touch targets are at least
48px. The phone experience drops the decorative scene once a count is active
and fixes only the bottom action dock, padded for safe areas. Desktop uses a
narrow 1120px workbench with a 5/7 split; the count itself stays single-column
so the operator never hunts for the next action.

## Interaction grammar

- Import → walk → review → export is always visible as a numbered rail.
- The current full shelf path is the largest text in the work view.
- Physical metaphors stay restrained: ruled labels, tally marks, registration
  crosses and square status stamps.
- A scan resolves to one item and location; duplicates are shown with their
  full path for explicit selection.
- Every write produces a quiet status message and an audit event.
- Destructive reset requires naming its effect and explicit confirmation.

## Motion

State changes use 180ms opacity and 4px vertical translation; the active count
briefly presses by 2px like a mechanical key. Nothing loops. Under
`prefers-reduced-motion: reduce`, transforms, smooth scrolling and transitions
are removed and feedback is immediate.

## Asset plan and provenance

The hero is an original generated editorial still: a low warehouse shelf,
concrete textures, numbered-but-unreadable inventory labels, a handheld scanner,
and moss-green crate accents. It explains the physical shelf-path context rather
than decorating the page. App icons and UI glyphs are hand-authored SVG/CSS.

Prompt sheet (use case `stylized-concept`): “Wide editorial still for an offline
warehouse stock-counting tool. Empty compact wholesale storeroom, frontal view
down one low aisle, brutalist poured-concrete walls and floor, dark steel shelving,
paper shelf labels, rugged unbranded handheld barcode scanner resting on a crate,
moss and lichen green plastic bins as sparse accents. Natural overcast loading-bay
light, tactile dust and paper, restrained documentary composition, 35mm lens,
room on the left for interface copy. Palette: pale concrete, carbon black, moss
green, lichen. No people, no legible text, no numbers, no logos, no watermark,
no futuristic screens, no glossy showroom, no dramatic neon.”

- Generator: Azure AI Foundry factory image deployment via
  `/opt/fleet/lib/gen-image.sh`.
- Generated: 2026-08-28. Original to this product; no reference image or
  third-party asset was used. Generated imagery is disclosed in the footer.
- Source PNG and prompt sidecar live in `assets/src/`; shipped WebP is optimised
  to ≤300 KB.

