import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

const SCRIPT_ID = 'google-translate-script';
const SCRIPT_URL = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
const CONTAINER_ID = 'google_translate_element';

const RELOAD_DELAY_MS = 120;

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

  useEffect(() => {
    scheduleApplySavedLanguage();
  }, [location.pathname]);

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
      if (typeof window !== 'undefined' && window.top) {
        const url = window.top.location.origin + window.top.location.pathname + window.top.location.search;
        window.top.location.href = url;
      } else {
        window.location.reload();
      }
    } catch (_) {
      window.location.reload();
    }
  };

  const handleChange = (e) => {
    const value = e.target.value;
    e.target.blur();
    const normalized = value ? value.replace(/\/+$/, '') : '';
    if (isApplying) return;
    setIsApplying(true);
    try {
      if (!normalized) {
        document.cookie = 'googtrans=;path=/;max-age=0';
        if (typeof localStorage !== 'undefined') localStorage.removeItem('googtrans');
        setTimeout(forceReload, RELOAD_DELAY_MS);
        return;
      }
      document.cookie = `googtrans=${normalized};path=/;max-age=31536000`;
      if (typeof localStorage !== 'undefined') localStorage.setItem('googtrans', normalized);
      setTimeout(forceReload, RELOAD_DELAY_MS);
    } catch (_) {
      if (mounted.current) setIsApplying(false);
      setTimeout(forceReload, RELOAD_DELAY_MS);
    }
  };

  const value = displayValue !== undefined && displayValue !== null ? displayValue : getCookieValue();

  return (
    <div className="notranslate inline-flex">
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
        className="notranslate min-h-[36px] max-w-[140px] rounded-lg border border-[#333D4D] bg-[#1F2732] px-3 py-1.5 pr-8 text-sm text-white cursor-pointer appearance-none bg-no-repeat bg-[length:18px] bg-[right_6px_center] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-70"
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")",
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
