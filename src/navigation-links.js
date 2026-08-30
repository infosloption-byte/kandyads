/*
 * Small progressive-enhancement layer for the shared navigation/footer.
 * Keeps the existing React pages intact while ensuring Contact and Get a Quote
 * are distinct destinations even on the legacy route shell.
 */
(function wireKandyAdsLinks() {
  const QUOTE = '/quote';
  const CONTACT = '/contact';

  function setHref(link, href) {
    if (link && link.getAttribute('href') !== href) link.setAttribute('href', href);
  }

  function update() {
    const nav = document.querySelector('.nav nav');
    if (nav) {
      const links = Array.from(nav.querySelectorAll('a'));
      const quote = links.find((a) => /get a quote/i.test(a.textContent || ''));
      if (quote) setHref(quote, QUOTE);

      const contact = links.find((a) => /^contact$/i.test((a.textContent || '').trim()));
      if (!contact) {
        const anchor = document.createElement('a');
        anchor.href = CONTACT;
        anchor.textContent = 'Contact';
        anchor.className = 'nav-contact';
        if (quote) nav.insertBefore(anchor, quote);
        else nav.appendChild(anchor);
      } else {
        setHref(contact, CONTACT);
      }
    }

    document.querySelectorAll('footer a').forEach((link) => {
      const text = (link.textContent || '').trim();
      if (/^(get a quote|request a quote)$/i.test(text)) setHref(link, QUOTE);
      if (/^contact$/i.test(text)) setHref(link, CONTACT);
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
