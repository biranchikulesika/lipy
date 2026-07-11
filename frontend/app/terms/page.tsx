import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",

  description:
    "LiPy Terms of Service — the terms governing your use of the LiPy Odia handwritten character recognition platform.",

  alternates: {
    canonical: "/terms",
  },

  openGraph: {
    title: "Terms of Service | LiPy",
    description:
      "LiPy Terms of Service — the terms governing your use of the LiPy Odia handwritten character recognition platform.",
    images: [
      {
        url: "/og-ocr.png",
        width: 1200,
        height: 630,
        alt: "LiPy Terms of Service",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Terms of Service | LiPy",
    description:
      "LiPy Terms of Service — the terms governing your use of the LiPy Odia handwritten character recognition platform.",
    images: ["/og-ocr.png"],
  },
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
      <div className="panel rounded-2xl p-6 sm:p-10 lg:p-12">
        <div className="mb-10">
          <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-verdigris-400 mb-3">
            Effective Date: July 12, 2026
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Terms of Service
          </h1>
        </div>

        <div className="space-y-8 text-slate-300 text-[15px] leading-relaxed">
          {/* 1. Acceptance of Terms */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the LiPy platform (the &ldquo;Service&rdquo;), you
              agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you do
              not agree to these Terms, you may not access or use the Service.
            </p>
            <p className="mt-3">
              These Terms apply to all visitors, users, contributors, and administrators
              of the LiPy platform. We may update these Terms periodically. Continued use
              of the Service after changes constitutes acceptance of the updated Terms.
            </p>
          </section>

          {/* 2. Eligibility */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">2. Eligibility</h2>
            <p>
              You must be at least 13 years of age to use the Service. By using the
              Service, you represent and warrant that you meet this requirement. If you
              are under 13, you may not use the Service.
            </p>
            <p className="mt-3">
              If you are using the Service on behalf of an organization, you represent and
              warrant that you have the authority to bind that organization to these Terms.
            </p>
          </section>

          {/* 3. Description of the Service */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">3. Description of the Service</h2>
            <p>
              LiPy is an academic open-source project that provides:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>
                <strong className="text-white">OCR Workspace</strong> — a tool for recognizing handwritten Odia
                characters by drawing on a canvas, uploading images, or using a device
                camera.
              </li>
              <li>
                <strong className="text-white">LiPyD Dataset Contributor</strong> — a module for contributing
                handwritten Odia character samples to an open research dataset used to
                train machine learning models.
              </li>
              <li>
                <strong className="text-white">Admin Dashboard</strong> — a restricted-access area for
                pre-authorized administrators to manage authentication settings, review
                contributed dataset samples, and monitor security events.
              </li>
            </ul>
            <p className="mt-3">
              The Service is provided free of charge as an academic and research tool.
            </p>
          </section>

          {/* 4. User Accounts */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">4. User Accounts</h2>

            <h3 className="text-lg font-semibold text-white mt-4 mb-2">4.1 Administrator Accounts</h3>
            <p>
              Access to the admin dashboard is restricted to pre-authorized administrators
              only. Users cannot self-register as administrators. Administrator accounts
              are created and managed by the LiPy team.
            </p>
            <p className="mt-2">
              Administrators are responsible for maintaining the confidentiality of their
              login credentials and for all activities that occur under their account.
            </p>

            <h3 className="text-lg font-semibold text-white mt-4 mb-2">4.2 LiPyD Contributors</h3>
            <p>
              LiPyD contributors do not require an account. Participation is anonymous and
              voluntary. A contributor identifier is generated automatically in your
              browser and a name of your choice (which may be a pseudonym) is stored
              locally.
            </p>
            <p className="mt-2">
              You may reset your contributor profile at any time using the
              &ldquo;Reset profile&rdquo; feature in the LiPyD panel, which clears all
              locally stored contributor data.
            </p>
          </section>

          {/* 5. Administrator Access */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">5. Administrator Access</h2>
            <p>
              Access to the admin dashboard is granted only to individuals listed in the
              admins table. The following rules apply:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>Authentication is separate from authorization. Being authenticated does not grant access to the admin dashboard.</li>
              <li>Only accounts manually added to the admins table by the LiPy team are authorized.</li>
              <li>Administrator sessions expire after 24 hours and require re-authentication.</li>
              <li>Administrators with sufficient permissions can manage authentication settings, including linked OAuth providers and passkeys.</li>
              <li>Administrators can revoke other active sessions after a password change.</li>
              <li>Security events are logged for all authentication attempts and administrative actions.</li>
            </ul>
          </section>

          {/* 6. Acceptable Use */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">6. Acceptable Use</h2>
            <p>You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>Use the Service for any illegal purpose or in violation of any applicable laws or regulations.</li>
              <li>Attempt to gain unauthorized access to the admin dashboard or any other restricted area.</li>
              <li>Interfere with or disrupt the operation of the Service, including by introducing malware or conducting denial-of-service attacks.</li>
              <li>Submit harmful, offensive, or inappropriate content through the Service.</li>
              <li>Reverse-engineer, decompile, or disassemble any part of the Service, except as permitted by applicable open-source licenses.</li>
              <li>Use automated scripts or bots to interact with the Service in a manner that imposes an unreasonable load on infrastructure.</li>
            </ul>
          </section>

          {/* 7. Intellectual Property */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">7. Intellectual Property</h2>

            <h3 className="text-lg font-semibold text-white mt-4 mb-2">7.1 LiPy Platform</h3>
            <p>
              The LiPy platform, including its source code, design, and branding, is
              released under an open-source license. The source code is available on GitHub
              at{" "}
              <a
                href="https://github.com/biranchikulesika/lipy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-verdigris-400 hover:text-verdigris-300 underline underline-offset-2"
              >
                github.com/biranchikulesika/lipy
              </a>
              . You may use, modify, and distribute the code in accordance with the terms
              of the applicable open-source license.
            </p>

            <h3 className="text-lg font-semibold text-white mt-4 mb-2">7.2 Contributed Data</h3>
            <p>
              Handwritten character samples contributed through LiPyD are collected for
              academic research and machine learning purposes. By contributing samples,
              you grant LiPy a perpetual, worldwide, royalty-free license to use, store,
              reproduce, and distribute the contributed samples as part of the research
              dataset. This license is necessary to build and share the open dataset used
              to train character recognition models.
            </p>
            <p className="mt-2">
              This license applies to samples that have been synchronized to the remote
              dataset. You may delete locally stored samples at any time using the
              &ldquo;Reset profile&rdquo; feature. You retain ownership of the original
              content you contribute, and you represent that your contributions do not
              infringe upon the rights of any third party.
            </p>

            <h3 className="text-lg font-semibold text-white mt-4 mb-2">7.3 Machine Learning Model Outputs</h3>
            <p>
              Predictions generated by the machine learning model are provided for
              informational and research purposes. The model may produce incorrect or
              unexpected results, particularly for handwritten inputs that differ
              significantly from the training data.
            </p>
          </section>

          {/* 8. Availability */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">8. Availability</h2>
            <p>
              We strive to keep the Service available and reliable, but we do not
              guarantee uninterrupted access. The Service may be temporarily unavailable
              for maintenance, updates, or due to factors beyond our control.
            </p>
            <p className="mt-3">
              The LiPyD contributor module may operate in a degraded mode (offline) when
              Supabase is not configured. In this mode, samples are stored locally in
              IndexedDB and will be synchronized when the connection is restored.
            </p>
          </section>

          {/* 9. Disclaimer */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">9. Disclaimer</h2>
            <p>
              THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo;
              WITHOUT ANY WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
              LIMITED TO THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
              PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p className="mt-3">
              THE MACHINE LEARNING MODEL MAY PRODUCE INCORRECT PREDICTIONS. THE SERVICE IS
              A RESEARCH PROTOTYPE AND SHOULD NOT BE USED AS THE SOLE BASIS FOR ANY
              DECISION REQUIRING ACCURATE CHARACTER RECOGNITION.
            </p>
          </section>

          {/* 10. Limitation of Liability */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">10. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE LIPY TEAM AND ITS
              CONTRIBUTORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
              CONSEQUENTIAL, OR EXEMPLARY DAMAGES ARISING OUT OF OR IN CONNECTION WITH
              YOUR USE OF THE SERVICE.
            </p>
            <p className="mt-3">
              THIS LIMITATION APPLIES WHETHER THE CLAIM IS BASED IN CONTRACT, TORT
              (INCLUDING NEGLIGENCE), OR OTHER LEGAL THEORY, EVEN IF WE HAVE BEEN ADVISED
              OF THE POSSIBILITY OF SUCH DAMAGES.
            </p>
          </section>

          {/* 11. Suspension and Termination */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">11. Suspension and Termination</h2>
            <p>
              We reserve the right to suspend or terminate access to the Service, or any
              portion thereof, at any time and for any reason, including violation of
              these Terms.
            </p>
            <p className="mt-3">
              Administrator accounts may be suspended or terminated at the discretion of
              the LiPy team. LiPyD contributor access is self-managed and can be reset at
              any time by the contributor.
            </p>
          </section>

          {/* 12. Changes to the Service */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">12. Changes to the Service</h2>
            <p>
              We reserve the right to modify, suspend, or discontinue the Service (or any
              part thereof) at any time with or without notice. We will not be liable to
              you or any third party for any modification, suspension, or discontinuation
              of the Service.
            </p>
          </section>

          {/* 13. Governing Law */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">13. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of
              India (to the extent applicable). Any disputes arising under these Terms
              shall be subject to the exclusive jurisdiction of the applicable courts.
            </p>
            <p className="mt-3">
              If any provision of these Terms is held to be unenforceable, the remaining
              provisions shall remain in full force and effect.
            </p>
          </section>

          {/* 14. Contact Information */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">14. Contact Information</h2>
            <p>
              For questions, concerns, or requests regarding these Terms, please contact
              us at:
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
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">
              Privacy Policy
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
