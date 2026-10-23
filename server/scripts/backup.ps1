$ErrorActionPreference = "Stop"

$dir   = "$env:USERPROFILE\Respaldos-Conutria"
$fecha = Get-Date -Format "yyyy-MM-dd_HHmm"
$sql   = "$dir\conutria_$fecha.sql"
$zip   = "$dir\conutria_$fecha.7z"

$mysqldump = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe"
$sevenZip  = "C:\Program Files\7-Zip\7z.exe"

foreach ($v in "CONUTRIA_DB_HOST","CONUTRIA_DB_PORT","CONUTRIA_DB_USER","CONUTRIA_DB_PASSWORD","CONUTRIA_DB_NAME","CONUTRIA_BACKUP_KEY") {
  if (-not [Environment]::GetEnvironmentVariable($v)) { throw "Falta la variable $v" }
}
if (-not (Test-Path "$dir\ca.pem")) { throw "No encuentro $dir\ca.pem" }

# 1) Volcado de la base (la clave va por variable de entorno, no en el comando)
$env:MYSQL_PWD = $env:CONUTRIA_DB_PASSWORD
& $mysqldump `
  --host=$env:CONUTRIA_DB_HOST --port=$env:CONUTRIA_DB_PORT `
  --user=$env:CONUTRIA_DB_USER `
  --ssl-mode=VERIFY_CA --ssl-ca="$dir\ca.pem" `
  --single-transaction --routines --triggers `
  --set-gtid-purged=OFF --no-tablespaces `
  --result-file=$sql $env:CONUTRIA_DB_NAME
$env:MYSQL_PWD = $null
if ($LASTEXITCODE -ne 0) { throw "mysqldump fallo" }
if (-not (Test-Path $sql) -or (Get-Item $sql).Length -lt 1000) { throw "El respaldo salio vacio o muy pequeno" }

# 2) Comprimir y cifrar (tambien cifra los nombres de archivo)
& $sevenZip a -t7z -mhe=on "-p$env:CONUTRIA_BACKUP_KEY" $zip $sql | Out-Null
if ($LASTEXITCODE -ne 0) { throw "7-Zip fallo" }

# 3) Borrar el .sql sin cifrar
Remove-Item $sql -Force

# 4) Conservar solo los ultimos 14 respaldos
Get-ChildItem "$dir\conutria_*.7z" | Sort-Object LastWriteTime -Descending |
  Select-Object -Skip 14 | Remove-Item -Force

Write-Host "Respaldo listo: $zip"