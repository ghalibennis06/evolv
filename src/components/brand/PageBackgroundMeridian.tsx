import SpineWatermark from "@/components/brand/SpineWatermark";

/**
 * Fixed, full-viewport background watermark — used on all main pages.
 * Sits behind all content (z=-1), never overlaps text.
 */
const PageBackgroundMeridian = () => (
  <div
    className="fixed inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
    style={{ zIndex: -1 }}
    aria-hidden
  >
    <SpineWatermark size={600} opacity={0.04} />
  </div>
);

export default PageBackgroundMeridian;
