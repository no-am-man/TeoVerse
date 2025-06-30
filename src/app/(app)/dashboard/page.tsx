
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { federationConfig } from '@/config';
import { CreditCard, Landmark, PiggyBank, Flag } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getPassport, type Passport, getFederationMemberCount } from '@/services/passport-service';
import { getRecentActivity, type ActivityLog } from '@/services/activity-log-service';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { geny } from '@/ai/flows/geny-flow';
import Image from 'next/image';

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [passport, setPassport] = useState<Passport | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [federationFlagUrl, setFederationFlagUrl] = useState<string | null>(null);
  const [isGeneratingFlag, setIsGeneratingFlag] = useState(false);

  useEffect(() => {
    if (user) {
      Promise.all([
        getPassport(user.uid),
        getFederationMemberCount(),
        getRecentActivity(user.uid),
      ]).then(([p, count, act]) => {
        setPassport(p);
        setMemberCount(count);
        setActivity(act);
      }).catch(error => {
        console.error("Failed to fetch dashboard data:", error);
        toast({ title: "Error", description: "Could not fetch dashboard data.", variant: "destructive" });
      }).finally(() => {
        setLoading(false);
      });
    } else if (user === null) {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (passport) {
      const generateFlag = async () => {
        setIsGeneratingFlag(true);
        try {
          const createPassportDigest = (p: Passport): string => {
            const dataToHash = {
              id: p.id,
              email: p.email,
              teoBalance: p.teoBalance,
              physicalAssets: [...p.physicalAssets]
                .sort((a, b) => a.id.localeCompare(b.id))
                .map(({ id, name, type, value }) => ({ id, name, type, value })),
              ipTokens: [...p.ipTokens]
                .sort((a, b) => a.id.localeCompare(b.id))
                .map(({ id, name, value }) => ({ id, name, value })),
            };
            return JSON.stringify(dataToHash);
          };

          const passportDigest = createPassportDigest(passport);
          const prompt = `Generate a futuristic, cyberpunk-style flag for the ${federationConfig.federationName} federation. The flag's design is derived from the Capital State's passport, representing the core identity of the federation. The identity data used to generate the flag is: ${passportDigest}. The design should be intricate and unique, incorporating the app's theme colors: deep purple (#673AB7) and teal (#009688) as glowing elements against a dark background. It should look like a national flag for a digital sovereign state.`;

          const response = await geny({
            prompt: prompt,
            imageSize: { width: 400, height: 400 }
          });

          setFederationFlagUrl(response.url);
        } catch (error) {
          console.error("Failed to generate Federation flag:", error);
          toast({ title: "Flag Error", description: "Could not generate the Federation Flag.", variant: "destructive" });
        } finally {
          setIsGeneratingFlag(false);
        }
      };
      generateFlag();
    }
  }, [passport, toast]);
  
  const MOCK_RATE = 10000; // From DEX page: 1 BTC = 10000 TEO
  const teoBalance = passport?.teoBalance || 0;
  const passportValueInBtc = teoBalance / MOCK_RATE;
  const totalAssets = (passport?.physicalAssets?.length || 0) + (passport?.ipTokens?.length || 0);
  const MOCK_BTC_BALANCE = 100;
  
  const otherMemberCount = memberCount > 0 ? memberCount - 1 : 0;
  const stats = [
    { title: 'Passport Value', value: `${passportValueInBtc.toFixed(4)} BTC`, icon: CreditCard, description: `Based on your ${federationConfig.tokenSymbol} balance` },
    { title: 'BTC Balance', value: `${MOCK_BTC_BALANCE.toLocaleString()} BTC`, icon: Landmark, description: 'From your connected UniSat wallet (mock)' },
    { title: `${federationConfig.tokenSymbol} Balance`, value: `${teoBalance.toLocaleString()} ${federationConfig.tokenSymbol}`, icon: PiggyBank, description: 'Your federation currency' },
    { title: 'Federation States', value: memberCount.toLocaleString(), icon: Flag, description: `1 Capital (You) + ${otherMemberCount.toLocaleString()} members` },
  ];

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div>
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <div className="grid gap-8 md:grid-cols-2">
          <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
          <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to the {federationConfig.federationName} Federation.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>A log of your recent transactions and mints.</CardDescription>
          </CardHeader>
          <CardContent>
             {activity.length > 0 ? (
              <div className="space-y-4">
                {activity.map((item) => (
                  <div key={item.id} className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium leading-none">{item.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.createdAt ? formatDistanceToNow(item.createdAt, { addSuffix: true }) : 'Just now'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No recent activity.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Federation Flag</CardTitle>
            <CardDescription>The official flag of the {federationConfig.federationName} federation, generated from the Capital State's passport.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-4 pt-4">
             {isGeneratingFlag ? (
                <Skeleton className="h-48 w-48 rounded-lg" />
            ) : federationFlagUrl ? (
                <Image
                    src={federationFlagUrl}
                    alt="Federation Flag"
                    width={192}
                    height={192}
                    className="rounded-lg border-2 border-primary/50 shadow-lg"
                    data-ai-hint="federation flag"
                />
            ) : (
                <div className="flex h-48 w-48 items-center justify-center rounded-lg border-2 border-dashed">
                    <p className="text-center text-sm text-muted-foreground">Your federation flag will be generated here.</p>
                </div>
            )}
            <p className="text-center text-sm text-muted-foreground">You have {totalAssets} tokenized assets.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
