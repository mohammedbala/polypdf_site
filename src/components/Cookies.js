import React from 'react';
import LegalPage from './LegalPage';
import { openCookieSettings } from '../lib/consent';

const rows = [
  ['polypdf.cookie-consent.v1', 'Necessary · local storage', 'Remembers analytics and advertising choices, notice version and choice time.', '180 days; expiry checked on the next visit.'],
  ['polypdf_account', 'Necessary · first-party cookie', 'Keeps you signed in after you request and confirm an account link. HttpOnly and secure on HTTPS.', 'Up to 30 days, or sign-out.'],
  ['_ga, _ga_*', 'Optional analytics · Google cookies', 'Distinguish visits for Google Analytics after you allow analytics.', 'Configured for 180 days without automatic renewal.'],
  ['_gcl_*, _gac_*', 'Optional advertising · Google cookies', 'Measure advertising results after you allow advertising measurement. Names vary with the Google service.', 'Google controls these expiries; common conversion cookies last 90 days.'],
  ['polypdf.attribution.v1', 'Optional advertising · local storage', 'Stores source and UTM campaign codes so a purchase can be attributed.', '30 days; checked on use.'],
  ['polypdf.ga4.purchase.* / polypdf.ads.purchase.*', 'Optional analytics / advertising · local storage', 'Remembers an order identifier and send time to avoid counting the same verified payment twice for the chosen provider.', '30-day validity; removed on the next check or when the category is rejected.']
];
export default function Cookies() {
  return <LegalPage title="Cookie Policy" subtitle="What this website stores in your browser">
    <section className="legal-section"><h2>You control optional tracking</h2>
      <p>Cookies are small browser records. Local storage is a related way to remember information on your device. We keep optional analytics and advertising measurement off until you choose to enable the relevant category. Continuing to browse, downloading, buying, or closing settings does not count as consent.</p>
      <button type="button" className="cookie-settings-button" onClick={openCookieSettings}>Open cookie settings / Do not sell or share</button>
      <p>Rejecting optional cookies leaves downloads, purchases and account access available. Necessary account and payment functions run only as needed for the service you request. Google tags are not loaded while both optional categories are off; we do not send Google consent-mode measurement pings in that state.</p>
    </section>
    <section className="legal-section"><h2>Storage used on polypdf.com</h2>
      <div className="cookie-table-scroll" role="region" aria-label="Cookie and storage inventory" tabIndex={0}><table className="cookie-table">
        <caption>Browser storage, purposes and durations</caption><thead><tr><th scope="col">Name</th><th scope="col">Category and provider</th><th scope="col">Purpose</th><th scope="col">Duration</th></tr></thead><tbody>{rows.map((row) => <tr key={row[0]}>{row.map((cell, i) => i === 0 ? <th scope="row" key={i}>{cell}</th> : <td key={i}>{cell}</td>)}</tr>)}</tbody>
      </table></div>
      <p>Local storage does not delete itself on a timer while the site is closed. The site checks the stated validity periods when it runs. You can delete it immediately in your browser's site-data settings. Browser rules can shorten cookie lifetimes.</p>
    </section>
    <section className="legal-section"><h2>Google and payment services</h2>
      <p>Google Analytics receives visit and browser information only when analytics is enabled. Google Ads receives advertising and verified order information only when advertising measurement is enabled. These categories can be selected separately. We turn off ad personalization and Google signals in our tag configuration. Read <a href="https://policies.google.com/technologies/cookies">Google's cookie information</a> and <a href="https://policies.google.com/privacy">privacy policy</a> for its handling and cookie durations.</p>
      <p>When you choose to proceed to Stripe checkout, Stripe may use cookies and related technology on its own payment pages for the payment, fraud prevention and other purposes it describes. PolyPDF's controls govern this website, not your independent use of Stripe or other external websites. Read <a href="https://stripe.com/legal/cookies-policy">Stripe's cookie policy</a> and the choices offered on its pages.</p>
    </section>
    <section className="legal-section"><h2>Change or withdraw your choice</h2>
      <p>Use Cookie settings in the footer of any page. Reject and accept are equally available; the detailed settings also let you save each category separately. Your choice is remembered for 180 days unless you clear site data. A different notice version or an expired choice requires a new choice before optional tracking resumes.</p>
      <p>When you turn a category off, we clear its accessible first-party cookies and local storage. If a Google tag was already loaded, the page reloads to stop its running code. We cannot clear another domain's cookies or undo information already sent; use your browser's controls and the provider's privacy tools for those records.</p>
      <p>Global Privacy Control and Do Not Track signals keep optional tracking off, even if an older saved choice allowed it. If local storage is blocked, the site still works, but a choice may only last until the page closes or reloads.</p>
    </section>
    <section className="legal-section"><h2>Contact</h2><p>Euclidean Software LLC · <a href="mailto:support@polypdf.com?subject=Cookie%20question">support@polypdf.com</a></p></section>
  </LegalPage>;
}
