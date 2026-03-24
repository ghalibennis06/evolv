import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useSiteContent<T extends Record<string, unknown>>(section: string, fallback: T): T {
  const [content, setContent] = useState<T>(fallback);

  useEffect(() => {
    supabase
      .from("site_content")
      .select("content")
      .eq("section", section)
      .single()
      .then(({ data }) => {
        if (data?.content && typeof data.content === "object") {
          setContent({ ...fallback, ...(data.content as T) });
        }
      });
  }, [section]);

  return content;
}
