
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { federationConfig } from '@/config';
import { CreditCard, Landmark, PiggyBank, Flag, RefreshCw, Share2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getPassport, type Passport, getFederationMemberCount } from '@/services/passport-service';
import { getRecentActivity, type ActivityLog } from '@/services/activity-log-service';
import { useState, useEffect, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { generateFederationFlag } from '@/ai/flows/generate-federation-flag-flow';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { rtdb, storage } from '@/lib/firebase';
import { ref as dbRef, onValue, off, set } from 'firebase/database';
import { ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage';
import { sha256 } from '@/lib/crypto';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [passport, setPassport] = useState<Passport | null>(null);
  const [passportDigest, setPassportDigest] = useState('');
  const [memberCount, setMemberCount] = useState(0);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [federationFlagUrl, setFederationFlagUrl] = useState<string | null>(null);
  const [isGeneratingFlag, setIsGeneratingFlag] = useState(false);
  const [publicUrl, setPublicUrl] = useState('');

  // This function now handles caching based on a hash of the passport digest.
  const handleFlagGeneration = useCallback(async (digest: string, forceRegenerate = false) => {
    if (!user) return;
    setIsGeneratingFlag(true);

    try {
      const flagId = await sha256(digest);
      const filePath = `federation_flags/${flagId}.png`;
      const fileRef = storageRef(storage, filePath);
      const flagUrlDbRef = dbRef(rtdb, `users/${user.uid}/federation/flagUrl`);

      let downloadURL: string | null = null;
      
      if (!forceRegenerate) {
        try {
          downloadURL = await getDownloadURL(fileRef);
        } catch (error: any) {
          if (error.code !== 'storage/object-not-found') {
            console.warn("Error checking for existing flag:", error);
          }
        }
      }

      if (downloadURL) {
        await set(flagUrlDbRef, downloadURL);
      } else {
        if (forceRegenerate) {
          toast({ title: "Regenerating Flag...", description: "A new flag is being forged for the federation." });
        }
        
        const prompt = `A futuristic, cyberpunk-style national flag for a digital sovereign state named '${federationConfig.federationName}'. The flag's design must be cryptographically derived from the following unique data hash, representing the state's identity: '${flagId}'. The design must be intricate, abstract, and incorporate the federation's theme colors - vibrant orange (#f56502) and green (#15b56d) - as glowing, neon-like elements against a dark, textured background.`;
        
        const salt = forceRegenerate ? Math.random().toString() : digest;

        const { dataUri } = await generateFederationFlag({ prompt, salt });

        if (!dataUri) {
          throw new Error("AI flow did not return image data.");
        }

        const uploadResult = await uploadString(fileRef, dataUri, 'data_url');
        const newDownloadURL = await getDownloadURL(uploadResult.ref);

        await set(flagUrlDbRef, newDownloadURL);
      }
    } catch (error) {
      console.error("Failed during flag generation:", error);
      const err = error instanceof Error ? error.message : "Could not create the Federation Flag.";
      toast({ title: "Flag Error", description: err, variant: "destructive" });
    } finally {
      setIsGeneratingFlag(false);
    }
  }, [user, toast]);


  useEffect(() => {
    if (user) {
      setPublicUrl(`${window.location.origin}/federation/${user.uid}`);
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
  
  useEffect(() => {
    if (passport) {
      setPassportDigest(createPassportDigest(passport));
    }
  }, [passport]);

  useEffect(() => {
    if (!user) return;
    const flagUrlRef = dbRef(rtdb, `users/${user.uid}/federation/flagUrl`);
    
    const unsubscribe = onValue(flagUrlRef, (snapshot) => {
      const url = snapshot.val();
      if (url) {
        setFederationFlagUrl(url);
      }
    });

    return () => off(flagUrlRef, 'value', unsubscribe);
  }, [user]);

  useEffect(() => {
    if (passportDigest) {
      handleFlagGeneration(passportDigest);
    }
  }, [passportDigest, handleFlagGeneration]);
  
  const regenerateFlag = useCallback(() => {
    if (!passportDigest) return;
    handleFlagGeneration(passportDigest, true);
  }, [passportDigest, handleFlagGeneration]);

  const MOCK_BTC_USD_RATE = 50000;

  const parseCurrency = (value: string): number => {
    const numericString = value.replace(/[^0-9.]/g, '');
    return parseFloat(numericString) || 0;
  };

  const totalAssetValueUsd = (passport?.physicalAssets?.reduce((sum, asset) => sum + parseCurrency(asset.value), 0) || 0) +
                             (passport?.ipTokens?.reduce((sum, token) => sum + parseCurrency(token.value), 0) || 0);

  const passportValueInBtc = totalAssetValueUsd / MOCK_BTC_USD_RATE;

  const teoBalance = passport?.teoBalance || 0;
  const totalAssets = (passport?.physicalAssets?.length || 0) + (passport?.ipTokens?.length || 0);
  const MOCK_BTC_BALANCE = 100;
  
  const otherMemberCount = memberCount > 0 ? memberCount - 1 : 0;
  const stats = [
    { title: 'Passport Value', value: `${passportValueInBtc.toFixed(4)} BTC`, icon: CreditCard, description: `Based on your ${totalAssets} tokenized assets` },
    { title: 'BTC Balance', value: `${MOCK_BTC_BALANCE.toLocaleString()} BTC`, icon: Landmark, description: 'From your connected UniSat wallet (mock)' },
    { title: `${federationConfig.tokenSymbol} Balance`, value: `${teoBalance.toLocaleString()} ${federationConfig.tokenSymbol}`, icon: PiggyBank, description: 'Your federation currency' },
    { title: 'Federation States', value: memberCount.toLocaleString(), icon: Flag, description: `1 Capital (You) + ${otherMemberCount.toLocaleString()} members` },
  ];

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    toast({ title: "Copied!", description: "Public federation URL copied to clipboard." });
  };

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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Federation Flag</CardTitle>
                <CardDescription>The official flag of the {federationConfig.federationName} federation, generated from the Capital State's passport.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Share2 className="h-4 w-4" />
                      <span className="sr-only">Share Federation</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Share your Federation</DialogTitle>
                      <DialogDescription>
                        Anyone with this link can view your public federation page and interact with the AI ambassador.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center space-x-2">
                      <div className="grid flex-1 gap-2">
                        <Label htmlFor="link" className="sr-only">
                          Link
                        </Label>
                        <Input
                          id="link"
                          defaultValue={publicUrl}
                          readOnly
                        />
                      </div>
                      <Button type="button" size="sm" className="px-3" onClick={handleCopyUrl}>
                        <span className="sr-only">Copy</span>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                {federationFlagUrl && (
                  <Button variant="outline" size="icon" onClick={regenerateFlag} disabled={isGeneratingFlag}>
                      <RefreshCw className="h-4 w-4" />
                      <span className="sr-only">Regenerate Flag</span>
                  </Button>
                )}
              </div>
            </div>
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
                    unoptimized
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
