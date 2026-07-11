import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",

  description:
    "LiPy Privacy Policy — how we collect, use, and protect your data when you use our Odia handwritten character recognition platform.",

  alternates: {
    canonical: "/privacy",
  },

  openGraph: {
    title: "Privacy Policy | LiPy",
    description:
      "LiPy Privacy Policy — how we collect, use, and protect your data when you use our Odia handwritten character recognition platform.",
    images: [
      {
        url: "/og-ocr.png",
        width: 1200,
        height: 630,
        alt: "LiPy Privacy Policy",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | LiPy",
    description:
      "LiPy Privacy Policy — how we collect, use, and protect your data when you use our Odia handwritten character recognition platform.",
    images: ["/og-ocr.png"],
  },
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
      <div className="panel rounded-2xl p-6 sm:p-10 lg:p-12">
        <div className="mb-10">
          <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-verdigris-400 mb-3">
            Effective Date: July 12, 2026
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Privacy Policy
          </h1>
        </div>

        <div className="space-y-8 text-slate-300 text-[15px] leading-relaxed">
          {/* 1. Introduction */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">1. Introduction</h2>
            <p>
              LiPy (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is an academic
              open-source project for Odia handwritten character recognition, OCR, dataset
              creation, and machine learning research. We are committed to protecting your
              privacy. This Privacy Policy explains what information we collect, how we use
              it, and your rights regarding your data.
            </p>
            <p className="mt-3">
              By using the LiPy platform, you agree to the practices described in this
              policy. If you do not agree, please discontinue use of the platform.
            </p>
          </section>

          {/* 2. Information We Collect */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">2. Information We Collect</h2>
            <p>
              We collect only the information necessary to operate the platform and improve
              our machine learning models. The specific data we collect depends on how you
              interact with LiPy.
            </p>

            <h3 className="text-lg font-semibold text-white mt-5 mb-2">2.1 Administrator Authentication Data</h3>
            <p>
              The LiPy admin dashboard is accessible only to pre-authorized administrators.
              Users cannot self-register as administrators. When an administrator
              authenticates, we collect:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>
                <strong className="text-white">Email address</strong> — used as the primary identifier for
                authentication via email/password login.
              </li>
              <li>
                <strong className="text-white">OAuth profile data</strong> — when authenticating with Google or
                GitHub, we receive the basic profile information that your OAuth provider
                shares (name, email address, and avatar URL). This data is used only for
                authentication and identity verification.
              </li>
              <li>
                <strong className="text-white">Passkeys (WebAuthn)</strong> — if you register a passkey, your
                device manages the cryptographic key pair. LiPy stores only the public key
                and a passkey identifier, never the private key.
              </li>
            </ul>

            <h3 className="text-lg font-semibold text-white mt-5 mb-2">2.2 Security Event Logging</h3>
            <p>
              To protect administrator accounts and detect unauthorized access attempts,
              we log security events in our database. These logs include:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>User ID and event type (login, logout, failed login, password change, OAuth login, passkey login, session revocation, and automatic session expiry).</li>
              <li>Timestamp of the event.</li>
              <li>IP address and user-agent string, from which we derive browser type and operating system for display purposes.</li>
              <li>Device information label (e.g., &ldquo;Chrome on Windows 11&rdquo;).</li>
              <li>Event status (Success, Failed, Not Authorized, Auto-Expired).</li>
              <li>Additional metadata relevant to the event (e.g., reason for failure, provider name for OAuth events, number of sessions revoked).</li>
            </ul>

            <h3 className="text-lg font-semibold text-white mt-5 mb-2">2.3 LiPyD Contributor Data</h3>
            <p>
              LiPyD is the dataset contribution module of the platform. Participation is
              entirely voluntary and does not require an account. When you contribute, we
              collect:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>
                <strong className="text-white">Contributor Name</strong> — a name you provide yourself. This is
                not verified and can be any identifier you choose (including a pseudonym).
              </li>
              <li>
                <strong className="text-white">Contributor ID</strong> — a unique identifier automatically
                generated in your browser and stored locally. This ID is not linked to any
                real-world identity.
              </li>
              <li>
                <strong className="text-white">Session ID</strong> — a session identifier generated in your
                browser to group contributions within a session.
              </li>
              <li>
                <strong className="text-white">Handwritten Character Samples</strong> — images of Odia characters
                that you draw on the canvas. These images are the core dataset used to
                train machine learning models.
              </li>
              <li>
                <strong className="text-white">Character Metadata</strong> — the character label (e.g.,
                &ldquo;CONS_KA&rdquo;), the collection mode (single-character or mixed
                random), a sample number, and a filename.
              </li>
              <li>
                <strong className="text-white">Timestamps</strong> — the date and time when each sample was
                created.
              </li>
            </ul>
            <p className="mt-2">
              Contributor names and IDs are stored in browser cookies and localStorage to
              recognize returning contributors. Handwritten samples are stored locally in
              IndexedDB and, when Supabase is configured, uploaded to our Supabase storage
              bucket and recorded in our database tables.
            </p>

            <h3 className="text-lg font-semibold text-white mt-5 mb-2">2.4 Cookies and Local Storage</h3>
            <p>We use the following client-side storage:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li><strong className="text-white">Supabase session cookies</strong> — used for administrator authentication session management. These are HTTP-only cookies set by Supabase Auth.</li>
              <li><code className="text-verdigris-400 bg-verdigris-950 px-1.5 py-0.5 rounded text-xs font-mono">lipy_name</code> — stores your chosen contributor name (LiPyD).</li>
              <li><code className="text-verdigris-400 bg-verdigris-950 px-1.5 py-0.5 rounded text-xs font-mono">lipy_contributorId</code> — stores your auto-generated contributor identifier (LiPyD).</li>
              <li><code className="text-verdigris-400 bg-verdigris-950 px-1.5 py-0.5 rounded text-xs font-mono">lipy_stroke_width</code> — stores your preferred canvas stroke width (LiPyD).</li>
              <li><strong className="text-white">localStorage</strong> — various keys prefixed with <code className="text-verdigris-400 bg-verdigris-950 px-1.5 py-0.5 rounded text-xs font-mono">lipy_</code> for session configuration, sample counters, contribution statistics, scheduler state, and export timestamps.</li>
              <li><strong className="text-white">IndexedDB (LiPyDB)</strong> — stores sample records with image blobs, contributor records, and an upload queue for synchronizing contributions to Supabase when configured.</li>
            </ul>
          </section>

          {/* 3. Information We Do Not Collect */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">3. Information We Do Not Collect</h2>
            <p>LiPy does not collect:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>Analytics or usage tracking data (no Google Analytics, no tracking scripts).</li>
              <li>Advertising data (we do not serve advertisements).</li>
              <li>Marketing email addresses or communication preferences (we do not send marketing emails).</li>
              <li>Payment or billing information (the platform is free to use).</li>
              <li>Location data beyond the IP address logged for security events.</li>
              <li>Personal information from children under 13 (the platform is not directed at children).</li>
            </ul>
          </section>

          {/* 4. How Information Is Used */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">4. How Information Is Used</h2>
            <p>We use the collected information for the following purposes:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li><strong className="text-white">Authentication and Authorization</strong> — to verify administrator identity and control access to the admin dashboard.</li>
              <li><strong className="text-white">Security Monitoring</strong> — to detect and log unauthorized access attempts, enforce session expiration, and maintain an audit trail of administrative actions.</li>
              <li><strong className="text-white">Dataset Development</strong> — handwritten character samples contributed through LiPyD are used to train and improve our Odia handwritten character recognition machine learning model.</li>
              <li><strong className="text-white">Service Improvement</strong> — to understand aggregate usage patterns and improve the platform experience.</li>
              <li><strong className="text-white">Communication</strong> — to send password reset emails when requested by an administrator.</li>
            </ul>
          </section>

          {/* 5. Authentication */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">5. Authentication</h2>
            <p>
              LiPy uses <strong className="text-white">Supabase Authentication</strong> for all authentication
              operations. We support the following authentication methods:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li><strong className="text-white">Email and Password</strong> — standard email/password authentication with password hashing handled by Supabase.</li>
              <li><strong className="text-white">Google OAuth</strong> — sign in with your Google account. Google shares only the profile information necessary for authentication and identity verification.</li>
              <li><strong className="text-white">GitHub OAuth</strong> — sign in with your GitHub account. GitHub shares only the profile information necessary for authentication and identity verification.</li>
              <li><strong className="text-white">Passkeys (WebAuthn)</strong> — passwordless authentication using device-bound cryptographic keys.</li>
            </ul>
            <p className="mt-3">
              <strong className="text-white">Important:</strong> Authentication is only used to identify
              pre-authorized administrators. <em>Users cannot self-register as
              administrators.</em> Only accounts present in the admins table are allowed
              to access the dashboard after authentication. Authentication and
              authorization are separate — being authenticated does not grant access to
              the admin dashboard unless the account is specifically authorized.
            </p>
            <p className="mt-3">
              We also offer a <strong className="text-white">password reset</strong> feature for administrators.
              When requested, a password reset email is sent to the registered email
              address via Supabase Auth. After a successful password reset, other active
              sessions may be revoked to protect the account.
            </p>
          </section>

          {/* 6. Third-Party Services */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">6. Third-Party Services</h2>
            <p>LiPy uses the following third-party services:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>
                <strong className="text-white">Supabase</strong> — provides authentication services, database
                (PostgreSQL) for storing security events, admin records, and dataset
                metadata, and object storage for handwritten character image files.
              </li>
              <li>
                <strong className="text-white">Vercel</strong> — hosts the frontend web application.
              </li>
              <li>
                <strong className="text-white">Microsoft Azure</strong> — hosts the FastAPI backend service for
                model inference.
              </li>
              <li>
                <strong className="text-white">Hugging Face</strong> — hosts the trained model weights and a
                reference copy of the dataset.
              </li>
              <li>
                <strong className="text-white">Google OAuth</strong> — used exclusively for authentication
                (sign-in). No other Google APIs are accessed. Google&rsquo;s privacy policy
                applies to data handled during the OAuth flow.
              </li>
              <li>
                <strong className="text-white">GitHub OAuth</strong> — used exclusively for authentication
                (sign-in). No other GitHub APIs are accessed. GitHub&rsquo;s privacy policy
                applies to data handled during the OAuth flow.
              </li>
            </ul>
            <p className="mt-3">
              Each third-party service has its own privacy policy governing how it handles
              your data. We encourage you to review those policies.
            </p>
          </section>

          {/* 7. Data Storage and Retention */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">7. Data Storage and Retention</h2>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>
                <strong className="text-white">Administrator authentication data</strong> is stored in Supabase
                Auth and retained until the administrator account is deleted.
              </li>
              <li>
                <strong className="text-white">Security event logs</strong> are stored in the Supabase database
                and retained indefinitely for audit purposes.
              </li>
              <li>
                <strong className="text-white">LiPyD contributor data</strong> (name, contributor ID, session
                information) is stored in browser cookies, localStorage, and IndexedDB.
                When Supabase is configured, contributor metadata and handwritten samples
                are uploaded to Supabase storage and database tables. This data is
                retained until you clear your browser data or use the &ldquo;Reset
                profile&rdquo; feature in LiPyD.
              </li>
              <li>
                <strong className="text-white">Handwritten character samples</strong> contributed through LiPyD
                are retained as part of the research dataset. Once synchronized to the
                remote database, they become part of the aggregate dataset used for model
                training.
              </li>
            </ul>
          </section>

          {/* 8. Data Security */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">8. Data Security</h2>
            <p>
              We implement reasonable security measures to protect your data, including:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>Enforced 24-hour session expiration for administrator sessions.</li>
              <li>Automatic session revocation after password changes.</li>
              <li>Rate limiting on authentication attempts.</li>
              <li>Detailed security event logging to detect and investigate unauthorized access.</li>
              <li>Admin-only authorization checks on every protected route via middleware.</li>
            </ul>
            <p className="mt-3">
              No method of electronic storage or transmission is 100% secure. While we
              strive to protect your data, we cannot guarantee absolute security.
            </p>
          </section>

          {/* 9. Your Rights */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">9. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the following rights:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li><strong className="text-white">Access</strong> — request a copy of the data we hold about you.</li>
              <li><strong className="text-white">Correction</strong> — request that we correct inaccurate data.</li>
              <li><strong className="text-white">Deletion</strong> — request deletion of your data, subject to our retention policies.</li>
              <li><strong className="text-white">Export</strong> — export your contributed dataset using the &ldquo;Export dataset&rdquo; feature in LiPyD.</li>
              <li><strong className="text-white">Objection</strong> — object to the processing of your data for research purposes.</li>
            </ul>
            <p className="mt-3">
              To exercise these rights, please contact us at the email address provided in
              Section 13. We will respond to your request within a reasonable timeframe.
            </p>
          </section>

          {/* 10. Account Deletion */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">10. Account Deletion</h2>
            <p>
              <strong className="text-white">Administrator accounts:</strong> To request deletion of an
              administrator account, please contact us at the email below. Note that
              security event logs associated with the account may be retained for audit
              purposes.
            </p>
            <p className="mt-3">
              <strong className="text-white">LiPyD contributor data:</strong> You can delete your local
              contributor data at any time by using the &ldquo;Reset profile&rdquo; button
              in the LiPyD contributor panel. This clears all cookies, localStorage keys,
              and IndexedDB records associated with your contributor profile on your
              device. Data that has already been synchronized to the remote database may
              remain as part of the aggregate research dataset.
            </p>
          </section>

          {/* 11. Children's Privacy */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">11. Children&rsquo;s Privacy</h2>
            <p>
              LiPy is not directed at children under the age of 13. We do not knowingly
              collect personal information from children under 13. If you believe a child
              has provided us with personal data, please contact us, and we will take
              steps to delete such information.
            </p>
          </section>

          {/* 12. Changes to This Policy */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">12. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Changes will be posted
              on this page with an updated effective date. We encourage you to review this
              policy periodically. Continued use of the platform after changes constitutes
              acceptance of the updated policy.
            </p>
          </section>

          {/* 13. Contact Information */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">13. Contact Information</h2>
            <p>
              If you have questions, concerns, or requests regarding this Privacy Policy
              or your data, please contact us at:
            </p>
            <div className="mt-3 rounded-xl bg-verdigris-950/60 border border-verdigris-700/20 p-4 sm:p-5">
              <p className="font-semibold text-white">LiPy Team</p>
              <p className="mt-1">
                Email:{" "}
                <a
                  href="mailto:contact@lipy.app"
                  className="text-verdigris-400 hover:text-verdigris-300 underline underline-offset-2 transition-colors"
                >
                  contact@lipy.app
                </a>
              </p>
              <p className="mt-1">
                GitHub:{" "}
                <a
                  href="https://github.com/biranchikulesika/lipy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-verdigris-400 hover:text-verdigris-300 underline underline-offset-2 transition-colors"
                >
                  github.com/biranchikulesika/lipy
                </a>
              </p>
            </div>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 LiPy Team. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-slate-300 transition-colors">
              Terms of Service
            </Link>
            <span className="opacity-40">•</span>
            <Link href="/" className="hover:text-slate-300 transition-colors">
              Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
