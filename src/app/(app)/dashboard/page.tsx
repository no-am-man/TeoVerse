import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { federationConfig } from '@/config';
import { CreditCard, Landmark, PiggyBank, Users } from 'lucide-react';

export default function DashboardPage() {
  const stats = [
    { title: 'Passport Value', value: '1.25 BTC', icon: CreditCard, description: 'Total value of all assets' },
    { title: 'BTC Balance', value: '0.05 BTC', icon: Landmark, description: 'Liquid balance in your wallet' },
    { title: `${federationConfig.tokenSymbol} Balance`, value: `10,000 ${federationConfig.tokenSymbol}`, icon: PiggyBank, description: 'Your federation currency' },
    { title: 'Federation Members', value: '1', icon: Users, description: 'Total passports in this federation' },
  ];

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
            <p className="text-muted-foreground">No recent activity.</p>
            {/* Activity feed will go here */}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>My Assets</CardTitle>
            <CardDescription>A summary of your tokenized property.</CardDescription>
          </CardHeader>
          <CardContent>
             <p className="text-muted-foreground">No assets added yet.</p>
            {/* Asset list summary will go here */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
