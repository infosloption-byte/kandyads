# Services page portfolio crops

The six service rows use photographs cropped from the original Kandy Ads portfolio posters. **No stock images or remotely hosted imagery.**

| Service | Existing portfolio poster | Selected view |
|---|---|---|
| Signage & Signboards | Casting Signs | Illuminated Infinity sign (top left) |
| Vehicle Branding | Vehicle Branding | Branded white van (bottom right) |
| Outdoor Advertising | Flex Hoardings | Street-level billboard and signage (middle) |
| Digital Printing & Displays | Stickers | Glass/window sticker graphics (bottom right) |
| Retail & Commercial Branding | Cladding & Facades | Branded storefront (bottom left) |
| Exhibitions & Promotional | Exhibition Stalls | Green exhibition booth (upper left) |

Crops are recorded in `frontend/src/data/service-work-previews.js` as source-pixel rectangles measured against each original PNG's width and height. The `ServicesPage` uses `ProjectImage` and a clipped, responsive 16:9 frame to display the chosen rectangle without copying or modifying the portfolio's original image files. This is a non-destructive crop and retains Vite's asset hashing and existing image fallback behavior.

To adjust a crop, change its `x`, `y`, `width`, `height` (using a 16:9 region). The service card dimensions, page layout, icons, and links do not need to change.
