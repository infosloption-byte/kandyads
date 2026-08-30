/*
 * Official Kandy Ads contact details for the standalone quote entry point.
 * The main React pages use the same values from site-data.js directly.
 * This small bridge keeps the separately mounted quote page synchronized.
 */
(function applyOfficialContactDetails(){
  const details = {
    phones: ['0777 483 502', '0814 253 566'],
    phoneHrefs: ['tel:+94777483502', 'tel:+94814253566'],
    whatsapp: '94777483502',
    emails: ['kandyads342@gmail.com', 'info@kandyads.lk'],
    addresses: [
      '155/E, Wathurakumbura Road, Kiribathkumbura, 20450',
      'Warehouse - 150/B, Kahatagoda Road, Pilimathalawa.'
    ]
  };

  function updateQuoteFooter(){
    document.querySelectorAll('.quote-footer').forEach((footer) => {
      footer.querySelectorAll('a[href^="tel:"]').forEach((link, index) => {
        link.href = details.phoneHrefs[index] || details.phoneHrefs[0];
        const text = index === 0 ? details.phones[0] : details.phones[1];
        const walker = document.createTreeWalker(link, NodeFilter.SHOW_TEXT);
        const node = walker.nextNode();
        if(node) node.nodeValue = text;
      });

      const emailLinks = Array.from(footer.querySelectorAll('a[href^="mailto:"]'));
      emailLinks.forEach((link, index) => {
        link.href = `mailto:${details.emails[index] || details.emails[0]}`;
        const text = details.emails[index] || details.emails[0];
        const walker = document.createTreeWalker(link, NodeFilter.SHOW_TEXT);
        const node = walker.nextNode();
        if(node) node.nodeValue = text;
      });

      const startColumn = Array.from(footer.querySelectorAll('.quote-footer-col')).find((column) => /START A PROJECT/i.test(column.textContent || ''));
      if(startColumn){
        const addressSpans = startColumn.querySelectorAll('span');
        if(addressSpans[0]){
          addressSpans[0].innerHTML = `${details.addresses[0]}<br/>${details.addresses[1]}`;
        }
      }
    });
  }

  function updateFallbackText(){
    document.querySelectorAll('.quote-footer a[href="https://wa.me/94770000000"]').forEach((link) => {
      link.href = `https://wa.me/${details.whatsapp}`;
    });
    document.querySelectorAll('.quote-footer a[href^="https://wa.me/"]').forEach((link) => {
      link.href = `https://wa.me/${details.whatsapp}`;
    });
  }

  function update(){
    updateQuoteFooter();
    updateFallbackText();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', update, {once:true});
  } else {
    update();
  }

  const observer = new MutationObserver(update);
  observer.observe(document.documentElement, {childList:true, subtree:true});
})();
