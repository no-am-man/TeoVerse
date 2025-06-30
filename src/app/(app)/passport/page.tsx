
"use client";

import { useState, ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Computer, Smartphone, Home, BrainCircuit, FileText, User as UserIcon, Trash2, Coins } from 'lucide-react';
import { federationConfig } from '@/config';
import { useToast } from "@/hooks/use-toast";

const initialPhysicalAssets = [
  { id: '1', type: 'Bio', name: 'My Body', value: '1,000,000 USD', icon: <UserIcon className="h-4 w-4" /> },
  { id: '2', type: 'Real Estate', name: 'Apartment', value: '250,000 USD', icon: <Home className="h-4 w-4" /> },
  { id: '3', type: 'Electronics', name: 'Computer', value: '2,500 USD', icon: <Computer className="h-4 w-4" /> },
  { id: '4', type: 'Electronics', name: 'Phone', value: '1,200 USD', icon: <Smartphone className="h-4 w-4" /> },
];

const initialIpTokens = [
    { id: '1', name: 'TeoVerse Concept', value: '500,000 USD', icon: <BrainCircuit className="h-4 w-4" /> },
    { id: '2', name: 'Personal Manifesto', value: '10,000 USD', icon: <FileText className="h-4 w-4" /> },
];

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
  const [hasPassport, setHasPassport] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [physicalAssets, setPhysicalAssets] = useState(initialPhysicalAssets);
  const [ipTokens, setIpTokens] = useState(initialIpTokens);
  
  const [isAddAssetDialogOpen, setIsAddAssetDialogOpen] = useState(false);
  const [assetTypeToAdd, setAssetTypeToAdd] = useState<'physical' | 'ip' | null>(null);
  const [assetToDelete, setAssetToDelete] = useState<{ id: string; name: string; type: 'physical' | 'ip' } | null>(null);
  
  const { toast } = useToast();
  
  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: { name: "", type: "", value: "" },
  });

  const mintForm = useForm<MintFormValues>({
    resolver: zodResolver(mintFormSchema),
    defaultValues: { amount: "" },
  });

  const handleMintPassport = () => {
    setIsMinting(true);
    toast({
        title: "Minting Passport...",
        description: "Your sovereign identity is being created on the federation.",
    });

    setTimeout(() => {
        setIsMinting(false);
        setHasPassport(true);
        toast({
            title: "Passport Minted!",
            description: "Congratulations! You are now a citizen of the federation.",
            variant: "default"
        });
    }, 2000);
  };
  
  const getAssetIcon = (type: string): ReactNode => {
    switch (type.toLowerCase()) {
        case 'bio': return <UserIcon className="h-4 w-4" />;
        case 'real estate': return <Home className="h-4 w-4" />;
        case 'electronics': return <Computer className="h-4 w-4" />;
        case 'teoverse concept': return <BrainCircuit className="h-4 w-4" />;
        default: return <FileText className="h-4 w-4" />;
    }
  };

  const handleAddAsset = (values: AssetFormValues) => {
    const newAsset = {
        id: new Date().toISOString(),
        name: values.name,
        value: values.value,
        type: values.type || '',
        icon: getAssetIcon(values.type || values.name),
    };

    if (assetTypeToAdd === 'physical') {
        setPhysicalAssets(prev => [...prev, newAsset]);
        toast({ title: "Physical Asset Added", description: `${values.name} has been added to your passport.` });
    } else if (assetTypeToAdd === 'ip') {
        setIpTokens(prev => [...prev, { ...newAsset, name: values.name, value: values.value, icon: getAssetIcon(values.name) }]);
        toast({ title: "IP Token Minted", description: `Token for ${values.name} has been minted.` });
    }
    
    setIsAddAssetDialogOpen(false);
    form.reset();
  };

  const confirmDelete = () => {
    if (!assetToDelete) return;

    if (assetToDelete.type === 'physical') {
        setPhysicalAssets(prev => prev.filter(asset => asset.id !== assetToDelete.id));
        toast({ title: "Asset Removed", description: `${assetToDelete.name} has been removed.` });
    } else if (assetToDelete.type === 'ip') {
        setIpTokens(prev => prev.filter(token => token.id !== assetToDelete.id));
        toast({ title: "Token Burned", description: `${assetToDelete.name} has been burned.` });
    }
    setAssetToDelete(null);
  };

  const handleMintTeos = (values: MintFormValues) => {
    toast({
      title: 'Tokens Minted!',
      description: `You have successfully minted ${values.amount} ${federationConfig.tokenSymbol}.`,
    });
    mintForm.reset();
  };
  
  if (!hasPassport) {
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
                              <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {physicalAssets.map(asset => (
                              <TableRow key={asset.id}>
                                  <TableCell className="font-medium flex items-center gap-2">
                                      {asset.icon} {asset.name} <Badge variant="outline">{asset.type}</Badge>
                                  </TableCell>
                                  <TableCell>{asset.value}</TableCell>
                                  <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => setAssetToDelete({ id: asset.id, name: asset.name, type: 'physical' })}>
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Delete</span>
                                    </Button>
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
                              <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {ipTokens.map(token => (
                              <TableRow key={token.id}>
                                  <TableCell className="font-medium flex items-center gap-2">{token.icon}{token.name}</TableCell>
                                  <TableCell>{token.value}</TableCell>
                                  <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => setAssetToDelete({ id: token.id, name: token.name, type: 'ip' })}>
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Delete</span>
                                    </Button>
                                  </TableCell>
                              </TableRow>
                          ))}
                      </TableBody>
                  </Table>
                  <Button className="mt-4 w-full" variant="outline" onClick={() => { setAssetTypeToAdd('ip'); setIsAddAssetDialogOpen(true); form.reset()}}>Mint IP Token</Button>
              </CardContent>
          </Card>
        </div>
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
      
      <AlertDialog open={!!assetToDelete} onOpenChange={() => setAssetToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently remove the asset "{assetToDelete?.name}" from your passport.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
