import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

const SCRIPT_ID = 'google-translate-script';
const SCRIPT_URL = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
const CONTAINER_ID = 'google_translate_element';

/** Delay before reload so cookie/localStorage are committed (fixes "sometimes not translated") */
const RELOAD_DELAY_MS = 120;
/** Longer delay on mobile so storage is committed before reload */
const RELOAD_DELAY_MOBILE_MS = 280;

const LANGUAGES = [
  { value: '', label: 'English', code: 'en' },
  { value: '/en/hi', label: 'हिन्दी', code: 'hi' },
  { value: '/en/mr', label: 'मराठी', code: 'mr' },
  { value: '/en/gu', label: 'ગુજરાતી', code: 'gu' },
  { value: '/en/ta', label: 'தமிழ்', code: 'ta' },
  { value: '/en/te', label: 'తెలుగు', code: 'te' },
  { value: '/en/bn', label: 'বাংলা', code: 'bn' },
  { value: '/en/kn', label: 'ಕನ್ನಡ', code: 'kn' },
  { value: '/en/ml', label: 'മലയാളം', code: 'ml' },
  { value: '/en/ar', label: 'العربية', code: 'ar' },
];

const getInitDone = () => window.__googleTranslateWidgetInit === true;
const setInitDone = () => { window.__googleTranslateWidgetInit = true; };

function getCookieValue() {
  if (typeof document === 'undefined') return '';
  const m = document.cookie.match(/googtrans=([^;]+)/);
  const val = m && m[1] ? m[1].trim().replace(/\/+$/, '') : '';
  return val;
}

function getTargetLangFromCookie() {
  const val = getCookieValue();
  if (!val) return null;
  const parts = val.split('/').filter(Boolean);
  return parts.length >= 2 ? parts[1] : parts[0] || null;
}

function getWidgetSelect() {
  return document.querySelector(`#${CONTAINER_ID} select, #${CONTAINER_ID} .goog-te-combo`);
}

/** Google cannot fetch localhost; redirect would show "Can't translate this page". */
function isLocalhost() {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1' || h === '';
}

/**
 * Trigger the hidden Google widget to translate in-place. Returns true if widget was used.
 */
function triggerWidgetTranslation(ourValue) {
  const widgetSelect = getWidgetSelect();
  if (!widgetSelect || !widgetSelect.options || !widgetSelect.options.length) return false;
  const opts = Array.from(widgetSelect.options);
  let valueToSet = null;
  if (!ourValue) {
    const enOpt = opts.find((o) => o.value === '' || o.value === 'en' || String(o.value).endsWith('/en'));
    valueToSet = enOpt ? enOpt.value : (opts[0]?.value ?? '');
  } else {
    const code = ourValue.startsWith('/en/') ? ourValue.split('/')[2] : ourValue;
    const match = opts.find(
      (o) =>
        o.value === ourValue ||
        o.value === code ||
        String(o.value).endsWith(`/${code}`)
    );
    valueToSet = match ? match.value : ourValue;
  }
  if (valueToSet === null || valueToSet === undefined) return false;
  try {
    widgetSelect.value = valueToSet;
    widgetSelect.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  } catch (_) {
    return false;
  }
}

function applySavedLanguage() {
  const target = getTargetLangFromCookie();
  if (!target) return;
  const select = getWidgetSelect();
  if (!select || !select.options || !select.options.length) return;
  const opts = Array.from(select.options);
  const match = opts.find(
    (o) => o.value === target || o.value === `/en/${target}` || String(o.value).endsWith(`/${target}`)
  );
  const valueToSet = match ? match.value : target;
  if (valueToSet == null) return;
  try {
    select.value = valueToSet;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  } catch (_) {}
}

/** Run applySavedLanguage at intervals so translation applies even if widget loads slowly */
function scheduleApplySavedLanguage() {
  [300, 800, 1500, 2500].forEach((ms) => setTimeout(applySavedLanguage, ms));
}

function doInit() {
  const el = document.getElementById(CONTAINER_ID);
  if (!el || getInitDone() || !window.google?.translate?.TranslateElement) return false;
  try {
    new window.google.translate.TranslateElement(
      {
        pageLanguage: 'en',
        includedLanguages: 'en,hi,mr,gu,ta,te,bn,kn,ml,ar',
        layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
        autoDisplay: false,
      },
      CONTAINER_ID
    );
    setInitDone();
    setTimeout(() => {
      const select = getWidgetSelect();
      if (select && typeof localStorage !== 'undefined') {
        select.addEventListener('change', () => {
          try {
            const v = select.value;
            if (v != null && v !== '') {
              const cookieVal = String(v).indexOf('/') !== -1 ? v : `/en/${v}`;
              document.cookie = `googtrans=${cookieVal};path=/;max-age=31536000`;
              localStorage.setItem('googtrans', cookieVal);
            }
          } catch (_) {}
        });
      }
      applySavedLanguage();
      scheduleApplySavedLanguage();
    }, 200);
    return true;
  } catch (e) {
    console.warn('Google Translate init failed:', e);
    return false;
  }
}

/**
 * Language switcher: uses native dropdown; drives Google widget for in-place translation when
 * available (smooth, no redirect). Falls back to redirect only when widget is not ready.
 */
const GoogleTranslate = () => {
  const location = useLocation();
  const [displayValue, setDisplayValue] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    try {
      const saved = typeof localStorage !== 'undefined' && localStorage.getItem('googtrans');
      if (saved) document.cookie = `googtrans=${saved};path=/;max-age=31536000`;
      setDisplayValue(getCookieValue());
    } catch (_) {}

    const runInit = () => {
      requestAnimationFrame(() => {
        if (doInit() && mounted.current) setDisplayValue(getCookieValue());
      });
    };

    if (document.getElementById(SCRIPT_ID)) {
      if (window.google?.translate?.TranslateElement) runInit();
      return () => { mounted.current = false; };
    }

    window.googleTranslateElementInit = () => runInit();

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_URL;
    script.async = true;
    script.onerror = () => console.warn('Google Translate script failed to load');
    script.onload = () => {
      if (window.google?.translate?.TranslateElement) runInit();
      else {
        let attempts = 0;
        const id = setInterval(() => {
          attempts++;
          if (window.google?.translate?.TranslateElement) {
            clearInterval(id);
            runInit();
          } else if (attempts > 100) clearInterval(id);
        }, 50);
      }
    };
    document.head.appendChild(script);
    return () => { mounted.current = false; };
  }, []);

  /* Re-apply saved language when route changes (SPA) so new page content gets translated */
  useEffect(() => {
    scheduleApplySavedLanguage();
  }, [location.pathname]);

  /* Re-apply when page is restored from bfcache so translation isn’t lost */
  useEffect(() => {
    const onPageShow = (ev) => {
      if (ev.persisted) {
        try {
          const saved = typeof localStorage !== 'undefined' && localStorage.getItem('googtrans');
          if (saved) document.cookie = `googtrans=${saved};path=/;max-age=31536000`;
          scheduleApplySavedLanguage();
        } catch (_) {}
      }
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  const forceReload = () => {
    try {
      if (typeof window === 'undefined') return;
      // Same window (desktop + mobile): full reload so translation applies everywhere
      if (window.self === window.top) {
        const url = window.location.origin + window.location.pathname + window.location.search;
        // Assigning href forces a full navigation/reload (more reliable on mobile than reload() in some PWAs/WebViews)
        window.location.href = url;
        return;
      }
      // If inside iframe, reload top so whole page updates
      const url = window.top.location.origin + window.top.location.pathname + window.top.location.search;
      window.top.location.href = url;
    } catch (_) {
      window.location.reload();
    }
  };

  const handleChange = (e) => {
    const select = e.target;
    const value = select.value;
    select.blur();

    const normalized = value ? value.replace(/\/+$/, '') : '';
    if (isApplying) return;
    setIsApplying(true);

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const delay = isMobile ? RELOAD_DELAY_MOBILE_MS : RELOAD_DELAY_MS;

    try {
      if (!normalized) {
        document.cookie = 'googtrans=;path=/;max-age=0';
        if (typeof localStorage !== 'undefined') localStorage.removeItem('googtrans');
        setTimeout(forceReload, delay);
        return;
      }

      document.cookie = `googtrans=${normalized};path=/;max-age=31536000`;
      if (typeof localStorage !== 'undefined') localStorage.setItem('googtrans', normalized);
      // Delay so cookie/localStorage are committed before reload (longer on mobile)
      setTimeout(forceReload, delay);
    } catch (_) {
      if (mounted.current) setIsApplying(false);
      setTimeout(forceReload, delay);
    }
  };

  const value = displayValue !== undefined && displayValue !== null ? displayValue : getCookieValue();

  return (
    <div className="google-translate-wrapper notranslate">
      <div
        id={CONTAINER_ID}
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          overflow: 'hidden',
          visibility: 'hidden',
          pointerEvents: 'none',
          left: -9999,
        }}
        aria-hidden="true"
      />
      <select
        aria-label="Select language"
        value={value}
        onChange={handleChange}
        disabled={isApplying}
        className="google-translate-select notranslate"
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")",
        }}
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.value}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default GoogleTranslate;
