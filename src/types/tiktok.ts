export interface TikTokInfluencer {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  tiktok_username: string | null;
  category: string | null;
  target_videos: number;
  completed_videos: number;
  salary: number;
  is_active: boolean;
  agreement_start_date: string | null;
  agreement_end_date: string | null;
  notes: string | null;
  targets_locked: boolean;
  platform: string;
  contract_type: string;
  ad_types: string[];
  created_at: string;
  updated_at: string;
}

export interface TikTokVideoDelivery {
  id: string;
  user_id: string;
  advertiser_id: string;
  video_link: string;
  submission_date: string;
  status: 'pending' | 'approved' | 'rejected';
  notes: string | null;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
  advertiser?: TikTokInfluencer;
}

export interface TikTokProductDelivery {
  id: string;
  user_id: string;
  advertiser_id: string;
  product_name: string;
  quantity: number;
  date_sent: string;
  status: 'pending' | 'sent' | 'returned';
  price: number;
  company_name: string | null;
  delivery_person: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  advertiser?: TikTokInfluencer;
}

export interface TikTokPayment {
  id: string;
  user_id: string;
  advertiser_id: string;
  amount: number;
  status: 'paid' | 'unpaid' | 'pending' | 'suspended';
  payment_date: string | null;
  campaign_month: string | null;
  total_target_videos: number;
  completed_videos: number;
  notes: string | null;
  receipt_url: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  advertiser?: TikTokInfluencer;
}

export interface PaymentAuditLog {
  id: string;
  payment_id: string;
  changed_by: string;
  old_status: string | null;
  new_status: string;
  notes: string | null;
  created_at: string;
}

export interface TikTokSettings {
  id: string;
  user_id: string;
  currency: string | null;
  default_platform: string | null;
  default_contract_type: string | null;
  tax_rate: number | null;
  created_at: string;
  updated_at: string;
}
