import Image from "next/image";
import { Button } from "@/components/ui/button";  

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <h1 className="text-4xl font-bold text-zinc-800 dark:text-zinc-200">Welcome to AI Voice Agent</h1>
      <Button variant="destructive">Get Started </Button>
    </div>
  );
}
