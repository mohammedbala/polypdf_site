import React, { createContext, useContext } from "react";
import locales from "./locales.json";
import catalog from "./catalog.json";
import marketingLocales from "../lib/locales.json";
import { localizedRoutes } from "../lib/internationalRoutes";

export const toolkitLocales = locales;
export const toolkitRoutes = ["/tools", "/tools/automation", ...catalog.map(t => `/tools/${t.id}`)];
export const normalize = value => value.replace(/\s+/g, " ").trim();
export const sourceRoute = pathname => pathname.replace(/^\/(?:[a-z]{2}(?:-[a-z]{2})?)\/(?=tools(?:\/|$))/, "/").replace(/\/+$/, "") || "/";
export const toolkitLocale = pathname => locales.find(l => pathname.startsWith(`/${l.id}/tools`)) || null;
const LanguageContext = createContext(null);
export const ToolkitLanguageProvider = LanguageContext.Provider;
export const useToolkitLanguage = () => useContext(LanguageContext);
const patterns = new WeakMap();
const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Copy is translated; file bytes, form identifiers, typed values and MCP protocol keys are not.
export function translateText(raw, language) {
  if (!language || typeof raw !== "string" || !raw.trim()) return raw;
  const key = normalize(raw);
  language.collect?.add(key);
  let translated = language.strings?.[key];
  if (translated === undefined && language.strings) {
    if (!patterns.has(language.strings)) patterns.set(language.strings, Object.entries(language.strings)
      .filter(([source]) => /\{\d+\}/.test(source))
      .sort(([a], [b]) => b.length - a.length)
      .map(([source, target]) => ({ target, keys: [...source.matchAll(/\{(\d+)\}/g)].map(m => m[1]),
        regex: new RegExp("^" + source.split(/\{\d+\}/).map(escape).join("([\\s\\S]*?)") + "$") })));
    for (const pattern of patterns.get(language.strings)) {
      const match = key.match(pattern.regex);
      if (match) { translated = pattern.target.replace(/\{(\d+)\}/g, (token, id) => match[pattern.keys.indexOf(id) + 1] ?? token); break; }
    }
  }
  if (translated === undefined) { language.missing?.add(key); return raw; }
  return (/^\s/.test(raw) ? " " : "") + translated + (/\s$/.test(raw) ? " " : "");
}

export function localizedHref(raw, language) {
  if (!language?.locale || typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//")) return raw;
  const url = new URL(raw, "https://www.polypdf.com");
  const route = url.pathname.replace(/\/+$/, "") || "/";
  const supported = toolkitRoutes.includes(route) || (marketingLocales.some(l => l.id === language.locale.id) && localizedRoutes.includes(route));
  if (supported) return `/${language.locale.id}${route === "/" ? "/" : route + "/"}${url.search}${url.hash}`;
  if (route === "/buy") {
    url.searchParams.set("source", `intl_${language.locale.id}_${url.searchParams.get("source") || "browser_tools"}`.slice(0, 80));
    return `${url.pathname}${url.search}${url.hash}`;
  }
  return raw;
}

export function localizeView(tree, language) {
  if (!language) return tree;
  const visit = node => {
    if (typeof node === "string") return translateText(node, language);
    if (!React.isValidElement(node)) return node;
    if (node.props.translate === "no" || ["svg", "code", "pre"].includes(node.type)) return node;
    const props = {};
    for (const attr of ["aria-label", "title", "alt", "placeholder"]) if (typeof node.props[attr] === "string") props[attr] = translateText(node.props[attr], language);
    for (const attr of ["to", "href"]) if (typeof node.props[attr] === "string") props[attr] = localizedHref(node.props[attr], language);
    const children = React.Children.toArray(node.props.children);
    const translatedChildren = [];
    for (let i = 0; i < children.length; i++) {
      if (typeof children[i] !== "string" && typeof children[i] !== "number") { translatedChildren.push(visit(children[i])); continue; }
      const fragments = [String(children[i])];
      while (i + 1 < children.length && ["string", "number"].includes(typeof children[i + 1])) fragments.push(String(children[++i]));
      const joined = fragments.join("");
      const translated = translateText(joined, language);
      // Prefer complete sentences; newly composed result quantities use their known fragments.
      if (translated !== joined || Object.prototype.hasOwnProperty.call(language.strings || {}, normalize(joined))) translatedChildren.push(translated);
      else translatedChildren.push(...fragments.map(fragment => translateText(fragment, language)));
    }
    return React.cloneElement(node, props, ...translatedChildren);
  };
  return visit(tree);
}
