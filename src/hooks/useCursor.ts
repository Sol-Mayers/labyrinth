import { useEffect, useRef } from "react";

export type Cursor = { x: number; y: number };

export function useCursor() {
  const cursor = useRef<Cursor>({ x: 0, y: 0 });

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      cursor.current.x = e.clientX / width - 0.5;
      cursor.current.y = e.clientY / height - 0.5;
    };

    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, []);

  return cursor;
}
