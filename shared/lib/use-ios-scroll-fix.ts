import React from "react";

export function useIsIOS(): boolean {
  const [isIOS, setIsIOS] = React.useState(false);
  React.useEffect(() => {
    setIsIOS(
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1),
    );
  }, []);
  return isIOS;
}

export function useIOSScrollFix(): boolean {
  const isIOS = useIsIOS();
  React.useEffect(() => {
    if (!isIOS) return;
    const el = document.createElement("div");
    el.style.cssText =
      "position:fixed;top:0;left:0;width:0;height:0;overflow:hidden;pointer-events:none;";
    document.body.appendChild(el);
    const handler = () => {
      el.textContent = String(window.scrollY);
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => {
      window.removeEventListener("scroll", handler);
      el.remove();
    };
  }, [isIOS]);
  return isIOS;
}
