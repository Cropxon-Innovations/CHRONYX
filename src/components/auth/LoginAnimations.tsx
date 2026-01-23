import { motion } from "framer-motion";

// Floating particles - Apple-style subtle dots
export const FloatingParticles = () => {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 1 + Math.random() * 1.5,
    duration: 25 + Math.random() * 20,
    delay: Math.random() * 8,
  }));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-primary/15"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 10, 0],
            opacity: [0.1, 0.3, 0.1],
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

// Left Panel - Apple-style clean flowing animations
export const LeftSketchAnimation = () => (
  <motion.div 
    className="flex flex-col items-center justify-center w-full h-full relative overflow-hidden"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 1 }}
  >
    {/* Background gradient mesh */}
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3" />
    
    {/* Floating productivity card */}
    <motion.div
      className="absolute top-[12%] left-[8%] bg-card/70 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl shadow-black/10 w-[280px]"
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center gap-3 mb-5">
        <motion.div 
          className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="text-lg">✨</span>
        </motion.div>
        <div>
          <p className="text-sm font-medium text-foreground">Today's Focus</p>
          <p className="text-xs text-muted-foreground">3 priorities</p>
        </div>
      </div>
      
      <div className="space-y-3">
        {[
          { text: "Review quarterly goals", done: true },
          { text: "Submit tax documents", done: false },
          { text: "Update portfolio", done: false },
        ].map((task, i) => (
          <motion.div
            key={task.text}
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
          >
            <motion.div 
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                task.done 
                  ? 'bg-emerald-500/20 border-emerald-500' 
                  : 'border-muted-foreground/30'
              }`}
              animate={task.done ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {task.done && (
                <motion.svg 
                  className="w-3 h-3 text-emerald-500" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="3"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.8, duration: 0.3 }}
                >
                  <path d="M5 12l5 5L20 7" />
                </motion.svg>
              )}
            </motion.div>
            <span className={`text-sm ${task.done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
              {task.text}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>

    {/* Finance card with animated chart */}
    <motion.div
      className="absolute bottom-[18%] left-[5%] bg-card/70 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl shadow-black/10 w-[260px]"
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Net Worth</p>
          <motion.p 
            className="text-2xl font-light mt-1 text-foreground"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            ₹12,45,890
          </motion.p>
        </div>
        <motion.div 
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1, duration: 0.4 }}
        >
          <span className="text-xs font-medium text-emerald-500">↑ 8.2%</span>
        </motion.div>
      </div>
      
      {/* Animated chart bars */}
      <div className="flex items-end gap-2 h-16 mt-4">
        {[35, 55, 40, 70, 50, 85, 65].map((h, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-t-md bg-gradient-to-t from-primary/30 to-primary/60"
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{ 
              delay: 1 + i * 0.08, 
              duration: 0.6, 
              ease: [0.16, 1, 0.3, 1] 
            }}
          />
        ))}
      </div>
    </motion.div>

    {/* Floating accent orb */}
    <motion.div
      className="absolute top-[45%] right-[15%] w-24 h-24 rounded-full"
      style={{
        background: 'radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)',
      }}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.5, 0.8, 0.5],
      }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    />

    {/* Bottom tagline */}
    <motion.div
      className="absolute bottom-8 left-1/2 -translate-x-1/2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.5, duration: 0.8 }}
    >
      <p className="text-[10px] text-muted-foreground/40 tracking-[0.4em] uppercase font-light">
        Organize Everything
      </p>
    </motion.div>
  </motion.div>
);

// Right Panel - Premium flowing visualization
export const RightSketchAnimation = () => (
  <motion.div 
    className="flex flex-col items-center justify-center w-full h-full relative overflow-hidden"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 1 }}
  >
    {/* Background gradient mesh */}
    <div className="absolute inset-0 bg-gradient-to-bl from-primary/5 via-transparent to-primary/3" />
    
    {/* Life visualization card */}
    <motion.div
      className="absolute top-[10%] right-[8%] bg-card/70 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl shadow-black/10"
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center gap-3 mb-5">
        <motion.div 
          className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center"
          animate={{ rotate: [0, -5, 5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="text-lg">⏳</span>
        </motion.div>
        <div>
          <p className="text-sm font-medium text-foreground">Life Calendar</p>
          <p className="text-xs text-muted-foreground">Week 26 • Year 32</p>
        </div>
      </div>
      
      {/* Life grid - minimalist weeks */}
      <div className="grid grid-cols-10 gap-1 w-fit">
        {Array.from({ length: 40 }).map((_, i) => (
          <motion.div
            key={i}
            className={`w-3 h-3 rounded-sm ${
              i < 22 
                ? 'bg-gradient-to-br from-primary/60 to-primary/40' 
                : 'bg-muted/30'
            }`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              delay: 0.6 + i * 0.02, 
              duration: 0.3,
              ease: [0.16, 1, 0.3, 1]
            }}
          />
        ))}
      </div>
    </motion.div>

    {/* Memory stack - elegant floating cards */}
    <motion.div
      className="absolute bottom-[25%] right-[10%]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.8 }}
    >
      <div className="relative">
        {[
          { rotate: -12, z: 1, gradient: "from-rose-500/15 to-rose-500/5", delay: 0.6 },
          { rotate: 6, z: 2, gradient: "from-amber-500/15 to-amber-500/5", delay: 0.75 },
          { rotate: -3, z: 3, gradient: "from-primary/15 to-primary/5", delay: 0.9 },
        ].map((card, i) => (
          <motion.div
            key={i}
            className={`absolute w-36 h-44 rounded-2xl bg-gradient-to-br ${card.gradient} border border-white/10 backdrop-blur-sm shadow-xl`}
            style={{ 
              rotate: card.rotate, 
              zIndex: card.z,
              top: (3 - i) * 8,
              left: (3 - i) * 4,
            }}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              delay: card.delay, 
              duration: 0.6, 
              ease: [0.16, 1, 0.3, 1] 
            }}
          />
        ))}
        
        {/* Top card content */}
        <motion.div
          className="relative w-36 h-44 rounded-2xl flex flex-col items-center justify-center"
          style={{ zIndex: 4, rotate: -3 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.5 }}
        >
          <motion.span 
            className="text-4xl mb-2"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            📸
          </motion.span>
          <span className="text-xs text-muted-foreground font-medium">248 Memories</span>
        </motion.div>
      </div>
    </motion.div>

    {/* Notification pill */}
    <motion.div
      className="absolute top-[48%] right-[5%] bg-card/80 backdrop-blur-2xl border border-amber-500/20 rounded-2xl px-4 py-3 shadow-lg flex items-center gap-3"
      initial={{ opacity: 0, x: 30, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ delay: 1.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.span 
        className="text-xl"
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
      >
        🛡️
      </motion.span>
      <div>
        <p className="text-xs font-medium text-foreground">Policy Renewal</p>
        <p className="text-[10px] text-amber-600 dark:text-amber-400">12 days remaining</p>
      </div>
    </motion.div>

    {/* Floating accent orb */}
    <motion.div
      className="absolute bottom-[50%] left-[10%] w-32 h-32 rounded-full"
      style={{
        background: 'radial-gradient(circle, hsl(var(--primary) / 0.1) 0%, transparent 70%)',
      }}
      animate={{
        scale: [1.1, 1, 1.1],
        opacity: [0.4, 0.7, 0.4],
      }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
    />

    {/* Bottom tagline */}
    <motion.div
      className="absolute bottom-8 left-1/2 -translate-x-1/2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.5, duration: 0.8 }}
    >
      <p className="text-[10px] text-muted-foreground/40 tracking-[0.4em] uppercase font-light">
        Preserve Moments
      </p>
    </motion.div>
  </motion.div>
);

// Premium glowing orb background
export const GlowingOrbs = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <motion.div
      className="absolute top-1/3 -left-48 w-[500px] h-[500px] rounded-full"
      style={{
        background: 'radial-gradient(circle, hsl(var(--primary) / 0.06) 0%, transparent 60%)',
        filter: 'blur(60px)',
      }}
      animate={{
        scale: [1, 1.15, 1],
        opacity: [0.4, 0.6, 0.4],
      }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.div
      className="absolute bottom-1/3 -right-48 w-[500px] h-[500px] rounded-full"
      style={{
        background: 'radial-gradient(circle, hsl(var(--primary) / 0.06) 0%, transparent 60%)',
        filter: 'blur(60px)',
      }}
      animate={{
        scale: [1.15, 1, 1.15],
        opacity: [0.6, 0.4, 0.6],
      }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 5 }}
    />
  </div>
);
