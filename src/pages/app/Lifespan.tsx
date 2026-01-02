import { useState } from "react";
import LifespanBar from "@/components/dashboard/LifespanBar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const Lifespan = () => {
  const [reflection, setReflection] = useState("");

  // Sample data - birth date assumption: January 1, 1991 (age ~34)
  const birthDate = new Date(1991, 0, 1);
  const targetAge = 60;
  const today = new Date();
  
  const daysLived = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
  const targetDate = new Date(birthDate);
  targetDate.setFullYear(birthDate.getFullYear() + targetAge);
  const daysRemaining = Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  const yearsLived = Math.floor(daysLived / 365);
  const monthsLived = Math.floor((daysLived % 365) / 30);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-light text-foreground tracking-wide">Lifespan</h1>
        <p className="text-sm text-muted-foreground mt-1">Perspective on time</p>
      </header>

      {/* Main Visualization */}
      <LifespanBar daysLived={daysLived} daysRemaining={daysRemaining} />

      {/* Time Lived Detail */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-6">
          Time Lived
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-3xl font-semibold text-foreground">{yearsLived}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Years</p>
          </div>
          <div>
            <p className="text-3xl font-semibold text-foreground">{yearsLived * 12 + monthsLived}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Months</p>
          </div>
          <div>
            <p className="text-3xl font-semibold text-foreground">{Math.floor(daysLived / 7).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Weeks</p>
          </div>
          <div>
            <p className="text-3xl font-semibold text-foreground">{daysLived.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Days</p>
          </div>
        </div>
      </div>

      {/* Milestones */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-6">
          Life Markers
        </h3>
        <div className="space-y-4">
          {[
            { age: 25, status: yearsLived >= 25 ? "passed" : "upcoming" },
            { age: 30, status: yearsLived >= 30 ? "passed" : "upcoming" },
            { age: 35, status: yearsLived >= 35 ? "passed" : "upcoming" },
            { age: 40, status: yearsLived >= 40 ? "passed" : "upcoming" },
            { age: 50, status: yearsLived >= 50 ? "passed" : "upcoming" },
            { age: 60, status: yearsLived >= 60 ? "passed" : "upcoming" },
          ].map(({ age, status }) => (
            <div key={age} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  status === "passed" ? "bg-vyom-success" : "bg-muted"
                }`} />
                <span className="text-sm text-foreground">Age {age}</span>
              </div>
              <span className={`text-xs ${
                status === "passed" ? "text-vyom-success" : "text-muted-foreground"
              }`}>
                {status === "passed" ? "Reached" : `${age - yearsLived} years away`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Reflection */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
          Reflection
        </h3>
        <Textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="What matters most to you right now?"
          className="min-h-[120px] bg-background resize-none"
        />
        <Button variant="vyom" size="sm" className="mt-4">
          Save Reflection
        </Button>
      </div>
    </div>
  );
};

export default Lifespan;
