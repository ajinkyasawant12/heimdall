$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$localHtml = Join-Path (Split-Path -Parent $scriptDir) "packages\dashboard\heimdall_swarm_board.html"
$brainHtml = "C:\Users\Ajinkya\.gemini\antigravity\brain\8eead122-7bc1-4a93-98d8-f02b87669e93\heimdall_swarm_board.html"

if (Test-Path $localHtml) {
    $htmlPath = $localHtml
} elseif (Test-Path $brainHtml) {
    $htmlPath = $brainHtml
} else {
    Write-Error "Could not find heimdall_swarm_board.html in package or brain artifact directory"
    exit 1
}
$port = 4040

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$port/")
$listener.Prefixes.Add("http://localhost:$port/")

try {
    $listener.Start()
    Write-Host "[+] Heimdall CRS Swarm Board listening on http://127.0.0.1:$port/ and http://localhost:$port/"
    
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $path = $request.Url.LocalPath

        $bytes = [System.IO.File]::ReadAllBytes($htmlPath)
        $response.ContentType = "text/html; charset=utf-8"
        $response.ContentLength64 = $bytes.Length
        $response.OutputStream.Write($bytes, 0, $bytes.Length)
        $response.Close()
    }
} catch {
    Write-Error "Listener error: $_"
} finally {
    $listener.Stop()
    $listener.Close()
}
