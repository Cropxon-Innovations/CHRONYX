import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  X, 
  Wallet, 
  CheckSquare, 
  Key,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuickTodoDialog, QuickExpenseDialog, QuickVaultDialog } from "./QuickAddDialogs";

const FloatingQuickAction = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [todoOpen, setTodoOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [vaultOpen, setVaultOpen] = useState(false);

  const actions = [
    { 
      icon: CheckSquare, 
      label: "Add Task", 
      color: "text-blue-400",
      onClick: () => { setTodoOpen(true); setIsOpen(false); }
    },
    { 
      icon: Wallet, 
      label: "Add Expense", 
      color: "text-red-400",
      onClick: () => { setExpenseOpen(true); setIsOpen(false); }
    },
    { 
      icon: Key, 
      label: "Add Credential", 
      color: "text-purple-400",
      onClick: () => { setVaultOpen(true); setIsOpen(false); }
    },
  ];

  return (
    <>
      <div className="fixed bottom-24 right-6 z-40">
        {/* Action buttons */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute bottom-16 right-0 flex flex-col gap-2 items-end"
            >
              {actions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <motion.div
                    key={action.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-2"
                  >
                    <span className="px-2 py-1 text-xs font-medium bg-card border border-border rounded-md shadow-md whitespace-nowrap">
                      {action.label}
                    </span>
                    <Button
                      size="icon"
                      variant="outline"
                      className={`w-10 h-10 rounded-full shadow-lg border-border/50 bg-card hover:bg-accent ${action.color}`}
                      onClick={action.onClick}
                    >
                      <Icon className="w-4 h-4" />
                    </Button>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main FAB button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 ${
            isOpen 
              ? "bg-muted-foreground text-background rotate-45" 
              : "bg-primary text-primary-foreground"
          }`}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
        </motion.button>

        {/* Backdrop when open */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/40 backdrop-blur-sm -z-10"
              onClick={() => setIsOpen(false)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Quick Add Dialogs */}
      <QuickTodoDialog open={todoOpen} onOpenChange={setTodoOpen} />
      <QuickExpenseDialog open={expenseOpen} onOpenChange={setExpenseOpen} />
      <QuickVaultDialog open={vaultOpen} onOpenChange={setVaultOpen} />
    </>
  );
};

export default FloatingQuickAction;
