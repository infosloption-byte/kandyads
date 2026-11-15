# Kandy Ads homepage: brand logo references

The homepage partner grid now shows image marks rather than rendering every brand as plain text. All images use `object-fit: contain`, and any unavailable remote image falls back to its brand name.

| Brand | Public image source | Notes |
| --- | --- | --- |
| DSI | https://static-01.daraz.lk/other/shop/df311e89ca0402775322d3387445bba0.jpeg | DSI Sri Lanka logo shown on its Daraz shop. |
| NinetyNine | https://www.google.com/s2/favicons?domain=ninetynine.lk&sz=128 | Website favicon only: **unconfirmed** that the portfolio's `NinetyNine` refers to ninetynine.lk; replace once exact client artwork is supplied. |
| KFC | https://upload.wikimedia.org/wikipedia/commons/5/5d/KFC_2026_%28wordmark%29.svg | Wikimedia Commons 2026 official wordmark. |
| Pepsi | https://upload.wikimedia.org/wikipedia/commons/6/68/Pepsi_2023.svg | Wikimedia Commons modern Pepsi logo. |
| Puma | https://upload.wikimedia.org/wikipedia/commons/a/ae/Puma-logo-%28text%29.svg | Wikimedia Commons PUMA wordmark. |
| Fancy Point | https://www.mybizsl.lk/assets/imgs/clients/fancypoint.jpg | FancyPoint (Pvt) Ltd identity as pictured in a Sri Lankan business directory. |
| Arpico | https://ten.lk/media/809/arpico.webp?v=2 | Blue Arpico wordmark as pictured in a Sri Lankan directory. |
| Ceylon Brands | https://www.google.com/s2/favicons?domain=ceylonbrands.lk&sz=128 | Website favicon only: **unconfirmed** that the portfolio name refers to ceylonbrands.lk; replace with verified original artwork. |

**Operational note:** Image URLs are remote; if a host changes or blocks requests, the site displays a readable name rather than a broken image. Long-term best practice: obtain logo files/permission from the client and store approved SVG/PNG files under `frontend/public/brands/`. Displaying a brand logo does not establish endorsement or an agency-client relationship by itself.
