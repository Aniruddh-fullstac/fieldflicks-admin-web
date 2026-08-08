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
  isConfigured?: boolean;
  status: 'ONLINE' | 'OFFLINE' | 'RECORDING' | 'STREAMING' | 'UNCONFIGURED';
  isLiveStreaming?: boolean;
  livePlaybackUrl?: string;
}

export interface VenueFleet {
  turfId: string;
  turfName: string;
  city: string;
  address?: string;
  sportsSupported?: string[];
  courtsCount: number;
  courts: CourtCamera[];
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
  muxPlaybackId?: string;
  s3Path?: string;
  createdAt: string;
}
