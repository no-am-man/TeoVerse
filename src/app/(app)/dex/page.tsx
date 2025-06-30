"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowDownUp, CheckCircle2 } from "lucide-react";
import { federationConfig } from "@/config";
import { useToast } from "@/hooks/use-toast";
import { useState, useCallback } from "react";

const MOCK_RATE = 10000;
const MOCK_BTC_BALANCE = 100;

export default function DexPage() {
  const { toast } = useToast();
  const [fromAmount, setFromAmount] = useState('0.01');
  const [toAmount, setToAmount] = useState((0.01 * MOCK_RATE).toString());
  const [isFromBtc, setIsFromBtc] = useState(true);
  const [isWalletConnected, setIsWalletConnected] = useState(false);

  const fromCurrency = isFromBtc ? 'BTC' : federationConfig.tokenSymbol;
  const toCurrency = isFromBtc ? federationConfig.tokenSymbol : 'BTC';

  const handleAmountChange = useCallback((value: string, type: 'from' | 'to') => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || value === '') {
      setFromAmount('');
      setToAmount('');
      return;
    }

    const toLocaleStringNoE = (num: number) => num.toLocaleString('fullwide', { useGrouping: false, maximumFractionDigits: 20 });

    if (type === 'from') {
      setFromAmount(value);
      const calculatedToAmount = isFromBtc ? numValue * MOCK_RATE : numValue / MOCK_RATE;
      setToAmount(toLocaleStringNoE(calculatedToAmount));
    } else {
      setToAmount(value);
      const calculatedFromAmount = isFromBtc ? numValue / MOCK_RATE : numValue * MOCK_RATE;
      setFromAmount(toLocaleStringNoE(calculatedFromAmount));
    }
  }, [isFromBtc]);

  const handleFlip = () => {
    setIsFromBtc(prev => !prev);
    const currentFrom = fromAmount;
    setFromAmount(toAmount);
    setToAmount(currentFrom);
  }

  const handleConnectWallet = () => {
    setIsWalletConnected(true);
    toast({
        title: "Wallet Connected",
        description: `UniSat wallet (emulated) connected with a mock balance of ${MOCK_BTC_BALANCE} BTC.`,
    });
  }

  const handleSwap = () => {
    const fromAmountNum = parseFloat(fromAmount);
    
    if (isFromBtc && fromAmountNum > MOCK_BTC_BALANCE) {
        toast({
            title: "Insufficient Balance",
            description: `Your mock BTC balance is only ${MOCK_BTC_BALANCE} BTC.`,
            variant: "destructive",
        });
        return;
    }

    toast({
        title: "Transaction Submitted",
        description: `Swapping ${fromAmount} ${fromCurrency} for ${toAmount} ${toCurrency}. This is a mock transaction.`,
    });
  };
  
  const btcBalanceDisplay = (
      <div className="text-xs text-muted-foreground">
          Balance: {MOCK_BTC_BALANCE.toLocaleString()} BTC
      </div>
  );
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold">Private DEX</h1>
        <p className="text-muted-foreground">Trade assets within the {federationConfig.federationName} federation.</p>
      </div>
      <Tabs defaultValue="swap" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
          <TabsTrigger value="swap">Swap Tokens</TabsTrigger>
          <TabsTrigger value="passports" disabled>Trade Passports</TabsTrigger>
          <TabsTrigger value="ip" disabled>Trade IP</TabsTrigger>
        </TabsList>
        <TabsContent value="swap">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Swap</CardTitle>
              <CardDescription>Exchange BTC and {federationConfig.tokenSymbol} seamlessly.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                    <Label htmlFor="from-amount">From</Label>
                    {isFromBtc && isWalletConnected && btcBalanceDisplay}
                </div>
                <div className="flex gap-2">
                  <Input id="from-amount" type="number" value={fromAmount} onChange={(e) => handleAmountChange(e.target.value, 'from')} />
                  <Button variant="outline" className="w-32 shrink-0">{fromCurrency}</Button>
                </div>
              </div>
              <div className="flex justify-center my-[-8px]">
                <Button variant="ghost" size="icon" onClick={handleFlip}><ArrowDownUp className="h-4 w-4" /></Button>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                    <Label htmlFor="to-amount">To</Label>
                    {!isFromBtc && isWalletConnected && btcBalanceDisplay}
                </div>
                <div className="flex gap-2">
                  <Input id="to-amount" type="number" value={toAmount} onChange={(e) => handleAmountChange(e.target.value, 'to')} />
                  <Button variant="outline" className="w-32 shrink-0">{toCurrency}</Button>
                </div>
              </div>
              <div className="text-sm text-muted-foreground pt-2">
                Rate: 1 BTC ≈ {MOCK_RATE.toLocaleString()} {federationConfig.tokenSymbol} (mock rate)
              </div>
              {isWalletConnected ? (
                 <Button className="w-full" size="lg" onClick={handleSwap}>Swap</Button>
              ) : (
                <Button className="w-full" size="lg" onClick={handleConnectWallet}>Connect Wallet</Button>
              )}
              <p className="text-xs text-center text-muted-foreground pt-2 flex items-center justify-center gap-1.5">
                 {isWalletConnected && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                Powered by UniSat Wallet ({isWalletConnected ? "Connected" : "Emulated"})
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
