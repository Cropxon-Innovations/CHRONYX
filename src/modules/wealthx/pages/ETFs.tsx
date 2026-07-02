import HoldingsTable from "../components/HoldingsTable";
import { useETFs } from "../hooks/useWealthX";

export const ETFs = () => {
  const { data } = useETFs();
  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-lg font-semibold text-foreground tracking-tight">ETFs</h2>
        <p className="text-sm text-muted-foreground">Index & thematic ETF holdings — values in ₹.</p>
      </header>
      <HoldingsTable data={data ?? []} />
    </div>
  );
};
export default ETFs;
