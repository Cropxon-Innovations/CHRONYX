import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Free stock API - Yahoo Finance via RapidAPI alternative (using free tier)
// This uses a public Yahoo Finance endpoint
async function fetchStockPrice(symbol: string, exchange: string): Promise<{
  price: number;
  change: number;
  changePercent: number;
  name: string;
} | null> {
  try {
    // Format symbol based on exchange
    let formattedSymbol = symbol;
    if (exchange === 'NSE') {
      formattedSymbol = `${symbol}.NS`;
    } else if (exchange === 'BSE') {
      formattedSymbol = `${symbol}.BO`;
    }

    // Using Yahoo Finance chart API (public endpoint)
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${formattedSymbol}?interval=1d&range=1d`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch price for ${symbol}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const result = data.chart?.result?.[0];
    
    if (!result) {
      return null;
    }

    const meta = result.meta;
    const price = meta.regularMarketPrice || 0;
    const previousClose = meta.chartPreviousClose || meta.previousClose || price;
    const change = price - previousClose;
    const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

    return {
      price,
      change,
      changePercent,
      name: meta.shortName || meta.symbol || symbol,
    };
  } catch (error) {
    console.error(`Error fetching stock price for ${symbol}:`, error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, symbols, symbol, exchange, quantity, averagePrice, holdingId } = await req.json();

    if (action === "update_all") {
      // Fetch all user's holdings and update prices
      const { data: holdings, error: holdingsError } = await supabase
        .from("stock_holdings")
        .select("*")
        .eq("user_id", user.id);

      if (holdingsError) {
        throw holdingsError;
      }

      const updates: any[] = [];
      const results: any[] = [];

      for (const holding of holdings || []) {
        const priceData = await fetchStockPrice(holding.symbol, holding.exchange);
        
        if (priceData) {
          updates.push({
            id: holding.id,
            current_price: priceData.price,
            name: priceData.name || holding.name,
            last_price_update: new Date().toISOString(),
          });

          results.push({
            ...holding,
            current_price: priceData.price,
            name: priceData.name || holding.name,
            change: priceData.change,
            changePercent: priceData.changePercent,
            totalValue: priceData.price * holding.quantity,
            profitLoss: (priceData.price - holding.average_price) * holding.quantity,
            profitLossPercent: ((priceData.price - holding.average_price) / holding.average_price) * 100,
          });
        }
      }

      // Batch update
      for (const update of updates) {
        await supabase
          .from("stock_holdings")
          .update({
            current_price: update.current_price,
            name: update.name,
            last_price_update: update.last_price_update,
          })
          .eq("id", update.id);
      }

      return new Response(
        JSON.stringify({ success: true, holdings: results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "get_quote") {
      const priceData = await fetchStockPrice(symbol, exchange || "NSE");
      
      if (!priceData) {
        return new Response(
          JSON.stringify({ error: "Could not fetch price" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, ...priceData }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "add_holding") {
      // Get current price
      const priceData = await fetchStockPrice(symbol, exchange || "NSE");

      const { data: holding, error: insertError } = await supabase
        .from("stock_holdings")
        .insert({
          user_id: user.id,
          symbol: symbol.toUpperCase(),
          exchange: exchange || "NSE",
          quantity,
          average_price: averagePrice,
          current_price: priceData?.price || averagePrice,
          name: priceData?.name || symbol,
          last_price_update: priceData ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      return new Response(
        JSON.stringify({ success: true, holding }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "update_holding") {
      const { error: updateError } = await supabase
        .from("stock_holdings")
        .update({
          quantity,
          average_price: averagePrice,
        })
        .eq("id", holdingId)
        .eq("user_id", user.id);

      if (updateError) {
        throw updateError;
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "delete_holding") {
      const { error: deleteError } = await supabase
        .from("stock_holdings")
        .delete()
        .eq("id", holdingId)
        .eq("user_id", user.id);

      if (deleteError) {
        throw deleteError;
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "search") {
      // Search for stocks - using a simple approach
      const searchResults = [
        { symbol: "RELIANCE", name: "Reliance Industries", exchange: "NSE" },
        { symbol: "TCS", name: "Tata Consultancy Services", exchange: "NSE" },
        { symbol: "HDFCBANK", name: "HDFC Bank", exchange: "NSE" },
        { symbol: "INFY", name: "Infosys", exchange: "NSE" },
        { symbol: "ICICIBANK", name: "ICICI Bank", exchange: "NSE" },
        { symbol: "HINDUNILVR", name: "Hindustan Unilever", exchange: "NSE" },
        { symbol: "SBIN", name: "State Bank of India", exchange: "NSE" },
        { symbol: "BHARTIARTL", name: "Bharti Airtel", exchange: "NSE" },
        { symbol: "ITC", name: "ITC Limited", exchange: "NSE" },
        { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank", exchange: "NSE" },
        { symbol: "LT", name: "Larsen & Toubro", exchange: "NSE" },
        { symbol: "AXISBANK", name: "Axis Bank", exchange: "NSE" },
        { symbol: "ASIANPAINT", name: "Asian Paints", exchange: "NSE" },
        { symbol: "MARUTI", name: "Maruti Suzuki", exchange: "NSE" },
        { symbol: "SUNPHARMA", name: "Sun Pharmaceutical", exchange: "NSE" },
        { symbol: "TATAMOTORS", name: "Tata Motors", exchange: "NSE" },
        { symbol: "WIPRO", name: "Wipro", exchange: "NSE" },
        { symbol: "HCLTECH", name: "HCL Technologies", exchange: "NSE" },
        { symbol: "ONGC", name: "Oil & Natural Gas Corp", exchange: "NSE" },
        { symbol: "NTPC", name: "NTPC Limited", exchange: "NSE" },
      ].filter(s => 
        s.symbol.toLowerCase().includes(symbol.toLowerCase()) ||
        s.name.toLowerCase().includes(symbol.toLowerCase())
      ).slice(0, 10);

      return new Response(
        JSON.stringify({ success: true, results: searchResults }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Stock prices error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
