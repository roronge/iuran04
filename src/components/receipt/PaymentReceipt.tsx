import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency, getMonthName, formatDate } from '@/lib/format';
import { Printer, Download, X } from 'lucide-react';

export interface ReceiptData {
  id: string;
  kepala_keluarga: string;
  alamat: string;
  items: {
    kategori: string;
    nominal: number;
  }[];
  total: number;
  bulan: number;
  tahun: number;
  tanggal_bayar: string;
}

interface PaymentReceiptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ReceiptData | null;
}

export function PaymentReceipt({ open, onOpenChange, data }: PaymentReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!data) return null;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bukti Pembayaran - ${data.kepala_keluarga}</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px dashed #ccc; padding-bottom: 16px; margin-bottom: 16px; }
          .title { font-size: 18px; font-weight: bold; margin-bottom: 4px; }
          .subtitle { font-size: 12px; color: #666; }
          .info { margin-bottom: 16px; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12px; }
          .items { border-top: 1px dashed #ccc; border-bottom: 1px dashed #ccc; padding: 12px 0; margin-bottom: 12px; }
          .item { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
          .total { display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; }
          .footer { text-align: center; margin-top: 20px; font-size: 11px; color: #666; }
          .badge { background: #22c55e; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; display: inline-block; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">BUKTI PEMBAYARAN</div>
          <div class="subtitle">Iuran RT</div>
        </div>
        <div class="info">
          <div class="info-row"><span>No. Transaksi:</span><span>${data.id.slice(0, 8).toUpperCase()}</span></div>
          <div class="info-row"><span>Nama:</span><span>${data.kepala_keluarga}</span></div>
          <div class="info-row"><span>Alamat:</span><span>${data.alamat}</span></div>
          <div class="info-row"><span>Periode:</span><span>${getMonthName(data.bulan)} ${data.tahun}</span></div>
          <div class="info-row"><span>Tanggal Bayar:</span><span>${formatDate(data.tanggal_bayar)}</span></div>
        </div>
        <div class="items">
          ${data.items.map(item => `
            <div class="item">
              <span>${item.kategori}</span>
              <span>${formatCurrency(item.nominal)}</span>
            </div>
          `).join('')}
        </div>
        <div class="total">
          <span>TOTAL</span>
          <span>${formatCurrency(data.total)}</span>
        </div>
        <div style="text-align: center; margin-top: 12px;">
          <span class="badge">LUNAS</span>
        </div>
        <div class="footer">
          Terima kasih atas pembayaran Anda<br/>
          Bukti pembayaran ini sah tanpa tanda tangan
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownload = () => {
    const content = `
BUKTI PEMBAYARAN IURAN RT
================================

No. Transaksi: ${data.id.slice(0, 8).toUpperCase()}
Nama: ${data.kepala_keluarga}
Alamat: ${data.alamat}
Periode: ${getMonthName(data.bulan)} ${data.tahun}
Tanggal Bayar: ${formatDate(data.tanggal_bayar)}

--------------------------------
RINCIAN PEMBAYARAN
--------------------------------
${data.items.map(item => `${item.kategori}: ${formatCurrency(item.nominal)}`).join('\n')}
--------------------------------
TOTAL: ${formatCurrency(data.total)}

Status: LUNAS

================================
Terima kasih atas pembayaran Anda
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bukti-pembayaran-${data.id.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">Bukti Pembayaran</DialogTitle>
        </DialogHeader>
        
        <div ref={receiptRef} className="bg-card p-4 rounded-lg border">
          <div className="text-center border-b border-dashed pb-4 mb-4">
            <h3 className="font-bold text-lg">BUKTI PEMBAYARAN</h3>
            <p className="text-sm text-muted-foreground">Iuran RT</p>
          </div>

          <div className="space-y-1 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">No. Transaksi:</span>
              <span className="font-mono">{data.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nama:</span>
              <span>{data.kepala_keluarga}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Alamat:</span>
              <span>{data.alamat}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Periode:</span>
              <span>{getMonthName(data.bulan)} {data.tahun}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tanggal Bayar:</span>
              <span>{formatDate(data.tanggal_bayar)}</span>
            </div>
          </div>

          <div className="border-t border-b border-dashed py-3 space-y-2 mb-3">
            {data.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span>{item.kategori}</span>
                <span>{formatCurrency(item.nominal)}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between font-bold">
            <span>TOTAL</span>
            <span>{formatCurrency(data.total)}</span>
          </div>

          <div className="text-center mt-3">
            <span className="bg-success text-success-foreground px-3 py-1 rounded text-sm font-medium">
              LUNAS
            </span>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Terima kasih atas pembayaran Anda
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={handlePrint} className="flex-1">
            <Printer className="h-4 w-4 mr-2" />
            Cetak
          </Button>
          <Button variant="outline" onClick={handleDownload} className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Unduh
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
