const API_BASE_URL = "http://localhost:8000";

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

export const apiFetch = async (endpoint: string, options: FetchOptions = {}) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("jwt_token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  if (options.body instanceof FormData) {
    delete headers["Content-Type"];
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: "include",
  };

  let response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  // Handle 401 Unauthorized (Token Expired)
  if (response.status === 401) {
    // Attempt Refresh
    try {
      // We rely on the HttpOnly cookie for the refresh token
      const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        // credentials: "include" ensures cookies are sent/received
        credentials: "include", 
      });

      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        const newAccessToken = data.access_token;
        
        if (typeof window !== "undefined") {
          localStorage.setItem("jwt_token", newAccessToken);
        }

        // Retry Original Request with new Token
        const newHeaders = {
          ...headers,
          Authorization: `Bearer ${newAccessToken}`,
        };
        
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers: newHeaders,
        });
      } else {
        // Refresh Failed -> Logout
        if (typeof window !== "undefined") {
            // Only redirect if we are not already on the login page (to avoid loops, though handled by app usually)
            // But for now, just clear and reload or let the app handle it.
            localStorage.removeItem("jwt_token");
            window.location.href = "/"; // Assuming / is the login/home page
        }
      }
    } catch (error) {
       console.error("Token refresh failed", error);
       if (typeof window !== "undefined") {
          localStorage.removeItem("jwt_token");
          window.location.href = "/";
       }
    }
  }

  return response;
};
