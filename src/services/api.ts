import axios from 'axios';
import type {
  OverviewData,
  AthleteUser,
  UserUtilityProfile,
  Tournament,
  CouponItem,
  VenueFleet,
} from '../types';

const defaultProdUrl = 'https://fieldfflix-backend.onrender.com';
const isDev = import.meta.env.DEV;
let rawBaseUrl = import.meta.env.VITE_API_URL !== undefined && import.meta.env.VITE_API_URL !== ''
  ? String(import.meta.env.VITE_API_URL)
  : (isDev ? '' : defaultProdUrl);

// Sanitize accidental copy-paste in Vercel env settings (e.g. trailing "vite_api_url=")
rawBaseUrl = rawBaseUrl
  .replace(/^VITE_API_URL\s*=\s*/i, '')
  .replace(/vite_api_url.*$/i, '')
  .replace(/=+$/, '')
  .replace(/\/+$/, '')
  .trim();

if (!rawBaseUrl && !isDev) {
  rawBaseUrl = defaultProdUrl;
}

const API_BASE_URL = rawBaseUrl;

const api = axios.create({
  baseURL: API_BASE_URL || undefined,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach bearer token if stored in localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fieldflix_admin_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 Unauthorized globally by purging token
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('fieldflix_admin_token');
      // If we are not already on the login page (which would have no token anyway), reload to force the LoginView
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// Helper to extract data from NestJS GlobalResponseInterceptor { success: true, data: ... }
function extractData<T>(response: any): T {
  if (response && response.data !== undefined) {
    // If nested under { success: true, data: { ... } }
    if (typeof response.data === 'object' && response.data !== null && 'data' in response.data) {
      return response.data.data as T;
    }
    return response.data as T;
  }
  return response as T;
}

export const AdminApi = {
  // Authentication
  async sendOtp(mobile: string): Promise<any> {
    const res = await api.post('/auth/send-otp', { mobile });
    return extractData<any>(res);
  },

  async verifyOtp(mobile: string, otp: string): Promise<{ token: string; isFirstTimeLogin: boolean }> {
    const res = await api.post('/auth/verify-otp', { mobile, otp });
    return extractData<any>(res);
  },

  // 1. Overview & Analytics: Real backend aggregate metrics & charts
  async getOverview(): Promise<OverviewData> {
    const res = await api.get('/admin/analytics/overview');
    const raw = extractData<any>(res);
    
    // Ensure default shape even if freshly initialized DB
    return {
      summary: raw?.summary || {
        totalUsers: 0,
        dau: 0,
        mau: 0,
        userGrowthMoM: '0%',
        totalRecordings: 0,
        completedRecordings: 0,
        failedRecordings: 0,
        recordingSuccessRate: '100%',
        grossRevenueInr: 0,
        arpuInr: '0.00',
        totalVenues: 0,
        totalCourts: 0,
        activeStreams: 0,
      },
      timeSeries: Array.isArray(raw?.timeSeries) ? raw.timeSeries : [],
      sportDistribution: Array.isArray(raw?.sportDistribution) ? raw.sportDistribution : [],
    };
  },

  // 2. User CRM & Utility: Real athletes directory from database
  async listUsers(
    search?: string,
    page = 1,
    limit = 50
  ): Promise<{ users: AthleteUser[]; total: number; page: number; limit: number; totalPages: number }> {
    const res = await api.get('/admin/users', { params: { search, page, limit } });
    const raw = extractData<any>(res);
    
    if (raw && Array.isArray(raw.users)) {
      const total = raw.total ?? raw.users.length;
      const actualLimit = raw.limit ?? limit;
      return {
        users: raw.users,
        total,
        page: raw.page ?? page,
        limit: actualLimit,
        totalPages: raw.totalPages ?? Math.max(1, Math.ceil(total / actualLimit)),
      };
    }
    if (Array.isArray(raw)) {
      return { users: raw, total: raw.length, page: 1, limit: raw.length, totalPages: 1 };
    }
    return { users: [], total: 0, page: 1, limit, totalPages: 0 };
  },

  // Per-user CRM profile drilldown with real matches, purchases, coupons, XP audit
  async getUserUtility(userId: string): Promise<UserUtilityProfile> {
    const res = await api.get(`/admin/users/${userId}/utility`);
    return extractData<UserUtilityProfile>(res);
  },

  // 3. Tournaments: Real tournaments from PostgreSQL
  async listTournaments(): Promise<Tournament[]> {
    const res = await api.get('/tournaments');
    const raw = extractData<any>(res);
    return Array.isArray(raw) ? raw : [];
  },

  async createTournament(dto: Partial<Tournament>): Promise<Tournament> {
    const res = await api.post('/tournaments', dto);
    return extractData<Tournament>(res);
  },

  async updateTournamentStatus(id: string, status: string): Promise<any> {
    const res = await api.patch(`/tournaments/${id}/status`, { status });
    return extractData<any>(res);
  },

  // 4. Coupons & Free Games: Real discount codes and assignments
  async listCoupons(): Promise<CouponItem[]> {
    const res = await api.get('/coupons');
    const raw = extractData<any>(res);
    return Array.isArray(raw) ? raw : [];
  },

  async createCoupon(dto: {
    code: string;
    label: string;
    discountPercent: number;
    maxRecordings: number;
  }): Promise<CouponItem> {
    const res = await api.post('/coupons', dto);
    return extractData<CouponItem>(res);
  },

  async assignFreeGame(
    userId: string,
    couponCode = 'VIPFREE100',
    note = 'Admin Grant'
  ): Promise<any> {
    const res = await api.post('/coupons/assign', {
      userId,
      couponCode,
      note,
    });
    return extractData<any>(res);
  },

  // 5. Fleet & Live Streaming Controls: Real turfs and camera bridges
  async getFleet(): Promise<VenueFleet[]> {
    const res = await api.get('/admin/fleet');
    const raw = extractData<any>(res);
    return Array.isArray(raw) ? raw : [];
  },

  async updateCameraMapping(
    cameraId: string,
    data: { name?: string; court_number?: number; raspberryPiBaseUrl?: string }
  ): Promise<any> {
    const res = await api.put(`/admin/cameras/${cameraId}`, data);
    return extractData<any>(res);
  },

  async createCameraMapping(data: {
    turfId: string;
    name?: string;
    court_number?: number;
    raspberryPiBaseUrl?: string;
  }): Promise<any> {
    const res = await api.post('/admin/cameras', data);
    return extractData<any>(res);
  },

  async testPiConnectivity(url: string): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const res = await api.post('/admin/cameras/test-connectivity', { url });
      return extractData<any>(res);
    } catch (err: any) {
      // Direct browser fallback probe to Pi /health if backend is currently restarting/deploying
      try {
        const cleanUrl = url.trim().replace(/\/+$/, '');
        const target = cleanUrl.endsWith('/health') ? cleanUrl : `${cleanUrl}/health`;
        const start = Date.now();
        const probe = await fetch(target, { method: 'GET' });
        const latency = Date.now() - start;
        if (probe.ok || probe.status === 200) {
          const body = await probe.json().catch(() => ({ status: 'OK' }));
          return {
            success: true,
            message: `Device reached directly (${latency}ms): ${JSON.stringify(body)}`,
          };
        }
      } catch {
        // Ignore direct probe error and throw backend error
      }
      throw err;
    }
  },

  async startLiveStream(cameraId: string, courtName: string): Promise<any> {
    const res = await api.post('/recording/start-live-stream', {
      cameraId,
      streamTitle: `Live Stream: ${courtName}`,
    });
    return extractData<any>(res);
  },

  async stopLiveStream(cameraId: string): Promise<any> {
    const res = await api.post('/recording/stop-live-stream', { cameraId });
    return extractData<any>(res);
  },

  async getRecordings(params?: { page?: number; limit?: number; status?: string }): Promise<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    recordings: import('../types').AdminRecordingItem[];
  }> {
    const res = await api.get('/admin/recordings', { params });
    return extractData<any>(res);
  },

  async triggerTestExtraction(data: {
    cameraId: string;
    durationMinutes?: number;
    startTime?: string;
    endTime?: string;
  }): Promise<{
    success: boolean;
    cached: boolean;
    recordingId: string;
    status: string;
    venueName: string;
    courtName: string;
    startTime: string;
    endTime: string;
    playableUrl?: string;
    s3Path?: string;
  }> {
    const res = await api.post('/admin/recordings/test-extract', data);
    return extractData<any>(res);
  },

  async getRecordingPlaybackUrl(id: string): Promise<{ playableUrl: string }> {
    const res = await api.get(`/admin/recordings/${id}/playback-url`);
    return extractData<any>(res);
  },

  // 6. FlickShorts Moderation & Public Feed
  async getFlickShorts(sport?: string): Promise<any[]> {
    const res = await api.get('/flick-shorts/admin', { params: { sport } });
    const raw = extractData<any>(res);
    return Array.isArray(raw) ? raw : [];
  },

  async approveFlickShort(id: string, approved = true): Promise<any> {
    const res = await api.patch(`/flick-shorts/${id}/approve`, { approved });
    return extractData<any>(res);
  },

  async deleteFlickShort(id: string): Promise<any> {
    const res = await api.delete(`/flick-shorts/${id}`);
    return extractData<any>(res);
  },

  async createFlickShort(data: {
    title: string;
    sport: string;
    tags?: string[];
    videoUrl?: string;
    thumbnailUrl?: string;
  }): Promise<any> {
    const res = await api.post('/flick-shorts', data);
    return extractData<any>(res);
  },

  // 7. Points & Multi-Sport Leaderboard
  async getLeaderboard(period = 'all', limit = 50): Promise<any[]> {
    const res = await api.get('/points/leaderboard', { params: { period, limit } });
    const raw = extractData<any>(res);
    return Array.isArray(raw) ? raw : [];
  },

  async getPointConfigs(): Promise<any[]> {
    const res = await api.get('/points/configs');
    const raw = extractData<any>(res);
    return Array.isArray(raw) ? raw : [];
  },

  async getPointLevels(): Promise<any[]> {
    const res = await api.get('/points/levels');
    const raw = extractData<any>(res);
    return Array.isArray(raw) ? raw : [];
  },

  async updatePointConfig(eventType: string, data: { label?: string; points?: number; enabled?: boolean }): Promise<any> {
    const res = await api.patch(`/points/configs/${eventType}`, data);
    return extractData<any>(res);
  },
};
