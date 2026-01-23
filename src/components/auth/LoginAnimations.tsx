import { motion } from "framer-motion";

// Floating particles - Apple-style subtle dots
export const FloatingParticles = () => {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 1 + Math.random() * 2,
    duration: 20 + Math.random() * 15,
    delay: Math.random() * 5,
  }));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-primary/10"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          animate={{
            y: [0, -40, 0],
            opacity: [0.1, 0.4, 0.1],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// Left Panel - Tasks & Finance Preview (Apple-style clean animation)
export const LeftSketchAnimation = () => (
  <motion.div 
    className="hidden lg:flex flex-col items-center justify-center w-full h-full relative"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 1.2 }}
  >
    {/* Floating Tasks Card */}
    <motion.div
      className="absolute top-[15%] left-[10%] bg-card/60 backdrop-blur-xl border border-border/30 rounded-2xl p-5 shadow-2xl w-64"
      initial={{ opacity: 0, y: 30, rotateX: 15 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">Today's Focus</span>
      </div>
      {["Review quarterly goals", "Submit tax documents", "Call insurance agent"].map((task, i) => (
        <motion.div
          key={task}
          className="flex items-center gap-3 py-2.5"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 + i * 0.15, duration: 0.5 }}
        >
          <motion.div 
            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${i === 0 ? 'bg-primary border-primary' : 'border-muted-foreground/30'}`}
            animate={i === 0 ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {i === 0 && <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />}
          </motion.div>
          <span className={`text-sm ${i === 0 ? 'text-foreground' : 'text-muted-foreground'}`}>{task}</span>
        </motion.div>
      ))}
    </motion.div>

    {/* Finance Stats Card */}
    <motion.div
      className="absolute bottom-[20%] left-[5%] bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border border-border/30 rounded-2xl p-5 shadow-2xl w-56"
      initial={{ opacity: 0, y: 30, rotateY: -10 }}
      animate={{ opacity: 1, y: 0, rotateY: 0 }}
      transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
    >
      <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">Net Worth</span>
      <motion.div 
        className="text-2xl font-light mt-2 text-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        ₹12,45,890
      </motion.div>
      <div className="flex items-center gap-2 mt-2">
        <span className="text-xs text-emerald-500">↑ 8.2%</span>
        <span className="text-xs text-muted-foreground">this month</span>
      </div>
      
      {/* Mini chart bars */}
      <div className="flex items-end gap-1.5 mt-4 h-10">
        {[40, 65, 45, 80, 55, 75, 90].map((h, i) => (
          <motion.div
            key={i}
            className="flex-1 bg-gradient-to-t from-primary/40 to-primary/80 rounded-sm"
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{ delay: 1.2 + i * 0.08, duration: 0.4, ease: "easeOut" }}
          />
        ))}
      </div>
    </motion.div>

    {/* Floating label */}
    <motion.div
      className="absolute bottom-8 left-1/2 -translate-x-1/2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 2, duration: 1 }}
    >
      <p className="text-[11px] text-muted-foreground/50 tracking-[0.3em] uppercase">Organize Life</p>
    </motion.div>
  </motion.div>
);

// Right Panel - Memories & Time Preview (Apple-style clean animation)
export const RightSketchAnimation = () => (
  <motion.div 
    className="hidden lg:flex flex-col items-center justify-center w-full h-full relative"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 1.2 }}
  >
    {/* Lifespan Visualization */}
    <motion.div
      className="absolute top-[12%] right-[8%] bg-card/60 backdrop-blur-xl border border-border/30 rounded-2xl p-5 shadow-2xl"
      initial={{ opacity: 0, y: 30, rotateX: -10 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-xs">⏳</span>
        </div>
        <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">Your Time</span>
      </div>
      
      {/* Weeks grid - minimalist */}
      <div className="grid grid-cols-13 gap-0.5 w-48">
        {Array.from({ length: 52 }).map((_, i) => (
          <motion.div
            key={i}
            className={`w-2.5 h-2.5 rounded-sm ${i < 26 ? 'bg-primary/80' : 'bg-muted/40'}`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 + i * 0.015, duration: 0.2 }}
          />
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground mt-3">Week 26 of Year 32</p>
    </motion.div>

    {/* Memory Cards Stack */}
    <motion.div
      className="absolute bottom-[22%] right-[12%]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6, duration: 0.8 }}
    >
      {[
        { rotate: -8, delay: 0.7, bg: "from-rose-500/20 to-rose-500/5" },
        { rotate: 4, delay: 0.85, bg: "from-amber-500/20 to-amber-500/5" },
        { rotate: -2, delay: 1, bg: "from-primary/20 to-primary/5" },
      ].map((card, i) => (
        <motion.div
          key={i}
          className={`absolute w-32 h-40 rounded-xl bg-gradient-to-br ${card.bg} border border-border/20 backdrop-blur-sm shadow-xl`}
          style={{ rotate: card.rotate, zIndex: 3 - i }}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: i * -8 }}
          transition={{ delay: card.delay, duration: 0.6, ease: "easeOut" }}
        />
      ))}
      
      {/* Top card content */}
      <motion.div
        className="absolute w-32 h-40 rounded-xl flex flex-col items-center justify-center z-10"
        style={{ rotate: -2 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3, duration: 0.5 }}
      >
        <span className="text-3xl mb-2">📸</span>
        <span className="text-[10px] text-muted-foreground tracking-wide">248 Memories</span>
      </motion.div>
    </motion.div>

    {/* Insurance Reminder Pill */}
    <motion.div
      className="absolute top-[55%] right-[5%] bg-card/70 backdrop-blur-xl border border-amber-500/30 rounded-full px-4 py-2 shadow-lg flex items-center gap-2"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1.5, duration: 0.6, ease: "easeOut" }}
    >
      <span className="text-sm">🛡️</span>
      <span className="text-xs text-amber-600 dark:text-amber-400">Policy renewal in 12 days</span>
    </motion.div>

    {/* Floating label */}
    <motion.div
      className="absolute bottom-8 left-1/2 -translate-x-1/2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 2, duration: 1 }}
    >
      <p className="text-[11px] text-muted-foreground/50 tracking-[0.3em] uppercase">Preserve Moments</p>
    </motion.div>
  </motion.div>
);

// Premium glowing orb background
export const GlowingOrbs = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <motion.div
      className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-gradient-to-r from-primary/8 to-transparent blur-3xl"
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.5, 0.3],
      }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.div
      className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-gradient-to-l from-primary/8 to-transparent blur-3xl"
      animate={{
        scale: [1.2, 1, 1.2],
        opacity: [0.5, 0.3, 0.5],
      }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 4 }}
    />
    <motion.div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-radial from-primary/5 to-transparent blur-3xl"
      animate={{
        scale: [1, 1.1, 1],
      }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
    />
  </div>
);
