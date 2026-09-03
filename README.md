# HedgeTutor UI — Commos Consulting (prototype)

Prototipo HTML/CSS/JS del dashboard HedgeTutor (frame desktop **1440×985**).

## Cómo ver la demo (cliente)

No abras `index.html` haciendo doble clic: las pantallas se cargan por `fetch` y eso **falla** en `file://`.

### Opción A — GitHub Pages (recomendada para compartir link)

1. Subí este repo a GitHub.
2. En el repo: **Settings → Pages → Source: Deploy from a branch → `main` / root**.
3. Esperá 1–2 minutos.
4. Link público (reemplazá USER y REPO):

`https://USER.github.io/REPO/`

Ese link es el que le pasás al cliente para **ver** la demo.

> **Importante:** si invitás al cliente al repositorio, también puede descargar el código.  
> Si querés que solo vea la demo hasta que pague: compartí **solo la URL de Pages** (o un deploy con contraseña en Netlify) y **no** lo agregues como collaborator del repo.

### Opción B — Local (vos)

```powershell
powershell -ExecutionPolicy Bypass -File scripts\serve.ps1
```

Abrí: http://127.0.0.1:5173/

## Módulos

| Ruta | Pantalla |
|------|----------|
| `/` o `/market-data` | Market Data |
| `/physical-trading` | Physical Trading |
| `/financial-trading` | Financial Trading |
| `/payoff-exposure` | Payoff and Exposure |
| `/pnl-cash-flow` | PnL and Cash Flow |
| `/credit-line` | Credit Line |
| `/greeks` | Greeks |
| `/statements` | Statements |

## Subir a GitHub (primera vez)

```powershell
cd C:\Users\sebas\commos-consulting
git init
git add .
git commit -m "Initial HedgeTutor UI prototype"
git branch -M main
git remote add origin https://github.com/USER/REPO.git
git push -u origin main
```

Si Git no está instalado: https://git-scm.com/download/win

## Nota sobre archivos

Entregá el zip/código fuente al cliente **después** del pago. Hasta entonces, alcanza con el link de la demo.
