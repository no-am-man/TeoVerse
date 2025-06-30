
"use client";

import { useState, useEffect, ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Computer, Smartphone, Home, BrainCircuit, FileText, User as UserIcon, Coins, MoreHorizontal, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { federationConfig } from '@/config';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { createPassport, getPassport, updatePassport, mintTeos, deletePassport, type Passport, type IpToken, type PhysicalAsset, type ActivityType } from '@/services/passport-service';
import { addActivityLog } from '@/services/activity-log-service';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';

const assetFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  type: z.string().optional(),
  value: z.string().min(1, { message: "Value is required." }),
});

type AssetFormValues = z.infer<typeof assetFormSchema>;

const mintFormSchema = z.object({
  amount: z.string().min(1, { message: "Please enter an amount." }).refine(
    (val) => Number(val) > 0,
    { message: "Amount must be a positive number." }
  ),
});

type MintFormValues = z.infer<typeof mintFormSchema>;

export default function PassportPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [passport, setPassport] = useState<Passport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMinting, setIsMinting] = useState(false);
  
  const [isAddAssetDialogOpen, setIsAddAssetDialogOpen] = useState(false);
  const [assetTypeToAdd, setAssetTypeToAdd] = useState<'physical' | 'ip' | null>(null);
  const [isDeletePassportAlertOpen, setIsDeletePassportAlertOpen] = useState(false);
  
  const [assetToDelete, setAssetToDelete] = useState<{ id: string; name: string; type: 'physical' | 'ip' } | null>(null);
  const [isDeleteAssetAlertOpen, setIsDeleteAssetAlertOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      getPassport(user.uid)
        .then(setPassport)
        .catch(error => {
          console.error("Failed to fetch passport:", error);
          toast({ title: "Error", description: "Could not fetch passport data.", variant: "destructive" });
        })
        .finally(() => setIsLoading(false));
    } else if (user === null) {
      setIsLoading(false);
    }
  }, [user, toast]);

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: { name: "", type: "", value: "" },
  });

  const mintForm = useForm<MintFormValues>({
    resolver: zodResolver(mintFormSchema),
    defaultValues: { amount: "" },
  });

  const handleMintPassport = async () => {
    if (!user) return;
    setIsMinting(true);
    toast({
        title: "Minting Passport...",
        description: "Your sovereign identity is being created on the federation.",
    });

    try {
      const newPassport = await createPassport(user, federationConfig.federationURL);
      setPassport(newPassport);
      toast({
          title: "Passport Minted!",
          description: "Congratulations! You are now a citizen of the federation.",
      });
    } catch (error) {
      console.error("Failed to mint passport:", error);
      const errorMessage = error instanceof Error ? error.message : "There was an error creating your passport. Please try again.";
      toast({
          title: "Minting Failed",
          description: errorMessage,
          variant: "destructive",
      });
    } finally {
      setIsMinting(false);
    }
  };
  
  const getAssetIcon = (type: string): ReactNode => {
    switch (type.toLowerCase()) {
        case 'bio': return <UserIcon className="h-4 w-4" />;
        case 'real estate': return <Home className="h-4 w-4" />;
        case 'electronics': return <Computer className="h-4 w-4" />;
        case 'phone': return <Smartphone className="h-4 w-4" />;
        case 'teoverse concept': return <BrainCircuit className="h-4 w-4" />;
        default: return <FileText className="h-4 w-4" />;
    }
  };

  const handleAddAsset = async (values: AssetFormValues) => {
    if (!user || !passport) return;

    const newAsset = {
        id: new Date().toISOString(),
        name: values.name,
        value: values.value,
        type: values.type || '',
        forSale: false,
    };

    try {
      if (assetTypeToAdd === 'physical') {
        const updatedAssets = [...(passport.physicalAssets || []), newAsset as PhysicalAsset];
        await updatePassport(user.uid, { physicalAssets: updatedAssets });
        setPassport(prev => prev ? { ...prev, physicalAssets: updatedAssets } : null);
        await addActivityLog(user.uid, 'ADD_PHYSICAL_ASSET', `Added physical asset: ${values.name}`);
        toast({ title: "Physical Asset Added", description: `${values.name} has been added to your passport.` });
      } else if (assetTypeToAdd === 'ip') {
        const newIpToken: IpToken = { id: newAsset.id, name: newAsset.name, value: newAsset.value, forSale: false };
        const updatedTokens = [...(passport.ipTokens || []), newIpToken];
        await updatePassport(user.uid, { ipTokens: updatedTokens });
        setPassport(prev => prev ? { ...prev, ipTokens: updatedTokens } : null);
        await addActivityLog(user.uid, 'MINT_IP_TOKEN', `Minted IP token: ${values.name}`);
        toast({ title: "IP Token Minted", description: `Token for ${values.name} has been minted.` });
      }
      setIsAddAssetDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error("Failed to add asset:", error);
      toast({ title: "Error", description: "Failed to update passport.", variant: "destructive" });
    }
  };

  const handleToggleForSale = async (itemId: string, itemType: 'physical' | 'ip') => {
    if (!user || !passport) return;

    const originalPassport = passport;
    let updatedPassport: Passport | null = null;
    let updatedDescription = "";

    if (itemType === 'physical') {
        const updatedAssets = originalPassport.physicalAssets.map(asset =>
            asset.id === itemId ? { ...asset, forSale: !asset.forSale } : asset
        );
        updatedPassport = { ...originalPassport, physicalAssets: updatedAssets };
        const changedAsset = updatedAssets.find(a => a.id === itemId);
        updatedDescription = `${changedAsset?.name} is now ${changedAsset?.forSale ? 'listed for sale' : 'no longer for sale'}.`;
    } else { // 'ip'
        const updatedTokens = originalPassport.ipTokens.map(token =>
            token.id === itemId ? { ...token, forSale: !token.forSale } : token
        );
        updatedPassport = { ...originalPassport, ipTokens: updatedTokens };
        const changedToken = updatedTokens.find(t => t.id === itemId);
        updatedDescription = `IP Token ${changedToken?.name} is now ${changedToken?.forSale ? 'listed for sale' : 'no longer for sale'}.`;
    }

    setPassport(updatedPassport); // Optimistic UI update

    try {
        await updatePassport(user.uid, {
            physicalAssets: updatedPassport.physicalAssets,
            ipTokens: updatedPassport.ipTokens
        });
        toast({ title: "Update Successful", description: updatedDescription });
    } catch (error) {
        setPassport(originalPassport); // Revert on error
        toast({ title: "Error", description: "Failed to update asset status.", variant: "destructive" });
    }
  };

  const handleDeleteAsset = async () => {
    if (!user || !passport || !assetToDelete) return;

    try {
      let updatedPassport: Passport;
      let logDescription: string;
      let logType: ActivityType;

      if (assetToDelete.type === 'physical') {
        const updatedAssets = passport.physicalAssets.filter(asset => asset.id !== assetToDelete.id);
        updatedPassport = { ...passport, physicalAssets: updatedAssets };
        logDescription = `Removed physical asset: ${assetToDelete.name}`;
        logType = 'REMOVE_PHYSICAL_ASSET';
      } else {
        const updatedTokens = passport.ipTokens.filter(token => token.id !== assetToDelete.id);
        updatedPassport = { ...passport, ipTokens: updatedTokens };
        logDescription = `Burned IP token: ${assetToDelete.name}`;
        logType = 'BURN_IP_TOKEN';
      }
      
      await updatePassport(user.uid, {
          physicalAssets: updatedPassport.physicalAssets,
          ipTokens: updatedPassport.ipTokens
      });
      await addActivityLog(user.uid, logType, logDescription);
      
      setPassport(updatedPassport);
      toast({ title: "Asset Removed", description: `The asset "${assetToDelete.name}" has been removed.` });

    } catch (error) {
      console.error("Failed to delete asset:", error);
      toast({ title: "Error", description: "Failed to remove asset.", variant: "destructive" });
    } finally {
      setIsDeleteAssetAlertOpen(false);
      setAssetToDelete(null);
    }
  };


  const handleMintTeos = async (values: MintFormValues) => {
    if (!user) return;
    const amount = Number(values.amount);
    try {
      await mintTeos(user.uid, amount);
      setPassport(prev => prev ? { ...prev, teoBalance: (prev.teoBalance || 0) + amount } : null);
      toast({
        title: 'Tokens Minted!',
        description: `You have successfully minted ${values.amount} ${federationConfig.tokenSymbol}.`,
      });
      mintForm.reset();
    } catch (error) {
      console.error("Failed to mint TEOs:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to mint tokens.";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }
  };
  
  const handleDeletePassport = async () => {
    if (!user) return;
    try {
        await deletePassport(user.uid);
        setPassport(null); 
        toast({
            title: "Passport Deleted",
            description: "Your passport has been successfully deleted. You can now mint a new one.",
        });
    } catch (error) {
        console.error("Failed to delete passport:", error);
        toast({
            title: "Error",
            description: "Failed to delete your passport. Please try again.",
            variant: "destructive"
        });
    } finally {
        setIsDeletePassportAlertOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div>
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-4 w-3/4 mt-2" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-2/3 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4 max-w-sm">
              <div className="flex-grow space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-10 w-24" />
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-8 lg:grid-cols-2">
          <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-32 w-full" /></CardContent></Card>
          <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-32 w-full" /></CardContent></Card>
        </div>
      </div>
    );
  }

  if (!passport) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Mint Your Passport</CardTitle>
            <CardDescription>
              Create your unique, self-referencing NFT identity token to join the {federationConfig.federationName} federation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="lg" onClick={handleMintPassport} disabled={isMinting}>
              {isMinting ? 'Minting...' : 'Mint Passport'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-headline font-bold">My Passport</h1>
          <p className="text-muted-foreground">Your sovereign identity and asset portfolio.</p>
        </div>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Coins className="h-6 w-6" /> Mint {federationConfig.tokenSymbol} Tokens
                </CardTitle>
                <CardDescription>
                    Create new federation currency. Your balance is reflected on the dashboard.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...mintForm}>
                    <form onSubmit={mintForm.handleSubmit(handleMintTeos)} className="flex items-end gap-4 max-w-sm">
                        <FormField
                            control={mintForm.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem className="flex-grow">
                                    <FormLabel htmlFor="amount">Amount</FormLabel>
                                    <FormControl>
                                        <Input id="amount" type="number" placeholder="e.g. 1000" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit">Mint</Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
        
        <div className="grid gap-8 lg:grid-cols-2">
          <Card>
              <CardHeader>
                  <CardTitle>Physical Assets</CardTitle>
                  <CardDescription>Tangible assets you own.</CardDescription>
              </CardHeader>
              <CardContent>
                   <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>Asset</TableHead>
                              <TableHead>Value (USD)</TableHead>
                              <TableHead>For Sale</TableHead>
                              <TableHead className="text-right"></TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {passport.physicalAssets.map(asset => (
                              <TableRow key={asset.id}>
                                  <TableCell className="font-medium flex items-center gap-2">
                                      {getAssetIcon(asset.type || asset.name)} {asset.name} <Badge variant="outline">{asset.type}</Badge>
                                  </TableCell>
                                  <TableCell>{asset.value}</TableCell>
                                  <TableCell>
                                    <Switch
                                        id={`physical-${asset.id}`}
                                        checked={asset.forSale}
                                        onCheckedChange={() => handleToggleForSale(asset.id, 'physical')}
                                        aria-label="Toggle for sale"
                                    />
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                          <MoreHorizontal className="h-4 w-4" />
                                          <span className="sr-only">Actions</span>
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                          className="text-destructive"
                                          onSelect={() => {
                                            setAssetToDelete({ id: asset.id, name: asset.name, type: 'physical' });
                                            setIsDeleteAssetAlertOpen(true);
                                          }}
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                              </TableRow>
                          ))}
                      </TableBody>
                  </Table>
                  <Button className="mt-4 w-full" variant="outline" onClick={() => { setAssetTypeToAdd('physical'); setIsAddAssetDialogOpen(true); form.reset()}}>Add Physical Asset</Button>
              </CardContent>
          </Card>
          <Card>
              <CardHeader>
                  <CardTitle>IP Tokens</CardTitle>
                  <CardDescription>Intangible intellectual property assets.</CardDescription>
              </CardHeader>
              <CardContent>
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>Token</TableHead>
                              <TableHead>Value (USD)</TableHead>
                              <TableHead>For Sale</TableHead>
                              <TableHead className="text-right"></TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {passport.ipTokens.map(token => (
                              <TableRow key={token.id}>
                                  <TableCell className="font-medium flex items-center gap-2">
                                    {getAssetIcon(token.name)}
                                    {token.name}
                                  </TableCell>
                                  <TableCell>{token.value}</TableCell>
                                  <TableCell>
                                    <Switch
                                        id={`ip-${token.id}`}
                                        checked={token.forSale}
                                        onCheckedChange={() => handleToggleForSale(token.id, 'ip')}
                                        aria-label="Toggle for sale"
                                    />
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                          <MoreHorizontal className="h-4 w-4" />
                                          <span className="sr-only">Actions</span>
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                          className="text-destructive"
                                          onSelect={() => {
                                            setAssetToDelete({ id: token.id, name: token.name, type: 'ip' });
                                            setIsDeleteAssetAlertOpen(true);
                                          }}
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                              </TableRow>
                          ))}
                      </TableBody>
                  </Table>
                  <Button className="mt-4 w-full" variant="outline" onClick={() => { setAssetTypeToAdd('ip'); setIsAddAssetDialogOpen(true); form.reset()}}>Mint IP Token</Button>
              </CardContent>
          </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                    Deleting your passport is permanent and cannot be undone.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button variant="destructive" onClick={() => setIsDeletePassportAlertOpen(true)}>
                    Delete My Passport
                </Button>
            </CardContent>
        </Card>
      </div>

      <Dialog open={isAddAssetDialogOpen} onOpenChange={setIsAddAssetDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{assetTypeToAdd === 'physical' ? 'Add Physical Asset' : 'Mint IP Token'}</DialogTitle>
            <DialogDescription>
              {assetTypeToAdd === 'physical' 
                ? 'Add a new tangible asset to your passport.' 
                : 'Create a new token representing your intellectual property.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddAsset)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{assetTypeToAdd === 'physical' ? 'Asset Name' : 'Token Name'}</FormLabel>
                    <FormControl>
                      <Input placeholder={assetTypeToAdd === 'physical' ? 'e.g. Laptop' : 'e.g. My Great Novel'} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {assetTypeToAdd === 'physical' && (
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asset Type</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Electronics" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value (USD)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 1,500 USD" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">
                    {assetTypeToAdd === 'physical' ? 'Add Asset' : 'Mint Token'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeletePassportAlertOpen} onOpenChange={setIsDeletePassportAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete your passport and all associated data. This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeletePassport} className={cn(buttonVariants({ variant: "destructive" }))}>Delete Passport</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={isDeleteAssetAlertOpen} onOpenChange={setIsDeleteAssetAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently remove the asset "{assetToDelete?.name}" from your passport. This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setAssetToDelete(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAsset} className={cn(buttonVariants({ variant: "destructive" }))}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </>
  );
}
