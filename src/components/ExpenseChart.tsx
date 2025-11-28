import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const COLORS = [
  "hsl(16, 90%, 58%)",  // primary
  "hsl(220, 70%, 45%)", // secondary
  "hsl(16, 95%, 68%)",  // accent
  "hsl(142, 76%, 36%)", // success
  "hsl(38, 92%, 50%)",  // warning
  "hsl(0, 85%, 60%)",   // destructive
];

interface ChartData {
  name: string;
  value: number;
}

const ExpenseChart = () => {
  const [chartData, setChartData] = useState<ChartData[]>([]);

  useEffect(() => {
    fetchExpenseData();

    const channel = supabase
      .channel('expense-chart-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        fetchExpenseData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchExpenseData = async () => {
    const { data, error } = await supabase
      .from("transactions")
      .select("category, amount")
      .eq("type", "expense");

    if (error) {
      console.error("Error fetching expense data:", error);
      return;
    }

    if (data) {
      // Group by category
      const grouped = data.reduce((acc, curr) => {
        const existing = acc.find((item) => item.name === curr.category);
        if (existing) {
          existing.value += Number(curr.amount);
        } else {
          acc.push({ name: curr.category, value: Number(curr.amount) });
        }
        return acc;
      }, [] as ChartData[]);

      setChartData(grouped);
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Expenses by Category</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No expense data yet. Start tracking your spending!
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => `$${value.toFixed(2)}`}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default ExpenseChart;
