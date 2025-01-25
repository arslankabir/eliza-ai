# PowerShell script to extract version from lerna.json

$LERNA_FILE = "../lerna.json"

# Check if lerna.json exists
if (-Not (Test-Path $LERNA_FILE)) {
    Write-Error "Error: $LERNA_FILE does not exist."
    exit 1
}

# Read the content of lerna.json and extract the version
$lernaContent = Get-Content $LERNA_FILE | ConvertFrom-Json
$VERSION = $lernaContent.version

# Check if version was successfully extracted
if (-Not $VERSION) {
    Write-Error "Error: Unable to extract version from $LERNA_FILE."
    exit 1
}

# Create or overwrite info.json with the version property
$infoJson = @{
    version = $VERSION
} | ConvertTo-Json

Set-Content -Path "info.json" -Value $infoJson
