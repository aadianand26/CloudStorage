import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export const PricingOverview = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handlePurchaseStorage = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId: 'price_1QqZQCRr9zupYLJEPWFVF0sF' }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error",
        description: "Failed to start checkout process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center space-x-2">
            <Zap className="h-5 w-5 text-primary" />
            <span>Storage Plans</span>
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/pricing')}
            className="text-xs"
          >
            View All Plans <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Free Tier */}
        <div className="p-4 border border-border rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-base">Free Tier</h3>
              <p className="text-2xl font-bold mt-1">$0</p>
            </div>
            <Badge variant="secondary">Current</Badge>
          </div>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>10 MB storage</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>AI-powered insights</span>
            </li>
          </ul>
        </div>

        {/* Pay As You Go */}
        <div className="p-4 border-2 border-primary rounded-lg bg-primary/5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-base">Pay As You Go</h3>
              <p className="text-2xl font-bold mt-1">
                $2<span className="text-sm text-muted-foreground">/GB</span>
              </p>
            </div>
            <Badge>Popular</Badge>
          </div>
          <ul className="space-y-2 text-sm mb-4">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>Unlimited storage</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>No monthly commitment</span>
            </li>
          </ul>
          <Button 
            className="w-full" 
            size="sm"
            onClick={handlePurchaseStorage}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Upgrade Now"}
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Only pay for what you use • No hidden fees
        </p>
      </CardContent>
    </Card>
  );
};
