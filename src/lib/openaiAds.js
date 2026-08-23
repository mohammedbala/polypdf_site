const OPENAI_ADS_SDK_URL = 'https://bzrcdn.openai.com/sdk/oaiq.min.js';

const configuredPixelID = () => String(
  process.env.REACT_APP_OPENAI_ADS_PIXEL_ID || ''
).trim();

const validPixelID = (pixelID) => /^[A-Za-z0-9_-]{1,128}$/.test(pixelID);

export const initializeOpenAIAdsMeasurement = ({
  pixelID = configuredPixelID(),
  debug = process.env.NODE_ENV !== 'production'
} = {}) => {
  if (typeof window === 'undefined' || typeof document === 'undefined' || !validPixelID(pixelID)) {
    return false;
  }

  if (typeof window.oaiq !== 'function') {
    const queue = function queueOpenAIAdsCommand() {
      queue.q.push(arguments);
    };
    queue.q = [];
    window.oaiq = queue;

    const script = document.createElement('script');
    script.async = true;
    script.src = OPENAI_ADS_SDK_URL;
    const firstScript = document.getElementsByTagName('script')[0];
    if (firstScript?.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    } else {
      document.head.appendChild(script);
    }
  }

  window.oaiq('init', {
    pixelId: pixelID,
    ...(debug ? { debug: true } : {})
  });
  return true;
};

export { OPENAI_ADS_SDK_URL };
