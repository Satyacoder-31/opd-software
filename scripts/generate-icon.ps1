Add-Type -AssemblyName System.Drawing

$logoPath = Join-Path $PSScriptRoot "..\public\logo.png"
$icoPath = Join-Path $PSScriptRoot "..\public\app-icon.ico"

if (-not (Test-Path $logoPath)) {
    Write-Error "logo.png not found at $logoPath"
    exit 1
}

$src = [System.Drawing.Image]::FromFile($logoPath)
Write-Host "Source logo loaded: $($src.Width)x$($src.Height)"

$sizes = @(16, 32, 48, 64, 128, 256)
$imagesData = @()

foreach ($size in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # Fit source inside square while preserving aspect ratio
    $ratio = [Math]::Min($size / $src.Width, $size / $src.Height)
    $destW = [int][Math]::Round($src.Width * $ratio)
    $destH = [int][Math]::Round($src.Height * $ratio)
    $destX = [int][Math]::Round(($size - $destW) / 2)
    $destY = [int][Math]::Round(($size - $destH) / 2)

    $g.DrawImage($src, $destX, $destY, $destW, $destH)
    $g.Dispose()

    $ms = New-Object System.IO.MemoryStream
    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $pngBytes = $ms.ToArray()
    $ms.Dispose()
    $bmp.Dispose()

    $imagesData += ,@($size, $pngBytes)
}
$src.Dispose()

# Create multi-resolution ICO file
$fs = [System.IO.File]::Create($icoPath)
$bw = New-Object System.IO.BinaryWriter $fs

$count = $imagesData.Count
$bw.Write([UInt16]0)          # Reserved
$bw.Write([UInt16]1)          # Type 1 = ICO
$bw.Write([UInt16]$count)      # Number of images

# Header is 6 bytes + (16 * count)
$offset = 6 + (16 * $count)

foreach ($item in $imagesData) {
    $size = $item[0]
    $bytes = $item[1]
    $w = if ($size -ge 256) { 0 } else { [byte]$size }
    $h = if ($size -ge 256) { 0 } else { [byte]$size }

    $bw.Write([Byte]$w)       # Width
    $bw.Write([Byte]$h)       # Height
    $bw.Write([Byte]0)        # Color count
    $bw.Write([Byte]0)        # Reserved
    $bw.Write([UInt16]1)      # Color planes
    $bw.Write([UInt16]32)     # Bits per pixel
    $bw.Write([UInt32]$bytes.Length) # Image data size
    $bw.Write([UInt32]$offset)       # Image data offset

    $offset += $bytes.Length
}

foreach ($item in $imagesData) {
    $bytes = $item[1]
    $bw.Write($bytes)
}

$bw.Flush()
$fs.Close()

Write-Host "Generated multi-resolution ICO from original logo.png successfully!"
Write-Host "File size: $((Get-Item $icoPath).Length) bytes"
