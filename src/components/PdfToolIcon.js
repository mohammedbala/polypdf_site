import React from "react";
import drawings from "../toolkit/icons.json";

// Original, operation-specific line drawings. Labels belong to the adjacent link/heading.
export default function PdfToolIcon({ id, size = 30, className = "" }) {
  if (!drawings[id]) return null;
  return <svg className={`pdf-custom-icon ${className}`} data-tool-icon={id} width={size} height={size}
    viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.65"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d={drawings[id]} />
  </svg>;
}
