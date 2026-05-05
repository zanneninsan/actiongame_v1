export function isLikelySmartphone() {
  const userAgent = navigator.userAgent || "";
  const uaLooksPhone = /Android.*Mobile|iPhone|iPod|Windows Phone|Mobile Safari/i.test(userAgent);
  const coarsePointer = matchMedia("(pointer: coarse)").matches;
  const hasTouch = navigator.maxTouchPoints > 0 || coarsePointer;
  const viewportWidth = Math.round(window.visualViewport?.width ?? window.innerWidth);
  const viewportHeight = Math.round(window.visualViewport?.height ?? window.innerHeight);
  const shortSide = Math.min(viewportWidth, viewportHeight);
  const longSide = Math.max(viewportWidth, viewportHeight);
  const narrowTouchViewport = hasTouch && shortSide <= 700 && longSide <= 1180;
  const portraitPhoneViewport = hasTouch && viewportWidth <= 820 && viewportHeight >= viewportWidth;
  return uaLooksPhone || narrowTouchViewport || portraitPhoneViewport;
}

export function isLandscapeViewport() {
  const width = window.visualViewport?.width ?? window.innerWidth;
  const height = window.visualViewport?.height ?? window.innerHeight;
  return width > height;
}

export function hasFullscreenElement() {
  const fullscreenDocument = document as Document & {
    webkitFullscreenElement?: Element | null;
    msFullscreenElement?: Element | null;
  };
  return Boolean(document.fullscreenElement ?? fullscreenDocument.webkitFullscreenElement ?? fullscreenDocument.msFullscreenElement);
}
