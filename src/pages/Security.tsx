import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Lock, Eye, Database, Download, Trash2, Key, Server } from "lucide-react";
import { motion } from "framer-motion";

const Security = () => {
  return (
    <motion.main
      className="min-h-screen bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* SEO-optimized header */}
      <header className="sr-only">
        <h1>CHRONYX Security & Data Control - Your Data, Your Control</h1>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <nav aria-label="Breadcrumb">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back to Home
          </Link>
        </nav>

        <article>
          <h1 className="text-3xl font-light tracking-wide text-foreground mb-2">
            Security & Data Control
          </h1>
          <p className="text-sm text-muted-foreground mb-8">Your data belongs to you. Always.</p>

          {/* Trust Badge Section */}
          <section className="mb-10 p-6 rounded-xl bg-gradient-to-br from-primary/5 via-transparent to-accent/5 border border-border/50" aria-labelledby="trust-heading">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" aria-hidden="true" />
              </div>
              <div>
                <h2 id="trust-heading" className="text-lg font-medium text-foreground">Privacy-First Promise</h2>
                <p className="text-sm text-muted-foreground">CHRONYX never sells user data</p>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              <strong className="text-foreground">All data belongs to the user and can be exported or deleted at any time.</strong> We believe your personal records should remain personal. CHRONYX is built on the principle that you are the sole owner of your data.
            </p>
          </section>

          <div className="prose prose-sm dark:prose-invert max-w-none space-y-8">
            {/* Data Encryption */}
            <section aria-labelledby="encryption-heading">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-5 h-5 text-primary" aria-hidden="true" />
                <h2 id="encryption-heading" className="text-xl font-medium text-foreground !mt-0 !mb-0">End-to-End Encryption</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Your sensitive data is encrypted using industry-standard AES-256 encryption. Vault contents, financial records, and personal notes are protected with encryption keys that only you control.
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-3" role="list">
                <li>AES-256 encryption for sensitive data at rest</li>
                <li>TLS 1.3 encryption for all data in transit</li>
                <li>Zero-knowledge architecture for vault contents</li>
                <li>Secure password hashing with bcrypt</li>
              </ul>
            </section>

            {/* Data Storage */}
            <section aria-labelledby="storage-heading">
              <div className="flex items-center gap-3 mb-4">
                <Database className="w-5 h-5 text-primary" aria-hidden="true" />
                <h2 id="storage-heading" className="text-xl font-medium text-foreground !mt-0 !mb-0">Secure Cloud Storage</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Your data is stored on secure, enterprise-grade cloud infrastructure with multiple redundancy layers.
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-3" role="list">
                <li>SOC 2 Type II compliant infrastructure</li>
                <li>Automatic encrypted backups</li>
                <li>Row-level security (RLS) for database access</li>
                <li>Geographic data residency options</li>
              </ul>
            </section>

            {/* Access Control */}
            <section aria-labelledby="access-heading">
              <div className="flex items-center gap-3 mb-4">
                <Key className="w-5 h-5 text-primary" aria-hidden="true" />
                <h2 id="access-heading" className="text-xl font-medium text-foreground !mt-0 !mb-0">Access Control</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Multi-layered authentication ensures only you can access your personal data.
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-3" role="list">
                <li>Secure authentication with email verification</li>
                <li>Optional two-factor authentication (2FA)</li>
                <li>Session management with automatic logout</li>
                <li>OAuth integration with Google for secure login</li>
              </ul>
            </section>

            {/* Privacy Controls */}
            <section aria-labelledby="privacy-heading">
              <div className="flex items-center gap-3 mb-4">
                <Eye className="w-5 h-5 text-primary" aria-hidden="true" />
                <h2 id="privacy-heading" className="text-xl font-medium text-foreground !mt-0 !mb-0">Privacy Controls</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                You have complete control over your privacy settings and data visibility.
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-3" role="list">
                <li>No tracking cookies or advertising pixels</li>
                <li>No third-party analytics that identify you</li>
                <li>Folder-level locking with PIN protection</li>
                <li>Private by default - nothing is shared</li>
              </ul>
            </section>

            {/* Data Export */}
            <section aria-labelledby="export-heading">
              <div className="flex items-center gap-3 mb-4">
                <Download className="w-5 h-5 text-primary" aria-hidden="true" />
                <h2 id="export-heading" className="text-xl font-medium text-foreground !mt-0 !mb-0">Full Data Export</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Your data is always portable. Export everything at any time.
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-3" role="list">
                <li>Complete data export in JSON format</li>
                <li>PDF reports for financial records</li>
                <li>Bulk photo and document downloads</li>
                <li>Migration guides for data portability</li>
              </ul>
            </section>

            {/* Data Deletion */}
            <section aria-labelledby="deletion-heading">
              <div className="flex items-center gap-3 mb-4">
                <Trash2 className="w-5 h-5 text-primary" aria-hidden="true" />
                <h2 id="deletion-heading" className="text-xl font-medium text-foreground !mt-0 !mb-0">Right to Delete</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                You can permanently delete your account and all associated data at any time.
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-3" role="list">
                <li>One-click account deletion</li>
                <li>Complete data removal within 30 days</li>
                <li>No hidden data retention</li>
                <li>Confirmation before permanent deletion</li>
              </ul>
            </section>

            {/* Infrastructure */}
            <section aria-labelledby="infra-heading">
              <div className="flex items-center gap-3 mb-4">
                <Server className="w-5 h-5 text-primary" aria-hidden="true" />
                <h2 id="infra-heading" className="text-xl font-medium text-foreground !mt-0 !mb-0">Infrastructure Security</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Built on enterprise-grade infrastructure with security best practices.
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-3" role="list">
                <li>Regular security audits and penetration testing</li>
                <li>DDoS protection and rate limiting</li>
                <li>Automated vulnerability scanning</li>
                <li>24/7 infrastructure monitoring</li>
              </ul>
            </section>

            {/* Contact */}
            <section aria-labelledby="contact-heading" className="pt-6 border-t border-border">
              <h2 id="contact-heading" className="text-xl font-medium text-foreground mb-3">Security Questions?</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have security concerns or want to report a vulnerability, please contact us at{" "}
                <a href="mailto:security@originxlabs.com" className="text-primary hover:underline">security@originxlabs.com</a>
              </p>
            </section>
          </div>
        </article>

        <footer className="mt-12 pt-6 border-t border-border text-center">
          <p className="text-xs text-muted-foreground/60">CHRONYX by ORIGINX LABS PVT. LTD.</p>
        </footer>
      </div>
    </motion.main>
  );
};

export default Security;
