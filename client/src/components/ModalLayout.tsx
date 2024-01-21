import { useEffect } from "react";

export default function ModalLayout({ children }: { children: any }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="animate-fadein z-50 fixed top-0 left-0 h-full w-full bg-black bg-opacity-80 flex items-center justify-center">
      <div className="animate-scalein font-title min-w-80 flex-col bg-zinc-900 bg-opacity-100 shadow-card-xl flex justify-center border-solid rounded-lg">
        {children}
      </div>
    </div>
  );
}
