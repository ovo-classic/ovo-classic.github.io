// Initialize PWA-related features when the window loads
$(window).on('load', function () {
    initializePwaFeatures();
});

// Initialize PWA-related features by calling specific functions
function initializePwaFeatures() {
    addManifestLink();
    registerServiceWorker();
    setupPwaInstallationPrompt();
}

// Dynamically add the manifest link for the PWA
function addManifestLink() {
    const manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    manifestLink.href = '/manifest.json'; // Ensure this file exists at the root
    document.head.appendChild(manifestLink);
    console.log('Manifest file added:', manifestLink.href);
}

// Register the Service Worker for offline support
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js', { scope: '/' }) // Set the root scope
            .then((registration) => {
                console.log('Service Worker registered with scope:', registration.scope);
                trackEvent('PWA_service_worker', 'Service Worker', 'Registered', 1);
            })
            .catch((error) => {
                console.error('Service Worker registration failed:', error);
                trackEvent('PWA_service_worker', 'Service Worker', 'Failed', 0);
            });
    } else {
        console.warn('Service Worker is not supported in this browser.');
        trackEvent('PWA_service_worker', 'Service Worker', 'Not Supported', 0);
    }
}

// Set up the PWA installation prompt and its interactions
function setupPwaInstallationPrompt() {
    let deferredPrompt;
    const isPwaInstalled = localStorage.getItem('pwaInstalled') === 'true';

    // Check if the PWA is already installed
    if (isPwaInstalled) {
        console.log('PWA is already installed.');
        return; // Exit if the PWA is already installed
    }

    // Only show the prompt for non-mobile devices
    if (!isMobileDevice()) {
        const popupHTML = `
            <div id="pwa-popup" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(255,255,255,0.8); color: #333; text-align: center; z-index: 1000; display: flex; align-items: center; justify-content: center;">
                <div style="padding: 25px; background: #f5f5f5; border-radius: 20px; width: 90%; max-width: 450px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2); text-align: center;">
                    <h2 style="font-size: 22px; margin-bottom: 15px; color: #2c3e50;">Install Our App for a Faster, Seamless Experience!</h2>
                    <button id="install-button" style="padding: 12px 28px; font-size: 18px; cursor: pointer; background: #7f2525; color: white; border: none; border-radius: 30px;">Add to Home Screen</button>
                    <button id="close-popup" style="padding: 12px 28px; font-size: 18px; cursor: pointer; background-color: transparent; color: #888; border: none; border-radius: 30px;">Not Now</button>
                </div>
            </div>
        `;
        $('body').append(popupHTML);

        const popup = $('#pwa-popup');
        const installButton = $('#install-button');
        const closePopupButton = $('#close-popup');

        // Listen for the beforeinstallprompt event to show the installation prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            popup.show();
            console.log('beforeinstallprompt event triggered');
            trackEvent('PWA_prompt', 'PWA', 'Prompt Displayed', 1);
        });

        // Handle the click on the "Add to Home Screen" button
        installButton.on('click', () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('PWA installation accepted');
                        trackEvent('PWA_installation', 'PWA', 'Accepted', 1);
                        localStorage.setItem('pwaInstalled', 'true');
                    } else {
                        console.log('PWA installation dismissed');
                        trackEvent('PWA_installation', 'PWA', 'Dismissed', 0);
                    }
                    deferredPrompt = null;
                    popup.hide();
                }).catch((error) => {
                    console.error('Error during PWA installation:', error);
                });
            }
        });

        // Allow users to dismiss the installation prompt
        closePopupButton.on('click', () => {
            popup.hide();
            console.log('PWA popup closed.');
            trackEvent('PWA_prompt', 'PWA', 'Closed', 0);
        });

        // Listen for the appinstalled event to confirm successful installation
        window.addEventListener('appinstalled', () => {
            console.log('PWA installed successfully.');
            trackEvent('PWA_installation', 'PWA', 'Successful', 1);
            localStorage.setItem('pwaInstalled', 'true');
            popup.hide();
        });
    } else {
        console.log('Device is mobile, skipping PWA installation prompt.');
    }
}

// Helper function to detect if the current device is mobile
function isMobileDevice() {
    return window.matchMedia("(max-width: 767px)").matches || /Mobi|Android/i.test(navigator.userAgent);
}
