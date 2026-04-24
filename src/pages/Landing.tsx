import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  Zap, 
  Brain, 
  Upload, 
  Search,
  BarChart,
  Users,
  Star,
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import logo from '@/assets/logo.png';

export const Landing = () => {
  const features = [
    {
      icon: <img src={logo} alt="Clever Vault logo" className="h-8 w-8 object-contain" />,
      title: "Secure Cloud Storage",
      description: "Store your files safely in the cloud with enterprise-grade security and encryption."
    },
    {
      icon: <Brain className="h-8 w-8 text-primary" />,
      title: "AI-Powered Insights",
      description: "Get intelligent file analysis, automatic tagging, and smart organization suggestions."
    },
    {
      icon: <Search className="h-8 w-8 text-primary" />,
      title: "Smart Search",
      description: "Find your files instantly with AI-enhanced search across content and metadata."
    },
    {
      icon: <BarChart className="h-8 w-8 text-primary" />,
      title: "Storage Analytics",
      description: "Track your storage usage, file patterns, and optimize your digital workspace."
    },
    {
      icon: <Shield className="h-8 w-8 text-primary" />,
      title: "Privacy First",
      description: "Your data is encrypted and accessible only to you. We prioritize your privacy."
    },
    {
      icon: <Zap className="h-8 w-8 text-primary" />,
      title: "Lightning Fast",
      description: "Upload, download, and access your files with blazing-fast performance."
    }
  ];

  const benefits = [
    "Unlimited file storage",
    "AI-powered file analysis",
    "Advanced search capabilities",
    "Real-time sync across devices",
    "Secure sharing options",
    "24/7 customer support"
  ];

  const pricing = [
    {
      name: "Starter",
      price: "Free",
      description: "Perfect for personal use and trying Clever Vault.",
      features: [
        "5 GB secure storage",
        "Basic AI tagging",
        "Smart search",
        "Email support"
      ],
      cta: "Start Free",
      highlight: false
    },
    {
      name: "Pro",
      price: "$12",
      description: "For power users who want more automation and space.",
      features: [
        "2 TB secure storage",
        "Advanced AI insights",
        "Priority indexing",
        "Team sharing",
        "Priority support"
      ],
      cta: "Go Pro",
      highlight: true
    },
    {
      name: "Business",
      price: "$29",
      description: "For teams that need governance and advanced controls.",
      features: [
        "10 TB shared storage",
        "Admin controls",
        "Audit logs",
        "SSO (SAML)",
        "Dedicated success manager"
      ],
      cta: "Talk to Sales",
      highlight: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#fffaf3] to-[#f3e6d8]">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-4">
          <BrandLogo text="Clever Vault" />
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">About</a>
          </nav>
          <Link to="/auth">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 py-14 md:py-20">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="mb-6 text-4xl font-bold leading-tight text-foreground sm:text-5xl md:text-7xl">
            Intelligent Cloud Storage
            <span className="gradient-text block">Powered by AI</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-base text-muted-foreground sm:text-lg md:text-xl">
            Store, organize, and discover your files with the power of artificial intelligence. 
            Get insights, automated tagging, and smart search in one beautiful platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="text-lg px-8 py-3">
                Start Free Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8 py-3">
              Watch Demo
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground sm:gap-6 sm:text-base">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span>10,000+ users</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-current text-yellow-500" />
              <span>4.9/5 rating</span>
            </div>
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              <span>1M+ files stored</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white/35">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Everything you need for smart file management
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our AI-powered platform transforms how you store, organize, and interact with your digital files.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="glass-card hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-foreground mb-6">
                Why choose Clever Vault?
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Experience the future of file storage with AI-driven insights, 
                seamless organization, and powerful search capabilities.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link to="/auth">
                  <Button size="lg">Start Your Free Trial</Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <Card className="glass-card p-8">
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Upload className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Upload Files</h4>
                      <p className="text-sm text-muted-foreground">Drag & drop your files</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Brain className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">AI Analysis</h4>
                      <p className="text-sm text-muted-foreground">Get intelligent insights</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Search className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Smart Search</h4>
                      <p className="text-sm text-muted-foreground">Find anything instantly</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-white/35">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose a plan that fits how you work today, and scale up anytime.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {pricing.map((plan) => (
              <Card
                key={plan.name}
                className={`glass-card hover:shadow-lg transition-shadow ${
                  plan.highlight ? "border-primary/60 shadow-lg" : ""
                }`}
              >
                <CardContent className="p-8">
                  <div className="flex items-baseline justify-between mb-4">
                    <h3 className="text-2xl font-semibold text-foreground">{plan.name}</h3>
                    {plan.highlight && (
                      <span className="text-xs uppercase tracking-wide text-primary font-semibold bg-primary/10 px-2 py-1 rounded-full">
                        Most Popular
                      </span>
                    )}
                  </div>
                  <div className="flex items-end gap-2 mb-4">
                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                    {plan.price !== "Free" && (
                      <span className="text-muted-foreground">/month</span>
                    )}
                  </div>
                  <p className="text-muted-foreground mb-6">{plan.description}</p>
                  <div className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                        <span className="text-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                  <Link to="/auth">
                    <Button
                      size="lg"
                      className={`w-full ${plan.highlight ? "" : "bg-background"}`}
                      variant={plan.highlight ? "default" : "outline"}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-8">
            All plans include secure backups, version history, and GDPR compliance.
          </p>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-foreground mb-6">
                Built for teams that value clarity and control
              </h2>
              <p className="text-xl text-muted-foreground mb-6">
                Clever Vault brings AI to file management without sacrificing privacy.
                We combine secure storage, smart organization, and human-friendly design
                to keep your work flowing.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Card className="glass-card">
                  <CardContent className="p-6">
                    <Shield className="h-8 w-8 text-primary mb-3" />
                    <h4 className="font-semibold text-foreground mb-2">Security-first</h4>
                    <p className="text-sm text-muted-foreground">
                      End-to-end encryption and role-based access control.
                    </p>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardContent className="p-6">
                    <Zap className="h-8 w-8 text-primary mb-3" />
                    <h4 className="font-semibold text-foreground mb-2">Speed by design</h4>
                    <p className="text-sm text-muted-foreground">
                      Instant search results and rapid uploads at any scale.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
            <div className="relative">
              <Card className="glass-card p-8">
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Team ready</h4>
                      <p className="text-sm text-muted-foreground">Collaborate across departments</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Brain className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">AI you control</h4>
                      <p className="text-sm text-muted-foreground">Granular settings per workspace</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Compliance</h4>
                      <p className="text-sm text-muted-foreground">SOC 2, HIPAA, and GDPR ready</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-[#f7ecdf] via-[#fbf5ec] to-[#f0e0cf]">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Ready to revolutionize your file storage?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of users who trust Clever Vault for their intelligent file management needs.
          </p>
          <Link to="/auth">
            <Button size="lg" className="text-lg px-8 py-3">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border/50">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <BrandLogo text="Clever Vault" className="mb-4" imageClassName="h-8 w-8" />
              <p className="text-muted-foreground">
                Intelligent cloud storage powered by AI for the modern world.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Support</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border/50 text-center text-muted-foreground">
            <p>&copy; 2025 Clever Vault. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
