
'use client';

import { useState, useRef, useEffect, FormEvent, ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import { ambassador, AmbassadorInput } from '@/ai/flows/ambassador-flow';
import type { Passport } from '@/services/passport-service';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Bot, BrainCircuit, FileText, Send, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface AmbassadorClientPageProps {
  userId: string;
  passport: Passport;
  federationName: string;
}

type Message = {
  role: 'user' | 'model';
  content: string;
};

export function AmbassadorClientPage({ userId, passport, federationName }: AmbassadorClientPageProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: `Welcome! I am the AI Ambassador for the ${federationName} federation. Feel free to ask me anything about our vision or our listed IP assets.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const historyForApi = messages.map((m) => ({
        role: m.role,
        parts: [{ text: m.content }],
      }));

      const flowInput: AmbassadorInput = {
        userId,
        question: input,
        history: historyForApi,
      };

      const result = await ambassador(flowInput);
      const modelMessage: Message = { role: 'model', content: result.answer };
      setMessages((prev) => [...prev, modelMessage]);
    } catch (error) {
      console.error(error);
      const err = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        title: "An error occurred",
        description: "I was unable to process your request. Please try again.",
        variant: "destructive",
      });
      // remove the user message if the call fails
       setMessages(prev => prev.slice(0, prev.length -1));
    } finally {
      setIsLoading(false);
    }
  };
  
  const getAssetIcon = (type: string): ReactNode => {
    switch (type.toLowerCase()) {
      case 'teoverse concept': return <BrainCircuit className="h-5 w-5 text-primary" />;
      default: return <FileText className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-4 md:p-8">
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* IP Tokens List */}
          <div className="lg:col-span-1 space-y-8">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>About This Federation</CardTitle>
                <CardDescription>This is the public-facing embassy for the <span className="font-bold text-primary">{federationName}</span> federation, owned by a sovereign member of the TeoVerse.</CardDescription>
              </CardHeader>
            </Card>
             <Card className="sticky top-48">
              <CardHeader>
                <CardTitle>IP Assets for Sale</CardTitle>
                 <CardDescription>The following intellectual property tokens are available for investment.</CardDescription>
              </CardHeader>
              <CardContent>
                {passport.ipTokens.length > 0 ? (
                  <ul className="space-y-4">
                    {passport.ipTokens.map(token => (
                       <li key={token.id} className="flex items-start gap-4">
                        <div className="pt-1">{getAssetIcon(token.name)}</div>
                        <div>
                           <p className="font-semibold">{token.name}</p>
                           <p className="text-sm text-muted-foreground">{token.value}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No IP assets are currently listed for sale.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chat interface */}
          <div className="lg:col-span-2">
            <Card className="h-[85vh] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot /> AI Ambassador
                </CardTitle>
                <CardDescription>Ask me anything about this federation and its assets.</CardDescription>
              </CardHeader>
              <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
                 <div className="space-y-6 pr-4">
                    {messages.map((message, index) => (
                      <div key={index} className={cn("flex items-start gap-3", message.role === 'user' && 'justify-end')}>
                         {message.role === 'model' && (
                            <Avatar className="h-8 w-8">
                               <AvatarFallback><Bot className="h-5 w-5"/></AvatarFallback>
                            </Avatar>
                         )}
                         <div className={cn(
                            "max-w-sm md:max-w-md lg:max-w-lg rounded-xl px-4 py-3 text-sm",
                            message.role === 'model' ? "bg-muted" : "bg-primary text-primary-foreground"
                         )}>
                            <ReactMarkdown className="prose dark:prose-invert prose-p:my-0 prose-headings:my-2">
                               {message.content}
                            </ReactMarkdown>
                         </div>
                         {message.role === 'user' && (
                           <Avatar className="h-8 w-8">
                               <AvatarFallback><User className="h-5 w-5"/></AvatarFallback>
                           </Avatar>
                         )}
                      </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-start gap-3">
                            <Avatar className="h-8 w-8">
                               <AvatarFallback><Bot className="h-5 w-5"/></AvatarFallback>
                            </Avatar>
                            <div className="max-w-sm md:max-w-md lg:max-w-lg rounded-xl px-4 py-3 text-sm bg-muted">
                                <Skeleton className="h-4 w-10 animate-bounce" />
                            </div>
                        </div>
                    )}
                 </div>
              </ScrollArea>
              <CardFooter className="p-4 border-t">
                <form onSubmit={handleSendMessage} className="w-full flex items-center gap-2">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about an IP asset or the federation's mission..."
                    className="min-h-0 max-h-28 flex-1"
                    rows={1}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e);
                        }
                    }}
                    disabled={isLoading}
                  />
                  <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                    <Send className="h-4 w-4" />
                    <span className="sr-only">Send message</span>
                  </Button>
                </form>
              </CardFooter>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
