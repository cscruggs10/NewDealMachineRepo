import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = `${res.status} ${res.statusText}`;
    try {
      // Clone the response to avoid "body already read" errors
      const clonedRes = res.clone();
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await res.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } else {
        const text = await clonedRes.text();
        if (text) errorMessage = text;
      }
    } catch (e) {
      // If parsing fails, stick with status + statusText
    }
    throw new Error(errorMessage);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: HeadersInit = {};
  
  // Add auth token if available
  const adminToken = localStorage.getItem('adminToken');
  if (adminToken) {
    headers['Authorization'] = `Bearer ${adminToken}`;
    console.log('Sending admin token with request to:', url);
  }
  
  if (data) {
    headers['Content-Type'] = 'application/json';
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const headers: HeadersInit = {};
    
    // Add auth token if available
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      headers['Authorization'] = `Bearer ${adminToken}`;
      console.log('Sending admin token with GET request to:', queryKey[0]);
    }
    
    const res = await fetch(queryKey[0] as string, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }), // Changed from "throw" to "returnNull"
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
      onError: (error) => {
        // Don't do anything on 401s - let components handle it
        console.error('Mutation error:', error);
      },
    },
  },
});
