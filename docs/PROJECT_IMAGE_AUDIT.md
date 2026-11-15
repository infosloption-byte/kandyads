# KandyAds portfolio image audit and replacement prompts

## Audit outcome

**Source-image files missing: 0 of 19 portfolio entries.** All filenames referenced by `portfolio` in `frontend/src/site-data.js` have a matching PNG under `frontend/src/assets/` in the repository. One additional PNG (`Screenshot 2026-08-30 142904.png`) is present but not referenced by the current portfolio.

**Actual cause of broken images:** The production pages used string-concatenated URLs such as `/src/assets/Screenshot 2026-08-30 142854.png`. Vite copies imported source images to fingerprinted URLs under `dist/assets/`, and does not publish `src/assets/` as a public web directory.

**Correction:** `frontend/src/components/ProjectImage.jsx` now uses `import.meta.glob` to bundle those existing source PNG files and resolve correct production URLs. It also provides a single local `frontend/src/assets/projects/project-fallback.svg` for absent references or failed downloads. The fix covers Projects, About and individual service detail pages. No client work photographs were replaced, invented or deleted.

## All 19 project references

| # | Portfolio item | Category | Existing PNG filename | Missing? |
|---|---|---|---|---|
| 1 | Casting Signs | Signage | `Screenshot 2026-08-30 142854.png` | No |
| 2 | Uncommon Signs | Signage | `Screenshot 2026-08-30 142840.png` | No |
| 3 | Cladding & Facades | Retail Branding | `Screenshot 2026-08-30 142816.png` | No |
| 4 | Vehicle Branding | Vehicle Branding | `Screenshot 2026-08-30 142803.png` | No |
| 5 | LED Road Sign Boards | Signage | `Screenshot 2026-08-30 142751.png` | No |
| 6 | Sunboard Panels | Print & Displays | `Screenshot 2026-08-30 142739.png` | No |
| 7 | Promotional Items | Promotional | `Screenshot 2026-08-30 142729.png` | No |
| 8 | X Stands | Events | `Screenshot 2026-08-30 142720.png` | No |
| 9 | Neon Sign Boards | Signage | `Screenshot 2026-08-30 142708.png` | No |
| 10 | Stickers | Print & Displays | `Screenshot 2026-08-30 142702.png` | No |
| 11 | Exhibition Stalls | Events | `Screenshot 2026-08-30 142653.png` | No |
| 12 | Stainless Steel Sign Boards | Signage | `Screenshot 2026-08-30 142607.png` | No |
| 13 | Stand Boards | Displays | `Screenshot 2026-08-30 142556.png` | No |
| 14 | Dealer Boards | Retail Branding | `Screenshot 2026-08-30 142548.png` | No |
| 15 | Fiber Letter Sign Boards | Signage | `Screenshot 2026-08-30 142541.png` | No |
| 16 | Pylon Sign Boards | Outdoor Advertising | `Screenshot 2026-08-30 142530.png` | No |
| 17 | Export Sign Boards | Signage | `Screenshot 2026-08-30 142523.png` | No |
| 18 | LED Sign Boards | Signage | `Screenshot 2026-08-30 142508.png` | No |
| 19 | Flex Hoardings | Outdoor Advertising | `Screenshot 2026-08-30 142458.png` | No |

## Optional AI replacement prompts if an original photo is later unavailable

**None are currently required.** The prompts below are ready only for a future situation where the business decides to use *illustrative sample work* instead of an original photo. AI-generated examples must be visibly identified as conceptual illustrations, **not photographed or completed Kandy Ads client projects**. Avoid recognizable third-party logos or false customer branding.

**Shared image constraints:** realistic commercial photography style, wide landscape 3:2, clean framing with space for website card cropping, authentic Sri Lankan streetscape or business environment where appropriate, natural lighting, no watermarks, no legible brand names or logos, no text overlays.

| # | Filename to replace, if ever required | Matching prompt (add shared constraints above) |
|---|---|---|
| 1 | `Screenshot 2026-08-30 142854.png` | Close three-quarter view of an elegant custom-cast dimensional metal shop sign mounted to a modern storefront, crisp handcrafted forms and subtle warm daylight |
| 2 | `Screenshot 2026-08-30 142840.png` | Distinctive custom freestanding sculptural business sign made from acrylic and metal in a contemporary commercial courtyard, refined fabrication and bold geometric design |
| 3 | `Screenshot 2026-08-30 142816.png` | Newly installed aluminum composite cladding on a retail facade with neat seams, architectural detail, glass shopfront and premium finishes |
| 4 | `Screenshot 2026-08-30 142803.png` | Professionally vinyl-wrapped delivery van with abstract red, white and black graphic shapes parked on a clean commercial street, side-angle composition |
| 5 | `Screenshot 2026-08-30 142751.png` | Illuminated LED direction sign near a well-kept road junction at early dusk, professional installation, realistic light diffusion and roadside environment |
| 6 | `Screenshot 2026-08-30 142739.png` | Group of colorful printed sunboard point-of-sale promotional panels on tidy stands inside a modern retail store, visible lightweight rigid board edges |
| 7 | `Screenshot 2026-08-30 142729.png` | Flat-lay of branded promotional merchandise mockups such as tote bags, mugs, notebooks and lanyards with abstract neutral artwork, crisp commercial product photography |
| 8 | `Screenshot 2026-08-30 142720.png` | Two retractable X-frame display banners standing inside a bright showroom, realistic thin cross-shaped support structure, clean non-readable graphics |
| 9 | `Screenshot 2026-08-30 142708.png` | Warm-glowing flexible neon-style sign mounted on a dark interior feature wall of a contemporary cafe, realistic halo illumination with abstract shapes |
| 10 | `Screenshot 2026-08-30 142702.png` | Close-up of custom die-cut vinyl stickers in varied shapes and finishes laid out across a designer's studio table, clean product-photography lighting |
| 11 | `Screenshot 2026-08-30 142653.png` | Modern modular exhibition booth at a trade fair with elegant illuminated backdrop, counter, printed panels and uncluttered visitor walkway |
| 12 | `Screenshot 2026-08-30 142607.png` | Premium brushed stainless-steel dimensional letters mounted on a stone office reception wall, precise reflections and tasteful subtle shadow |
| 13 | `Screenshot 2026-08-30 142556.png` | Professionally fabricated freestanding outdoor stand board with weighted base outside a small modern shop, neutral artwork and visible sturdy frame |
| 14 | `Screenshot 2026-08-30 142548.png` | Neatly installed dealer identity signboards on the facade of a neighborhood commercial outlet, consistent graphic panels and realistic Sri Lankan urban surroundings |
| 15 | `Screenshot 2026-08-30 142541.png` | Lightweight dimensional fiber letters installed over a minimalist commercial storefront, smooth molded shapes and clean surface finishes |
| 16 | `Screenshot 2026-08-30 142530.png` | Tall roadside pylon sign with stacked panels and engineered metal support structure at the entrance to a business park, viewed from ground level |
| 17 | `Screenshot 2026-08-30 142523.png` | Fabricated industrial export-company entrance sign mounted on a clean factory gate, professional metal construction, simple abstract identity artwork |
| 18 | `Screenshot 2026-08-30 142508.png` | Illuminated LED channel-letter storefront sign photographed at twilight, sharp red and white lit letters without readable wording, polished installation |
| 19 | `Screenshot 2026-08-30 142458.png` | Large-format outdoor flex hoarding on a secure billboard frame beside a busy Sri Lankan roadway, taut vinyl print with abstract brand-neutral artwork |

## Validation

From `frontend/` run `npm test`, then `npm run build`.

The tests check each listed image file's existence, unique filenames, absence of `/src/assets/` paths in the three affected pages, and presence of the fallback image and bundling helper. During a Vite production build, the PNGs will be fingerprinted and included automatically.

**Deploy:** After merging this fix into the branch used by your Lightsail server, rebuild *only* the `frontend` container with `docker compose --env-file .env.production -f compose.production.yml build frontend`, then recreate it with `up -d --no-deps frontend`. Avoid modifying API, admin, MySQL, or LankaHost DNS for this fix.
