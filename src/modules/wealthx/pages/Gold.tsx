import HoldingsTable from "../components/HoldingsTable";
import { useGold } from "../hooks/useWealthX";

export const Gold = () => {
  const { data } = useGold();
  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-lg font-semibold text-foreground tracking-tight">Gold</h2>
        <p className="text-sm text-muted-foreground">Sovereign Gold Bonds, digital gold & ETFs — values in ₹.</p>
      </header>
      <HoldingsTable data={data ?? []} />
    </div>
  );
};
export default Gold;
