# Do Ink Open

**An open-source web-based animation and drawing studio — keeping creative tools alive and accessible.**

> *When Do Ink pulled its beloved apps from the stores, a decade of creative passion was at risk. Not on our watch.*

**Current Focus:** Animation & Drawing features — frame-by-frame animation, vector drawing tools, compositions, and the art gallery. Green screen features are not in scope for this project.

---

## The Story

[Do Ink](https://www.doink.com/) built two of the most beloved creative tools for young animators and educators — **Animation & Drawing** and **Green Screen**. For over a decade, these apps empowered kids, teachers, and hobbyist animators to create frame-by-frame animations, vector artwork, and green screen compositions right on their iPads.

Then Do Ink pulled out of the app stores.

For users who had built years of creative work and workflows around these tools, this was devastating. One such user, [**@zrbrewer148-ui**](https://github.com/zrbrewer148-ui), reached out after a **10-year cartoon animation passion** was suddenly put at risk. The tools he depended on were disappearing.

**That's where [Ultimum Group](https://ultimumgroup.com) stepped in.**

This project is part of the **Ultimum for All Initiative** — our commitment to ensuring critical creative and productivity tools don't just vanish when a company changes direction. We've engaged the local open-source community in **Des Moines, Iowa** (a community we're becoming deeply connected with and that is a big part of the future of software) and deployed the latest AI-powered software development tools to rebuild these capabilities as an open, web-based platform — moving at Ultimum speeds.

**Do Ink Open** is the result: a fully featured, browser-based animation studio that recreates and extends the core Do Ink experience. No app store required. No platform lock-in. Open source, forever.

---

## Features

### Project Gallery
- **Project Management** — Create, duplicate, delete, and organize animation projects
- **Search & Filter** — Filter projects by type (Drawings, Compositions, All) and search by tags
- **Thumbnails & Previews** — Visual project cards with animated multi-frame previews
- **Share & Export** — Export projects as video (H.264), single images (PNG/JPEG), or all frames as multiple images with configurable resolution sizes

### Drawing Editor
A full-featured vector and raster drawing environment inspired by the original Do Ink Animation & Drawing app:

- **Drawing Tools**
  - **Brush** — Freehand drawing with adjustable size (0.1–60px), smooth stroke rendering
  - **Pencil** — Precision vector paths with Catmull-Rom curve smoothing and automatic close-loop detection
  - **Eraser** — Configurable eraser that respects selection context (erases only selected elements when a selection exists)
  - **Paint Bucket** — Flood fill with advanced options: gap closing, fill expansion, color tolerance, and anti-aliasing

- **Shape Tools**
  - **Rectangle** — Drag-to-draw rectangles with fill and stroke
  - **Ellipse** — Drag-to-draw ellipses
  - **Polygon** — Configurable polygon with adjustable vertex count (3–60) and inner radius percentage
  - **Star** — Multi-pointed stars with inner/outer radius control
  - **Flower** — Parametric flower shapes with independent control over petal count, inner radius, inner curve, and outer curve — includes a live SVG preview panel

- **Selection & Transform**
  - **Select / Multi-select** — Click or drag-box to select elements
  - **Transform** — Move, scale, and manipulate selected elements with visual bounding box handles
  - **Clipboard** — Cut, Copy, Paste, and Duplicate operations
  - **Alignment** — Six-axis alignment (Left, Center H, Right, Top, Center V, Bottom)
  - **Layer Ordering** — Bring to Front, Bring Forward, Send Backward, Send to Back
  - **Flip** — Horizontal and vertical flipping
  - **Group / Ungroup** — Element grouping (in progress)

- **Color System**
  - **Default Palette** — 54-color curated swatch grid
  - **HSB Sliders** — Hue, Saturation, Brightness, and Alpha with visual gradient tracks
  - **RGB Sliders** — Direct Red, Green, Blue channel control
  - **Fill Properties** — None, Solid Color, or Gradient fill (Linear / Radial) with multi-stop gradient editor
  - **Stroke Properties** — Enable/disable stroke, HSB color control, line width (0.1–50px), line cap (Butt/Round/Square), and line join (Miter/Round/Bevel)

- **Canvas**
  - 4000×4000 pixel working area with checkered transparency background
  - Scroll-wheel zoom (0.5x–10x) with pinch-to-zoom touch support
  - Right-click or Ctrl+click pan navigation
  - Zoom percentage display with one-click reset to 100%

- **Timeline (Frame-by-Frame Animation)**
  - Visual frame strip with SVG-rendered thumbnails of frame content
  - Add, duplicate, and delete frames
  - Frame counter with current/total display
  - FPS-based animation playback preview

- **Autosave** — Projects auto-save on page close via `beforeunload`

### Composition Editor
A layer-based composition environment for combining drawings into complex scenes:

- **Layer System** — Add, select, delete, and manage composition layers
- **Keyframe Animation** — Per-layer keyframes controlling position (X/Y), scale, rotation, and opacity
- **Import from Gallery** — Pull existing drawing projects into composition layers
- **Composition Canvas** — Visual preview with layer selection and manipulation
- **Composition Timeline** — Layer-aware timeline with drag-and-drop reordering, keyframe visualization, and playback controls

### Draggable UI Panels
All tool property panels (Brush, Eraser, Polygon, Flower, Selection, Color, Stroke, Paint Bucket) are **draggable floating panels** with grip handles, respecting toolbar boundaries — keeping the canvas workspace clear and flexible.

---

## Tech Stack

**Core:** React 18 · Vite 6 · Tailwind CSS 3 · shadcn/ui (New York) · Radix UI

**Data & Routing:** TanStack React Query 5 · React Router DOM 6 · Base44 SDK

**Drawing & Animation:** Canvas API · Framer Motion · Three.js

**UI & Utilities:** Lucide React icons · React Hook Form · Zod · date-fns · lodash · clsx · class-variance-authority · tailwind-merge · tailwindcss-animate

**Export & Media:** html2canvas · jsPDF · React Quill · Recharts · Sonner (toasts)

---

## Project Structure

```
do-ink-open/
├── index.html                          # App entry point
├── package.json                        # Dependencies and scripts
├── vite.config.js                      # Vite + Base44 plugin config
├── tailwind.config.js                  # Tailwind with CSS variable theming
├── components.json                     # shadcn/ui configuration
├── eslint.config.js                    # ESLint with React hooks + unused imports
├── jsconfig.json                       # Path aliases (@/ → ./src/)
├── postcss.config.js                   # PostCSS with Tailwind + Autoprefixer
└── src/
    ├── main.jsx                        # React DOM entry
    ├── App.jsx                         # Root component (Auth, Router, Query)
    ├── index.css                       # Global styles + CSS variables
    ├── pages.config.js                 # Auto-generated page routing config
    ├── pages/
    │   ├── Gallery.jsx                 # Project gallery (main landing page)
    │   ├── Editor.jsx                  # Drawing/animation editor
    │   └── CompositionEditor.jsx       # Layer-based composition editor
    ├── components/
    │   ├── editor/                     # Drawing editor components
    │   │   ├── Canvas.jsx              # Main drawing canvas (4000x4000)
    │   │   ├── DrawingTools.jsx        # Bottom toolbar with all tools
    │   │   ├── TopToolbar.jsx          # Top bar (back, play, zoom, settings)
    │   │   ├── Timeline.jsx            # Frame strip + frame management
    │   │   ├── ColorPanel.jsx          # Right-side color panel
    │   │   ├── ColorPropertiesPanel.jsx # Full color picker (HSB/RGB/Swatch)
    │   │   ├── FillPropertiesPanel.jsx # Fill type + gradient editor
    │   │   ├── StrokePropertiesPanel.jsx # Stroke width, cap, join controls
    │   │   ├── ToolPropertiesPanel.jsx # Brush/Eraser/Polygon size controls
    │   │   ├── FlowerToolPanel.jsx     # Flower shape parameter controls
    │   │   ├── SelectionToolsPanel.jsx # Selection ops, alignment, layer order
    │   │   └── PaintBucketPanel.jsx    # Paint bucket settings
    │   ├── composition/                # Composition editor components
    │   │   ├── CompositionCanvas.jsx   # Composition preview canvas
    │   │   ├── CompositionToolbar.jsx  # Composition top toolbar
    │   │   ├── CompositionTimeline.jsx # Layer timeline with keyframes
    │   │   └── ClipToolsPanel.jsx      # Per-layer clip editing tools
    │   ├── gallery/                    # Gallery & project management
    │   │   ├── ProjectCard.jsx         # Project thumbnail card + actions
    │   │   ├── ExportDialog.jsx        # Multi-step export wizard
    │   │   └── SharePopup.jsx          # Share/export popup
    │   ├── ui/                         # shadcn/ui base components (40+)
    │   └── UserNotRegisteredError.jsx  # Auth error boundary
    ├── api/
    │   └── base44Client.js             # Base44 SDK client initialization
    ├── lib/
    │   ├── AuthContext.jsx             # Authentication provider + hooks
    │   ├── app-params.js               # App parameter resolution
    │   ├── query-client.js             # TanStack Query client instance
    │   ├── PageNotFound.jsx            # 404 page
    │   └── utils.js                    # Utility functions (cn, etc.)
    ├── hooks/
    │   └── use-mobile.jsx              # Mobile detection hook
    └── utils/
        └── index.ts                    # URL/page utility helpers
```

---

## Getting Started

### Prerequisites
- **Node.js** 18+ and **npm** 9+
- A Base44 account and app (for backend data persistence)

### Installation

```bash
# Clone the repository
git clone https://github.com/ultimum-j/do-ink-open-ultimum.git
cd do-ink-open-ultimum

# Install dependencies
npm install
```

### Environment Setup

Create a `.env.local` file in the project root:

```env
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=your_backend_url
```

### Development

```bash
# Start the dev server
npm run dev

# Lint the codebase
npm run lint

# Auto-fix lint issues
npm run lint:fix

# Type checking
npm run typecheck

# Production build
npm run build

# Preview the production build
npm run preview
```

---

## Roadmap

This project is actively being developed. The focus is on **animation and drawing** — recreating and improving the core Do Ink Animation & Drawing experience.

### v1 — Core Animation Studio
- [ ] **Backend Independence** — Remove Base44 dependency; use IndexedDB/localStorage for browser-native persistence
- [ ] **Undo/Redo System** — Full operation history stack (Redo was missing from original Do Ink)
- [ ] **Autosave** — Reliable auto-save to browser storage
- [ ] **Vector Quality** — Ensure crisp rendering at all zoom levels
- [ ] **Export** — Video (H.264) and Image (PNG) with resolution options (360p–1080p)
- [ ] **Drawing Editor Layers** — Multiple drawing layers per frame
- [ ] **Onion Skinning** — Ghost frames for smoother animation workflows
- [ ] **Element Grouping** — Complete the group/ungroup implementation

### v2 — Enhanced Workflows
- [ ] **Video Stitching** — Combine compositions into a single video (replacing Videoleap workflow)
- [ ] **Audio Timeline** — Sound layers synced to animation
- [ ] **Local Project Export/Import** — Zip-based backup and transfer
- [ ] **Prop Library** — Built-in asset library (shapes, characters, backgrounds)
- [ ] **SVG/File Import** — Import external artwork
- [ ] **Color Picker from Imported Images** — Pick colors from imported reference images
- [ ] **Gradient Stop Deletion** — Remove individual gradient color stops

### Future
- [ ] **PWA Support** — Offline-capable progressive web app
- [ ] **Touch-First UI** — Optimized layouts for tablet use
- [ ] **Community Gallery** — Share and discover animations
- [ ] **Folders in Gallery** — Organize projects into folders

> **Note:** Green screen features are not in scope for this project. This project focuses exclusively on animation and drawing.

---

## Contributing

We welcome contributions from developers, animators, educators, and anyone passionate about keeping creative tools open and accessible.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Push to your fork and submit a Pull Request

Please keep commits focused and well-described. If you're tackling a roadmap item, open an issue first to coordinate.

### Community Fork

[**@zrbrewer148-ui**](https://github.com/zrbrewer148-ui) — the user whose decade-long animation passion sparked this project — has forked this repository and is actively contributing. Check out their fork for community-driven enhancements.

---

## About the Ultimum for All Initiative

**Do Ink Open** is a project under the [Ultimum for All Initiative](https://ultimumgroup.com) — Ultimum Group's commitment to using modern development tools and open-source principles to ensure essential software doesn't disappear when companies change direction.

We believe:
- **Creative tools should be durable.** A decade of someone's work shouldn't vanish because an app leaves a store.
- **Open source is the future of software.** The Des Moines, Iowa open-source community (and communities like it everywhere) is the engine that keeps innovation accessible.
- **AI-powered development accelerates what's possible.** We deploy the latest AI software development tools to move at Ultimum speeds — so that when someone's creative passion is at risk, the response is measured in days, not years.

Learn more at [**ultimumgroup.com**](https://ultimumgroup.com)

---

## License

This project is open source. See the repository for license details.

---

*Built with care by [Ultimum Group](https://ultimumgroup.com) and the Des Moines open-source community.*
