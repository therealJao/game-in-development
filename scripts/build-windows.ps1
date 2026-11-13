param([string]$OutputName = 'Escape-Code.exe', [switch]$SourceOnly)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$dependencyRoot = Join-Path $projectRoot 'work/deps/webview2'
if (-not (Test-Path -LiteralPath (Join-Path $dependencyRoot 'lib/net462/Microsoft.Web.WebView2.Core.dll'))) {
    New-Item -ItemType Directory -Path (Join-Path $projectRoot 'work/deps') -Force | Out-Null
    $downloadPath = Join-Path $projectRoot 'work/deps/webview2.zip'
    Invoke-WebRequest -Uri 'https://api.nuget.org/v3-flatcontainer/microsoft.web.webview2/1.0.3537.50/microsoft.web.webview2.1.0.3537.50.nupkg' -OutFile $downloadPath
    Expand-Archive -LiteralPath $downloadPath -DestinationPath $dependencyRoot -Force
}
# Escreve os recursos diretamente no ZIP para não duplicar todos os modelos no disco.
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -TypeDefinition @'
using System;using System.IO;
public sealed class FluxoPacote:Stream {
 readonly Stream source;readonly long start;
 public FluxoPacote(Stream stream){source=stream;start=stream.Position;}
 public override bool CanRead{get{return false;}}public override bool CanSeek{get{return true;}}public override bool CanWrite{get{return true;}}
 public override long Length{get{return source.Length-start;}}public override long Position{get{return source.Position-start;}set{source.Position=start+value;}}
 public override long Seek(long offset,SeekOrigin origin){Position=(origin==SeekOrigin.Begin?0:origin==SeekOrigin.Current?Position:Length)+offset;return Position;}
 public override void Write(byte[] buffer,int offset,int count){source.Write(buffer,offset,count);}public override void Flush(){source.Flush();}
 public override void SetLength(long length){source.SetLength(start+length);}public override int Read(byte[] buffer,int offset,int count){throw new NotSupportedException();}
}
'@
New-Item -ItemType Directory -Path (Join-Path $projectRoot 'outputs') -Force | Out-Null
$archivePath = Join-Path $projectRoot 'work/game-payload.zip'
$stream = [IO.File]::Open($archivePath, [IO.FileMode]::Create)
$archive = New-Object IO.Compression.ZipArchive($stream, [IO.Compression.ZipArchiveMode]::Create, $false)
try {
    $sourceRoot = Join-Path $projectRoot 'dist'
    foreach ($relative in @('lib/net462/Microsoft.Web.WebView2.Core.dll','lib/net462/Microsoft.Web.WebView2.WinForms.dll','runtimes/win-x64/native/WebView2Loader.dll','LICENSE.txt','NOTICE.txt')) {
        $sourceFile = Join-Path $dependencyRoot $relative
        [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $sourceFile, [IO.Path]::GetFileName($sourceFile), [IO.Compression.CompressionLevel]::Optimal) | Out-Null
    }
} finally { $archive.Dispose(); $stream.Dispose() }
$outputPath = Join-Path $projectRoot $OutputName
$compilerPath = Join-Path $env:WINDIR 'Microsoft.NET/Framework64/v4.0.30319/csc.exe'
$compilerArguments = @('/nologo',"/win32icon:$projectRoot/dist/assets/escape-code.ico",'/target:winexe','/platform:x64','/optimize+',"/out:$outputPath",'/reference:System.Windows.Forms.dll','/reference:System.Drawing.dll','/reference:System.IO.Compression.dll','/reference:System.IO.Compression.FileSystem.dll',"/reference:$dependencyRoot/lib/net462/Microsoft.Web.WebView2.Core.dll","/reference:$dependencyRoot/lib/net462/Microsoft.Web.WebView2.WinForms.dll","/resource:$archivePath,EscapeCode.Payload",(Join-Path $projectRoot 'native/Programa.cs'))
& $compilerPath $compilerArguments
if ($LASTEXITCODE -ne 0) { throw 'A compilação do executável falhou.' }
# Grava o jogo diretamente no EXE. O rodapé permite abrir o ZIP como um
# segmento do arquivo, evitando uma segunda cópia temporária dos recursos.
if (-not $SourceOnly) {
    $outputStream=[IO.File]::Open($outputPath,[IO.FileMode]::Append,[IO.FileAccess]::Write)
    $payloadStart=$outputStream.Position
    $relativeStream=New-Object FluxoPacote($outputStream)
    $archive=New-Object IO.Compression.ZipArchive($relativeStream,[IO.Compression.ZipArchiveMode]::Create,$true)
    try {
        foreach ($asset in Get-ChildItem -LiteralPath $sourceRoot -Recurse -File) {
            $entryName='game/'+$asset.FullName.Substring($sourceRoot.Length+1).Replace('\','/')
            [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive,$asset.FullName,$entryName,[IO.Compression.CompressionLevel]::Optimal) | Out-Null
        }
        foreach ($relative in @('lib/net462/Microsoft.Web.WebView2.Core.dll','lib/net462/Microsoft.Web.WebView2.WinForms.dll','runtimes/win-x64/native/WebView2Loader.dll','LICENSE.txt','NOTICE.txt')) {
            [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive,(Join-Path $dependencyRoot $relative),[IO.Path]::GetFileName($relative),[IO.Compression.CompressionLevel]::Optimal) | Out-Null
        }
    } finally {$archive.Dispose()}
    $footer=[Text.Encoding]::ASCII.GetBytes('ECPK2424')+[BitConverter]::GetBytes([long]$payloadStart)
    $outputStream.Write($footer,0,$footer.Length);$outputStream.Dispose()
}
Get-Item -LiteralPath $outputPath | Select-Object FullName,Length
