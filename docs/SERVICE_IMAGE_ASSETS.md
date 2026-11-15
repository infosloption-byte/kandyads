# Generated service image assets

The six service-card pictures are **AI-generated illustrative visuals**, not documented photographs of completed Kandy Ads client work. The real client work and original source PNGs remain in the separate Projects gallery.

| Service | Local file | Subject |
| --- | --- | --- |
| Signage & Signboards | `frontend/src/assets/services/signage.webp` | Illuminated architectural signage |
| Vehicle Branding | `frontend/src/assets/services/vehicle-branding.webp` | Colorful graphics on van and delivery truck |
| Outdoor Advertising | `frontend/src/assets/services/outdoor-advertising.webp` | Premium roadside advertising boards |
| Digital Printing & Displays | `frontend/src/assets/services/printing.webp` | Large-format printing showroom |
| Retail & Commercial Branding | `frontend/src/assets/services/retail-branding.webp` | Coordinated store branding and cladding |
| Exhibitions & Promotional | `frontend/src/assets/services/events.webp` | Exhibition booth and promotional displays |

## Implementation

Images were generated separately, then optimized to ~1120 px wide WebP files. They are committed under `frontend/src/assets/services/` and imported by `ServicesPage.jsx` so Vite fingerprints them for production caching.

The Services page continues to use the existing responsive rows; the image in each 16:9 frame uses `object-fit: cover`. Old source-pixel portfolio collage crop calculations and tests were replaced. No third-party image hosts are needed for these six cards.

This change does not alter the Project gallery or the service detail page's real portfolio images.
