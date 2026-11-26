<script setup lang="ts">
import { ref } from "vue";
import { ToolChips, type ToolDiff, type ToolStep } from "@fndn/vue";

const steps: ToolStep[] = [
  {
    icon: "think",
    label: "Thinking",
    chip: "Planning the move to the new mailer…",
    detail: [
      { text: "Invoice emails still call the legacy SMTP client in three places." },
      { text: "The new mailer needs a template id per locale; en-US and de-DE exist." },
    ],
  },
  {
    icon: "search",
    label: "Search code",
    chip: "sendInvoiceEmail",
    mono: true,
    detail: [
      { text: "4 matches in 3 files" },
      { text: "src/invoices/send.ts · src/jobs/dunning.ts · src/refunds/notify.ts" },
    ],
  },
  {
    icon: "read",
    label: "Read file",
    chip: "src/mail/client.ts",
    mono: true,
    detail: [{ text: "88 lines · exports createMailer, MailTemplate" }],
  },
  {
    icon: "write",
    label: "Edit 41 lines",
    chip: "src/invoices/send.ts",
    mono: true,
    detailMono: true,
    detail: [
      { text: "- await smtp.sendMail(buildInvoiceMail(invoice))" },
      {
        text: "+ const mailer = createMailer({ region: env.MAIL_REGION })",
        tone: "add",
      },
      {
        text: '+ await mailer.send("invoice.issued", { to, locale, invoice })',
        tone: "add",
      },
    ],
  },
  {
    icon: "run",
    label: "Run tests",
    chip: "pnpm vitest run src/invoices",
    mono: true,
    detailMono: true,
    detail: [{ text: "✓ 42 passed" }, { text: "✓ 3 snapshots updated" }],
  },
  {
    icon: "image",
    label: "Read image",
    chip: "invoice-email-preview.png",
    mono: true,
    detail: [
      { text: "1200 × 1600 · rendered invoice email, en-US" },
      { text: "Totals and the VAT line match the PDF invoice." },
    ],
  },
];

const diffs: ToolDiff[] = [
  {
    file: "send.ts",
    add: 38,
    del: 21,
    lines: [
      {
        text: "export async function sendInvoiceEmail(invoice: Invoice) {",
        tone: "ctx",
      },
      { text: "  await smtp.sendMail(buildInvoiceMail(invoice));", tone: "del" },
      {
        text: "  const mailer = createMailer({ region: env.MAIL_REGION });",
        tone: "add",
      },
      {
        text: '  await mailer.send("invoice.issued", { to, locale, invoice });',
        tone: "add",
      },
      { text: "}", tone: "ctx" },
    ],
  },
  {
    file: "dunning.ts",
    add: 9,
    del: 6,
    lines: [
      { text: "  await sendInvoiceEmail(invoice, { reminder: true });", tone: "ctx" },
      { text: "  attempts: 3,", tone: "del" },
      { text: "  attempts: env.DUNNING_ATTEMPTS,", tone: "add" },
    ],
  },
  {
    file: "notify.ts",
    add: 7,
    del: 4,
    lines: [
      { text: 'import { smtp } from "../legacy/smtp";', tone: "del" },
      { text: 'import { createMailer } from "../mail/client";', tone: "add" },
    ],
  },
  {
    file: "send.test.ts",
    add: 52,
    del: 0,
    lines: [
      {
        text: "it(\"sends invoice.issued in the customer's locale\", async () => {",
        tone: "add",
      },
      {
        text: '  expect(mailer.send).toHaveBeenCalledWith("invoice.issued", expect.anything());',
        tone: "add",
      },
    ],
  },
];

const openRows = ref(["Edit 41 lines", "Run tests"]);
</script>

<template>
  <ToolChips
    v-model:open-rows="openRows"
    :steps="steps"
    :diffs="diffs"
    :labels="{ header: '6 tool calls, 2 messages', more: '+3 more' }"
  />
</template>
