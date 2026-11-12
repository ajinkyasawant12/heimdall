$ErrorActionPreference = "Stop"
$rootDir = "C:\Users\Ajinkya\.gemini\antigravity\scratch\heimdall-crs"

Write-Host "[+] Starting Heimdall Rebrand in $rootDir"

# 1. Rename files & folders if they exist
$renames = @(
    @("aegis.scope.json", "heimdall.scope.json"),
    @("aegis_crs_colab_runner.ipynb", "heimdall_colab_runner.ipynb"),
    @(".agents\aegis-orchestrator.json", ".agents\heimdall-orchestrator.json"),
    @("binary-harness\aegis_binary", "binary-harness\heimdall_binary")
)

foreach ($r in $renames) {
    $oldPath = Join-Path $rootDir $r[0]
    $newPath = Join-Path $rootDir $r[1]
    if (Test-Path $oldPath) {
        Rename-Item -Path $oldPath -NewName (Split-Path $newPath -Leaf) -Force
        Write-Host "[+] Renamed $($r[0]) -> $($r[1])"
    }
}

# 2. Process all text files
$extensions = @(".json", ".ts", ".js", ".mjs", ".md", ".ipynb", ".py", ".toml", ".txt", ".html", ".css")
$files = Get-ChildItem -Path $rootDir -Recurse -File | Where-Object { 
    $_.FullName -notmatch "node_modules|\.git" -and $extensions -contains $_.Extension
}

Write-Host "[+] Found $($files.Count) text files to inspect."

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    $orig = $content

    $content = $content.Replace('@aegis/', '@heimdall/')
    $content = $content.Replace('aegis-crs', 'heimdall-crs')
    $content = $content.Replace('aegis_crs', 'heimdall_crs')
    $content = $content.Replace('aegis.scope.json', 'heimdall.scope.json')
    $content = $content.Replace('Aegis CRS', 'Heimdall CRS')
    $content = $content.Replace('Aegis Security', 'Heimdall Security')
    $content = $content.Replace('AEGIS_BANNER', 'HEIMDALL_BANNER')
    $content = $content.Replace('AEGIS_VERSION', 'HEIMDALL_VERSION')
    $content = $content.Replace('"aegis":', '"heimdall":')
    $content = $content.Replace('aegis_binary', 'heimdall_binary')
    $content = $content.Replace('Aegis', 'Heimdall')
    $content = $content.Replace('AEGIS', 'HEIMDALL')
    
    # Specific agent and tool references in configs
    $content = $content.Replace('"aegis-orchestrator"', '"heimdall-orchestrator"')
    $content = $content.Replace('aegis-orchestrator.json', 'heimdall-orchestrator.json')
    $content = $content.Replace('aegis_', 'heimdall_')

    if ($content -ne $orig) {
        [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
        Write-Host "[+] Updated $($file.Name)"
    }
}

Write-Host "[+] Rebranding complete!"
