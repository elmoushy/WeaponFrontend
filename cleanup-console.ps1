$sourceDir = "c:\Users\iP\Downloads\WeaponpowerCloud-Frontend-main\WeaponpowerCloud-Frontend-main\src"

# Process all .vue and .ts files recursively
Get-ChildItem -Path $sourceDir -Include "*.vue", "*.ts" -Recurse | ForEach-Object {
    $filePath = $_.FullName
    $content = Get-Content $filePath -Raw
    
    # Replace console statements with comments
    $newContent = $content -replace "console\.(log|error|warn|debug|info)\([^)]*\)", "// Logging removed for production"
    
    if ($content -ne $newContent) {
        Set-Content $filePath -Value $newContent -NoNewline
        Write-Host "Updated: $($_.Name)"
    }
}

Write-Host "Console cleanup completed!"
