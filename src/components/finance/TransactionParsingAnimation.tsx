import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowRight, CreditCard, Calendar, Store, Tag } from "lucide-react";

interface TransactionParsingAnimationProps {
  isActive: boolean;
  currentEmail?: {
    subject: string;
    amount?: number;
    merchant?: string;
  };
}

const TransactionParsingAnimation = ({
  isActive,
  currentEmail,
}: TransactionParsingAnimationProps) => {
  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="relative p-4 rounded-lg bg-gradient-to-r from-red-500/5 via-orange-500/5 to-transparent border border-red-500/10">
        {/* Email envelope animation */}
        <div className="flex items-center gap-4">
          {/* Email icon with opening animation */}
          <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="relative"
          >
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <Mail className="w-6 h-6 text-white" />
            </div>
            {/* Scanning line */}
            <motion.div
              animate={{ top: ["0%", "100%", "0%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 right-0 h-0.5 bg-emerald-500/50"
              style={{ top: "0%" }}
            />
          </motion.div>

          {/* Arrow */}
          <motion.div
            animate={{ x: [0, 5, 0], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <ArrowRight className="w-5 h-5 text-muted-foreground" />
          </motion.div>

          {/* Extracted data cards */}
          <div className="flex-1 space-y-2">
            <AnimatePresence>
              {currentEmail?.amount && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-2 text-sm"
                >
                  <div className="w-6 h-6 rounded bg-emerald-500/10 flex items-center justify-center">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <span className="text-foreground font-medium">
                    ₹{currentEmail.amount.toLocaleString()}
                  </span>
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="text-[10px] text-emerald-500"
                  >
                    Detected
                  </motion.span>
                </motion.div>
              )}

              {currentEmail?.merchant && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-2 text-sm"
                >
                  <div className="w-6 h-6 rounded bg-orange-500/10 flex items-center justify-center">
                    <Store className="w-3.5 h-3.5 text-orange-500" />
                  </div>
                  <span className="text-foreground">{currentEmail.merchant}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Subject preview */}
            {currentEmail?.subject && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-muted-foreground truncate max-w-[300px]"
              >
                {currentEmail.subject}
              </motion.p>
            )}
          </div>
        </div>

        {/* Processing dots */}
        <div className="absolute bottom-2 right-2 flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              className="w-1.5 h-1.5 rounded-full bg-red-500"
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default TransactionParsingAnimation;
