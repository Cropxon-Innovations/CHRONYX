import { memo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Layers, ShieldCheck, Wind, TrendingUp, ArrowRight } from "lucide-react";

const benefits = [
  {
    icon: Layers,
    title: "Everything in one place",
    text: "Tasks, money, study, documents and memories live together — no more juggling ten different apps.",
  },
  {
    icon: ShieldCheck,
    title: "Private by default",
    text: "Your data belongs to you. Row-level security, optional 2FA and passkeys keep your life yours.",
  },
  {
    icon: Wind,
    title: "Designed for calm",
    text: "A minimal, quiet interface that helps you think clearly instead of demanding your attention.",
  },
  {
    icon: TrendingUp,
    title: "Grows with you",
    text: "Start with a single module and add finance, tax, study or projects whenever you're ready.",
  },
];

const steps = [
  { n: "01", title: "Create your free account", text: "Sign up in seconds — no credit card needed." },
  { n: "02", title: "Pick your modules", text: "Turn on only what you need. Hide the rest." },
  { n: "03", title: "Build your rhythm", text: "Track tasks, money and time in one quiet daily flow." },
];

const fade = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number] },
  }),
};

const CalmBenefits = memo(() => (
  <section
    aria-labelledby="calm-benefits-heading"
    className="px-6 py-24 sm:py-28 border-t border-border/10"
  >
    <div className="max-w-5xl mx-auto">
      {/* Benefits */}
      <motion.div
        className="text-center mb-14 sm:mb-16"
        variants={fade}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.4 }}
      >
        <p className="mb-3 text-[10px] tracking-[0.4em] text-muted-foreground/70 uppercase">Why CHRONYX</p>
        <h2
          id="calm-benefits-heading"
          className="text-3xl sm:text-4xl font-semibold tracking-tight"
          style={{ color: "hsl(var(--chronyx-brand))" }}
        >
          Less noise. More life.
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 mb-20 sm:mb-24">
        {benefits.map((b, i) => (
          <motion.article
            key={b.title}
            className="rounded-2xl border border-border/40 bg-card/30 backdrop-blur-sm p-6 sm:p-7 text-left"
            variants={fade}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            custom={i}
          >
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border/40 bg-muted/40">
              <b.icon className="h-5 w-5 text-foreground/80" aria-hidden="true" />
            </div>
            <h3 className="text-base font-medium text-foreground mb-1.5">{b.title}</h3>
            <p className="text-sm text-muted-foreground font-light leading-relaxed">{b.text}</p>
          </motion.article>
        ))}
      </div>

      {/* Next steps */}
      <motion.div
        className="text-center mb-12"
        variants={fade}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.4 }}
      >
        <p className="mb-3 text-[10px] tracking-[0.4em] text-muted-foreground/70 uppercase">Getting started</p>
        <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
          Three quiet steps
        </h3>
      </motion.div>

      <ol className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 mb-14">
        {steps.map((s, i) => (
          <motion.li
            key={s.n}
            className="rounded-2xl border border-border/40 p-6 text-left"
            variants={fade}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            custom={i}
          >
            <span className="text-xs font-mono text-muted-foreground/60">{s.n}</span>
            <h4 className="mt-2 text-sm font-medium text-foreground">{s.title}</h4>
            <p className="mt-1 text-sm text-muted-foreground font-light leading-relaxed">{s.text}</p>
          </motion.li>
        ))}
      </ol>

      <motion.div
        className="text-center"
        variants={fade}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <Link
          to="/login"
          className="group inline-flex items-center gap-3 px-8 py-4 text-base font-medium bg-foreground text-background rounded-full hover:bg-foreground/90 transition-all shadow-xl shadow-foreground/10"
        >
          Get Started Free
          <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
        </Link>
      </motion.div>
    </div>
  </section>
));

CalmBenefits.displayName = "CalmBenefits";
export default CalmBenefits;
