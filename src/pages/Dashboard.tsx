import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Wallet, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import FinanceOverview from "@/components/FinanceOverview";
import TransactionForm from "@/components/TransactionForm";
import TransactionList from "@/components/TransactionList";
import TodoList from "@/components/TodoList";
import EventsList from "@/components/EventsList";
import ExpenseChart from "@/components/ExpenseChart";
import BudgetSetter from "@/components/BudgetSetter";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Wallet className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <header className="bg-card/50 backdrop-blur-lg border-b border-border/50 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold gradient-text">MoneyWise</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm text-muted-foreground">Logged in as</p>
              <p className="text-sm font-medium">{user?.email}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Finance Overview */}
        <FinanceOverview />

        {/* Budget and Transaction */}
        <div className="grid lg:grid-cols-2 gap-6">
          <BudgetSetter />
          <div className="glass-card p-6 rounded-2xl animate-fade-in">
            <h2 className="text-xl font-bold mb-4">Add Transaction</h2>
            <TransactionForm />
          </div>
        </div>

        {/* Charts and Stats */}
        <div className="grid lg:grid-cols-2 gap-6">
          <ExpenseChart />
          <TransactionList />
        </div>

        {/* Productivity Suite */}
        <div className="grid lg:grid-cols-2 gap-6">
          <TodoList />
          <EventsList />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
