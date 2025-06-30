
"use client";

import { useState } from 'react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { generateDocumentation } from '@/ai/flows/generate-documentation-flow';
import { Skeleton } from '@/components/ui/skeleton';
import { BookText, Sparkles } from 'lucide-react';

const documentationTopics = [
  { value: 'Passport Management & Asset Tokenization', label: 'Passport & Asset Tokenization' },
  { value: 'Decentralized Exchange (DEX)', label: 'Decentralized Exchange (DEX)' },
  { value: 'Federation Linking System', label: 'Federation Linking System' },
  { value: 'Public AI Ambassador', label: 'Public AI Ambassador' },
  { value: 'Dashboard & Federation Flag Generation', label: 'Dashboard & Flag Generation' },
];

export default function DocumentationPage() {
  const { toast } = useToast();
  const [topic, setTopic] = useState<string>('');
  const [article, setArticle] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleGenerate = async () => {
    if (!topic) {
      toast({
        title: 'Select a Topic',
        description: 'Please choose a topic to generate documentation for.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setArticle('');
    setImageUrl('');

    try {
      const result = await generateDocumentation({ topic });
      setArticle(result.article);
      setImageUrl(result.imageUrl);
    } catch (error) {
      console.error("Documentation generation failed:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        title: 'Generation Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const LoadingState = () => (
    <div className="space-y-6">
      <Skeleton className="aspect-video w-full rounded-lg" />
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
        </div>
        <Skeleton className="h-6 w-1/3" />
        <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    </div>
  );
  
  const InitialState = () => (
    <div className="text-center text-muted-foreground py-12">
        <BookText className="mx-auto h-12 w-12" />
        <h3 className="mt-4 text-lg font-medium">Live Documentation</h3>
        <p className="mt-1">Select a topic and let the AI generate a technical overview with a header image.</p>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold">AI Documentation</h1>
        <p className="text-muted-foreground">
          Generate live technical documentation for the project's features using AI.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Documentation Generator</CardTitle>
          <CardDescription>
            Select a feature to generate an article explaining its implementation.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-end gap-4">
          <div className="flex-grow">
            <Select onValueChange={setTopic} value={topic}>
              <SelectTrigger>
                <SelectValue placeholder="Select a topic..." />
              </SelectTrigger>
              <SelectContent>
                {documentationTopics.map((docTopic) => (
                  <SelectItem key={docTopic.value} value={docTopic.value}>
                    {docTopic.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleGenerate} disabled={isLoading || !topic}>
            <Sparkles className="mr-2 h-4 w-4" />
            {isLoading ? 'Generating...' : 'Generate'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
            {isLoading ? <LoadingState /> : article ? (
                <article className="prose dark:prose-invert max-w-none">
                    {imageUrl && (
                        <Image
                            src={imageUrl}
                            alt={`Generated image for ${topic}`}
                            width={1200}
                            height={600}
                            className="w-full aspect-video object-cover rounded-lg mb-8"
                            data-ai-hint="documentation abstract"
                        />
                    )}
                    <ReactMarkdown>{article}</ReactMarkdown>
                </article>
            ) : (
                <InitialState />
            )}
        </CardContent>
      </Card>
    </div>
  );
}
