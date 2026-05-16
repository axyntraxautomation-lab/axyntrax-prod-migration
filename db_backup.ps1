# ==============================================================================
# AXYNTRAX AUTOMATION SUITE — SCRIPT DE RESPALDO DE BASE DE DATOS (SQLite)
# ==============================================================================
# Este script copia de forma segura la base de datos de SQLite en caliente,
# genera un historico timestamped y rota respaldos antiguos para ahorrar espacio.
# ==============================================================================

# 1. Configuración de Directorios y Rutas
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$DbPath = Join-Path $ScriptDir "data\axyntrax.db"
$BackupDir = Join-Path $ScriptDir "backups"
$LogPath = Join-Path $ScriptDir "logs\backup_history.log"

# Asegurar que existan los directorios
if (!(Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}
$LogDir = Split-Path -Parent $LogPath
if (!(Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir | Out-Null
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = Join-Path $BackupDir "axyntrax_$Timestamp.db"

# 2. Función de Logueo Estructurado
function Write-BackupLog {
    param (
        [string]$Message,
        [string]$Type = "INFO"
    )
    $DateStr = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "[$DateStr] [$Type] $Message"
    Add-Content -Path $LogPath -Value $LogEntry
    Write-Host $LogEntry
}

Write-BackupLog "Iniciando proceso de copia de seguridad de base de datos..."

# 3. Copia en caliente (Safe Hot Copy)
if (Test-Path $DbPath) {
    try {
        # Copiar elemento de forma forzada para capturar el estado actual (funciona en WAL mode)
        Copy-Item -Path $DbPath -Destination $BackupFile -Force -ErrorAction Stop
        Write-BackupLog "Respaldo creado con exito: axyntrax_$Timestamp.db" "SUCCESS"
    }
    catch {
        Write-BackupLog "Fallo al realizar la copia de la base de datos: $_" "ERROR"
        exit 1
    }
} else {
    Write-BackupLog "Error: No se encontro el archivo de base de datos en: $DbPath" "ERROR"
    exit 1
}

# 4. Rotacion Automatica (Mantener solo los ultimos 15 dias)
try {
    $DaysToKeep = 15
    $LimitDate = (Get-Date).AddDays(-$DaysToKeep)
    $FilesToRemove = Get-ChildItem -Path $BackupDir -Filter "axyntrax_*.db" | Where-Object { $_.LastWriteTime -lt $LimitDate }
    
    if ($FilesToRemove.Count -gt 0) {
        foreach ($File in $FilesToRemove) {
            Remove-Item -Path $File.FullName -Force
            Write-BackupLog "Rotacion: Respaldo antiguo eliminado de forma segura: $($File.Name)" "ROTATE"
        }
    }
}
catch {
    Write-BackupLog "Error al procesar la rotacion de respaldos antiguos: $_" "WARNING"
}

Write-BackupLog "Proceso de copia de seguridad finalizado correctamente."
