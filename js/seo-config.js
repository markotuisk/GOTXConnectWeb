/**
 * Single place for gotx.uk search / analytics IDs (GOTXConnectWeb / Cloudflare Pages).
 * Empty strings load nothing.
 *
 *   1. gsc     — Google Search Console HTML-tag content=
 *   2. ga4     — Google Analytics 4 Measurement ID (primary on-page install)
 *   3. bing    — Bing Webmaster Tools msvalidate.01
 *   4. clarity — Microsoft Clarity project ID
 *
 * Note: Google Tag admin may also show GT-WRFXMCTV paired with G-PBKGR507D9.
 * Google's published install snippet for this property uses G-PBKGR507D9 only —
 * do not also load GT-WRFXMCTV (duplicate hits).
 */
window.GOTX_SEO = {
    gsc: '',
    ga4: 'G-PBKGR507D9',
    // googleTag: 'GT-WRFXMCTV', // unused; Google's snippet uses G- only — do not load
    bing: '',
    clarity: '',
    indexNowKey: '8f3c1a9e6b2d4f70a1c5e8d3b7f04629'
};
