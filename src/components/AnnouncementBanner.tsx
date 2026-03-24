import { useLocation } from "react-router-dom";
import { useSiteContent } from "@/hooks/useSiteContent";

const AnnouncementBanner = () => {
  const location = useLocation();
  const content = useSiteContent("announcements", { text: "", is_active: false, link: "" });

  // Masquer sur la page studio (couvre les boutons) et admin
  if (location.pathname === "/studio" || location.pathname.startsWith("/admin")) return null;
  if (!content.is_active || !content.text) return null;

  return (
    <div
      className="bg-terra text-warm-white text-center py-2 px-6 font-body text-[11px] tracking-[0.2em] uppercase relative z-20"
      style={{ fontWeight: 400 }}
    >
      {content.text as string}
      {content.link && (
        <a
          href={content.link as string}
          className="ml-2 underline hover:no-underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          →
        </a>
      )}
    </div>
  );
};

export default AnnouncementBanner;
