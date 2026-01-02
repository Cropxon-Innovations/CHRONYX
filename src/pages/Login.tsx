import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate login - replace with actual auth
    setTimeout(() => {
      setIsLoading(false);
      navigate("/app");
    }, 800);
  };

  return (
    <main className="min-h-screen vyom-gradient-bg flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Back Link */}
        <Link 
          to="/" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-12"
        >
          ← Back
        </Link>

        {/* Login Card */}
        <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-light tracking-[0.2em] text-foreground mb-3">
              VYOM
            </h1>
            <p className="text-sm text-muted-foreground">
              This space is private.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="h-11 bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-11 bg-background"
              />
            </div>

            <Button 
              type="submit" 
              variant="vyom-primary"
              className="w-full h-11 mt-6"
              disabled={isLoading}
            >
              {isLoading ? "Entering..." : "Enter"}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
};

export default Login;
