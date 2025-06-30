
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { federationConfig } from '@/config';
import { linkFederation, getLinkedFederations, unlinkFederation, type LinkedFederation } from '@/services/federation-link-service';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { buttonVariants } from '@/components/ui/button';

const linkFederationSchema = z.object({
  url: z.string().url({ message: "Please enter a valid URL." }),
});

type LinkFederationFormValues = z.infer<typeof linkFederationSchema>;

export default function FederationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [linkedFederations, setLinkedFederations] = useState<LinkedFederation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLinking, setIsLinking] = useState(false);

  const form = useForm<LinkFederationFormValues>({
    resolver: zodResolver(linkFederationSchema),
    defaultValues: { url: "" },
  });

  const fetchLinkedFederations = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const federations = await getLinkedFederations(user.uid);
      setLinkedFederations(federations);
    } catch (error) {
      toast({ title: "Error", description: "Could not fetch linked federations.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLinkedFederations();
  }, [user]);

  const handleLinkFederation = async (values: LinkFederationFormValues) => {
    if (!user) return;
    setIsLinking(true);
    try {
      const newLink = await linkFederation(user.uid, values.url);
      setLinkedFederations(prev => [...prev, newLink]);
      toast({ title: "Success", description: `Successfully linked to ${newLink.name}.` });
      form.reset();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({ title: "Linking Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlinkFederation = async (federationId: string) => {
    if (!user) return;
    try {
      await unlinkFederation(user.uid, federationId);
      setLinkedFederations(prev => prev.filter(f => f.id !== federationId));
      toast({ title: "Success", description: "Federation has been unlinked." });
    } catch (error) {
      toast({ title: "Error", description: "Could not unlink federation.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold">Linked Federations</h1>
        <div className="text-muted-foreground">
          Connect to other federations to enable cross-federation interactions.
          Your own federation version is{' '}
          <Badge variant="outline">v{federationConfig.version}</Badge>.
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Link a New Federation</CardTitle>
          <CardDescription>Enter the root URL of the federation you wish to link to.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleLinkFederation)} className="flex items-end gap-4 max-w-lg">
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormLabel>Federation URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://another-federation.web.app" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLinking}>
                {isLinking ? 'Linking...' : 'Link Federation'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Linked Federations</CardTitle>
          <CardDescription>A list of federations you are currently connected to.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : linkedFederations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {linkedFederations.map((fed) => (
                  <TableRow key={fed.id}>
                    <TableCell className="font-medium">{fed.name}</TableCell>
                    <TableCell>{fed.url}</TableCell>
                    <TableCell><Badge variant="secondary">v{fed.version}</Badge></TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Unlink</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will unlink the "{fed.name}" federation. You can relink it again later.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleUnlinkFederation(fed.id)} className={buttonVariants({ variant: "destructive" })}>
                              Unlink
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-4">You have not linked to any federations yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
