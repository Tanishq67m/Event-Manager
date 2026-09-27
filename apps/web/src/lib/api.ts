const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

// ── Token management ──────────────────────────────────────────────────────────

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("ep_access_token");
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("ep_refresh_token");
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem("ep_access_token", accessToken);
  localStorage.setItem("ep_refresh_token", refreshToken);
}

export function clearTokens() {
  localStorage.removeItem("ep_access_token");
  localStorage.removeItem("ep_refresh_token");
  localStorage.removeItem("ep_user");
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("ep_user");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function setStoredUser(user: User) {
  localStorage.setItem("ep_user", JSON.stringify(user));
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: "ATTENDEE" | "ORGANIZER" | "ADMIN";
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  ownerId: string;
}

export interface TicketType {
  id: string;
  eventId: string;
  name: string;
  description: string | null;
  price: number;
  totalQuantity: number;
  soldQuantity: number;
  saleStartsAt: string | null;
  saleEndsAt: string | null;
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  venue: string;
  bannerUrl: string | null;
  capacity: number;
  status: "DRAFT" | "PUBLISHED" | "ENDED" | "CANCELLED";
  startsAt: string;
  endsAt: string;
  organization: { name: string; slug: string; logoUrl: string | null };
  ticketTypes: TicketType[];
}

export interface Booking {
  id: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "REFUNDED";
  qrCode: string;
  quantity: number;
  totalAmount: number;
  createdAt: string;
  checkedIn?: boolean;
  checkedInAt?: string | null;
  ticketType: TicketType & { event: Event };
}

/** Organizer view of a confirmed booking (GET /bookings/event/:eventId). */
export interface EventBooking {
  id: string;
  status: Booking["status"];
  qrCode: string;
  quantity: number;
  totalAmount: number;
  checkedIn: boolean;
  checkedInAt: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string };
  ticketType: { id: string; name: string; price: number };
}

export interface EventAnalytics {
  event: { id: string; title: string; venue: string; startsAt: string; status: string; capacity: number };
  summary: {
    totalRegistrations: number;
    checkedInCount: number;
    totalRevenue: number;
    totalRevenueFormatted: string;
    checkInRate: number;
    capacityUsed: number;
  };
  ticketBreakdown: {
    ticketTypeId: string;
    name: string;
    price: number;
    sold: number;
    total: number;
    remaining: number;
    revenue: number;
    checkedIn: number;
  }[];
  recentCheckIns: {
    attendeeName: string;
    email: string;
    ticketType: string;
    checkedInAt: string;
  }[];
}

// ── Fetch wrapper ─────────────────────────────────────────────────────────────

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  auth = true
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (auth) {
    const token = getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const json = await res.json();

  if (!res.ok) {
    if (res.status === 401) {
      clearTokens();
      if (typeof window !== "undefined") {
        window.location.href = "/auth/login?expired=true";
      }
    }
    throw new ApiError(res.status, json.error || "Something went wrong");
  }

  return json.data as T;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const auth = {
  register: (body: { name: string; email: string; password: string; role: string }) =>
    request<{ user: User; tokens: { accessToken: string; refreshToken: string } }>(
      "/auth/register", { method: "POST", body: JSON.stringify(body) }, false
    ),

  login: (body: { email: string; password: string }) =>
    request<{ user: User; tokens: { accessToken: string; refreshToken: string } }>(
      "/auth/login", { method: "POST", body: JSON.stringify(body) }, false
    ),

  me: () => request<User>("/auth/me"),

  logout: (refreshToken: string) =>
    request<null>("/auth/logout", { method: "POST", body: JSON.stringify({ refreshToken }) }),

  verifyEmail: (token: string) =>
    request<{ success: boolean; message: string }>(
      "/auth/verify-email", { method: "POST", body: JSON.stringify({ token }) }, false
    ),

  forgotPassword: (email: string) =>
    request<{ success: boolean; message: string }>(
      "/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }, false
    ),

  resetPassword: (token: string, newPassword: string) =>
    request<{ success: boolean; message: string }>(
      "/auth/reset-password", { method: "POST", body: JSON.stringify({ token, newPassword }) }, false
    ),
};

// ── Events ────────────────────────────────────────────────────────────────────

export const events = {
  list: (params?: { page?: number; limit?: number; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.search) qs.set("search", params.search);
    return fetch(`${API_BASE}/events?${qs}`).then((r) => r.json()) as Promise<{
      success: boolean;
      data: Event[];
      total: number;
      page: number;
      totalPages: number;
    }>;
  },

  bySlug: (slug: string) => request<Event>(`/events/${slug}`, {}, false),

  myEvents: () => request<Event[]>("/events/manage/all"),

  byId: (id: string) => request<Event>(`/events/manage/${id}`),

  create: (body: {
    title: string; description: string; venue: string;
    capacity: number; startsAt: string; endsAt: string;
    ticketTypes: Array<{ name: string; description?: string; price: number; totalQuantity: number }>;
  }) => request<Event>("/events", { method: "POST", body: JSON.stringify(body) }),

  update: (id: string, body: Partial<Event>) =>
    request<Event>(`/events/manage/${id}`, { method: "PATCH", body: JSON.stringify(body) }),

  publish: (id: string) =>
    request<Event>(`/events/manage/${id}/publish`, { method: "POST" }),

  delete: (id: string) =>
    request<null>(`/events/manage/${id}`, { method: "DELETE" }),
};

// ── Organizations ──────────────────────────────────────────────────────────────

export const organizations = {
  create: (body: { name: string; description?: string }) =>
    request<Organization>("/organizations", { method: "POST", body: JSON.stringify(body) }),

  mine: () => request<Organization & { _count?: { events: number } }>("/organizations/me/profile"),

  bySlug: (slug: string) => request<Organization & { events: Event[] }>(`/organizations/${slug}`, {}, false),

  update: (body: { name?: string; description?: string }) =>
    request<Organization>("/organizations/me/profile", { method: "PATCH", body: JSON.stringify(body) }),
};

// ── Bookings ──────────────────────────────────────────────────────────────────

export const bookings = {
  create: (body: { ticketTypeId: string; quantity: number }) =>
    request<Booking>("/bookings", { method: "POST", body: JSON.stringify(body) }),

  mine: () => request<Booking[]>("/bookings/my"),

  byId: (id: string) => request<Booking>(`/bookings/${id}`),

  forEvent: (eventId: string) => request<EventBooking[]>(`/bookings/event/${eventId}`),

  cancel: (id: string) => request<Booking>(`/bookings/${id}/cancel`, { method: "DELETE" }),
};

// ── Payments ──────────────────────────────────────────────────────────────────

export const payments = {
  createOrder: (bookingId: string) =>
    request<{ orderId: string; amount: number; currency: string; keyId: string; bookingId: string; prefill: { name: string; email: string } }>(
      "/payments/order", { method: "POST", body: JSON.stringify({ bookingId }) }
    ),

  verify: (body: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) =>
    request<Booking>("/payments/verify", { method: "POST", body: JSON.stringify(body) }),
};

// ── Check-in ──────────────────────────────────────────────────────────────────

export const checkin = {
  // The scan endpoint's request schema requires eventId; without it every scan fails validation.
  scan: (qrCode: string, eventId: string) =>
    request<{ valid: boolean; message?: string; reason?: string; attendee?: string; ticketType?: string; checkedInAt?: string }>(
      "/checkin/scan", { method: "POST", body: JSON.stringify({ qrCode, eventId }) }
    ),

  analytics: (eventId: string) => request<EventAnalytics>(`/checkin/analytics/${eventId}`),

  exportUrl: (eventId: string) =>
    `${API_BASE}/checkin/export/${eventId}`,

  /** The export endpoint requires the Bearer token, so fetch it and save the blob. */
  downloadCsv: async (eventId: string, filename = "attendees.csv") => {
    const token = getAccessToken();
    const res = await fetch(`${API_BASE}/checkin/export/${eventId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(res.status, body.error || "Export failed");
    }
    // With no confirmed attendees the endpoint answers with JSON instead of a CSV.
    if (res.headers.get("content-type")?.includes("application/json")) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(204, body.message || "No confirmed attendees yet");
    }
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};

export { ApiError };
