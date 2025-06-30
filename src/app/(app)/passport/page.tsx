"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Computer, Smartphone, Home, BrainCircuit, FileText, User as UserIcon } from 'lucide-react';
import { federationConfig } from '@/config';
import { useToast } from "@/hooks/use-toast";

const physicalAssets = [
  { id: '1', type: 'Bio', name: 'My Body', value: '1,000,000 USD', icon: <UserIcon className="h-4 w-4" /> },
  { id: '2', type: 'Real Estate', name: 'Apartment', value: '250,000 USD', icon: <Home className="h-4 w-4" /> },
  { id: '3', type: 'Electronics', name: 'Computer', value: '2,500 USD', icon: <Computer className="h-4 w-4" /> },
  { id: '4', type: 'Electronics', name: 'Phone', value: '1,200 USD', icon: <Smartphone className="h-4 w-4" /> },
];

const ipTokens = [
    { id: '1', name: 'TeoVerse Concept', value: '500,000 USD', icon: <BrainCircuit className="h-4 w-4" /> },
    { id: '2', name: 'Personal Manifesto', value: '10,000 USD', icon: <FileText className="h-4 w-4" /> },
];

export default function PassportPage() {
  const [hasPassport, setHasPassport] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const { toast } = useToast();

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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold">My Passport</h1>
        <p className="text-muted-foreground">Your sovereign identity and asset portfolio.</p>
      </div>
      
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
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {physicalAssets.map(asset => (
                            <TableRow key={asset.id}>
                                <TableCell className="font-medium flex items-center gap-2">
                                    {asset.icon} {asset.name} <Badge variant="outline">{asset.type}</Badge>
                                </TableCell>
                                <TableCell>{asset.value}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <Button className="mt-4 w-full" variant="outline">Add Physical Asset</Button>
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
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {ipTokens.map(token => (
                            <TableRow key={token.id}>
                                <TableCell className="font-medium flex items-center gap-2">{token.icon}{token.name}</TableCell>
                                <TableCell>{token.value}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <Button className="mt-4 w-full" variant="outline">Mint IP Token</Button>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
