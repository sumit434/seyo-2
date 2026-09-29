import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { QrCode, Download, ExternalLink, Copy, Check, Radio, Smartphone, X } from 'lucide-react';
import { Button } from '../common/Button';
import { CustomerEntryPage } from '../../pages/CustomerEntryPage';

interface EntryItem {
  id: string;
  entryType: string;
  label: string;
  permanentCode: string;
  customerUrl: string;
  qrDataUrl: string;
}

interface QRGeneratorProps {
  entries: EntryItem[];
  businessName: string;
  businessSlug?: string;
}

export const QRGenerator: React.FC<QRGeneratorProps> = ({ entries, businessName, businessSlug }) => {
  const [selectedEntryIndex, setSelectedEntryIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [clientQrDataUrl, setClientQrDataUrl] = useState<string>('');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  if (entries.length === 0) return null;
  const currentEntry = entries[selectedEntryIndex] || entries[0];

  // Resolve business slug
  const slug = businessSlug || (currentEntry as any).businessSlug || 'bella-napoli';

  // Compute effective path and full URL using current window.location.origin
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const customerPath = currentEntry.entryType === 'instant_loyalty'
    ? `/c/${slug}/loyalty`
    : `/c/${slug}/v`;
  const effectiveCustomerUrl = origin ? `${origin}${customerPath}` : currentEntry.customerUrl;

  // Generate clean client-side QR matching the real browser origin
  useEffect(() => {
    let isMounted = true;
    if (effectiveCustomerUrl) {
      QRCode.toDataURL(effectiveCustomerUrl, {
        margin: 1,
        width: 280,
        color: { dark: '#0e7c66', light: '#ffffff' },
      })
        .then(url => {
          if (isMounted) setClientQrDataUrl(url);
        })
        .catch(() => {
          if (isMounted) setClientQrDataUrl(currentEntry.qrDataUrl);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [effectiveCustomerUrl, currentEntry.qrDataUrl]);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(effectiveCustomerUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleDownloadQr = () => {
    const dataUrl = clientQrDataUrl || currentEntry.qrDataUrl;
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${businessName.toLowerCase().replace(/\s+/g, '-')}-${currentEntry.entryType}.png`;
    a.click();
  };

  const qrToDisplay = clientQrDataUrl || currentEntry.qrDataUrl;

  return (
    <div className="bg-white rounded-3xl border border-[#e2e7e6] p-6 text-left space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e2e7e6]">
        <div>
          <h3 className="text-base font-bold text-[#10181c] flex items-center gap-2">
            <QrCode className="w-5 h-5 text-[#0e7c66]" />
            <span>Permanent QR & NFC Entry Points</span>
          </h3>
          <p className="text-xs text-[#6a787e]">
            Customers scan or tap these hardware identifiers to launch their daily engagement.
          </p>
        </div>

        {/* Entry selector tabs if multiple entries */}
        {entries.length > 1 && (
          <div className="flex items-center gap-1 bg-[#f1f3f2] p-1 rounded-2xl">
            {entries.map((ent, idx) => (
              <button
                key={ent.id}
                type="button"
                onClick={() => setSelectedEntryIndex(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedEntryIndex === idx
                    ? 'bg-white text-[#0e7c66] shadow-xs'
                    : 'text-[#6a787e] hover:text-[#10181c]'
                }`}
              >
                {ent.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* QR Visual Card */}
        <div className="flex flex-col items-center justify-center p-6 bg-[#f1f3f2]/60 rounded-3xl border border-[#e2e7e6] text-center">
          <div className="p-3 bg-white rounded-2xl shadow-sm border border-[#e2e7e6] mb-3">
            {qrToDisplay ? (
              <img
                src={qrToDisplay}
                alt="QR Code"
                className="w-48 h-48 rounded-xl object-contain"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-[#6a787e] text-xs">
                Generating QR...
              </div>
            )}
          </div>

          <span className="font-mono text-xs font-bold text-[#10181c] bg-white px-3 py-1 rounded-full border border-[#e2e7e6]">
            {currentEntry.permanentCode}
          </span>
          <p className="text-xs text-[#6a787e] mt-1">{currentEntry.label}</p>
        </div>

        {/* Details & Actions */}
        <div className="space-y-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#6a787e]">
              Destination Customer URL
            </span>
            <div className="mt-1 flex items-center gap-2 bg-[#f8faf9] p-3 rounded-2xl border border-[#e2e7e6]">
              <span className="text-xs font-mono text-[#10181c] truncate flex-1">
                {effectiveCustomerUrl}
              </span>
              <button
                type="button"
                onClick={handleCopyUrl}
                className="p-1.5 text-[#0e7c66] hover:bg-[#e2f1ec] rounded-lg transition-colors cursor-pointer shrink-0"
                title="Copy URL"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#e2f1ec]/60 border border-[#0e7c66]/20 space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0e7c66]">
              <Radio className="w-4 h-4" />
              <span>NFC Tag Writing Instruction</span>
            </div>
            <p className="text-[11px] text-[#0a6252] leading-relaxed">
              Program physical NTAG213/215 stickers with the URL above using standard NFC Tools. Customers tap directly to start.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadQr}
              className="gap-2 flex-1"
            >
              <Download className="w-4 h-4" />
              <span>Download QR</span>
            </Button>

            {/* Test Live Screen Button - Opens Interactive Mobile Simulator Modal */}
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsPreviewModalOpen(true)}
              className="gap-2 flex-1 shadow-sm"
            >
              <Smartphone className="w-4 h-4" />
              <span>Test Live Screen</span>
            </Button>
          </div>

          <div className="text-right">
            <a
              href={customerPath}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[#0e7c66] font-semibold hover:underline"
            >
              <span>Open in new browser tab</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Interactive Mobile Device Simulator Modal */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setIsPreviewModalOpen(false)}
            aria-hidden="true"
          />

          <div className="relative z-10 flex flex-col items-center max-w-sm w-full">
            {/* Phone Header Bar with Close and Direct Link */}
            <div className="w-full flex items-center justify-between text-white pb-3 px-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold tracking-wide uppercase">Live Device Simulator</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={customerPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors"
                  title="Open full page"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors cursor-pointer"
                  title="Close Simulator"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Smartphone Mockup Frame */}
            <div className="w-full h-[650px] max-h-[85vh] bg-[#f1f3f2] rounded-[40px] border-[8px] border-[#10181c] shadow-2xl overflow-hidden flex flex-col relative">
              {/* Notch */}
              <div className="w-28 h-4 bg-[#10181c] rounded-b-xl mx-auto absolute top-0 left-1/2 -translate-x-1/2 z-30" />

              {/* Live Interactive Customer Page Component */}
              <div className="flex-1 overflow-y-auto pt-4">
                <CustomerEntryPage
                  slug={slug}
                  entryMode={currentEntry.entryType === 'instant_loyalty' ? 'loyalty' : 'combined'}
                />
              </div>

              {/* Bottom Home Indicator Bar */}
              <div className="w-32 h-1 bg-[#10181c]/30 rounded-full mx-auto my-2" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
