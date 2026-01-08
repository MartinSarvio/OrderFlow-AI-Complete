// Simple live reload - checks for file changes every 2 seconds
(function() {
  let lastCheck = Date.now();
  
  setInterval(async () => {
    try {
      const response = await fetch('/', { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      const lastModified = response.headers.get('Last-Modified');
      const modifiedTime = new Date(lastModified).getTime();
      
      if (modifiedTime > lastCheck) {
        console.log('🔄 Files changed, reloading...');
        location.reload(true);
      }
    } catch (e) {
      // Ignore errors
    }
  }, 2000);
})();
