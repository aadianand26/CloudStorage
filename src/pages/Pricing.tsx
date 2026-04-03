import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/DashboardLayout";

const Pricing = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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
    <ProtectedRoute>
      <DashboardLayout>
        <section className="px-6 pt-16 pb-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h1 className="text-5xl font-bold mb-4 gradient-text">
                Simple, Transparent Pricing
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Start with 10MB free storage, then pay only for what you use
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Free Tier */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-2xl">Free Tier</CardTitle>
                  <CardDescription>Perfect to get started</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-4xl font-bold">$0</div>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-primary" />
                      <span>10 MB storage included</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-primary" />
                      <span>AI-powered file insights</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-primary" />
                      <span>File organization</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-primary" />
                      <span>Secure cloud storage</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" variant="outline" disabled>
                    Current Plan
                  </Button>
                </CardFooter>
              </Card>

              {/* Pay As You Go */}
              <Card className="border-2 border-primary">
                <CardHeader>
                  <CardTitle className="text-2xl">Pay As You Go</CardTitle>
                  <CardDescription>Scale as your needs grow</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-4xl font-bold">
                    $2<span className="text-lg text-muted-foreground">/GB</span>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-primary" />
                      <span>All free tier features</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-primary" />
                      <span>Pay only for what you use</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-primary" />
                      <span>No monthly commitment</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-primary" />
                      <span>Unlimited file uploads</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={handlePurchaseStorage}
                    disabled={isLoading}
                  >
                    {isLoading ? "Loading..." : "Purchase Storage"}
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <div className="mt-16 text-center">
              <h2 className="text-2xl font-bold mb-8">Frequently Asked Questions</h2>
              <div className="max-w-2xl mx-auto space-y-6 text-left">
                <div>
                  <h3 className="font-semibold text-lg mb-2">How does billing work?</h3>
                  <p className="text-muted-foreground">
                    You get 10MB free. Once you exceed that, you only pay $2 per GB of storage used.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Can I cancel anytime?</h3>
                  <p className="text-muted-foreground">
                    Yes! There are no long-term contracts. You only pay for the storage you use.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">What payment methods do you accept?</h3>
                  <p className="text-muted-foreground">
                    We accept all major credit cards through our secure payment processor, Stripe.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default Pricing;
