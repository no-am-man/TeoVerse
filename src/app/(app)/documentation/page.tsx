
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { generateDocumentation, type GenerateDocumentationOutput } from '@/ai/flows/generate-documentation-flow';
import { getAllCachedDocumentation } from '@/services/documentation-service';
import { Skeleton } from '@/components/ui/skeleton';
import { BookText, Sparkles } from 'lucide-react';
import { federationConfig } from '@/config';

const documentationTopics = [
  { value: 'Passport Management & Asset Tokenization', label: 'Passport & Asset Tokenization' },
  { value: 'Decentralized Exchange (DEX)', label: 'Decentralized Exchange (DEX)' },
  { value: 'Federation Linking System', label: 'Federation Linking System' },
  { value: 'Public AI Ambassador', label: 'Public AI Ambassador' },
  { value: 'Dashboard & Federation Flag Generation', label: 'Dashboard & Flag Generation' },
];

export default function DocumentationPage() {
  const { toast } = useToast();
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [cachedArticles, setCachedArticles] = useState<Record<string, GenerateDocumentationOutput>>({});
  const [displayedArticle, setDisplayedArticle] = useState<GenerateDocumentationOutput | null>(null);
  const [isLoadingCache, setIsLoadingCache] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  useEffect(() => {
    getAllCachedDocumentation(federationConfig.version)
      .then(articles => {
        const articlesMap: Record<string, GenerateDocumentationOutput> = {};
        for (const article of articles) {
            articlesMap[article.topic] = article;
        }
        setCachedArticles(articlesMap);
      })
      .catch(error => {
        console.error("Failed to fetch cached docs:", error);
        toast({
          title: 'Error',
          description: 'Could not fetch cached documentation.',
          variant: 'destructive',
        });
      })
      .finally(() => {
        setIsLoadingCache(false);
      });
  }, [toast]);

  const handleTopicChange = (topic: string) => {
    setSelectedTopic(topic);
    setDisplayedArticle(null);
  };

  const handleActionClick = async () => {
    if (!selectedTopic) return;

    const isCached = !!cachedArticles[selectedTopic];

    if (isCached) {
      setDisplayedArticle(cachedArticles[selectedTopic]);
    } else {
      setIsGenerating(true);
      setDisplayedArticle(null);

      try {
        const result = await generateDocumentation({ topic: selectedTopic });
        setDisplayedArticle(result);
        setCachedArticles(prev => ({ ...prev, [selectedTopic]: result }));
      } catch (error) {
        console.error("Documentation generation failed:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({
          title: 'Generation Failed',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setIsGenerating(false);
      }
    }
  };
  
  const isCached = selectedTopic && !!cachedArticles[selectedTopic];
  const buttonText = isCached ? 'Display' : 'Generate';
  const buttonIcon = isCached ? <BookText className="mr-2 h-4 w-4" /> : <Sparkles className="mr-2 h-4 w-4" />;

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
        <h3 className="mt-4 text-lg font-medium">Live Documentation (v{federationConfig.version})</h3>
        <p className="mt-1">Select a topic to display or generate a new documentation article.</p>
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
            <Select onValueChange={handleTopicChange} value={selectedTopic}>
              <SelectTrigger disabled={isLoadingCache}>
                <SelectValue placeholder={isLoadingCache ? "Loading topics..." : "Select a topic..."} />
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
          <Button onClick={handleActionClick} disabled={isLoadingCache || isGenerating || !selectedTopic}>
            {isGenerating ? <Sparkles className="mr-2 h-4 w-4 animate-spin" /> : buttonIcon}
            {isGenerating ? 'Generating...' : buttonText}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 min-h-[300px]">
            {isGenerating ? <LoadingState /> : displayedArticle ? (
                <article className="prose dark:prose-invert max-w-none">
                    {displayedArticle.imageUrl && (
                        <Image
                            src={displayedArticle.imageUrl}
                            alt={`Generated image for ${selectedTopic}`}
                            width={1200}
                            height={600}
                            className="w-full aspect-video object-cover rounded-lg mb-8"
                            data-ai-hint="documentation abstract"
                            unoptimized
                        />
                    )}
                    <h1>{displayedArticle.topic}</h1>
                    <ReactMarkdown>{displayedArticle.article}</ReactMarkdown>
                </article>
            ) : (
                <InitialState />
            )}
        </CardContent>
      </Card>
    </div>
  );
}
