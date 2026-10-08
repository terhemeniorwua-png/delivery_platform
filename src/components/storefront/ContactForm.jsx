"use client";

import { useState } from "react";
import { Input, Textarea } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

const SUPPORT_EMAIL = "admin@clothing-delivery.test";

/**
 * Contact form. There is no backend contact endpoint yet (documented as a
 * future API), so a valid submission opens the visitor's email client with
 * the message pre-filled — honest, working, no fake success states.
 */
export default function ContactForm() {
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});

  function onSubmit(event) {
    event.preventDefault();

    const nextErrors = {};
    if (name.trim().length < 2) nextErrors.name = "Please enter your name.";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) nextErrors.email = "Please enter a valid email address.";
    if (message.trim().length < 10) nextErrors.message = "Please write at least a few words.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const subject = encodeURIComponent(`Message from ${name.trim()}`);
    const body = encodeURIComponent(`${message.trim()}\n\n— ${name.trim()} (${email.trim()})`);
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
    toast("Opening your email app with your message…", { type: "success" });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <Input
        label="Your name"
        name="name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        error={errors.name}
        required
        autoComplete="name"
      />
      <Input
        label="Email address"
        name="email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={errors.email}
        required
        autoComplete="email"
      />
      <Textarea
        label="Message"
        name="message"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        error={errors.message}
        rows={5}
        placeholder="How can we help?"
        required
      />
      <Button type="submit" size="lg">
        Send message
      </Button>
      <p className="text-xs text-muted">
        Submitting opens your email app — your message is sent from your own
        email account to {SUPPORT_EMAIL}.
      </p>
    </form>
  );
}
