import { useCallback, useEffect, useState } from "react";
import {
  fetchRequests,
  ApiServiceError,
  type ApiRequestRecord
} from "../services/api";

interface UseApiRequestsResult {
  requests: ApiRequestRecord[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useApiRequests(): UseApiRequestsResult {
  const [requests, setRequests] = useState<ApiRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchRequests();
      setRequests(data);
    } catch (err) {
      const message =
        err instanceof ApiServiceError
          ? err.message
          : "Unable to load API monitoring data.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function loadInitialData() {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchRequests();

        if (active) {
          setRequests(data);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof ApiServiceError
              ? err.message
              : "Unable to load API monitoring data."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadInitialData();

    return () => {
      active = false;
    };
  }, []);

  return {
    requests,
    loading,
    error,
    refresh
  };
}
