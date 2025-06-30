$w.onReady(function () {
  const iframeUrl = "https://storage.googleapis.com/image-analysis-library/gfe-homepage-ai.html";
  $w("#gfeHomePageIframe").src = iframeUrl;

  $w("#gfeHomePageIframe").onViewportEnter(() => {
    console.log("HtmlComponent has entered the viewport.");
  });
});