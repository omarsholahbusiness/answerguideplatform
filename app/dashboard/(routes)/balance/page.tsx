"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { Wallet, Plus, History, ArrowUpRight, CreditCard, Send } from "lucide-react";
import { useRTL } from "@/components/providers/rtl-provider";
import { useTranslations } from "@/lib/use-translations";

interface BalanceTransaction {
  id: string;
  amount: number;
  type: "DEPOSIT" | "PURCHASE";
  description: string;
  createdAt: string;
}

export default function BalancePage() {
  const { data: session } = useSession();
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState<BalanceTransaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const { isRTL, language } = useRTL();
  const { t } = useTranslations();

  // Check if user is a student (USER role)
  const isStudent = session?.user?.role === "USER";

  useEffect(() => {
    fetchBalance();
    fetchTransactions();
  }, []);

  const fetchBalance = async () => {
    try {
      const response = await fetch("/api/user/balance");
      if (response.ok) {
        const data = await response.json();
        setBalance(data.balance);
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch("/api/balance/transactions");
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const handleAddBalance = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error(t("invalidAmount"));
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/balance/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: parseFloat(amount) }),
      });

      if (response.ok) {
        const data = await response.json();
        setBalance(data.newBalance);
        setAmount("");
        toast.success(t("balanceAddedSuccess"));
        fetchTransactions(); // Refresh transactions
      } else {
        const error = await response.text();
        toast.error(error || t("balanceAddError"));
      }
    } catch (error) {
      console.error("Error adding balance:", error);
      toast.error(t("balanceAddError"));
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("balanceManagement")}</h1>
          <p className="text-muted-foreground">
            {isStudent 
              ? t("viewBalanceTransactions")
              : t("addBalanceToAccount")
            }
          </p>
        </div>
      </div>

      {/* Balance Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            {t("accountBalance")}
          </CardTitle>
          <CardDescription>
            {t("availableBalance")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-[#005bd3]">
            {balance.toFixed(2)} {t("egp")}
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t("paymentMethods")}
          </CardTitle>
          <CardDescription>
            {t("selectPaymentMethod")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Vodafone Cash */}
          <div className="p-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-[#005bd3]/10 rounded-full">
                <CreditCard className="h-5 w-5 text-[#005bd3]" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">{t("vodafoneCash")}</h3>
                <p className="text-2xl font-bold text-[#005bd3] mb-2" dir="ltr">01095968792</p>
                <p className="text-sm text-muted-foreground">
                  {t("transferAmount")}
                </p>
              </div>
            </div>
          </div>

          {/* Confirmation Instructions */}
          <div className="p-4 border-2 border-[#005bd3]/20 rounded-lg bg-[#005bd3]/5">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-[#005bd3]/10 rounded-full">
                <Send className="h-5 w-5 text-[#005bd3]" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2 text-[#005bd3]">{t("paymentConfirmation")}</h3>
                <p className="text-sm mb-3">
                  {t("afterTransferInstructions")}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#005bd3]"></div>
                    <span className="font-semibold" dir="ltr">01095968792</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Balance Section - Only for non-students */}
      {!isStudent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              {t("addBalance")}
            </CardTitle>
            <CardDescription>
              {t("addBalanceDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                type="number"
                placeholder={t("enterAmount")}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                step="0.01"
                className="flex-1"
              />
              <Button 
                onClick={handleAddBalance}
                disabled={isLoading}
                className="bg-[#005bd3] hover:bg-[#005bd3]/90"
              >
                {isLoading ? t("addingBalance") : t("addBalanceButton")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            {t("transactionHistory")}
          </CardTitle>
          <CardDescription>
            {t("allTransactions")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingTransactions ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#005bd3] mx-auto"></div>
              <p className="mt-2 text-muted-foreground">{t("loading")}</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">{t("noTransactions")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      transaction.type === "DEPOSIT" 
                        ? "bg-green-100 text-green-600" 
                        : "bg-red-100 text-red-600"
                    }`}>
                      {transaction.type === "DEPOSIT" ? (
                        <Plus className="h-4 w-4" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4" />
                      )}
                    </div>
                                         <div>
                       <p className="font-medium">
                         {transaction.description.includes("Added") && transaction.type === "DEPOSIT" 
                           ? transaction.description.replace(/Added (\d+(?:\.\d+)?) EGP to balance/, language === "ar" ? `${t("addedToBalance")} $1 ${t("egp")} إلى الرصيد` : `${t("addedToBalance")} $1 ${t("egp")} to balance`)
                           : transaction.description.includes("Purchased course:") && transaction.type === "PURCHASE"
                           ? transaction.description.replace(/Purchased course: (.+)/, `${t("purchasedCourse")} $1`)
                           : transaction.description
                         }
                       </p>
                       <p className="text-sm text-muted-foreground">
                         {formatDate(transaction.createdAt)}
                       </p>
                       <p className="text-xs text-muted-foreground">
                         {transaction.type === "DEPOSIT" ? t("deposit") : t("coursePurchase")}
                       </p>
                     </div>
                  </div>
                  <div className={`font-bold ${
                    transaction.type === "DEPOSIT" ? "text-green-600" : "text-red-600"
                  }`}>
                    {transaction.type === "DEPOSIT" ? "+" : "-"}
                    {Math.abs(transaction.amount).toFixed(2)} {t("egp")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 