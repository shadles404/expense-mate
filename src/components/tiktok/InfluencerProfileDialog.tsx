import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { format, parseISO, differenceInDays } from 'date-fns';
import { User, Phone, DollarSign, Calendar, Target, Video } from 'lucide-react';
import type { TikTokInfluencer } from '@/types/tiktok';

interface InfluencerProfileDialogProps {
  influencer: TikTokInfluencer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InfluencerProfileDialog({ influencer, open, onOpenChange }: InfluencerProfileDialogProps) {
  if (!influencer) return null;

  const pct = influencer.target_videos > 0 
    ? Math.min(100, (influencer.completed_videos / influencer.target_videos) * 100) 
    : 0;
  const reached = influencer.target_videos > 0 && influencer.completed_videos >= influencer.target_videos;

  const contractDaysLeft = influencer.agreement_end_date 
    ? differenceInDays(parseISO(influencer.agreement_end_date), new Date())
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span>{influencer.name}</span>
              <div className="flex gap-2 mt-1">
                <Badge variant={influencer.is_active ? 'default' : 'secondary'}>
                  {influencer.is_active ? 'Active' : 'Inactive'}
                </Badge>
                {influencer.platform && (
                  <Badge variant="outline">{influencer.platform}</Badge>
                )}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Information Section */}
          <div className="grid grid-cols-2 gap-4">
            <InfoRow icon={User} label="Name" value={influencer.name} />
            <InfoRow icon={Phone} label="Phone" value={influencer.phone || '—'} />
            <InfoRow icon={Video} label="Platform" value={influencer.platform || 'TikTok'} />
            <InfoRow icon={DollarSign} label="Salary" value={`$${influencer.salary.toFixed(2)}`} />
            <InfoRow icon={Calendar} label="Contract Type" value={influencer.contract_type || 'Freelance'} />
            <InfoRow icon={Target} label="Category" value={influencer.category || '—'} />
          </div>

          <Separator />

          {/* Contract Dates */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Contract Period</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Start Date</p>
                <p className="font-medium text-sm">
                  {influencer.agreement_start_date ? format(parseISO(influencer.agreement_start_date), 'MMM d, yyyy') : '—'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">End Date</p>
                <p className="font-medium text-sm">
                  {influencer.agreement_end_date ? format(parseISO(influencer.agreement_end_date), 'MMM d, yyyy') : '—'}
                </p>
              </div>
            </div>
            {contractDaysLeft !== null && (
              <div className={`mt-2 p-2 rounded text-xs font-medium ${
                contractDaysLeft <= 0 ? 'bg-destructive/10 text-destructive' :
                contractDaysLeft <= 7 ? 'bg-destructive/10 text-destructive' :
                contractDaysLeft <= 30 ? 'bg-yellow-500/10 text-yellow-600' :
                'bg-primary/10 text-primary'
              }`}>
                {contractDaysLeft <= 0 ? `⚠ Contract expired ${Math.abs(contractDaysLeft)} days ago` :
                 contractDaysLeft <= 7 ? `⚠ Contract expires in ${contractDaysLeft} day(s)` :
                 `${contractDaysLeft} days remaining`}
              </div>
            )}
          </div>

          <Separator />

          {/* Target Progress */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Target Progress</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{influencer.completed_videos} / {influencer.target_videos} videos</span>
                <Badge variant={reached ? 'default' : 'destructive'}>{reached ? 'Reached' : 'Unreached'}</Badge>
              </div>
              <Progress value={pct} className="h-2" />
            </div>
          </div>

          {influencer.notes && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold mb-1">Notes</h4>
                <p className="text-sm text-muted-foreground">{influencer.notes}</p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
