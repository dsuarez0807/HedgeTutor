# Static server with SPA fallback for Commos Consulting
# Usage: powershell -File scripts/serve.ps1

$port = 5173
$root = Split-Path -Parent $PSScriptRoot
if (-not $root) { $root = (Get-Location).Path }

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$port/")
$listener.Start()
Write-Output "Serving $root at http://127.0.0.1:$port/ (SPA fallback → index.html)"

$spaRoutes = @(
  '/market-data',
  '/physical-trading',
  '/financial-trading',
  '/payoff-exposure',
  '/pnl-cash-flow',
  '/credit-line',
  '/greeks',
  '/statements'
)

function Get-ContentType([string]$ext) {
  switch ($ext.ToLower()) {
    '.html' { return 'text/html; charset=utf-8' }
    '.css'  { return 'text/css; charset=utf-8' }
    '.js'   { return 'application/javascript; charset=utf-8' }
    '.json' { return 'application/json; charset=utf-8' }
    '.svg'  { return 'image/svg+xml' }
    '.png'  { return 'image/png' }
    '.jpg'  { return 'image/jpeg' }
    default { return 'application/octet-stream' }
  }
}

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $path = $ctx.Request.Url.LocalPath
  if ($path -eq '/' -or $spaRoutes -contains $path) {
    $path = '/index.html'
  }

  $rel = $path.TrimStart('/').Replace('/', [IO.Path]::DirectorySeparatorChar)
  $file = Join-Path $root $rel

  if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
    $ctx.Response.StatusCode = 404
    $bytes = [Text.Encoding]::UTF8.GetBytes('Not found')
    $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    $ctx.Response.Close()
    continue
  }

  $bytes = [IO.File]::ReadAllBytes($file)
  $ctx.Response.ContentType = Get-ContentType ([IO.Path]::GetExtension($file))
  $ctx.Response.ContentLength64 = $bytes.Length
  $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  $ctx.Response.Close()
}
