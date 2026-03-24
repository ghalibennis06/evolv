import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import GrainOverlay from "@/components/brand/GrainOverlay";
import CustomCursor from "@/components/brand/CustomCursor";
import CookieBanner from "@/components/CookieBanner";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import MeridianLogo from "@/components/brand/MeridianLogo";

// Code-split: lazy load all pages
const Index = lazy(() => import("./pages/Index"));
const PlanningPage = lazy(() => import("./pages/PlanningPage"));
const BookingPage = lazy(() => import("./pages/BookingPage"));
const CarteBlackPage = lazy(() => import("./pages/CarteBlackPage"));
const BoutiquePage = lazy(() => import("./pages/BoutiquePage"));
const BoissonsPage = lazy(() => import("./pages/BoissonsPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const StudioPage = lazy(() => import("./pages/StudioPage"));
const CoachsPage = lazy(() => import("./pages/CoachsPage"));
const TarifsPage = lazy(() => import("./pages/TarifsPage"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentCanceled = lazy(() => import("./pages/PaymentCanceled"));
const MonPackPage = lazy(() => import("./pages/MonPackPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <MeridianLogo size={56} variant="sand" animate spinDuration={4} />
  </div>
);

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <GrainOverlay />
        <CustomCursor />
        <CookieBanner />
        <BrowserRouter>
          <AnnouncementBanner />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/planning" element={<PlanningPage />} />
              <Route path="/reserver" element={<BookingPage />} />
              <Route path="/carte-black" element={<CarteBlackPage />} />
              <Route path="/boutique" element={<BoutiquePage />} />
              <Route path="/boissons" element={<BoissonsPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/studio" element={<StudioPage />} />
              <Route path="/coachs" element={<CoachsPage />} />
              <Route path="/tarifs" element={<TarifsPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/payment-canceled" element={<PaymentCanceled />} />
              <Route path="/mon-pack" element={<MonPackPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
