$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$outDir = "C:\Users\admin\Downloads\ManoboLit-Archive1\public\manual\screenshots"

$pages = @(
    @{ url = "http://localhost:3000/explore"; file = "fig2_explore.png" },
    @{ url = "http://localhost:3000/archive/cmvnxgovq000jawurtx7fu6gl"; file = "fig3_detail.png" },
    @{ url = "http://localhost:3000/classification"; file = "fig4_classification.png" },
    @{ url = "http://localhost:3000/translator"; file = "fig5_translator.png" },
    @{ url = "http://localhost:3000/dashboard"; file = "fig6_dashboard.png" },
    @{ url = "http://localhost:3000/admin/login"; file = "fig7_admin_login.png" }
)

$i = 2
foreach ($p in $pages) {
    $outFile = Join-Path $outDir $p.file
    $profile = "C:\Users\admin\AppData\Local\Temp\shot_profile_$i"
    Write-Host "Capturing $($p.url) to $($p.file)..."
    Start-Process $chrome -ArgumentList "--headless", "--disable-gpu", "--user-data-dir=$profile", "--window-size=1280,850", "--screenshot=$outFile", $p.url -Wait
    $i++
}

Write-Host "All page screenshots captured successfully!"

