/* Keep Contact and Get a Quote as distinct destinations. */
(function wireKandyAdsLinks() {
  const QUOTE = '/quote';
  const CONTACT = '/contact';

  function setHref(link, href) {
    if (link) link.setAttribute('href', href);
  }

  function forceNavigation(link, href) {
    if (!link || link.dataset.kandyRouteWired === href) return;
    link.dataset.kandyRouteWired = href;
    link.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      window.location.assign(href);
    }, true);
  }

  function update() {
    const nav = document.querySelector('.nav nav');
    if (nav) {
      const links = Array.from(nav.querySelectorAll('a'));
      const quote = links.find((a) => /get a quote/i.test(a.textContent || ''));
      if (quote) {
        setHref(quote, QUOTE);
        forceNavigation(quote, QUOTE);
      }

      const contact = links.find((a) => /^contact$/i.test((a.textContent || '').trim()));
      if (!contact) {
        const anchor = document.createElement('a');
        anchor.href = CONTACT;
        anchor.textContent = 'Contact';
        anchor.className = 'nav-contact';
        anchor.dataset.kandyRouteWired = CONTACT;
        anchor.addEventListener('click', (event) => {
          event.preventDefault();
          window.location.assign(CONTACT);
        });
        if (quote) nav.insertBefore(anchor, quote);
        else nav.appendChild(anchor);
      } else {
        setHref(contact, CONTACT);
        forceNavigation(contact, CONTACT);
      }
    }

    document.querySelectorAll('footer a').forEach((link) => {
      const text = (link.textContent || '').trim();
      if (/^(get a quote|request a quote)$/i.test(text)) {
        setHref(link, QUOTE);
        forceNavigation(link, QUOTE);
      } else if (/^contact$/i.test(text)) {
        setHref(link, CONTACT);
        forceNavigation(link, CONTACT);
      }
    });

    document.querySelectorAll('a').forEach((link) => {
      const text = (link.textContent || '').trim();
      if (/^request a quote$/i.test(text)) {
        setHref(link, QUOTE);
        forceNavigation(link, QUOTE);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', update, { once: true });
  } else {
    update();
  }

  const observer = new MutationObserver(update);
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
