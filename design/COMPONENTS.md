# Componentes reutilizables — PHYSICAL MARKET / Market Data

| Componente | Clases BEM | Estado |
|---|---|---|
| **Chrome / Topbar** | `chrome`, `chrome__*` | Implementado (60px): HedgeTutor + HOME/TUTORIALS/CASE STUDIES/SIMULATIONS + User (Gen) |
| **Avatar** | `chrome__avatar` | SVG `assets/icons/user.svg` |
| **Sidebar** | `sidebar`, `sidebar__*` | Implementado; iconos en `assets/icons/*.svg` |
| **Toolbar** | `toolbar` | Dashboard Header: PhA ticker + Sim Date + Msg/Help/Reset |
| **Ticker PhA** | `ticker`, `ticker--pha` | Badge blanco sobre toolbar cyan |
| **Sim Date** | `simdate` | Control con chevrons |
| **Button toolbar** | `toolbar__action` | Chips `#1B297D` + iconos |
| **Card** | `card`, `card--chart`, `card--table` | Shell 358×325 |
| **Chart mount** | `chart`, `chart-svg` | SVG estático vía `assets/js/market-data.js` (sin Chart.js/ECharts) |
| **Table** | `table`, `table__*` | Physical / Cash / Term Structure |
| **Badge** | `badge`, `badge--positive/negative` | % cambios en tablas |

## Datos mock

Fuente: `data/mocks/market-data.json`  
Fallback embebido: `assets/js/market-data.js`

## Iconos

`assets/icons/*.svg` — vectores del Side Menu (blanco sobre navy):
Market Data (basket), Physical Trading (candles), Financial Trading (bars + lupa), Payoff, PnL, Credit Line, Greeks, Statements.
