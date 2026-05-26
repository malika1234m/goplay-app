export type UserRole        = "GROUND_OWNER" | "GROUND_WORKER";
export type BookingStatus   = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
export type PaymentMethod   = "ONLINE" | "ON_ARRIVAL";
export type PaymentStatus   = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type FacilityStatus  = "PENDING" | "ACTIVE" | "INACTIVE" | "REJECTED";

export interface AuthUser {
  id:                 string;
  name:               string;
  email:              string;
  role:               UserRole;
  mustChangePassword: boolean;
}

export interface MobileLoginResponse {
  token:     string;
  expiresAt: string;
  user:      AuthUser;
}

// ── Bookings ────────────────────────────────────────────────────────────────

export interface Booking {
  id:              string;
  bookingDate:     string;
  startTime:       string;
  endTime:         string;
  totalHours:      number;
  totalAmount:     number;
  status:          BookingStatus;
  paymentMethod:   PaymentMethod;
  paymentStatus:   PaymentStatus;
  specialRequests: string | null;
  contactNumber:   string | null;
  cancelledAt:     string | null;
  cancelledBy:     string | null;
  user:            { name: string; email: string; phone: string | null };
  facility:        { name: string; city: string };
  court:           { name: string } | null;
}

export interface BookingsResponse {
  bookings: Booking[];
  total:    number;
  page:     number;
  hasMore:  boolean;
}

// ── Stats / Dashboard ───────────────────────────────────────────────────────

export interface OwnerStats {
  monthlyRevenue: number;
  totalBookings:  number;
  activeGrounds:  number;
  totalGrounds:   number;
  avgRating:      number | null;
  totalReviews:   number;
}

export interface TodayBooking {
  id:            string;
  userName:      string;
  facilityName:  string;
  courtName:     string | null;
  startTime:     string;
  endTime:       string;
  totalAmount:   number;
  status:        BookingStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
}

export interface StatsResponse {
  stats:         OwnerStats;
  todayBookings: TodayBooking[];
}

// ── Grounds ─────────────────────────────────────────────────────────────────

export interface Ground {
  id:          string;
  name:        string;
  city:        string;
  status:      FacilityStatus;
  hourlyRate:  number;
  categories:  Array<{ name: string; icon: string | null }>;
  avgRating:   number | null;
  totalReviews:number;
  bookingCount:number;
  courtCount:  number;
}

export interface GroundsResponse {
  grounds: Ground[];
}

export interface GroundDetail {
  id:          string;
  name:        string;
  description: string | null;
  address:     string;
  city:        string;
  hourlyRate:  number;
  capacity:    number | null;
  amenities:   string[];
  images:      string[];
  status:      FacilityStatus;
  latitude:    number | null;
  longitude:   number | null;
  categories:  Array<{ id: string; name: string; icon: string | null }>;
}

export interface Court {
  id:          string;
  facilityId:  string;
  name:        string;
  description: string | null;
  isActive:    boolean;
  sortOrder:   number;
  createdAt:   string;
  _count:      { bookings: number };
}

export interface AvailabilityDay {
  dayOfWeek: number;
  isOpen:    boolean;
  openTime:  string;
  closeTime: string;
}

export interface BlockedDate {
  id:           string;
  facilityId:   string;
  facilityName: string;
  date:         string;
  startTime:    string | null;
  endTime:      string | null;
  reason:       string | null;
}

export interface Category {
  id:   string;
  name: string;
  icon: string | null;
}

// ── Earnings ─────────────────────────────────────────────────────────────────

export interface EarningsSummary {
  totalGross: number;
  totalFee:   number;
  totalNet:   number;
  totalCount: number;
  cashPending: number;
}

export interface EarningRecord {
  id:             string;
  earnedAt:       string;
  grossAmount:    number;
  platformFee:    number;
  netAmount:      number;
  paymentMethod:  "ONLINE" | "ON_ARRIVAL";
  cashConfirmed:  boolean;
  commissionNote: string | null;
  booking: {
    bookingDate:     string;
    startTime:       string;
    endTime:         string;
    totalHours:      number;
    specialRequests: string | null;
    user:            { name: string; email: string };
    court:           { name: string } | null;
  };
  facility: { id: string; name: string; city: string };
}

export interface EarningsByFacility {
  facilityId:   string;
  facilityName: string;
  facilityCity: string;
  gross:    number;
  fee:      number;
  net:      number;
  count:    number;
  earnings: EarningRecord[];
}

export interface OnlineEarning {
  id:          string;
  earnedAt:    string;
  grossAmount: number;
  platformFee: number;
  netAmount:   number;
  facility:    { id: string; name: string; city: string };
  booking: {
    bookingDate: string;
    startTime:   string;
    endTime:     string;
    totalHours:  number;
    user:        { name: string };
  };
}

export interface EarningsResponse {
  summary:    EarningsSummary;
  byFacility: EarningsByFacility[];
}

export interface TrendsResponse {
  trends: { labels: string[]; revenue: number[] };
}

// ── Payouts ──────────────────────────────────────────────────────────────────

export type PayoutStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface Payout {
  id:          string;
  amount:      number;
  commission:  number;
  netAmount:   number;
  status:      PayoutStatus;
  requestedAt: string;
  processedAt: string | null;
  reference:   string | null;
  notes:       string | null;
}

export interface PayoutBalance {
  grossOnline:       number;
  feeOnline:         number;
  netOnline:         number;
  paidOut:           number;
  inFlight:          number;
  availableBalance:  number;
}

export interface PayoutCommission {
  totalCommission:  number;
  paidCommission:   number;
  unpaidCommission: number;
  cashUnpaid:       number;
}

export interface PayoutResponse {
  balance:               PayoutBalance;
  commission:            PayoutCommission;
  hasBankDetails:        boolean;
  onlineEarnings:        OnlineEarning[];
  payouts:               Payout[];
  commissionSettlements: Payout[];
  cooldownRemaining:     number;
  pendingCommissionRequest: { requestedAt: string; amount: number } | null;
  settings: {
    commissionRate:     number;
    minPayout:          number;
    payoutCooldownDays: number;
  };
}

export interface BankDetails {
  bankName:          string | null;
  bankBranch:        string | null;
  accountNumber:     string | null;
  accountHolderName: string | null;
}

// ── Reviews ──────────────────────────────────────────────────────────────────

export interface Review {
  id:           string;
  rating:       number;
  reviewText:   string | null;
  reported:     boolean;
  reportReason: string | null;
  createdAt:    string;
  userName:     string;
  facilityName: string;
}

export interface ReviewStats {
  avgRating:    number | null;
  total:        number;
  reported:     number;
  thisWeek:     number;
  distribution: Array<{ star: number; count: number }>;
}

export interface ReviewsResponse {
  stats:         ReviewStats;
  reviews:       Review[];
  filteredTotal: number;
  page:          number;
  hasMore:       boolean;
}

// ── Workers ──────────────────────────────────────────────────────────────────

export interface Worker {
  id:       string;
  userId:   string;
  name:     string;
  email:    string;
  joinedAt: string;
}

export interface WorkersResponse {
  workers: Worker[];
}

// ── Worker app data ──────────────────────────────────────────────────────────

export interface WorkerBooking {
  id:              string;
  bookingDate:     string;
  startTime:       string;
  endTime:         string;
  status:          BookingStatus;
  paymentMethod:   PaymentMethod;
  paymentStatus:   PaymentStatus;
  totalAmount:     number;
  playerName:      string;
  playerEmail:     string;
  playerPhone:     string | null;
  contactNumber:   string | null;
  specialRequests: string | null;
  courtName:       string | null;
}

export interface WorkerBookingsResponse {
  bookings: WorkerBooking[];
}

export interface WorkerFacility {
  id:           string;
  name:         string;
  address:      string;
  city:         string;
  hourlyRate:   number;
  categories:   string[];
  ownerName:    string;
  courts:       Array<{ id: string; name: string }>;
  availability: Array<{ dayOfWeek: number; isOpen: boolean; openTime: string; closeTime: string }>;
}

export interface WorkerFacilityResponse {
  facility: WorkerFacility;
}

export interface WorkerProfileResponse {
  user: {
    id:        string;
    name:      string;
    email:     string;
    phone:     string | null;
    createdAt: string;
  };
  facility:    {
    name:       string;
    city:       string;
    address:    string;
    categories: Array<{ name: string; icon: string | null }>;
  } | null;
  workerSince: string | null;
  stats:       { walkins: number };
}
