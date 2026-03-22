import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8" };

interface ContactPayload {
  nom?: string;
  courriel?: string;
  organisation?: string;
  message?: string;
  objet?: string;
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function createTransport() {
  const smtpUrl = process.env.SMTP_URL;

  if (smtpUrl) {
    return nodemailer.createTransport(smtpUrl);
  }

  return nodemailer.createTransport({
    host: getRequiredEnv("SMTP_HOST"),
    port: Number(process.env.SMTP_PORT || "465"),
    secure: process.env.SMTP_SECURE !== "false",
    auth: {
      user: getRequiredEnv("SMTP_USER"),
      pass: getRequiredEnv("SMTP_PASS"),
    },
  });
}

function validatePayload(body: ContactPayload) {
  if (!body.objet || !body.nom || !body.courriel || !body.message) {
    return "Tous les champs obligatoires doivent etre remplis.";
  }

  const email = body.courriel.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Le courriel fourni est invalide.";
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ContactPayload;
    const validationError = validatePayload(body);

    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400, headers: JSON_HEADERS },
      );
    }

    const to = getRequiredEnv("CONTACT_EMAIL_TO");
    const from = process.env.CONTACT_EMAIL_FROM || getRequiredEnv("SMTP_USER");
    const transporter = createTransport();

    const subject = `[Scanimmo] ${body.objet}`;
    const text = [
      `Objet: ${body.objet}`,
      `Nom: ${body.nom}`,
      `Courriel: ${body.courriel}`,
      `Organisation: ${body.organisation || "Non fournie"}`,
      "",
      "Message:",
      body.message,
    ].join("\n");

    await transporter.sendMail({
      to,
      from,
      replyTo: body.courriel,
      subject,
      text,
    });

    return NextResponse.json({ ok: true }, { headers: JSON_HEADERS });
  } catch (error) {
    console.error("[contact] send failed", error);
    return NextResponse.json(
      { error: "Le message n'a pas pu etre envoye pour le moment." },
      { status: 500, headers: JSON_HEADERS },
    );
  }
}
