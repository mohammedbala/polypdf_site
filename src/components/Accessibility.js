import React from 'react';
import LegalPage from './LegalPage';

export default function Accessibility() {
  return <LegalPage title="Accessibility" subtitle="Help using the PolyPDF website">
    <section className="legal-section"><h2>Our approach</h2>
      <p>Euclidean Software LLC is working toward the Web Content Accessibility Guidelines (WCAG) 2.2 Level AA for polypdf.com. Accessibility is an ongoing process. This statement is not a claim that every page, the desktop app, or a third-party service is fully conformant or independently certified.</p>
    </section>
    <section className="legal-section"><h2>Using the website</h2><ul className="section-content">
      <li>Use Tab and Shift+Tab to move between links and controls, and Enter or Space to activate the appropriate control. A Skip to content link appears when focused.</li>
      <li>Cookie settings and the purchase review use keyboard-accessible dialogs. Escape closes a dialog without accepting optional cookies or terms.</li>
      <li>Page headings, image descriptions, labelled form fields and announced form messages support assistive technology. Browser zoom and narrow-screen layouts are supported.</li>
      <li>The site respects reduced-motion preferences. Use the Pause animations control in the footer to stop optional product motion while you browse.</li>
      <li>Downloads and policy pages do not require accepting optional tracking. Policy text is available even with JavaScript disabled; interactive account and checkout controls need JavaScript.</li>
    </ul></section>
    <section className="legal-section"><h2>Scope and known limitations</h2>
      <p>Detailed product screenshots contain small interface text and may need enlargement. The surrounding guides describe the workflow, but image descriptions do not transcribe every control shown. Some tables scroll horizontally on small screens. Product demonstrations are silent visual illustrations with nearby descriptions.</p>
      <p>Stripe checkout, external resources, the desktop application, and PDFs or files supplied by other people are separate interfaces. We cannot guarantee their accessibility. Automated checks help find some problems; they do not replace assistive-technology testing or feedback from people with disabilities.</p>
    </section>
    <section className="legal-section"><h2>Report a barrier or request help</h2>
      <p>Email <a href="mailto:support@polypdf.com?subject=Website%20accessibility%20help">support@polypdf.com</a> with “Website accessibility” in the subject. Include the page address, what you were trying to do, and your preferred way to receive help. Browser and assistive-technology details can help us reproduce an issue, but you do not need to disclose a disability or medical information.</p>
      <p>If you cannot use a download, read information, or complete a purchase, tell us what you need so we can work with you on an accessible alternative. Do not send payment-card details or passwords by email. We review accessibility reports and use them to prioritise improvements.</p>
    </section>
  </LegalPage>;
}
