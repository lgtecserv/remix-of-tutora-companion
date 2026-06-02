import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useTracking(
  entityType: "post" | "banner",
  entityId: string,
  options = { threshold: 0.5, delay: 2000 }
) {
  const elementRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const getTodayStorageKey = (type: string, id: string, action: string) => {
    const date = new Date().toISOString().split("T")[0];
    return `tracking_${type}_${id}_${action}_${date}`;
  };

  const trackEvent = useCallback(async (action: "view" | "click") => {
    if (!entityId) return;

    const storageKey = getTodayStorageKey(entityType, entityId, action);
    if (localStorage.getItem(storageKey)) return; // Já reportado hoje

    try {
      const rpcName = entityType === "post" ? "increment_post_stat" : "increment_banner_stat";
      const params = entityType === "post" 
        ? { p_post_id: entityId, p_stat_type: action }
        : { p_banner_id: entityId, p_stat_type: action };

      const { error } = await supabase.rpc(rpcName as any, params as any);
      
      if (!error) {
        localStorage.setItem(storageKey, "true");
      } else {
        console.warn(`[Tracking] Error tracking ${action} for ${entityType} ${entityId}:`, error);
      }
    } catch (e) {
      console.warn(`[Tracking] Failed to track ${action}:`, e);
    }
  }, [entityId, entityType]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Element is visible, start timer
            timerRef.current = setTimeout(() => {
              trackEvent("view");
            }, options.delay);
          } else {
            // Element is not visible, clear timer
            if (timerRef.current) {
              clearTimeout(timerRef.current);
            }
          }
        });
      },
      { threshold: options.threshold }
    );

    const el = elementRef.current;
    if (el) {
      observer.observe(el);
    }

    return () => {
      if (el) observer.unobserve(el);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [trackEvent, options.threshold, options.delay]);

  const trackClick = () => {
    trackEvent("click");
  };

  return { elementRef, trackClick };
}
