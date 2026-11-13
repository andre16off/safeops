# Prueba automatica de los endpoints de SafeOps API.
# Uso (con la app corriendo): powershell -ExecutionPolicy Bypass -File .\probar-endpoints.ps1
# Crea un area y riesgos de prueba y los elimina al final. No guarda contrasenas ni tokens.

$base = "http://localhost:8080"
$script:ok = 0
$script:fallos = 0

function Llamar($metodo, $ruta, $token, $cuerpo) {
    $h = @{}
    if ($token) { $h["Authorization"] = "Bearer $token" }
    $p = @{ Method = $metodo; Uri = "$base$ruta"; Headers = $h; UseBasicParsing = $true }
    if ($null -ne $cuerpo) {
        $p["ContentType"] = "application/json; charset=utf-8"
        $p["Body"] = [Text.Encoding]::UTF8.GetBytes(($cuerpo | ConvertTo-Json -Compress))
    }
    try {
        $r = Invoke-WebRequest @p
        return @{ Codigo = [int]$r.StatusCode; Cuerpo = $r.Content }
    } catch {
        $resp = $_.Exception.Response
        if ($null -eq $resp) { throw }
        return @{ Codigo = [int]$resp.StatusCode; Cuerpo = $_.ErrorDetails.Message }
    }
}

function Verificar($nombre, $resultado, [int[]]$esperados) {
    if ($esperados -contains $resultado.Codigo) {
        $script:ok++
        Write-Host ("[OK]    {0} -> {1}" -f $nombre, $resultado.Codigo) -ForegroundColor Green
    } else {
        $script:fallos++
        Write-Host ("[FALLO] {0} -> {1} (esperado {2}) {3}" -f $nombre, $resultado.Codigo, ($esperados -join "/"), $resultado.Cuerpo) -ForegroundColor Red
    }
}

function Leer-Clave($texto) {
    $s = Read-Host $texto -AsSecureString
    return [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s))
}

$usuarioAdmin = Read-Host "Usuario ADMIN (Enter = superadmin)"
if (-not $usuarioAdmin) { $usuarioAdmin = "superadmin" }
$claveAdmin = Leer-Clave "Contrasena de $usuarioAdmin"
$usuarioGuest = Read-Host "Usuario GUEST (Enter = invitado)"
if (-not $usuarioGuest) { $usuarioGuest = "invitado" }
$claveGuest = Leer-Clave "Contrasena de $usuarioGuest"

Write-Host "`n--- Autenticacion ---"
$r = Llamar POST "/api/auth/login" $null @{ nombreUsuario = $usuarioAdmin; password = $claveAdmin }
Verificar "Login ADMIN" $r 200
$tAdmin = $null
if ($r.Codigo -eq 200) { $tAdmin = ($r.Cuerpo | ConvertFrom-Json).token }
$r = Llamar POST "/api/auth/login" $null @{ nombreUsuario = $usuarioGuest; password = $claveGuest }
Verificar "Login GUEST" $r 200
$tGuest = $null
if ($r.Codigo -eq 200) { $tGuest = ($r.Cuerpo | ConvertFrom-Json).token }
Verificar "Login con contrasena incorrecta" (Llamar POST "/api/auth/login" $null @{ nombreUsuario = $usuarioAdmin; password = "incorrecta-xyz" }) 401
Verificar "Registro con usuario existente" (Llamar POST "/api/auth/register" $null @{ nombreUsuario = $usuarioAdmin; password = "x" }) 409
Verificar "Registro pidiendo rol ADMIN" (Llamar POST "/api/auth/register" $null @{ nombreUsuario = "no_se_crea_" + (Get-Random); password = "x"; rol = "ADMIN" }) 400
Verificar "GET /api/areas sin token" (Llamar GET "/api/areas" $null $null) 401

if (-not $tAdmin -or -not $tGuest) { Write-Host "No se pudo iniciar sesion; se detiene la prueba." -ForegroundColor Red; exit 1 }

Write-Host "`n--- Areas y riesgos ---"
Verificar "GET /api/areas (GUEST)" (Llamar GET "/api/areas" $tGuest $null) 200
$r = Llamar POST "/api/areas" $tAdmin @{ nombre = "Area de prueba script"; ubicacion = "Prueba" }
Verificar "POST /api/areas" $r 201
$areaId = ($r.Cuerpo | ConvertFrom-Json).id
Verificar "POST /api/areas con datos vacios" (Llamar POST "/api/areas" $tAdmin @{ nombre = ""; ubicacion = "" }) 400
Verificar "POST /api/areas (GUEST)" (Llamar POST "/api/areas" $tGuest @{ nombre = "x"; ubicacion = "x" }) 403

$r = Llamar POST "/api/areas/$areaId/riesgos" $tAdmin @{ peligro = "Piso mojado"; descripcion = "Caida del personal"; probabilidad = 3; impacto = 5 }
Verificar "POST riesgo valido" $r 201
$riesgo = $r.Cuerpo | ConvertFrom-Json
$riesgoId = $riesgo.id
if ($riesgo.nivel -eq "ALTO") { $script:ok++; Write-Host "[OK]    Nivel calculado 3x5 = ALTO" -ForegroundColor Green }
else { $script:fallos++; Write-Host "[FALLO] Nivel calculado: $($riesgo.nivel) (esperado ALTO)" -ForegroundColor Red }

Verificar "POST riesgo con probabilidad 6" (Llamar POST "/api/areas/$areaId/riesgos" $tAdmin @{ peligro = "x"; descripcion = "x"; probabilidad = 6; impacto = 2 }) 400
Verificar "POST riesgo sin probabilidad" (Llamar POST "/api/areas/$areaId/riesgos" $tAdmin @{ peligro = "x"; descripcion = "x"; impacto = 2 }) 400
Verificar "POST riesgo en area inexistente" (Llamar POST "/api/areas/999999/riesgos" $tAdmin @{ peligro = "x"; descripcion = "x"; probabilidad = 1; impacto = 1 }) 404

Verificar "GET riesgos del area (GUEST)" (Llamar GET "/api/areas/$areaId/riesgos" $tGuest $null) 200
Verificar "GET /api/riesgos/nivel/ALTO (JPQL)" (Llamar GET "/api/riesgos/nivel/ALTO" $tGuest $null) 200
Verificar "GET /api/riesgos/impacto-minimo/3 (JPQL)" (Llamar GET "/api/riesgos/impacto-minimo/3" $tGuest $null) 200

$r = Llamar PUT "/api/riesgos/$riesgoId" $tAdmin @{ peligro = "Piso mojado"; descripcion = "Senalizado"; probabilidad = 1; impacto = 2 }
Verificar "PUT riesgo" $r 200
if ($r.Codigo -eq 200) {
    $nivel = ($r.Cuerpo | ConvertFrom-Json).nivel
    if ($nivel -eq "BAJO") { $script:ok++; Write-Host "[OK]    Nivel recalculado 1x2 = BAJO" -ForegroundColor Green }
    else { $script:fallos++; Write-Host "[FALLO] Nivel recalculado: $nivel (esperado BAJO)" -ForegroundColor Red }
}
Verificar "PUT riesgo inexistente" (Llamar PUT "/api/riesgos/999999" $tAdmin @{ peligro = "x"; descripcion = "x"; probabilidad = 1; impacto = 1 }) 404

Verificar "GET /api/riesgos (todos)" (Llamar GET "/api/riesgos" $tGuest $null) 200
Verificar "GET /api/riesgos/{id}" (Llamar GET "/api/riesgos/$riesgoId" $tGuest $null) 200
Verificar "GET /api/riesgos/{id} inexistente" (Llamar GET "/api/riesgos/999999" $tGuest $null) 404
Verificar "GET /api/areas/{id}" (Llamar GET "/api/areas/$areaId" $tGuest $null) 200
Verificar "PUT /api/areas/{id}" (Llamar PUT "/api/areas/$areaId" $tAdmin @{ nombre = "Area de prueba editada"; ubicacion = "Prueba" }) 200
Verificar "PUT /api/areas/{id} (GUEST)" (Llamar PUT "/api/areas/$areaId" $tGuest @{ nombre = "x"; ubicacion = "x" }) 403
Verificar "PUT /api/areas/{id} inexistente" (Llamar PUT "/api/areas/999999" $tAdmin @{ nombre = "x"; ubicacion = "x" }) 404

$r = Llamar GET "/api/usuarios" $tAdmin $null
Verificar "GET /api/usuarios (ADMIN)" $r 200
if ($r.Codigo -eq 200) {
    if ($r.Cuerpo -match "password") { $script:fallos++; Write-Host "[FALLO] GET /api/usuarios expone la contrasena" -ForegroundColor Red }
    else { $script:ok++; Write-Host "[OK]    GET /api/usuarios no expone contrasenas" -ForegroundColor Green }
    $propio = ($r.Cuerpo | ConvertFrom-Json) | Where-Object { $_.nombreUsuario -eq $usuarioAdmin }
    Verificar "DELETE /api/usuarios/{id} propio" (Llamar DELETE "/api/usuarios/$($propio.id)" $tAdmin $null) 409
}
Verificar "GET /api/usuarios (GUEST)" (Llamar GET "/api/usuarios" $tGuest $null) 403
Verificar "DELETE /api/usuarios/{id} inexistente" (Llamar DELETE "/api/usuarios/999999" $tAdmin $null) 404

Verificar "DELETE riesgo (GUEST)" (Llamar DELETE "/api/riesgos/$riesgoId" $tGuest $null) 403
Verificar "DELETE area con riesgos" (Llamar DELETE "/api/areas/$areaId" $tAdmin $null) 409

Write-Host "`n--- Limpieza ---"
Verificar "DELETE riesgo (ADMIN)" (Llamar DELETE "/api/riesgos/$riesgoId" $tAdmin $null) 204
Verificar "DELETE riesgo ya eliminado" (Llamar DELETE "/api/riesgos/$riesgoId" $tAdmin $null) 404
Verificar "DELETE area vacia (ADMIN)" (Llamar DELETE "/api/areas/$areaId" $tAdmin $null) 204
Verificar "DELETE area ya eliminada" (Llamar DELETE "/api/areas/$areaId" $tAdmin $null) 404

Write-Host ("`nResultado: {0} OK, {1} fallos" -f $script:ok, $script:fallos) -ForegroundColor Cyan
