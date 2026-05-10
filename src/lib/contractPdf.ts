import jsPDF from "jspdf";
import { supabase } from "@/integrations/supabase/client";

export interface ContractPdfData {
  id: string;
  title: string;
  body: string;
  client_signature?: string | null;
  client_signed_at?: string | null;
  photographer_signature?: string | null;
  photographer_signed_at?: string | null;
}

export async function generateAndStoreContractPdf(c: ContractPdfData): Promise<string | null> {
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();
  doc.setFontSize(18);
  doc.text(c.title || "Service Agreement", 20, 22);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Contract ID: ${c.id}`, 20, 30);
  doc.setTextColor(0);
  doc.setFontSize(11);
  const lines = doc.splitTextToSize(c.body || "", w - 40);
  doc.text(lines, 20, 42);
  let y = 42 + lines.length * 5 + 10;
  if (y > 240) { doc.addPage(); y = 20; }
  doc.setFontSize(12);
  doc.text("Signatures", 20, y); y += 8;
  doc.setFontSize(10);
  doc.text(`Client: ${c.client_signature || "— not signed —"}`, 20, y); y += 6;
  if (c.client_signed_at) { doc.text(`Signed at: ${new Date(c.client_signed_at).toLocaleString()}`, 20, y); y += 6; }
  y += 4;
  doc.text(`Photographer: ${c.photographer_signature || "— not signed —"}`, 20, y); y += 6;
  if (c.photographer_signed_at) { doc.text(`Signed at: ${new Date(c.photographer_signed_at).toLocaleString()}`, 20, y); }

  const blob = doc.output("blob");
  const path = `${c.id}/${Date.now()}.pdf`;
  const { error } = await supabase.storage.from("evidence").upload(path, blob, { contentType: "application/pdf", upsert: true });
  if (error) { console.error(error); return null; }
  const { data } = await supabase.storage.from("evidence").createSignedUrl(path, 60 * 60 * 24 * 7);
  return data?.signedUrl ?? null;
}

export function downloadContractPdf(c: ContractPdfData) {
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();
  doc.setFontSize(18);
  doc.text(c.title || "Service Agreement", 20, 22);
  doc.setFontSize(11);
  const lines = doc.splitTextToSize(c.body || "", w - 40);
  doc.text(lines, 20, 42);
  let y = 42 + lines.length * 5 + 10;
  doc.setFontSize(12); doc.text("Signatures", 20, y); y += 8;
  doc.setFontSize(10);
  doc.text(`Client: ${c.client_signature || "— not signed —"}`, 20, y); y += 6;
  doc.text(`Photographer: ${c.photographer_signature || "— not signed —"}`, 20, y);
  doc.save(`contract-${c.id.slice(0,8)}.pdf`);
}