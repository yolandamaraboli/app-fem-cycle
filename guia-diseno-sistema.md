# Guía de Diseño — App de Ciclo Menstrual (Estilo Flo)

## 1. Paleta de Colores

### Colores Primarios

| Token | Hex | Uso |
|---|---|---|
| Rosa primario | `#EE6B8A` | Botones CTA, enlaces activos, acentos principales |
| Rosa hover | `#E05575` | Hover de botones primarios |
| Rosa light | `#FDE8EF` | Background de badges/etiquetas en rosa |
| Rosa ring | `#EE6B8A` con opacidad 0.3 | Focus ring de inputs |

### Colores Secundarios

| Token | Hex | Uso |
|---|---|---|
| Teal / Cian | `#2DB4C4` | Badges informativos, toggles activos, links secundarios |
| Coral | `#FA6364` | Alertas, fase menstrual, errores, eliminación |
| Ámbar / Naranja | `#FFB04C` | Fase folicular, warnings, avisos |
| Verde menta | `#4ECDC4` | Fase de ovulación, estados exitosos, confirmación |
| Lavanda / Púrpura | `#9B7ED8` | Fase lútea, features premium |

### Colores de Fases del Ciclo (Calendario)

| Fase | Hex | Nombre descriptivo |
|---|---|---|
| Menstrual | `#FA6364` | Rojo coral |
| Folicular | `#FFB04C` | Naranja ámbar |
| Ovulación | `#4ECDC4` | Verde menta |
| Lútea | `#9B7ED8` | Lavanda / púrpura suave |

### Fondos y Superficies

| Token | Hex | Uso |
|---|---|---|
| Blanco | `#FFFFFF` | Cards, modales, sidebar, contenedores |
| Fondo página | `#F8F9FC` | Gris muy claro, fondo general del layout |
| Card alterno | `#F0F2F8` | Cards secundarios, secciones alternas |
| Hover fila | `#F0F1F5` | Hover en filas de listas/tablas |
| Overlay modal | `rgba(0,0,0,0.4)` | Fondo oscuro de modales |

### Textos

| Token | Hex | Uso |
|---|---|---|
| Primario | `#1A1D26` | Títulos, cuerpo principal |
| Secundario | `#6B7280` | Subtítulos, metadatos, descripciones |
| Terciario / Placeholder | `#9CA3AF` | Placeholders, etiquetas deshabilitadas |
| On-primary | `#FFFFFF` | Texto sobre botón rosa o fondos oscuros |
| On-color secundario | `#FFFFFF` | Texto sobre teal, coral, etc. |

### Bordes y Divisores

| Token | Hex | Uso |
|---|---|---|
| Divider | `#E5E7EB` | Líneas divisorias horizontales/verticales |
| Border card | `#E2E4E9` | Bordes de cards e inputs |

### Sombras

| Token | Valor | Uso |
|---|---|---|
| Card shadow | `0 2px 8px rgba(0,0,0,0.06)` | Sombra sutil de cards |
| Elevated shadow | `0 4px 16px rgba(0,0,0,0.08)` | Dropdowns, modales |
| Modal shadow | `0 8px 32px rgba(0,0,0,0.12)` | Modales grandes |

---

## 2. Tipografía

### Fuente principal

- **Familia:** Inter (sans-serif) — descargar de Google Fonts
- **Fallback:** `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`

### Escala tipográfica

| Uso | Weight | Size | Line Height | Tracking |
|---|---|---|---|---|
| H1 | 700 (Bold) | 28px | 36px | -0.02em |
| H2 | 600 (Semibold) | 22px | 28px | -0.01em |
| H3 | 600 (Semibold) | 18px | 24px | 0 |
| Body (cuerpo) | 400 (Regular) | 15px | 22px | 0 |
| Body small | 400 (Regular) | 13px | 18px | 0 |
| Label / Badge | 500 (Medium) | 12px | 16px | +0.02em |
| Número grande (dashboard) | 700 (Bold) | 48px | 56px | -0.03em |
| Número mediano | 700 (Bold) | 32px | 40px | -0.02em |
| Caption | 400 (Regular) | 11px | 14px | 0 |

### Reglas tipográficas

- Texto secundario usa color `#6B7280`
- Nunca usar rosa como color de texto (excepto en links)
- Los números grandes se usan para mostrar días conteo (duración del ciclo, días restantes)
- Enlaces inline: color rosa `#EE6B8A`, text-decoration: none, subrayado en hover

---

## 3. Geometría y Espaciado

### Border Radius

| Elemento | Valor |
|---|---|
| Cards | 16px |
| Botones | 12px |
| Inputs, selects | 10px |
| Badges, chips, pills | 9999px (completamente redondeados) |
| Modales | 20px (esquinas superiores) |
| Tabla celdas | 8px |
| Calendario celdas | 8px |

### Sistema de espaciado (basado en múltiplos de 4)

| Token | px |
|---|---|
| space-1 | 4px |
| space-2 | 8px |
| space-3 | 12px |
| space-4 | 16px |
| space-5 | 20px |
| space-6 | 24px |
| space-8 | 32px |
| space-10 | 40px |
| space-12 | 48px |
| space-16 | 64px |

### Layout

- **Sidebar:** 280px de ancho, fija, fondo blanco, borde derecho 1px `#E5E7EB`
- **Contenido principal:** Área restante, padding 32px
- **Ancho máximo contenido:** 1200px, centrado con margin auto
- **Grid de dashboard:** 3 columnas (1fr 1fr 1fr), gap 16px
- **Grid de historial:** 2 columnas (1fr 1fr), gap 16px

---

## 4. Componentes Visuales

### Botón Primario

```
background: #EE6B8A
color: #FFFFFF
border: none
border-radius: 12px
padding: 12px 24px
font-size: 15px
font-weight: 600
box-shadow: 0 1px 3px rgba(238, 107, 138, 0.3)
transition: all 0.15s ease

Hover:
  background: #E05575
  transform: translateY(-1px)
  box-shadow: 0 4px 12px rgba(238, 107, 138, 0.35)

Active: transform: translateY(0)
Disabled: opacity 0.5, cursor not-allowed
```

### Botón Secundario

```
background: #FFFFFF
color: #EE6B8A
border: 1.5px solid #EE6B8A
border-radius: 12px
padding: 12px 24px
font-size: 15px
font-weight: 600
transition: all 0.15s ease

Hover:
  background: #FDE8EF
```

### Botón Ghost / Texto

```
background: transparent
color: #6B7280
border: none
border-radius: 10px
padding: 8px 16px
font-size: 14px
font-weight: 500

Hover:
  background: #F0F1F5
  color: #1A1D26
```

### Cards

```
background: #FFFFFF
border-radius: 16px
padding: 20px
box-shadow: 0 2px 8px rgba(0,0,0,0.06)

Header del card:
  border-bottom: 1px solid #E5E7EB
  padding-bottom: 16px
  margin-bottom: 16px
```

### Inputs

```
background: #FFFFFF
border: 1.5px solid #E2E4E9
border-radius: 10px
padding: 12px 16px
font-size: 15px
color: #1A1D26

Focus:
  border-color: #EE6B8A
  box-shadow: 0 0 0 3px rgba(238, 107, 138, 0.15)
  outline: none

Placeholder:
  color: #9CA3AF

Label:
  font-size: 13px
  font-weight: 500
  color: #6B7280
  margin-bottom: 6px
```

### Select / Dropdown

Mismos estilos que inputs. Icono de chevron hacia abajo.

### Tabs (Sidebar)

```
Item normal:
  padding: 10px 16px
  margin: 2px 12px
  border-radius: 10px
  color: #6B7280
  font-size: 14px
  font-weight: 500
  display: flex
  align-items: center
  gap: 12px
  cursor: pointer
  transition: all 0.15s

Hover:
  background: #F0F1F5
  color: #1A1D26

Item activo:
  background: #FDE8EF
  color: #EE6B8A
  font-weight: 600
```

### Badges y Chips

```
background: #FDE8EF (rosa light) u otros según contexto
border-radius: 9999px
padding: 4px 12px
font-size: 12px
font-weight: 500
color: #EE6B8A (o el color correspondiente)
```

### Indicador de Fase (calendario)

Cada celda del día tiene un círculo o fondo con el color de la fase correspondiente:

- Menstrual → círculo `#FA6364`
- Folicular → fondo suave `#FFF3E0`
- Ovulación → fondo suave `#E0F7F4`
- Lútea → fondo suave `#F0ECFA`

El día actual se marca con un borde/círculo rosa `#EE6B8A`.

### Tooltip

```
background: #1A1D26
color: #FFFFFF
font-size: 12px
padding: 6px 12px
border-radius: 8px
box-shadow: 0 4px 12px rgba(0,0,0,0.15)
```

### Modal

```
background: #FFFFFF
border-radius: 20px 20px 0 0
padding: 24px
max-width: 480px
box-shadow: 0 8px 32px rgba(0,0,0,0.12)
```

---

## 5. Iconografía

- **Sistema:** Phosphor Icons (o Lucide como alternativa)
- **Estilo:** Outline, regular weight
- **Tamaño estándar:** 20px (dentro de botones y tabs)
- **Tamaño grande:** 24px (encabezados de sección)
- **Tamaño pequeño:** 16px (en badges, metadata)
- **Color:** hereda del color del texto, o color de fase según contexto

### Iconos requeridos

| Concepto | Icono |
|---|---|
| Calendario / Ciclo | Calendar |
| Síntomas / Registro | NotePencil, Heart |
| Dashboard / Resumen | ChartBar, ChartPie |
| Historial | ClockClockwise |
| Ovulación / Fertilidad | Drop, Sparkle |
| Temperatura | Thermometer |
| Peso | Scales |
| Sueño | Moon |
| Ánimo / Emociones | Smiley, FaceSad |
| Dolor | Cramp / Warning |
| Embarazo | Baby |
| Configuración | Gear |
| Perfil | User |
| Notificaciones | Bell |
| Cerrar | X |
| Flecha atrás | ArrowLeft |
| Chevron | CaretRight, CaretDown |
| Añadir | PlusCircle |
| Editar | Pencil |
| Eliminar | Trash |

---

## 6. Estados y Transiciones

### Animaciones estándar

```
transition: all 0.15s ease      (hover, focus, active)
transition: all 0.25s ease      (modales, dropdowns)
transition: all 0.35s ease      (cambios de página o tabs)
```

### Micro-interacciones

- Botones: levantan 1px en hover, vuelven en active
- Cards: sombra se intensifica ligeramente en hover
- Sidebar items: cambio de color suave
- Días del calendario: escala leve (1.05) en hover
- Loading: spinner rosa `#EE6B8A` de 20px, animación suave

---

## 7. Responsive (Desktop Web)

- **Resolución objetivo:** 1280px–1920px de ancho
- **Mínimo soportado:** 1024px
- Layout de 2 columnas cuando el sidebar está presente (sidebar + contenido)
- Sidebar colapsable a íconos en pantallas menores a 1024px

---

## 8. Mood y Sensación General

- **Tono:** Femenino pero no infantil, moderno, clean, profesional
- **Sensación:** Cálido, acogedor, seguro, confiable
- **Referencia visual:** Flo app, pero en formato desktop web
- **Formas:** Predominan formas curvas, esquinas redondeadas, círculos
- **Gradientes:** Usar con moderación. Gradiente sutil de rosa a lavanda solo en hero/encabezados importantes
- **Ilustraciones:** Opcionales, estilo "abstract women's health" con colores de la paleta

---

## 9. Ejemplo de Páginas con esta Paleta

| Página | Colores dominantes |
|---|---|
| Login / Onboarding | Rosa `#EE6B8A` + blanco |
| Dashboard | Blanco + cards con acentos de fase |
| Calendario | Fondo blanco, celdas con colores de fase |
| Registro de síntomas | Blanco + inputs, toggles teal `#2DB4C4` |
| Historial | Blanco + gráficos con colores de fase |
| Resumen mensual | Cards con colores de fase + texto |
| Configuración | Blanco + grises |

---

## 10. Modo Oscuro (opcional / futuro)

Si se implementa modo oscuro:

| Token | Hex |
|---|---|
| Fondo página | `#0F1117` |
| Cards | `#1A1D26` |
| Texto primario | `#F3F4F6` |
| Texto secundario | `#9CA3AF` |
| Border | `#2D3140` |

Los colores de fase se mantienen iguales pero con mayor saturación para contrastar con fondos oscuros.
