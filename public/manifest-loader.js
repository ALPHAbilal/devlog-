// Defensive manifest loader to prevent icon errors
(function() {
  // Only run in production
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return;
  }

  // Check if manifest is loaded
  const manifestLink = document.querySelector('link[rel="manifest"]');
  if (manifestLink) {
    // Add error handler
    manifestLink.onerror = function() {
      console.warn('Manifest failed to load, removing link');
      this.remove();
    };

    // Verify manifest can be fetched
    fetch('/manifest.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Manifest not found');
        }
        return response.json();
      })
      .then(manifest => {
        // Verify icons exist
        if (manifest.icons && manifest.icons.length > 0) {
          manifest.icons.forEach(icon => {
            // Preload icon to check if it exists
            const img = new Image();
            img.onerror = () => {
              console.warn(`Icon ${icon.src} failed to load`);
            };
            img.src = icon.src;
          });
        }
      })
      .catch(error => {
        console.warn('Manifest error:', error);
        // Remove manifest link if it's causing issues
        if (manifestLink && manifestLink.parentNode) {
          manifestLink.remove();
        }
      });
  }
})();