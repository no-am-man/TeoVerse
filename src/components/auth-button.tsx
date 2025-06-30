"use client";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { Skeleton } from "./ui/skeleton";

export function AuthButton() {
  const { login, loading } = useAuth();

  if (loading) {
    return <Skeleton className="h-12 w-full max-w-xs" />;
  }

  return (
    <Button onClick={login} size="lg" className="w-full max-w-xs font-bold text-lg" aria-label="Continue with Google">
      <LogIn className="mr-2 h-5 w-5" /> Continue with Google
    </Button>
  );
}
