import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useTikTokAdvertisers } from '@/hooks/useTikTokAdvertisers';
import { AD_TYPES, PLATFORM_TYPES, CONTRACT_TYPES, AdType, PlatformType, ContractType } from '@/types/tiktok';
import { UserPlus, Loader2 } from 'lucide-react';

const registrationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  salary: z.number().min(0, 'Salary must be positive'),
  target_videos: z.number().min(1, 'Target must be at least 1'),
  platform: z.enum(['TikTok', 'Instagram', 'YouTube', 'Facebook', 'Other'] as const),
  contract_type: z.enum(['Full-time', 'Part-time', 'Freelance', 'Contract'] as const),
  ad_types: z.array(z.enum(['Milk', 'Makeup', 'Perfume', 'Cream', 'Skincare', 'Other'] as const)).min(1, 'Select at least one ad type'),
  notes: z.string().optional(),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

export default function TikTokRegistration() {
  const { createAdvertiser } = useTikTokAdvertisers();
  const [selectedAdTypes, setSelectedAdTypes] = useState<AdType[]>([]);

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: '',
      phone: '',
      salary: 0,
      target_videos: 1,
      platform: 'TikTok',
      contract_type: 'Freelance',
      ad_types: [],
      notes: '',
    },
  });

  const onSubmit = async (data: RegistrationFormData) => {
    await createAdvertiser.mutateAsync({
      name: data.name,
      phone: data.phone || undefined,
      salary: data.salary,
      target_videos: data.target_videos,
      platform: data.platform,
      contract_type: data.contract_type,
      ad_types: data.ad_types,
      notes: data.notes || undefined,
    });
    form.reset();
    setSelectedAdTypes([]);
  };

  const handleAdTypeChange = (type: AdType, checked: boolean) => {
    const newTypes = checked 
      ? [...selectedAdTypes, type]
      : selectedAdTypes.filter(t => t !== type);
    setSelectedAdTypes(newTypes);
    form.setValue('ad_types', newTypes);
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Register Advertiser</h1>
          <p className="mt-1 text-muted-foreground">Add a new team member to your TikTok advertising team</p>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              New Advertiser Registration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Advertiser name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="salary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Salary *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0.00"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="target_videos"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Videos *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            placeholder="1"
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="platform"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Platform *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select platform" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PLATFORM_TYPES.map(platform => (
                              <SelectItem key={platform} value={platform}>
                                {platform}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contract_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contract Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select contract type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CONTRACT_TYPES.map(type => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="ad_types"
                  render={() => (
                    <FormItem>
                      <FormLabel>Advertisement Types *</FormLabel>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                        {AD_TYPES.map(type => (
                          <div key={type} className="flex items-center space-x-2">
                            <Checkbox
                              id={type}
                              checked={selectedAdTypes.includes(type)}
                              onCheckedChange={(checked) => handleAdTypeChange(type, checked as boolean)}
                            />
                            <label
                              htmlFor={type}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {type}
                            </label>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional notes about the advertiser..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={createAdvertiser.isPending}
                    className="gap-2"
                  >
                    {createAdvertiser.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                    Register Advertiser
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
