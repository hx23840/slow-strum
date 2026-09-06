import english from './locales/en.js';

export const supportedLocales = ['en', 'zh-CN'];
export const languageKey = 'slow-strum-language';
export function resolveLocale(requested, saved) {
  return supportedLocales.includes(requested) ? requested : supportedLocales.includes(saved) ? saved : 'en';
}
let savedLanguage;
try { if (typeof window !== 'undefined') savedLanguage = window.localStorage?.getItem(languageKey); } catch {}
export const locale = resolveLocale(globalThis.location ? new URLSearchParams(location.search).get('lang') : null, savedLanguage);

// Chinese source messages are the Chinese catalogue; other locales use the same keys.
export function translate(source, params = {}, language = locale) {
  const key = source.trim();
  const message = language === 'en' ? english[key] ?? key : key;
  const rendered = message.replace(/\{(\w+)\}/g, (match, name) => Object.hasOwn(params, name) ? String(params[name]) : match);
  return source.slice(0, source.length - source.trimStart().length) + rendered + source.slice(source.trimEnd().length);
}
export const t = translate;
const escapeHTML = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
// Translate text and accessible labels in our own trusted render templates, never tag names or URLs.
export function html(markup) {
  const text = value => /\p{Script=Han}/u.test(value) ? escapeHTML(t(value)) : value;
  return markup.replace(/(aria-label|title)="([^"]*)"/g, (_, attr, value) => `${attr}="${text(value)}"`)
    .replace(/(^|>)([^<>]*)(?=<|$)/g, (_, start, value) => start + text(value));
}
export function languageURL(path, language = locale) {
  const url = new URL(path, location.href);
  url.searchParams.set('lang', language);
  return url.pathname + url.search + url.hash;
}
export function installLanguageControl(container, beforeChange = () => {}) {
  const label = document.createElement('label');
  label.className = 'language-control';
  const caption = document.createElement('span');
  caption.textContent = t('语言');
  const select = document.createElement('select');
  select.id = 'language';
  select.setAttribute('aria-label', 'Language / 语言');
  for (const [value, name] of [['en', 'English'], ['zh-CN', '简体中文']]) {
    const option = document.createElement('option');
    option.value = value; option.textContent = name; option.lang = value;
    select.append(option);
  }
  select.value = locale;
  select.onchange = () => {
    if (!supportedLocales.includes(select.value)) return;
    beforeChange();
    try { localStorage.setItem(languageKey, select.value); } catch {}
    location.assign(languageURL(location.href, select.value));
  };
  label.append(caption, select); container.append(label);
}
export function setPageLanguage(study = false) {
  document.documentElement.lang = locale;
  document.title = t(study ? '手部动作小样 · 慢慢弹' : '慢慢弹 · 尤克里里可视化练习室');
  const description = document.querySelector('meta[name="description"]');
  if (description) description.content = t('看清指法，听懂节奏。可交互的尤克里里 3D 入门练习室。');
}
