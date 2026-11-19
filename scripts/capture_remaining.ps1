$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$outDir = "C:\Users\admin\Downloads\ManoboLit-Archive1\public\manual\screenshots"

function Capture-Page($url, $fileName, $id) {
    $outFile = Join-Path $outDir $fileName
    $profile = "C:\Users\admin\AppData\Local\Temp\shot_p_$id"
    Write-Host "Capturing $url -> $fileName..."
    $proc = Start-Process $chrome -ArgumentList "--headless", "--disable-gpu", "--no-first-run", "--user-data-dir=$profile", "--window-size=1280,850", "--screenshot=$outFile", $url -PassThru
    # Wait up to 8 seconds for the file to be created
    $waited = 0
    while ($waited -lt 8) {
        Start-Sleep -Milliseconds 500
        $waited += 0.5
        if ((Test-Path $outFile) -and ((Get-Item $outFile).Length -gt 10000)) {
            Write-Host "Success! Created $fileName ($((Get-Item $outFile).Length) bytes) in $waited seconds."
            break
        }
    }
    if ($proc -and -not $proc.HasExited) {
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
}

Capture-Page "http://localhost:3000/archive/cmvnxgovq000jawurtx7fu6gl" "fig3_detail.png" 3
Capture-Page "http://localhost:3000/translator" "fig5_translator.png" 5
Capture-Page "http://localhost:3000/dashboard" "fig6_dashboard.png" 6
Capture-Page "http://localhost:3000/admin/login" "fig7_admin_login.png" 7

Write-Host "Completed capturing all remaining pages!"
