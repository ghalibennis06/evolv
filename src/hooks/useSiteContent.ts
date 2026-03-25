import { useEffect, useState } from "react";

export function useSiteContent<T extends Record<string, unknown>>(section: string, fallback: T): T {
  const [content, setContent] = useState<T>(fallback);

  useEffect(() => {
    fetch(`/api/site-content?section=${encodeURIComponent(section)}`)
      .then(r => r.json())
      .then(data => {
        if (data?.content && typeof data.content === "object") {
          setContent({ ...fallback, ...(data.content as T) });
        }
      })
      .catch(() => {});
  }, [section]);

  return content;
}
