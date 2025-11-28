import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Transaction {
  amount: number;
  type: "income" | "expense";
  date: string;
}

const FinanceOverview = () => {
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [balance, setBalance] = useState(0);
  const [budgetWarning, setBudgetWarning] = useState<string | null>(null);

  useEffect(() => {
    fetchFinanceData();
    
    // Subscribe to real-time changes
    const channel = supabase
      .channel('finance-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        fetchFinanceData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchFinanceData = async () => {
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("amount, type, date");

    if (error) {
      console.error("Error fetching transactions:", error);
      return;
    }

    if (transactions) {
      const income = transactions
        .filter((t: Transaction) => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const expense = transactions
        .filter((t: Transaction) => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      setTotalIncome(income);
      setTotalExpense(expense);
      setBalance(income - expense);

      // Calculate budget projection
      calculateBudgetProjection(transactions as Transaction[]);
    }
  };

  const calculateBudgetProjection = (transactions: Transaction[]) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysLeft = daysInMonth - now.getDate();

    // Filter this month's expenses
    const thisMonthExpenses = transactions.filter((t) => {
      const tDate = new Date(t.date);
      return (
        t.type === "expense" &&
        tDate.getMonth() === currentMonth &&
        tDate.getFullYear() === currentYear
      );
    });

    if (thisMonthExpenses.length === 0) {
      setBudgetWarning(null);
      return;
    }

    const totalExpenseThisMonth = thisMonthExpenses.reduce(
      (sum, t) => sum + Number(t.amount),
      0
    );
    const avgDailySpend = totalExpenseThisMonth / now.getDate();
    const projectedSpend = avgDailySpend * daysLeft;

    // Calculate current balance for this month
    const thisMonthIncome = transactions
      .filter((t) => {
        const tDate = new Date(t.date);
        return (
          t.type === "income" &&
          tDate.getMonth() === currentMonth &&
          tDate.getFullYear() === currentYear
        );
      })
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const currentBalance = thisMonthIncome - totalExpenseThisMonth;
    const projection = currentBalance - projectedSpend;

    if (projection < 0) {
      setBudgetWarning(
        `Warning: At your current spending rate, you may run short by $${Math.abs(projection).toFixed(2)} by month's end!`
      );
    } else {
      setBudgetWarning(null);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {budgetWarning && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{budgetWarning}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass-card border-l-4 border-l-success">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">
              ${balance.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Current available balance
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              ${totalIncome.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All time earnings
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-l-4 border-l-destructive">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">
              ${totalExpense.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All time spending
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinanceOverview;
