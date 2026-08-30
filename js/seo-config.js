/**
 * Single place for gotx.uk search / analytics IDs (GOTXConnectWeb / Cloudflare Pages).
 * Empty strings load nothing.
 *
 *   1. gsc       — Google Search Console HTML-tag content=
 *   2. googleTag — Google tag container (GT-…). Primary on-page install.
 *   3. ga4       — GA4 destination (G-…). Linked in Google Tag admin; do not
 *                  also gtag('config') this when googleTag is set (avoids duplicates).
 *   4. bing      — Bing Webmaster Tools msvalidate.01
 *   5. clarity   — Microsoft Clarity project ID
 */
window.GOTX_SEO = {
    gsc: '',
    googleTag: 'GT-WRFXMCTV',
    ga4: 'G-PBKGR507D9',
    bing: '',
    clarity: '',
    indexNowKey: '8f3c1a9e6b2d4f70a1c5e8d3b7f04629'
};
