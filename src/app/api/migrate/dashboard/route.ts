import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  // Return HTML interface for migration monitoring
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Image Migration Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .button { background: #007cba; color: white; padding: 12px 24px; border: none; border-radius: 5px; cursor: pointer; margin: 10px 5px; font-size: 14px; }
        .button:hover { background: #005a8a; }
        .button.danger { background: #dc3545; }
        .button.danger:hover { background: #c82333; }
        .status { padding: 15px; margin: 10px 0; border-radius: 5px; }
        .status.success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        .status.error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
        .status.warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; }
        .progress { width: 100%; height: 20px; background: #e9ecef; border-radius: 10px; overflow: hidden; margin: 10px 0; }
        .progress-bar { height: 100%; background: #28a745; transition: width 0.3s ease; }
        .migration-log { background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 5px; padding: 15px; height: 300px; overflow-y: auto; font-family: monospace; font-size: 12px; margin: 20px 0; white-space: pre-wrap; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #dee2e6; }
        .stat-number { font-size: 32px; font-weight: bold; color: #007cba; }
        .stat-label { color: #6c757d; margin-top: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Image Migration Dashboard</h1>
        <p>Migrate all database-stored images to UploadThing CDN</p>

        <div id="migration-status"></div>

        <div class="stats" id="stats">
            <div class="stat-card">
                <div class="stat-number" id="total-images">-</div>
                <div class="stat-label">Total Images</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="database-images">-</div>
                <div class="stat-label">In Database</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="uploadthing-images">-</div>
                <div class="stat-label">In UploadThing</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="migrated-count">0</div>
                <div class="stat-label">Migrated</div>
            </div>
        </div>

        <div id="progress-container" style="display: none;">
            <h3>Migration Progress</h3>
            <div class="progress">
                <div class="progress-bar" id="progress-bar" style="width: 0%"></div>
            </div>
            <div id="progress-text">0 / 0 images migrated</div>
        </div>

        <div>
            <button class="button" onclick="checkStatus()">🔍 Check Status</button>
            <button class="button" onclick="dryRun()">🧪 Dry Run (Preview)</button>
            <button class="button danger" onclick="startMigration()">🚀 Start Migration</button>
            <button class="button" onclick="clearLog()">🗑️ Clear Log</button>
        </div>

        <div class="migration-log" id="log"></div>
    </div>

    <script>
        let migrationState = { totalToMigrate: 0, migrated: 0, errors: 0 };

        function log(message) {
            const logEl = document.getElementById('log');
            logEl.textContent += new Date().toLocaleTimeString() + ': ' + message + '\\n';
            logEl.scrollTop = logEl.scrollHeight;
        }

        function clearLog() {
            document.getElementById('log').textContent = '';
        }

        function updateProgress() {
            const progress = migrationState.totalToMigrate > 0 ? 
                (migrationState.migrated / migrationState.totalToMigrate) * 100 : 0;
            
            document.getElementById('progress-bar').style.width = progress + '%';
            document.getElementById('progress-text').textContent = 
                migrationState.migrated + ' / ' + migrationState.totalToMigrate + ' images migrated';
            document.getElementById('migrated-count').textContent = migrationState.migrated;
            
            if (progress > 0) {
                document.getElementById('progress-container').style.display = 'block';
            }
        }

        async function checkStatus() {
            log('Checking migration status...');
            try {
                const response = await fetch('/api/migrate/images');
                const data = await response.json();
                
                if (data.migrationStatus) {
                    document.getElementById('total-images').textContent = data.migrationStatus.totalImages;
                    document.getElementById('database-images').textContent = data.migrationStatus.databaseStored;
                    document.getElementById('uploadthing-images').textContent = data.migrationStatus.uploadthingStored;
                    migrationState.totalToMigrate = data.migrationStatus.databaseStored;
                    
                    if (data.migrationStatus.needsMigration) {
                        document.getElementById('migration-status').innerHTML = 
                            '<div class="status warning">⚠️ ' + data.migrationStatus.databaseStored + ' images need migration to UploadThing</div>';
                    } else {
                        document.getElementById('migration-status').innerHTML = 
                            '<div class="status success">✅ All images are stored in UploadThing</div>';
                    }
                    
                    log('Status updated: ' + data.migrationStatus.databaseStored + ' images need migration');
                    updateProgress();
                }
            } catch (error) {
                log('Error checking status: ' + error.message);
                document.getElementById('migration-status').innerHTML = 
                    '<div class="status error">❌ Failed to check status</div>';
            }
        }

        async function dryRun() {
            log('Starting dry run preview...');
            try {
                const response = await fetch('/api/migrate/images', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ dryRun: true, limit: 5 })
                });
                
                const data = await response.json();
                log('Dry run completed. Would migrate ' + data.migrationSummary.totalProcessed + ' images');
                log('Preview: ' + JSON.stringify(data.migrationResults, null, 2));
                
            } catch (error) {
                log('Dry run failed: ' + error.message);
            }
        }

        async function startMigration() {
            if (!confirm('Are you sure you want to start the real migration? This will process all images.')) {
                return;
            }
            
            log('🚀 Starting real migration...');
            migrationState.migrated = 0;
            migrationState.errors = 0;
            
            // Process in batches
            let offset = 0;
            const batchSize = 5;
            let hasMore = true;
            
            while (hasMore) {
                try {
                    log('Processing batch starting at offset ' + offset + '...');
                    
                    const response = await fetch('/api/migrate/images', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ dryRun: false, limit: batchSize, offset })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        migrationState.migrated += data.migrationSummary.successCount;
                        migrationState.errors += data.migrationSummary.errorCount;
                        
                        log('Batch completed: ' + data.migrationSummary.successCount + ' success, ' + 
                            data.migrationSummary.errorCount + ' errors');
                        
                        // Log individual results
                        data.migrationResults.forEach(result => {
                            if (result.status === 'success') {
                                log('✅ ' + result.filename + ' -> ' + result.newUrl);
                            } else if (result.status === 'error') {
                                log('❌ ' + result.filename + ': ' + result.error);
                            }
                        });
                        
                        hasMore = data.migrationSummary.hasMore;
                        offset += batchSize;
                        
                        updateProgress();
                        
                        // Small delay between batches
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                    } else {
                        log('❌ Migration batch failed: ' + data.message);
                        break;
                    }
                    
                } catch (error) {
                    log('❌ Migration error: ' + error.message);
                    break;
                }
            }
            
            log('🎉 Migration completed! Total migrated: ' + migrationState.migrated + ', Errors: ' + migrationState.errors);
            
            // Refresh status
            setTimeout(checkStatus, 2000);
        }

        // Auto-check status on load
        checkStatus();
    </script>
</body>
</html>
  `

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  })
}
