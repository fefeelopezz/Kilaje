import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "./db";

async function sendCode(email: string, otp: string) {
  // OTP_LOG=1 (solo desarrollo): el código sale por la consola del servidor en vez de por mail.
  if (process.env.OTP_LOG === "1") {
    console.log(`[kilaje] Código de ingreso para ${email}: ${otp}`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `${otp} es tu código de Kilaje`,
      text: `Tu código para entrar a Kilaje es ${otp}. Vence en 5 minutos.\n\nSi no lo pediste, ignorá este mail.`,
    }),
  });
  if (!res.ok) throw new Error(`No se pudo enviar el mail (Resend ${res.status})`);
}

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  plugins: [
    // Las cuentas se crean solo desde /registro, que pide nombre y peso.
    emailOTP({
      disableSignUp: true,
      sendVerificationOTP: ({ email, otp }) => sendCode(email, otp),
    }),
    nextCookies(), // debe ir último: escribe las cookies desde server actions
  ],
});

// cache: el layout y la página la llaman en el mismo pedido; se consulta la sesión una sola vez.
export const requireUser = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return session.user;
});
