export interface AnalyticsSummary {
  totalUsers: number;
  dau: number;
  mau: number;
  userGrowthMoM: string;
  totalRecordings: number;
  completedRecordings: number;
  failedRecordings: number;
  recordingSuccessRate: string;
  grossRevenueInr: number;
  arpuInr: string;
  totalVenues: number;
  totalCourts: number;
  activeStreams: number;
}

export interface TimeSeriesPoint {
  date: string;
  signups: number;
  matches: number;
  revenue: number;
}

export interface SportDistributionItem {
  name: string;
  value: number;
  color: string;
}

export interface OverviewData {
  summary: AnalyticsSummary;
  timeSeries: TimeSeriesPoint[];
  sportDistribution: SportDistributionItem[];
}

export interface AthleteUser {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  city: string;
  preferredSport: string;
  matchesCount: number;
  totalSpentInr: number;
  xpPoints: number;
  currentLevel: number;
  levelName?: string;
  lastActive: string;
  createdAt: string;
}

export interface UserUtilityProfile {
  user: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    city: string;
    preferredSport: string;
    createdAt: string;
    lastActive: string;
    xpBalance: number;
    level: number;
    levelName?: string;
  };
  matches: Array<{
    id: string;
    turfName: string;
    courtNumber: number;
    startTime: string;
    endTime?: string;
    status: string;
    playbackUrl?: string;
  }>;
  purchases: Array<{
    id: string;
    amountInr: number;
    status: string;
    date: string;
  }>;
  coupons: Array<{
    id: string;
    code: string;
    discountPercent: number;
    remainingRecordings: number;
    note?: string;
    createdAt: string;
  }>;
  pointsAudit: Array<{
    id: string;
    points: number;
    eventType: string;
    refId?: string;
    date: string;
  }>;
}

export interface Tournament {
  id: string;
  name: string;
  sport: string;
  bannerImage?: string;
  prizePool: number;
  closingDate?: string;
  venue: string;
  turfId?: string;
  cameraIds?: string[];
  liveStreams?: TournamentLiveStream[];
  city: string;
  startDate: string;
  endDate?: string;
  participantsCount: number;
  maxParticipants: number;
  entryFee: number; // 0 for free/unpaid
  skillLevel: string;
  status: 'Upcoming' | 'Live' | 'Completed' | 'Pending_Approval' | 'Cancelled';
  organizer?: {
    name: string;
    contactEmail: string;
    contactPhone: string;
    isVerified: boolean;
  };
  prizes?: {
    champion: string;
    runnerUp: string;
    semiFinalists: string;
  };
}

export interface TournamentLiveStream {
  cameraId: string;
  cameraName: string;
  courtNumber?: number;
  playbackUrl?: string;
  isLive: boolean;
}

export interface CouponItem {
  id: string;
  code: string;
  label: string;
  discountPercent: number;
  maxRecordings: number;
  startsAt?: string;
  expiresAt?: string;
  enabled: boolean;
  totalAssignments?: number;
  totalRedemptions?: number;
}

export interface CourtCamera {
  cameraId: string;
  courtNumber: number;
  name: string;
  raspberryPiBaseUrl?: string;
  raspberryPiApiKey?: string;
  hiddenFromApp?: boolean;
  isConfigured?: boolean;
  status: 'ONLINE' | 'OFFLINE' | 'RECORDING' | 'STREAMING' | 'UNCONFIGURED';
  isLiveStreaming?: boolean;
  livePlaybackUrl?: string;
  isLiveStreamingCh2?: boolean;
  livePlaybackUrlCh2?: string;
  liveStreamId?: string;
  liveStreamIdCh2?: string;
}

export interface VenueFleet {
  turfId: string;
  turfIds?: string[];
  turfName: string;
  city: string;
  address?: string;
  sportsSupported?: string[];
  hiddenFromApp?: boolean;
  courtsCount: number;
  courts: CourtCamera[];
}

export const SPORTS_OPTIONS = [
  'Football',
  'Cricket',
  'Hockey',
  'Rugby',
  'Tennis',
  'Pickleball',
  'Pickle',
  'Paddle',
] as const;

export type SportOption = (typeof SPORTS_OPTIONS)[number];

export interface TurfRecord {
  id: string;
  name: string;
  description?: string;
  city?: string;
  state?: string;
  country?: string;
  location?: string;
  address_line?: string;
  sports_supported?: string[];
  opening_time?: string;
  closing_time?: string;
  hourly_rate?: number;
  is_active?: boolean;
  contact_phone?: string;
  contact_email?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CourtSetupDraft {
  courtNumber: number;
  name: string;
  raspberryPiBaseUrl: string;
  nvrChannels: string;
}

export interface VenueSetupDraft {
  name: string;
  sportsSupported: SportOption[];
  city: string;
  state: string;
  country: string;
  location: string;
  description: string;
  openingTime: string;
  closingTime: string;
  latitude: string;
  longitude: string;
  contactPhone: string;
  contactEmail: string;
  courts: CourtSetupDraft[];
}

export interface DatabaseTableCount {
  table: string;
  count: number;
  label: string;
}

export interface DatabaseSnapshot {
  generatedAt: string;
  counts: {
    turfs: number;
    cameras: number;
    users: number;
    recordings: number;
  };
  tableCounts: DatabaseTableCount[];
  fleet: VenueFleet[];
  turfs: TurfRecord[];
}

export interface AdminRecordingItem {
  id: string;
  venueName: string;
  turfId?: string;
  courtName: string;
  courtNumber: number;
  cameraId: string;
  userName: string;
  userPhone: string;
  status: 'completed' | 'extracting' | 'uploaded' | 'failed' | 'in_progress' | string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  playableUrl?: string;
  downloadUrl?: string;
  muxPlaybackId?: string;
  s3Path?: string;
  createdAt: string;
}

export interface AdminExtractionRequestItem {
  id: string;
  userId?: string;
  userName: string;
  userPhone: string;
  venueName: string;
  courtName: string;
  courtNumber: number;
  cameraId: string;
  nvrChannel: number;
  nvrChannels?: number[];
  nvrChannelLabel?: string;
  channelCount?: number;
  recordingIds?: string[];
  status: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number | null;
  linkedHighlightCount: number;
  highlightsInWindow: number;
  muxPlaybackId?: string;
  s3Path?: string;
  hasMux: boolean;
  hasS3: boolean;
  updatedAt: string;
  extractAttempts: number;
  extractSessionKey?: string;
}

export interface AdminPipelineStorageAudit {
  withoutMuxTotal: number;
  withS3NoMux: number;
  byStatusWithoutMux: Array<{ status: string; count: number }>;
  recentS3NoMux: Array<{
    id: string;
    status: string;
    s3Path?: string;
    userName: string;
    courtName: string;
    venueName: string;
    startTime?: string;
    updatedAt?: string;
  }>;
}
