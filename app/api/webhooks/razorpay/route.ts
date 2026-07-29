import { InvoicePaymentStatus, InvoiceStatus, PaymentMode } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyRazorpayWebhookSignature } from "@/lib/integrations/razorpay";

type RazorpayWebhook = {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        amount?: number;
        status?: string;
      };
    };
  };
};

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  if (!verifyRazorpayWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  let event: RazorpayWebhook;
  try {
    event = JSON.parse(rawBody) as RazorpayWebhook;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (event.event !== "payment.captured") {
    return NextResponse.json({ received: true });
  }
  const payment = event.payload?.payment?.entity;
  if (!payment?.id || !payment.order_id || payment.status !== "captured") {
    return NextResponse.json({ received: true });
  }
  const invoice = await prisma.invoice.findFirst({
    where: { razorpayOrderId: payment.order_id },
  });
  if (!invoice) return NextResponse.json({ received: true });
  const existing = await prisma.invoicePayment.findFirst({
    where: { razorpayPaymentId: payment.id },
  });
  if (existing) return NextResponse.json({ received: true });
  const received = Math.min((payment.amount ?? 0) / 100, Number(invoice.amount) - Number(invoice.amountPaid));
  if (received <= 0) return NextResponse.json({ received: true });
  const amountPaid = Number(invoice.amountPaid) + received;
  await prisma.$transaction([
    prisma.invoicePayment.create({
      data: {
        invoiceId: invoice.id,
        amount: new Decimal(received),
        paymentMode: PaymentMode.online,
        status: InvoicePaymentStatus.completed,
        razorpayPaymentId: payment.id,
      },
    }),
    prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        amountPaid: new Decimal(amountPaid),
        paymentMode: PaymentMode.online,
        status: amountPaid >= Number(invoice.amount) ? InvoiceStatus.paid : InvoiceStatus.partial,
      },
    }),
  ]);
  return NextResponse.json({ received: true });
}
