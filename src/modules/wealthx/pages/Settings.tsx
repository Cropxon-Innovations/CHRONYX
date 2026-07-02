import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Settings = () => (
  <div className="space-y-6 max-w-3xl">
    <header>
      <h2 className="text-lg font-semibold text-foreground tracking-tight">WealthX Settings</h2>
      <p className="text-sm text-muted-foreground">Preferences, broker connections, exports and privacy.</p>
    </header>

    <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Preferences</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Currency</Label>
          <Select defaultValue="INR">
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="INR">₹ Indian Rupee</SelectItem>
              <SelectItem value="USD" disabled>$ US Dollar (soon)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Language</Label>
          <Select defaultValue="en">
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="hi">हिन्दी</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>

    <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
      {[
        "SIP reminders",
        "Price target hits",
        "52-week high alerts",
        "News on my holdings",
      ].map((n) => (
        <div key={n} className="flex items-center justify-between">
          <p className="text-sm">{n}</p>
          <Switch defaultChecked />
        </div>
      ))}
    </section>

    <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Broker connections & API keys</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {["Zerodha Kite", "Groww", "Upstox", "AngelOne"].map((b) => (
          <button
            key={b}
            className="rounded-xl border border-border bg-background hover:bg-muted/40 p-4 text-left text-sm"
            onClick={() => toast.info(`${b} connector coming soon`)}
          >
            <p className="font-medium">{b}</p>
            <p className="text-xs text-muted-foreground mt-1">Connect to auto-sync holdings & trades</p>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div>
          <Label>Alpha Vantage / Twelve Data key</Label>
          <Input type="password" placeholder="Paste API key" className="mt-1" />
        </div>
        <div>
          <Label>Finnhub / FMP key</Label>
          <Input type="password" placeholder="Paste API key" className="mt-1" />
        </div>
      </div>
    </section>

    <section className="rounded-2xl border border-border bg-card p-5 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Data</h3>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => toast.info("Export CSV coming soon")}>Export data</Button>
        <Button variant="outline" size="sm" onClick={() => toast.info("Import wizard coming soon")}>Import transactions</Button>
      </div>
    </section>
  </div>
);

export default Settings;
