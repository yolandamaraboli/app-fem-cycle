# Guía Tecnológica — App de Ciclo Menstrual (Frontend-Only)

## Arquitectura General

App web progresiva (PWA) 100% frontend. Sin backend propio. Sin bases de datos externas.
Todo el almacenamiento es local en el navegador del usuario.

```
Navegador (Desktop / Mobile)
│
├── React + TypeScript + Vite
├── Tailwind CSS v4
├── React Router v7
├── Zustand (Estado global)
├── date-fns (Fechas)
├── Recharts (Gráficos)
├── localStorage (Datos de ciclos, síntomas, config)
└── Service Worker (PWA offline)
```

---

## Stack Detallado

### 1. Framework Frontend

| Tecnología | Versión | Propósito |
|---|---|---|       
| **React** | 19.x | Biblioteca UI, componentes reutilizables |
| **TypeScript** | 5.x | Tipado estático, seguridad en desarrollo |
| **Vite** | 6.x | Build tool, dev server rápido con HMR |

**Razón:** React con Vite es el estándar moderno para SPAs. TypeScript evita errores con tipos de datos complejos (ciclos, síntomas, predicciones).

### 2. Enrutado

| Tecnología | Propósito |
|---|---|
| **React Router v7** | Navegación SPA entre vistas (dashboard, calendario, registro, historial, config) |

**Router:** `HashRouter` (rutas tipo `/#/dashboard`). Necesario para GitHub Pages — el servidor estático solo sirve `index.html`, y HashRouter maneja el enrutado del lado del cliente sin necesidad de configuración de redirects.

**Rutas previstas:**

| Ruta | Vista |
|---|---|
| `/#/` | Dashboard / resumen del ciclo actual |
| `/#/calendar` | Calendario con fases coloreadas |
| `/#/log` | Registro diario de síntomas |
| `/#/history` | Historial de ciclos, tendencias, anomalías |
| `/#/insights/:cycleId` | Resumen detallado por ciclo |
| `/#/settings` | Configuración, exportar datos |

### 3. Estado Global

| Tecnología | Propósito |
|---|---|
| **Zustand** | Store global para datos del ciclo, síntomas, UI state |

**Razón:** Zustand es mínimo (1 KB), sin boilerplate, y soporta persistencia directa a localStorage con un middleware.

### 4. Persistencia de Datos

| Tecnología | Propósito |
|---|---|
| **localStorage** | Almacenamiento principal de todos los datos del usuario (ciclos, síntomas, config) |
| **Cookies** | Solo para preferencias de sesión (tema, onboarding completado) |
| **Zustand Persist Middleware** | Sincroniza automáticamente el store con localStorage |

**Estructura de datos en localStorage:**

```typescript
// Claves en localStorage
"app-cycles"       → Cycle[]         // Historial de ciclos
"app-symptoms"     → SymptomLog[]    // Registro diario de síntomas
"app-settings"     → AppSettings     // Configuración del usuario
"app-onboarding"   → boolean         // Onboarding completado o no
```

**Tipos principales:**

```typescript
interface Cycle {
  id: string
  startDate: string            // ISO date
  endDate: string | null       // ISO date, null si es el ciclo actual
  periodDays: string[]         // Array de fechas ISO con sangrado
  phases: {
    menstrual:   { start: string, end: string }
    follicular:  { start: string, end: string }
    ovulation:   { start: string, end: string }
    luteal:      { start: string, end: string }
  }
  averageCycleLength: number   // Calculado en base a ciclos anteriores
  periodDuration: number       // Días de sangrado reales
}

interface SymptomLog {
  date: string                 // ISO date
  physical: {
    cramps: number             // 0-5 escala
    backPain: number
    headache: number
    bloating: number
    breastTenderness: number
    fatigue: number
    nausea: number
    acne: number
  }
  emotional: {
    moodSwings: number
    anxiety: number
    sadness: number
    irritability: number
    energy: number
  }
  hormonal: {
    flow: 'none' | 'light' | 'medium' | 'heavy' | 'spotting'
    cervicalMucus: 'dry' | 'sticky' | 'creamy' | 'eggWhite' | 'watery'
  }
  libido: number               // 0-5
  appetite: number | string
  sleep: number                // Horas
  weight: number | null        // Opcional
  temperature: number | null   // Opcional (BBT)
  notes: string
  tags: string[]
}

interface AppSettings {
  cycleLengthAvg: number       // 28 por defecto
  periodDurationAvg: number    // 5 por defecto
  lutealPhaseDays: number      // 14 por defecto
  theme: 'light' | 'dark'
  firstDayOfWeek: 0 | 1       // Domingo o Lunes
  exportFormat: 'json' | 'csv'
}
```

### 5. UI y Estilos

| Tecnología | Propósito |
|---|---|
| **Tailwind CSS v4** | Estilos utility-first, diseño responsive, modo oscuro nativo |
| **CSS Modules** (opcional) | Para estilos específicos de componentes complejos (calendario) |

**Razón:** Tailwind permite desarrollo rápido, consistente, responsive. Sin runtime CSS-in-JS. V4 incluye modo oscuro por clase.

### 6. Manejo de Fechas

| Tecnología | Propósito |
|---|---|
| **date-fns** | Cálculos de fechas (duración de ciclos, predicción de fases, diferencias entre fechas) |

**Razón:** date-fns es modular (import solo lo que necesitas), tree-shakeable, sin dependencias. Mejor que Moment.js (legacy) o Day.js.

**Funcionalidades a usar:**
- `addDays`, `subDays` — navegación de calendario
- `differenceInDays` — duración de ciclos
- `format` — formato de fechas
- `startOfMonth`, `endOfMonth` — cálculo de meses
- `isSameDay`, `isWithinInterval` — lógica de fase
- `eachDayOfInterval` — generar días del calendario

### 7. Gráficos y Visualización

| Tecnología | Propósito |
|---|---|
| **Recharts** | Gráficos de duración de ciclos, tendencias, comparativas por fase |

**Gráficos necesarios:**
- Línea: duración de los últimos ciclos
- Línea: variación del ciclo (desviación del promedio)
- Barra: síntomas por fase (menstrual vs lútea vs folicular vs ovulación)
- Radar: intensidad de síntomas en el ciclo actual
- Calendario personalizado: fases coloreadas por día

### 8. PWA (Progressive Web App)

| Tecnología | Propósito |
|---|---|
| **Vite PWA Plugin** (`vite-plugin-pwa`) | Genera service worker, manifest.json, precaching |

**Configuración necesaria:**
- `manifest.json` con nombre, íconos, colores de la paleta
- Service worker para caché de assets (funciona offline)
- Estrategia: Network-first con fallback a cache
- Pantalla de splash con color de fondo `#F8F9FC`
- Orientación: `any` (funciona horizontal y vertical)

**Iconos de la app:**
- 192x192
- 512x512
- SVG maskable

### 9. Responsive Design

| Estrategia | Implementación |
|---|---|
| **Mobile-first** | Breakpoints de Tailwind: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px) |
| **Layout adaptable** | Sidebar se oculta en mobile, menú hamburguesa |
| **Calendario** | Vista mensual en desktop, semana en mobile |
| **Touch events** | Swipe entre meses en mobile |

### 10. Testing (opcional)

| Tecnología | Propósito |
|---|---|
| **Vitest** | Testing unitario de utilidades y lógica de predicción |
| **Testing Library** | Testing de componentes React |

---

## Dependencias (package.json)

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.0.0",
    "zustand": "^5.0.0",
    "date-fns": "^4.0.0",
    "recharts": "^2.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^6.0.0",
    "vite-plugin-pwa": "^0.21.0",
    "typescript": "^5.7.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0"
  }
}
```

---

## Lógica Core del Negocio (sin librería externa)

La app no usa APIs externas ni librerías de ciclo menstrual. Toda la lógica va en un hook o utilidad propia.

### Archivos de lógica esperados:

| Archivo | Contenido |
|---|---|
| `src/lib/cycle.ts` | Predicción de fases, promedio de ciclos, detección de anomalías |
| `src/lib/symptoms.ts` | Cálculo de resumen de síntomas por fase, recomendaciones |
| `src/lib/pregnancy.ts` | Cálculo de probabilidad de embarazo |
| `src/lib/storage.ts` | Helper de lectura/escritura a localStorage |
| `src/lib/seed.ts` | Datos de ejemplo para desarrollo (ciclos simulados) |

### API de predicción de fases (ejemplo):

```typescript
function predictPhases(
  startDate: Date,
  cycleLength: number,      // 28 por defecto, configurable 26-30
  lutealPhaseDays: number   // 14 por defecto
): CyclePhases
```

### API de recomendaciones (ejemplo):

```typescript
function getRecommendations(symptoms: SymptomLog): Recommendation[]

// Ejemplo de output:
[
  { symptom: "backPain", tip: "Aplica una almohadilla térmica en la zona lumbar por 15 minutos" },
  { symptom: "cramps", tip: "Infusión de jengibre o manzanilla para aliviar cólicos" },
]
```

---

## Deploy

| Plataforma | Tipo |
|---|---|
| **Vercel** | Gratuito, deploy automático desde GitHub, soporta SPA |
| **Netlify** | Alternativa, mismo perfil |
| **GitHub Pages** | Gratuito, requiere configuración extra para SPA routing |

**Requisito:** El deploy debe tener redirect de todas las rutas a `index.html` (para SPA routing).

---

## Resumen de Funcionalidades Técnicas

| Funcionalidad | Cómo se logra |
|---|---|
| Registro de síntomas diarios | Formulario → Zustand store → localStorage |
| Calendario con fases coloreadas | date-fns para cálculos + Tailwind para colores condicionales |
| Predicción de fases | Algoritmo propio en `cycle.ts` basado en fecha inicio + duración promedio |
| Resumen mensual por fase | Filtrado de SymptomLog[] por rango de fechas de cada fase |
| Recomendaciones contextuales | Map de síntoma → consejos en `symptoms.ts` |
| Probabilidad de embarazo | Algoritmo basado en día del ciclo, ventana fértil |
| Historial y tendencias | Recharts con datos de localStorage |
| PWA / offline | Service worker con vite-plugin-pwa |
| Responsive mobile | Tailwind breakpoints, sidebar colapsable |
| Exportar datos | Función que serializa localStorage a JSON/CSV y descarga |
