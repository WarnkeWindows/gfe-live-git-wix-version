// Main page Velo code (e.g., Home page)

import wixWindow from 'wix-window';

$w.onReady(function () {
    // Set up the button to open the lightbox
    $w('#openEstimatorBtn').onClick(() => {
        wixWindow.openLightbox('EstimatorLightbox');
    });
});