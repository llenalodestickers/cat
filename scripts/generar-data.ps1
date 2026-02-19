$ErrorActionPreference = "Stop"

function Normalize-Slug([string]$text) {
  if ([string]::IsNullOrWhiteSpace($text)) { return "general" }
  $lower = $text.ToLowerInvariant()
  $normalized = $lower.Normalize([Text.NormalizationForm]::FormD)
  $chars = New-Object System.Collections.Generic.List[char]
  foreach ($ch in $normalized.ToCharArray()) {
    $cat = [Globalization.CharUnicodeInfo]::GetUnicodeCategory($ch)
    if ($cat -ne [Globalization.UnicodeCategory]::NonSpacingMark) {
      [void]$chars.Add($ch)
    }
  }
  $noDiacritics = -join $chars
  $slug = $noDiacritics -replace '[^a-z0-9]+', '-'
  $slug = $slug.Trim('-')
  if ([string]::IsNullOrWhiteSpace($slug)) { return "general" }
  return $slug
}

function Label-FromName([string]$name) {
  if ([string]::IsNullOrWhiteSpace($name)) { return "General" }
  $clean = $name -replace '[_-]+', ' '
  $clean = $clean.Trim()
  return (Get-Culture).TextInfo.ToTitleCase($clean.ToLower())
}

$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$imagesRoot = (Resolve-Path (Join-Path $root "images/Stickers")).Path
$output = Join-Path $root "js/data.js"

if (-not (Test-Path $imagesRoot)) {
  throw "No existe la carpeta: $imagesRoot"
}

$files = Get-ChildItem -Path $imagesRoot -Recurse -File -Filter *.png | Sort-Object FullName

$countsByMain = @{}
$items = New-Object System.Collections.Generic.List[object]

foreach ($file in $files) {
  $relative = $file.FullName.Substring($imagesRoot.Length + 1) -replace '\\','/'
  $parts = $relative.Split('/')
  if ($parts.Count -lt 2) { continue }

  $mainRaw = $parts[0]
  $subRaw = if ($parts.Count -ge 3) { $parts[1] } else { "General" }

  $main = Normalize-Slug $mainRaw
  $sub = Normalize-Slug $subRaw

  if (-not $countsByMain.ContainsKey($main)) { $countsByMain[$main] = 0 }
  $countsByMain[$main]++

  $id = "ST-{0}-{1}" -f $main.Substring(0, [Math]::Min(3, $main.Length)).ToUpper(), $countsByMain[$main].ToString("000")
  $nameBase = [IO.Path]::GetFileNameWithoutExtension($file.Name)
  $imagePath = "images/Stickers/" + ($relative -replace '"','\"')

  $items.Add([PSCustomObject]@{
    id = $id
    nombre = "Sticker $nameBase"
    categoria = $main
    categoriaLabel = Label-FromName $mainRaw
    categoriaPrincipal = $main
    categoriaPrincipalLabel = Label-FromName $mainRaw
    subcategoria = $sub
    subcategoriaLabel = Label-FromName $subRaw
    tipo = "sticker"
    precio = 700
    imagen = $imagePath
  }) | Out-Null
}

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("const productos = [") | Out-Null

for ($i = 0; $i -lt $items.Count; $i++) {
  $item = $items[$i]
  $line = '  { id: "' + $item.id + '", nombre: "' + ($item.nombre -replace '"','\"') + '", categoria: "' + $item.categoria + '", categoriaLabel: "' + ($item.categoriaLabel -replace '"','\"') + '", categoriaPrincipal: "' + $item.categoriaPrincipal + '", categoriaPrincipalLabel: "' + ($item.categoriaPrincipalLabel -replace '"','\"') + '", subcategoria: "' + $item.subcategoria + '", subcategoriaLabel: "' + ($item.subcategoriaLabel -replace '"','\"') + '", tipo: "' + $item.tipo + '", precio: ' + $item.precio + ', imagen: "' + $item.imagen + '" }'
  if ($i -lt $items.Count - 1) { $line += "," }
  $lines.Add($line) | Out-Null
}

$lines.Add("];") | Out-Null
Set-Content -Path $output -Value $lines -Encoding UTF8

Write-Output ("Productos generados: {0}" -f $items.Count)
