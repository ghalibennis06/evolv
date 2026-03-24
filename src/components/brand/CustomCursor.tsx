import { useEffect, useRef } from "react";

const CustomCursor = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const ringPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Skip on touch devices
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
      if (dotRef.current) {
        dotRef.current.style.left = `${e.clientX}px`;
        dotRef.current.style.top = `${e.clientY}px`;
      }
    };

    const lerp = () => {
      ringPos.current.x += (pos.current.x - ringPos.current.x) * 0.12;
      ringPos.current.y += (pos.current.y - ringPos.current.y) * 0.12;
      if (ringRef.current) {
        ringRef.current.style.left = `${ringPos.current.x}px`;
        ringRef.current.style.top = `${ringPos.current.y}px`;
      }
      requestAnimationFrame(lerp);
    };

    const onHoverIn = () => {
      if (ringRef.current) {
        ringRef.current.style.width = "60px";
        ringRef.current.style.height = "60px";
      }
    };
    const onHoverOut = () => {
      if (ringRef.current) {
        ringRef.current.style.width = "40px";
        ringRef.current.style.height = "40px";
        ringRef.current.style.animation = "";
      }
    };
    const onBlackCardIn = () => {
      if (ringRef.current) {
        ringRef.current.style.width = "80px";
        ringRef.current.style.height = "80px";
        ringRef.current.style.animation = "cursor-shake 0.3s ease-in-out infinite";
        ringRef.current.style.borderColor = "hsl(13 42% 50%)";
        ringRef.current.style.borderWidth = "2px";
      }
      if (dotRef.current) {
        dotRef.current.style.width = "14px";
        dotRef.current.style.height = "14px";
      }
    };
    const onBlackCardOut = () => {
      if (ringRef.current) {
        ringRef.current.style.width = "40px";
        ringRef.current.style.height = "40px";
        ringRef.current.style.animation = "";
        ringRef.current.style.borderColor = "";
        ringRef.current.style.borderWidth = "";
      }
      if (dotRef.current) {
        dotRef.current.style.width = "8px";
        dotRef.current.style.height = "8px";
      }
    };

    document.addEventListener("mousemove", onMove);
    requestAnimationFrame(lerp);

    const interactives = document.querySelectorAll("a, button, [role='button'], input, textarea, select");
    interactives.forEach((el) => {
      el.addEventListener("mouseenter", onHoverIn);
      el.addEventListener("mouseleave", onHoverOut);
    });
    const blackCards = document.querySelectorAll(".black-card-hover");
    blackCards.forEach((el) => {
      el.addEventListener("mouseenter", onBlackCardIn);
      el.addEventListener("mouseleave", onBlackCardOut);
    });

    // MutationObserver to catch new interactive elements
    const observer = new MutationObserver(() => {
      const els = document.querySelectorAll("a, button, [role='button'], input, textarea, select");
      els.forEach((el) => {
        el.addEventListener("mouseenter", onHoverIn);
        el.addEventListener("mouseleave", onHoverOut);
      });
      const blackCards = document.querySelectorAll(".black-card-hover");
      blackCards.forEach((el) => {
        el.addEventListener("mouseenter", onBlackCardIn);
        el.addEventListener("mouseleave", onBlackCardOut);
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener("mousemove", onMove);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <div id="custom-cursor" ref={dotRef} />
      <div id="custom-cursor-ring" ref={ringRef} />
    </>
  );
};

export default CustomCursor;
