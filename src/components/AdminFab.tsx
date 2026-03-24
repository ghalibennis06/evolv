import { Settings } from "lucide-react";
import { Link } from "react-router-dom";

// Always visible on Contact page — anyone can click to reach /admin login
const AdminFab = () => (
  <Link
    to="/admin"
    className="fixed bottom-6 right-6 z-[100] w-9 h-9 rounded-full bg-card/80 border border-border/60 shadow-sm flex items-center justify-center text-muted-foreground/40 hover:text-terra hover:border-terra/40 hover:bg-card hover:shadow-md transition-all duration-300"
    title="Espace admin"
  >
    <Settings size={13} />
  </Link>
);

export default AdminFab;
