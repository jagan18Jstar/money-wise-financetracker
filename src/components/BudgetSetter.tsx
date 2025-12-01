import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Target, Save } from "lucide-react";

const BudgetSetter = () => {
  const [monthlyLimit, setMonthlyLimit] = useState<string>("");
  const [currentBudget, setCurrentBudget] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchBudget();
  }, []);

  const fetchBudget = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("budgets")
        .select("monthly_limit")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setCurrentBudget(Number(data.monthly_limit));
        setMonthlyLimit(data.monthly_limit.toString());
      }
    } catch (error) {
      console.error("Error fetching budget:", error);
    }
  };

  const handleSaveBudget = async () => {
    if (!monthlyLimit || Number(monthlyLimit) <= 0) {
      toast({
        title: "Invalid budget",
        description: "Please enter a valid budget amount",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      if (currentBudget !== null) {
        // Update existing budget
        const { error } = await supabase
          .from("budgets")
          .update({ monthly_limit: Number(monthlyLimit) })
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        // Insert new budget
        const { error } = await supabase
          .from("budgets")
          .insert({ user_id: user.id, monthly_limit: Number(monthlyLimit) });

        if (error) throw error;
      }

      setCurrentBudget(Number(monthlyLimit));
      toast({
        title: "Budget saved",
        description: `Your monthly budget has been set to Rs ${Number(monthlyLimit).toFixed(2)}`,
      });
    } catch (error) {
      console.error("Error saving budget:", error);
      toast({
        title: "Error",
        description: "Failed to save budget. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <CardTitle>Monthly Budget</CardTitle>
        </div>
        <CardDescription>
          Set your monthly spending limit to track your expenses
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="budget">Budget Limit (Rs)</Label>
            <Input
              id="budget"
              type="number"
              placeholder="Enter monthly budget"
              value={monthlyLimit}
              onChange={(e) => setMonthlyLimit(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>
          {currentBudget !== null && (
            <p className="text-sm text-muted-foreground">
              Current budget: Rs {currentBudget.toFixed(2)}
            </p>
          )}
          <Button onClick={handleSaveBudget} disabled={loading} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Saving..." : "Save Budget"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BudgetSetter;
