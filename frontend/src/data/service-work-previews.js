// Crops are measured against the original portfolio PNGs, not stock photography.
// Each view isolates a real Kandy Ads project photo from a multi-photo portfolio poster.
// Reuse the PNG files already bundled by Vite; avoid duplicate image downloads.
export const serviceWorkPreviews = {
  signage: {
    projectTitle: 'Casting Signs',
    source: { width: 488, height: 697 },
    crop: { x: 49, y: 105, width: 224, height: 126 },
  },
  'vehicle-branding': {
    projectTitle: 'Vehicle Branding',
    source: { width: 496, height: 702 },
    crop: { x: 257, y: 434, width: 216, height: 121.5 },
  },
  'outdoor-advertising': {
    projectTitle: 'Flex Hoardings',
    source: { width: 497, height: 702 },
    crop: { x: 177, y: 195, width: 270, height: 151.875 },
  },
  printing: {
    projectTitle: 'Stickers',
    source: { width: 492, height: 706 },
    crop: { x: 282, y: 415, width: 186, height: 104.625 },
  },
  'retail-branding': {
    projectTitle: 'Cladding & Facades',
    source: { width: 495, height: 708 },
    crop: { x: 33, y: 367, width: 216, height: 121.5 },
  },
  events: {
    projectTitle: 'Exhibition Stalls',
    source: { width: 495, height: 707 },
    crop: { x: 17, y: 216, width: 272, height: 153 },
  },
};

// CSS percentages are relative to the crop frame.
// Match the frame's 16:9 aspect ratio so the original photographs are not stretched.
export function serviceWorkImageStyle(preview) {
  const { source, crop } = preview;
  return {
    width: `${(source.width / crop.width) * 100}%`,
    height: `${(source.height / crop.height) * 100}%`,
    left: `${(-crop.x / crop.width) * 100}%`,
    top: `${(-crop.y / crop.height) * 100}%`,
  };
}
