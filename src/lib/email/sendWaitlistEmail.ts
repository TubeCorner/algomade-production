import { Resend } from "resend";

export async function sendWaitlistEmail(email: string) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error("❌ RESEND_API_KEY is missing at runtime");
    throw new Error("Email service not configured");
  }

  const resend = new Resend(apiKey);

  return resend.emails.send({
    from: "AlgoMade <onboarding@algomade.ai>",
    to: email,
    subject: "You're on the AlgoMade waitlist 🚀",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6">
        <h2>You're in 🎉</h2>
        <p>
          Thanks for joining <strong>AlgoMade</strong>.
        </p>
        <p>
          We’ll notify you as soon as early access opens.
        </p>
        <p style="margin-top: 24px">
          — Team AlgoMade
        </p>
      </div>
    `,
  });
}

