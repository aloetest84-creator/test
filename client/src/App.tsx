import React, { useState } from 'react';
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { ModelLoader } from "@/components/ModelLoader";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Analysis from "@/pages/analysis";
import History from "@/pages/history";
import Mapping from "@/pages/mapping";
import Profile from "@/pages/profile";
import Settings from "@/pages/settings";
import SignIn from "@/pages/signin";
import SignUp from "@/pages/signup";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="bg-[#edfffa] min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1c8567]"></div>
      </div>
    );
  }

  if (isAuthenticated && !isModelLoaded) {
    return (
      <ModelLoader 
        onLoaded={() => {
          setIsModelLoaded(true);
          setModelError(null);
        }} 
      />
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/signin" component={SignIn} />
          <Route path="/signup" component={SignUp} />
        </>
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/analysis" component={Analysis} />
          <Route path="/history" component={History} />
          <Route path="/mapping" component={Mapping} />
          <Route path="/profile" component={Profile} />
          <Route path="/settings" component={Settings} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Cleanup model on app unmount
  React.useEffect(() => {
    return () => {
      // Cleanup TensorFlow.js resources
      import('@/services/modelService').then(({ modelService }) => {
        modelService.dispose();
      });
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <OfflineIndicator />
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
