$urls = @(
    "https://axyntrax-automation-suite.vercel.app/",
    "https://axyntrax-automation-suite.vercel.app/registro",
    "https://axyntrax-automation-suite.vercel.app/descargar",
    "https://axyntrax-automation-suite.vercel.app/faq"
)

$results = @()

foreach ($url in $urls) {
    Write-Host "Probando $url..."
    $times = @()
    for ($i = 1; $i -le 5; $i++) {
        $elapsed = Measure-Command {
            try {
                Invoke-WebRequest -Uri $url -Method Get -UseBasicParsing -ErrorAction Stop | Out-Null
            } catch {
                Write-Host "Error en $($url): $($_.Exception.Message)"
            }
        }
        $times += $elapsed.TotalMilliseconds
    }
    $avg = ($times | Measure-Object -Average).Average
    $results += [PSCustomObject]@{
        URL = $url
        AvgResponseTime_ms = [math]::Round($avg, 2)
        Status = "OK"
    }
}

$results | Export-Csv -Path "perf_results.csv" -NoTypeInformation
$results | Format-Table
