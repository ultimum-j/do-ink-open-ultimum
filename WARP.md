# Do Ink Open — WARP.md (Agent Project Rules)

## Project Identity
- **Repo**: `do-ink-open` — a fully open-source animation and drawing studio
- **Origin remote**: `ultimum-j/do-ink-open-ultimum` (personal buffer)
- **Target upstream**: `ultimumgroup` GitHub organization (public open-source release)
- **Primary user**: Zach Brewer (@zrbrewer148-ui) — 10+ year Do Ink animator, no coding experience
- **Sponsor**: Ultimum Group — Ultimum for All Initiative

## CRITICAL: No Ultimum IP in This Repo
This open-source version MUST NOT use any Ultimum intellectual property, proprietary patterns, or internal tooling. This includes:
- No Ultimum branding, logos, or brand colors
- No code from ultimum-app, ultimum-app-hq, ultimum-online, policy-perfect, or any other Ultimum product
- No Ultimum Supabase projects, RLS patterns, or auth flows
- No references to Ultimum internal architecture (UAF, UDS, UKB, etc.)
- No Ultimum font files or brand assets

The Ultimum-branded free version (ultimum.art) is a COMPLETELY SEPARATE project that will leverage Ultimum IP. This repo is the community open-source version — keep them fully decoupled.

## Feature Focus: Animation & Drawing ONLY
- **PRIMARY**: Drawing editor (vector drawing, frame-by-frame animation)
- **PRIMARY**: Composition editor (layer-based scene assembly)
- **PRIMARY**: Art gallery (project management, export)
- **DEPRIORITIZED**: Green screen features — not in scope for this open-source version
- **FUTURE**: Simple video stitching (to replace Zach's Videoleap workflow)

## Zach's Core Workflow (Source of Truth)
1. Creates frame-by-frame drawings in the Drawing Editor
2. Assembles drawings into compositions in the Composition Editor
3. Exports compositions as video clips (H.264)
4. Currently uses Videoleap to stitch clips into final videos with audio
5. Goal: eventually bring clip stitching into this app so Videoleap is unnecessary

## Zach's Most-Used Features (from call walkthrough)
### Drawing Editor — MUST HAVE
- Brush tool (adjustable size 0.1–60)
- Pencil tool (vector paths with auto close-loop)
- Eraser tool (with visual trail, adjustable size)
- Paint bucket (auto-fill)
- Shape tools: rectangle, ellipse, polygon (3–60 sides, inner radius), flower (petals, curves), star
- Point editing: add/remove edge points on shapes
- Selection tool: single select, multi-select, box select
- Clipboard: cut, copy, paste, duplicate
- Arrange: bring to front/forward, send to back/backward
- Flip: horizontal, vertical
- Undo (MUST HAVE) + Redo (was removed from original Do Ink — MUST ADD BACK)
- Color picker from canvas
- Color system: HSB sliders, RGB, swatch grid, alpha/opacity
- Gradients: linear, radial, multi-stop (ability to delete gradient stops — missing from original)
- Fill properties: None, Solid, Gradient
- Stroke properties: width, cap, join
- Frames: add, duplicate, delete, copy/paste frames, frame strip with thumbnails
- FPS control (1–30, default 16)
- Ghost frames / onion skinning (0–6 frames forward/backward)
- Canvas background color (transparent default, color options for preview)
- Aspect ratio: freeform, 4:3, 16:9, 1:1
- Layers: add, delete, duplicate, lock, show/hide, reorder, opacity
- Camera roll import (image import with color picker from imported images — missing from original)
- Animation playback preview
- Project tagging and naming
- Autosave (CRITICAL — currently broken in Base44 version)

### Composition Editor — MUST HAVE
- Layer-based timeline with per-layer clips
- Import drawings from gallery
- Position, scale, rotate, opacity per layer
- Extend/shorten clip duration
- Aspect ratio options (4:3, 16:9, 1:1)
- Playback preview with loop
- Undo/Redo

### Gallery — MUST HAVE
- All Clips / Drawings / Compositions filter tabs
- Search by tags
- Project cards with thumbnails and preview playback
- Create new drawing / composition
- Delete, duplicate projects
- Export: Video (H.264), Image (PNG), Data
- Unlimited projects (no storage limits for local/browser storage)

## Technical Notes
### Current State
- Built with React 18, Vite 6, Tailwind CSS 3, shadcn/ui
- Heavy dependency on Base44 SDK for data persistence and auth — MUST BE REMOVED
- Canvas.jsx is the largest component (~47KB) — core drawing engine
- Uses Canvas API (not SVG) for rendering — Zach needs vector-quality output
- No undo/redo system implemented yet
- No autosave working in the Base44 version
- Group/ungroup is TODO
- Layers in drawing editor not implemented yet

### Priority Technical Work
1. Remove Base44 dependency — replace with IndexedDB/localStorage for browser-native persistence
2. Implement undo/redo (full operation history stack)
3. Fix autosave (auto-save to browser storage with cloud sync indicator)
4. Vector rendering quality (ensure crisp output at all zoom levels)
5. Export functionality (video H.264, PNG, with resolution options: 360p, 480p, 720p, 1080p)
6. Local project export/import (zip format for backup/transfer)

## Documentation
- `/docs/` is GITIGNORED — contains private planning materials (call transcripts, screenshots, internal roadmaps)
- `/docs/roadmap-and-planning/` — roadmap, backlog, and research findings (private)
- `/docs/call-transcripts/` — Otter AI transcripts from Zach walkthroughs (private)
- `/docs/do-ink-screenshots/` — screenshots from Zach's iPad Do Ink sessions (private)

## Versioning & Logging
- Maintain clear version tags and changelog entries
- Co-author all commits: `Co-Authored-By: Oz <oz-agent@warp.dev>`
- Push to `ultimum-j` first (personal buffer), then to `ultimumgroup` for public release

## Do Ink Reference
- Official documentation: https://www.doink.com/documentation
- Original app: Animation & Drawing by Do Ink (iPad, discontinued from App Store)
- Three work areas: Drawing Editor, Composition Editor, Gallery
