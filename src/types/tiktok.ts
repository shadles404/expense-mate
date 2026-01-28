export type AdType = 'Milk' | 'Makeup' | 'Perfume' | 'Cream' | 'Skincare' | 'Other';
export type PlatformType = 'TikTok' | 'Instagram' | 'YouTube' | 'Facebook' | 'Other';
export type ContractType = 'Full-time' | 'Part-time' | 'Freelance' | 'Contract';
export type DeliveryStatus = 'pending' | 'approved' | 'rejected';
export type ProductDeliveryStatus = 'pending' | 'sent' | 'returned';
export type PaymentStatus = 'paid' | 'unpaid';
export type AppRole = 'admin' | 'moderator' | 'user';

export interface TikTokAdvertiser {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  salary: number;
  target_videos: number;
  completed_videos: number;
  platform: PlatformType;
  contract_type: ContractType;
  ad_types: AdType[];
  notes: string | null;
  targets_locked: boolean;
  created_at: string;
  updated_at: string;
}

export interface TikTokDelivery {
  id: string;
  user_id: string;
  advertiser_id: string;
  video_link: string;
  submission_date: string;
  verified_by: string | null;
  verified_at: string | null;
  status: DeliveryStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  advertiser?: TikTokAdvertiser;
}

export interface TikTokProductDelivery {
  id: string;
  user_id: string;
  advertiser_id: string;
  product_name: string;
  quantity: number;
  date_sent: string;
  status: ProductDeliveryStatus;
  price: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  advertiser?: TikTokAdvertiser;
}

export interface TikTokPayment {
  id: string;
  user_id: string;
  advertiser_id: string;
  amount: number;
  status: PaymentStatus;
  payment_date: string | null;
  receipt_url: string | null;
  approved_by: string | null;
  approved_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  advertiser?: TikTokAdvertiser;
}

export interface TikTokSettings {
  id: string;
  user_id: string;
  default_platform: PlatformType;
  default_contract_type: ContractType;
  currency: string;
  tax_rate: number;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export const AD_TYPES: AdType[] = ['Milk', 'Makeup', 'Perfume', 'Cream', 'Skincare', 'Other'];
export const PLATFORM_TYPES: PlatformType[] = ['TikTok', 'Instagram', 'YouTube', 'Facebook', 'Other'];
export const CONTRACT_TYPES: ContractType[] = ['Full-time', 'Part-time', 'Freelance', 'Contract'];
export const PRODUCT_DELIVERY_STATUSES: ProductDeliveryStatus[] = ['pending', 'sent', 'returned'];
