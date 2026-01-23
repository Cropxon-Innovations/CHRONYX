import { motion } from "framer-motion";

// Floating particles - Apple-style subtle dots with smoother motion
export const FloatingParticles = () => {
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 1 + Math.random() * 1.5,
    duration: 30 + Math.random() * 20,
    delay: Math.random() * 10,
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
            y: [0, -20, 0],
            x: [0, 8, 0],
            opacity: [0.05, 0.2, 0.05],
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
    transition={{ duration: 1.2, ease: "easeOut" }}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3" />
    
    <motion.div
      className="absolute top-[20%] right-[10%] w-40 h-40 rounded-full"
      style={{
        background: 'radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 70%)',
        filter: 'blur(40px)',
      }}
      animate={{ y: [0, -15, 0], scale: [1, 1.05, 1] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
    />

    <motion.div
      className="absolute top-[12%] left-[8%] bg-card/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl shadow-black/5 w-[280px]"
      initial={{ opacity: 0, y: 60, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.3, duration: 1, ease: "easeOut" }}
      whileHover={{ y: -4, transition: { duration: 0.3 } }}
    >
      <div className="flex items-center gap-3 mb-5">
        <motion.div 
          className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"
          animate={{ rotate: [0, 3, -3, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
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
            transition={{ delay: 0.6 + i * 0.15, duration: 0.6, ease: "easeOut" }}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              task.done ? 'bg-emerald-500/20 border-emerald-500' : 'border-muted-foreground/30'
            }`}>
              {task.done && (
                <svg className="w-3 h-3 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M5 12l5 5L20 7" />
                </svg>
              )}
            </div>
            <span className={`text-sm ${task.done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
              {task.text}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>

    <motion.div
      className="absolute bottom-[18%] left-[5%] bg-card/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl shadow-black/5 w-[260px]"
      initial={{ opacity: 0, y: 60, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
      whileHover={{ y: -4, transition: { duration: 0.3 } }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Net Worth</p>
          <motion.p 
            className="text-2xl font-light mt-1 text-foreground"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1, duration: 0.6, ease: "easeOut" }}
          >
            ₹12,45,890
          </motion.p>
        </div>
        <motion.div 
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10"
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.2, duration: 0.5, ease: "easeOut" }}
        >
          <span className="text-xs font-medium text-emerald-500">↑ 8.2%</span>
        </motion.div>
      </div>
      
      <div className="flex items-end gap-2 h-16 mt-4">
        {[35, 55, 40, 70, 50, 85, 65].map((h, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-t-md bg-gradient-to-t from-primary/30 to-primary/60"
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{ delay: 1.3 + i * 0.1, duration: 0.8, ease: "easeOut" }}
          />
        ))}
      </div>
    </motion.div>

    <motion.div
      className="absolute bottom-8 left-1/2 -translate-x-1/2"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.8, duration: 1, ease: "easeOut" }}
    >
      <p className="text-[10px] text-muted-foreground/40 tracking-[0.4em] uppercase font-light">
        Organize Everything
      </p>
    </motion.div>
  </motion.div>
);

// Right Panel - Premium hero scene with parallax depth
export const RightSketchAnimation = () => (
  <motion.div 
    className="flex flex-col items-center justify-center w-full h-full relative overflow-hidden"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 1.2, ease: "easeOut" }}
  >
    <div className="absolute inset-0 bg-gradient-to-bl from-primary/5 via-transparent to-primary/3" />
    
    <motion.div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full"
      style={{
        background: 'radial-gradient(circle, hsl(var(--primary) / 0.06) 0%, transparent 60%)',
        filter: 'blur(60px)',
      }}
      animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.6, 0.4] }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
    />

    <motion.div
      className="absolute top-[10%] right-[8%] bg-card/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl shadow-black/5"
      initial={{ opacity: 0, y: 60, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.4, duration: 1, ease: "easeOut" }}
      whileHover={{ y: -4, transition: { duration: 0.3 } }}
    >
      <div className="flex items-center gap-3 mb-5">
        <motion.div 
          className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center"
          animate={{ rotate: [0, -3, 3, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="text-lg">⏳</span>
        </motion.div>
        <div>
          <p className="text-sm font-medium text-foreground">Life Calendar</p>
          <p className="text-xs text-muted-foreground">Week 26 • Year 32</p>
        </div>
      </div>
      
      <div className="grid grid-cols-10 gap-1 w-fit">
        {Array.from({ length: 40 }).map((_, i) => (
          <motion.div
            key={i}
            className={`w-3 h-3 rounded-sm ${i < 22 ? 'bg-gradient-to-br from-primary/60 to-primary/40' : 'bg-muted/30'}`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 + i * 0.025, duration: 0.4, ease: "easeOut" }}
          />
        ))}
      </div>
    </motion.div>

    <motion.div
      className="absolute bottom-[22%] right-[10%]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6, duration: 1, ease: "easeOut" }}
    >
      <div className="relative">
        {[
          { rotate: -10, z: 1, gradient: "from-rose-500/12 to-rose-500/4", delay: 0.7 },
          { rotate: 5, z: 2, gradient: "from-amber-500/12 to-amber-500/4", delay: 0.85 },
          { rotate: -2, z: 3, gradient: "from-primary/12 to-primary/4", delay: 1.0 },
        ].map((card, i) => (
          <motion.div
            key={i}
            className={`absolute w-32 h-40 rounded-2xl bg-gradient-to-br ${card.gradient} border border-white/10 backdrop-blur-sm shadow-xl`}
            style={{ rotate: card.rotate, zIndex: card.z, top: (3 - i) * 6, left: (3 - i) * 3 }}
            initial={{ opacity: 0, y: 40, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: card.delay, duration: 0.8, ease: "easeOut" }}
          />
        ))}
        
        <motion.div
          className="relative w-32 h-40 rounded-2xl flex flex-col items-center justify-center"
          style={{ zIndex: 4, rotate: -2 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.6, ease: "easeOut" }}
        >
          <motion.span className="text-3xl mb-2" animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
            📸
          </motion.span>
          <span className="text-xs text-muted-foreground font-medium">248 Memories</span>
        </motion.div>
      </div>
    </motion.div>

    <motion.div
      className="absolute top-[45%] right-[5%] bg-card/90 backdrop-blur-2xl border border-amber-500/20 rounded-2xl px-4 py-3 shadow-lg flex items-center gap-3"
      initial={{ opacity: 0, x: 40, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ delay: 1.4, duration: 0.8, ease: "easeOut" }}
    >
      <motion.span className="text-xl" animate={{ rotate: [0, 8, -8, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 2, ease: "easeInOut" }}>
        🛡️
      </motion.span>
      <div>
        <p className="text-xs font-medium text-foreground">Policy Renewal</p>
        <p className="text-[10px] text-amber-600 dark:text-amber-400">12 days remaining</p>
      </div>
    </motion.div>

    <motion.div
      className="absolute bottom-8 left-1/2 -translate-x-1/2"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 2, duration: 1, ease: "easeOut" }}
    >
      <p className="text-[10px] text-muted-foreground/40 tracking-[0.4em] uppercase font-light">
        Preserve Moments
      </p>
    </motion.div>
  </motion.div>
);

export const GlowingOrbs = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <motion.div
      className="absolute top-1/3 -left-48 w-[500px] h-[500px] rounded-full"
      style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.05) 0%, transparent 60%)', filter: 'blur(80px)' }}
      animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.div
      className="absolute bottom-1/3 -right-48 w-[500px] h-[500px] rounded-full"
      style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.05) 0%, transparent 60%)', filter: 'blur(80px)' }}
      animate={{ scale: [1.1, 1, 1.1], opacity: [0.5, 0.3, 0.5] }}
      transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 6 }}
    />
  </div>
);
