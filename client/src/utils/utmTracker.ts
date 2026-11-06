/**
 * UTM Parameter Tracker & Conversion Event Dispatcher
 * Section 14: SEO, Digital Marketing & Website Conversion
 */

export interface UtmParams {
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
  referrer?: string | null;
}

const STORAGE_KEY = 'edunexa_utm_tags';

/**
 * Captures UTM parameters from URL and saves to sessionStorage.
 * Safe to call on every page mount or route change.
 */
export function captureAndStoreUtmParams(): UtmParams {
  if (typeof window === 'undefined') return {};

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const source = urlParams.get('utm_source');
    const medium = urlParams.get('utm_medium');
    const campaign = urlParams.get('utm_campaign');
    const term = urlParams.get('utm_term');
    const content = urlParams.get('utm_content');

    // Retrieve existing params
    const existingRaw = sessionStorage.getItem(STORAGE_KEY);
    const existing: UtmParams = existingRaw ? JSON.parse(existingRaw) : {};

    // Update if new UTM parameters are present
    const updated: UtmParams = {
      utmSource: source || existing.utmSource || (document.referrer ? new URL(document.referrer, window.location.origin).hostname : 'Direct Organic'),
      utmMedium: medium || existing.utmMedium || 'organic',
      utmCampaign: campaign || existing.utmCampaign || 'general',
      utmTerm: term || existing.utmTerm || null,
      utmContent: content || existing.utmContent || null,
      referrer: document.referrer || existing.referrer || null,
    };

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('Failed to process UTM tags', err);
    return {};
  }
}

/**
 * Returns currently stored UTM parameters for lead and enquiry submissions.
 */
export function getStoredUtmParams(): UtmParams {
  if (typeof window === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : captureAndStoreUtmParams();
  } catch {
    return {};
  }
}

/**
 * Dispatches an event to Google Analytics 4 (window.gtag or dataLayer) if initialized.
 */
export function trackGa4Event(eventName: string, params: Record<string, any> = {}) {
  if (typeof window === 'undefined') return;
  try {
    const win = window as any;
    if (typeof win.gtag === 'function') {
      win.gtag('event', eventName, params);
    } else if (Array.isArray(win.dataLayer)) {
      win.dataLayer.push({ event: eventName, ...params });
    }
  } catch (err) {
    console.debug('GA4 event dispatch failed', err);
  }
}

