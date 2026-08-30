(function () {
    const seo = window.GOTX_SEO || {};
    const gsc = (seo.gsc || '').trim();
    const bing = (seo.bing || '').trim();
    const googleTag = (seo.googleTag || '').trim();
    const ga4 = (seo.ga4 || '').trim();
    const clarity = (seo.clarity || '').trim();
    const indexNowKey = (seo.indexNowKey || '').trim();
    // Prefer GT- container when set; G- is a destination of that tag.
    const primaryTag = googleTag || ga4;

    function setMeta(name, content) {
        if (!content) return;
        let tag = document.querySelector('meta[name="' + name + '"]');
        if (!tag) {
            tag = document.createElement('meta');
            tag.setAttribute('name', name);
            document.head.appendChild(tag);
        }
        tag.setAttribute('content', content);
    }

    setMeta('google-site-verification', gsc);
    setMeta('msvalidate.01', bing);

    const isLocal = /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);
    if (indexNowKey && !isLocal && !sessionStorage.getItem('gotx-indexnow')) {
        sessionStorage.setItem('gotx-indexnow', '1');
        const ping = 'https://www.bing.com/indexnow?url='
            + encodeURIComponent(window.location.href.split('#')[0])
            + '&key=' + encodeURIComponent(indexNowKey);
        fetch(ping, { method: 'GET', mode: 'no-cors', keepalive: true }).catch(function () {});
    }

    if (!primaryTag && !clarity) return;

    const STORAGE_KEY = 'gotx-analytics-consent';
    const consent = localStorage.getItem(STORAGE_KEY);

    function loadGoogleTag() {
        if (!primaryTag || window.__gotxGaLoaded) return;
        window.__gotxGaLoaded = true;
        window.dataLayer = window.dataLayer || [];
        function gtag() { dataLayer.push(arguments); }
        window.gtag = gtag;
        gtag('consent', 'default', {
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            analytics_storage: 'denied'
        });
        gtag('consent', 'update', { analytics_storage: 'granted' });
        gtag('js', new Date());
        // Only configure the GT- tag when present — G-PBKGR507D9 is already its destination.
        gtag('config', primaryTag);
        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(primaryTag);
        document.head.appendChild(script);
    }

    function loadClarity() {
        if (!clarity || window.__gotxClarityLoaded) return;
        window.__gotxClarityLoaded = true;
        (function (c, l, a, r, i, t, y) {
            c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
            t = l.createElement(r);
            t.async = 1;
            t.src = 'https://www.clarity.ms/tag/' + i;
            y = l.getElementsByTagName(r)[0];
            y.parentNode.insertBefore(t, y);
        })(window, document, 'clarity', 'script', clarity);
    }

    function enableAnalytics() {
        loadGoogleTag();
        loadClarity();
    }

    if (consent === 'granted') {
        enableAnalytics();
        return;
    }
    if (consent === 'denied') return;

    const bar = document.createElement('div');
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', 'Cookie consent');
    bar.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:9999;background:#1A1A1A;color:#F0F0F0;border-top:1px solid #333;padding:1rem 1.5rem;font-family:Inter,sans-serif;font-size:0.85rem;';
    bar.innerHTML = '<div style="max-width:1200px;margin:0 auto;display:flex;gap:1rem;flex-wrap:wrap;align-items:center;justify-content:space-between;">'
        + '<p style="margin:0;line-height:1.5;color:#B0B0B0;">We use optional Google Analytics cookies only after you accept. <a href="/privacy.html" style="color:#4A9EFF;">Privacy</a> · <a href="/cookies.html" style="color:#4A9EFF;">Cookies</a></p>'
        + '<div style="display:flex;gap:0.5rem;">'
        + '<button type="button" data-consent="denied" style="background:transparent;color:#F0F0F0;border:1px solid #505050;padding:0.5rem 0.9rem;cursor:pointer;font-size:0.75rem;">Essential only</button>'
        + '<button type="button" data-consent="granted" style="background:#4A9EFF;color:#1A1A1A;border:1px solid #4A9EFF;padding:0.5rem 0.9rem;cursor:pointer;font-size:0.75rem;font-weight:600;">Accept analytics</button>'
        + '</div></div>';

    function mountBanner() {
        document.body.appendChild(bar);
    }
    if (document.body) mountBanner();
    else document.addEventListener('DOMContentLoaded', mountBanner);

    bar.addEventListener('click', function (event) {
        const choice = event.target && event.target.getAttribute('data-consent');
        if (!choice) return;
        localStorage.setItem(STORAGE_KEY, choice);
        bar.remove();
        if (choice === 'granted') enableAnalytics();
    });
})();
