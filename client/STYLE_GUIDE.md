# RiojaMAP Style Guide

## Color Palette

### Background Colors
- **Main Background**: `#09090b` - Primary app background
- **Panel Background**: `#0c0c0e` - Header, footer, sidebar panels
- **Card Background**: `#141417` - Data cards, tables, modals
- **Gradient Background**: `radial-gradient(circle_at_center, #1a1a1e 0%, #09090b 100%)` - Map section

### Text Colors
- **Primary Text**: `#f8fafc` - Main content text
- **Secondary Text**: `#94a3b8` - Labels, descriptions
- **Muted Text**: `#52525b` - Disabled, placeholders
- **Slate 400**: `#94a3b8` - Secondary labels
- **Slate 500**: `#64748b` - Tertiary information

### Accent Colors
- **Amber Primary**: `#f59e0b` - Main accent color
- **Amber Light**: `#fcd34d` - Highlight, hover states
- **Amber Hover**: `#fde68a` - Active states
- **Amber 500/10**: `rgba(245, 158, 11, 0.1)` - Subtle backgrounds
- **Amber 500/20**: `rgba(245, 158, 11, 0.2)` - Card backgrounds
- **Amber 900/10**: `rgba(120, 53, 15, 0.1)` - Quote blocks
- **Amber 900/20**: `rgba(120, 53, 15, 0.2)` - Quote block borders

### Border Colors
- **Light Border**: `rgba(255, 255, 255, 0.05)` - Subtle dividers
- **Medium Border**: `rgba(255, 255, 255, 0.1)` - Panel borders
- **Strong Border**: `rgba(255, 255, 255, 0.15)` - Focused elements

### KPI Gradient Cards
- **Blue (Total)**: `linear-gradient(135deg, #2563eb, #3b82f6)`
- **Green (Parcial)**: `linear-gradient(135deg, #16a34a, #22c55e)`
- **Red (Pendiente)**: `linear-gradient(135deg, #dc2626, #ef4444)`

### Estado Badge Colors
- **En Ejecución**: `bg-blue-500/10 text-blue-400 border-blue-500/20`
- **Finalizado**: `bg-green-500/10 text-green-400 border-green-500/20`
- **Pendiente**: `bg-yellow-500/10 text-yellow-400 border-yellow-500/20`
- **Proyectada**: `bg-indigo-500/10 text-indigo-400 border-indigo-500/20`
- **Detenida**: `bg-red-500/10 text-red-400 border-red-500/20`

---

## Typography

### Font Families
- **Sans-serif (Body)**: `'Inter', ui-sans-serif, system-ui, sans-serif`
- **Serif (Headers)**: `'Playfair Display', ui-serif, Georgia, serif`
- **Monospace (Data)**: `'JetBrains Mono', ui-monospace, SFMono-Regular, monospace`

### Font Sizes
- **Display Large**: `2xl` to `4xl` (24px - 36px) - Main titles
- **Header**: `text-2xl` to `text-3xl` (24px - 30px) - Section headers
- **Body**: `text-sm` (14px) - Regular text
- **Small**: `text-xs` (12px) - Labels, captions
- **Tiny**: `text-[9px]` to `text-[10px]` - Metadata, footers

### Font Weights
- **Light**: `font-light` (300) - Main titles
- **Normal**: `font-normal` (400) - Body text
- **Medium**: `font-medium` (500) - Buttons, interactive
- **Semibold**: `font-semibold` (600) - Emphasis
- **Bold**: `font-bold` (700) - Strong emphasis, data values
- **Extra Bold**: `font-extrabold` (800) - KPI values

### Letter Spacing
- **Tighter**: `tracking-tighter` - Data values
- **Tight**: `tracking-tight` - Headers
- **Normal**: `tracking-normal` - Body text
- **Wide**: `tracking-widest` - Uppercase labels
- **Wider**: `tracking-wider` - Uppercase metadata

---

## Components

### Map
- **Background**: `#09090b`
- **Polygon Default**: 
  - Fill: `#000000` at 10% opacity
  - Border: `#fbbf24` (amber-400), weight 1.5, opacity 0.8
- **Polygon Hover**: 
  - Fill: `#f59e0b` (amber-500) at 25% opacity
  - Border: `#fde68a` (amber-300), weight 2
- **Polygon Selected**: 
  - Fill: `#f59e0b` at 35% opacity
  - Border: `#fcd34d` (amber-300), weight 3
- **Legend**: 
  - Position: bottom-left
  - Background: `#0c0c0e/80`
  - Border: `rgba(255, 255, 255, 0.1)`
  - Border-radius: `rounded`

### KPI Cards
- **Background**: Gradient (see Color Palette)
- **Border-radius**: `rounded-lg` (8px)
- **Border**: `border-white/10`
- **Shadow**: `shadow-lg` (0 10px 15px -3px rgba(0,0,0,0.1))
- **Hover Effect**: `translate-y-[-3px]`
- **Padding**: `p-4` (16px)
- **Title**: 
  - Font-size: `text-[10px]`
  - Weight: `font-bold`
  - Tracking: `tracking-wider`
  - Transform: `uppercase`
- **Value**: 
  - Font-size: `text-2xl`
  - Weight: `font-bold`
  - Family: `font-mono`

### Buttons
- **Primary**: 
  - Background: `bg-blue-600`
  - Hover: `hover:bg-blue-700`
  - Disabled: `disabled:bg-blue-600/50`
  - Border-radius: `rounded-lg`
  - Text: `text-white`
  - Font-size: `text-sm`
- **Secondary/Outline**: 
  - Background: transparent
  - Hover: `hover:bg-white/5`
  - Border: `border-white/10`
- **Icon Buttons**: 
  - Size: `p-1.5` to `p-2`
  - Hover: color change + background tint
  - Border-radius: `rounded` or `rounded-full`

### Tables
- **Container**: 
  - Background: `#141417`
  - Border: `border-white/5`
  - Border-radius: `rounded-lg`
- **Header**: 
  - Background: `#0c0c0e`
  - Border-bottom: `border-white/10`
  - Text: `text-[9px]`, `uppercase`, `tracking-wider`, `font-bold`, `text-slate-400`
  - Padding: `px-4 py-3`
- **Row**: 
  - Border-bottom: `border-white/5`
  - Hover: `hover:bg-white/[0.02]`
  - Padding: `px-4 py-3`
- **Cell Text**: 
  - Primary: `text-xs`, `text-slate-200`
  - Secondary: `text-[9px]`, `text-slate-500`

### Modal
- **Backdrop**: `bg-black/70` with `backdrop-blur-sm`
- **Container**: 
  - Background: `#0c0c0e`
  - Border: `border-white/10`
  - Border-radius: `rounded-xl`
  - Shadow: `shadow-2xl`
  - Max-width: `max-w-2xl`
  - Max-height: `max-h-[90vh]`
- **Header**: 
  - Sticky: `sticky top-0`
  - Background: `#0c0c0e/95` with `backdrop-blur-sm`
  - Border-bottom: `border-white/10`
  - Padding: `p-4 lg:p-6`
- **Form Inputs**: 
  - Background: `#141417`
  - Border: `border-white/10`
  - Border-radius: `rounded-lg`
  - Padding: `px-3 py-2`
  - Focus: `focus:border-amber-500/50`

### Sidebar (Hover State)
- **Width**: `lg:w-2/5`, `xl:w-[400px]`
- **Background**: `#0c0c0e`
- **Border**: `border-white/5`
- **Padding**: `p-4 lg:p-8`
- **Empty State**: 
  - Icon container: `w-16 h-16`, `rounded-full`, `border-white/10`, `bg-[#141417]`
  - Icon: `text-amber-500/50`

### Dashboard (Click State)
- **Width**: `lg:w-1/2`, `xl:w-[600px]`
- **Background**: `#0c0c0e`
- **Border**: `border-white/5`
- **Shadow**: `shadow-[-10px_0_30px_rgba(0,0,0,0.5)]`

---

## Map Layers

### Satellite
- **Provider**: Esri World Imagery
- **URL**: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`
- **Max Zoom**: 18

### Terrain (Topo)
- **Provider**: Esri World Topo Map
- **URL**: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}`
- **Max Zoom**: 18

### Minimal
- **Style**: Transparent fill, thin borders
- **Default Fill**: `transparent`
- **Default Border**: `#52525b` (zinc-600), weight 1
- **Selected Fill**: `rgba(245, 158, 11, 0.15)`
- **Selected Border**: `#fcd34d` (amber-300), weight 2

---

## Responsive Breakpoints

### Mobile (default)
- Stack vertically: `flex-col`
- Map min-height: `min-h-[50vh]`
- Full width panels

### Desktop (`lg:` - 1024px+)
- Horizontal layout: `lg:flex-row`
- Map and panel side-by-side
- Header: `lg:p-8`
- Gap: `lg:gap-8`

### Large Desktop (`xl:` - 1280px+)
- Sidebar width: `xl:w-[400px]`
- Dashboard width: `xl:w-[600px]`

---

## Spacing Scale

- **xs**: `gap-2` (8px), `p-2` (8px)
- **sm**: `gap-3` (12px), `p-3` (12px)
- **md**: `gap-4` (16px), `p-4` (16px)
- **lg**: `gap-6` (24px), `p-6` (24px)
- **xl**: `gap-8` (32px), `p-8` (32px)

---

## Border Radius

- **Small**: `rounded` (4px)
- **Medium**: `rounded-lg` (8px)
- **Large**: `rounded-xl` (12px)
- **Full**: `rounded-full` (9999px)

---

## Shadows

- **Small**: `shadow` (0 1px 3px rgba(0,0,0,0.1))
- **Medium**: `shadow-lg` (0 10px 15px -3px rgba(0,0,0,0.1))
- **Large**: `shadow-xl` (0 20px 25px -5px rgba(0,0,0,0.1))
- **Extra Large**: `shadow-2xl` (0 25px 50px -12px rgba(0,0,0,0.25))
- **Inner**: `shadow-[-10px_0_30px_rgba(0,0,0,0.5)]` (sidebar)

---

## Transitions

- **Default**: `transition-all duration-200`
- **Fast**: `transition-colors` (for hover states)
- **Slow**: `transition-all duration-300` (for map polygons)
- **Transform**: `transition-transform duration-200` (for cards)

---

## Animation (Motion)

### Fade In/Out
```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.2 }}
/>
```

### Slide In/Out
```tsx
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -10 }}
  transition={{ duration: 0.2 }}
/>
```

### Modal Animation
```tsx
<motion.div
  initial={{ opacity: 0, scale: 0.95, y: 20 }}
  animate={{ opacity: 1, scale: 1, y: 0 }}
  exit={{ opacity: 0, scale: 0.95, y: 20 }}
/>
```

---

## Currency Formatting

```typescript
function formatCurrency(val: number) {
  return new Intl.NumberFormat('es-AR', { 
    style: 'currency', 
    currency: 'ARS', 
    maximumFractionDigits: 0 
  }).format(val);
}
```

**Usage**: Always use `formatCurrency()` for displaying monetary values.

---

## Date Formatting

```typescript
// Display format
new Date(fecha).toLocaleDateString('es-AR')

// Input format (ISO)
new Date().toISOString().split('T')[0]
```

---

## Accessibility

- **Focus States**: All interactive elements have visible focus rings
- **Color Contrast**: Minimum WCAG AA contrast ratio maintained
- **Screen Readers**: Semantic HTML with proper ARIA labels where needed
- **Keyboard Navigation**: All interactive elements are keyboard accessible

---

## Last Updated

2026-07-08

## Version

1.0.0 - Frontend Core (PR #2)
