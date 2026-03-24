import MeridianLogo from "@/components/brand/MeridianLogo";

/**
 * Fixed, full-viewport background meridian — used on all main pages.
 * Sits behind all content (z-0), never overlaps text.
 * Simpler than the Index scroll-reactive version: always in center, low opacity.
 */
const PageBackgroundMeridian = () => (
  <div
    className="fixed inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
    style={{ zIndex: -1 }}
    aria-hidden
  >
    <div style={{ opacity: 0.08 }}>
      <MeridianLogo size={900} variant="theme" animate spinDuration={180} />
    </div>
  </div>
);

export default PageBackgroundMeridian;
