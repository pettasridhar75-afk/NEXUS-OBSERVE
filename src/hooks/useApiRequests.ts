import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiRequestRecord, DataSource } from "../models/request";
import { ApiServiceError, fetchRequests } from "../services/api";

export function useApiRequests() {
  const [requests, setRequests] = useState<ApiRequestRecord[]>([]);
  const [source, setSource] = useState<DataSource>("demo");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    setRefreshing(true);
    setError(null);

    try {
      const result = await fetchRequests(current.signal);
      if (!mounted.current || current.signal.aborted) return;
      setRequests(result.requests);
      setSource(result.source);
      setLastUpdated(new Date());
    } catch (cause) {
      if (!mounted.current || current.signal.aborted) return;
      setError(
        cause instanceof ApiServiceError
          ? cause.message
          : "Unable to load monitoring data."
      );
    } finally {
      if (mounted.current && controller.current === current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void refresh();

    return () => {
      mounted.current = false;
      controller.current?.abort();
    };
  }, [refresh]);

  return { requests, source, loading, refreshing, error, lastUpdated, refresh };
}
