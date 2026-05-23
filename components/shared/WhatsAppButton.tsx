'use client';

import { useState, useEffect } from 'react';

const WHATSAPP_NUMBER = '94764790033'; // Sri Lanka country code
const WHATSAPP_MESSAGE = encodeURIComponent('Hello! Siraa.lk මට උදව් කරන්න පුළුවන්ද? ');

export default function WhatsAppButton() {
  const [visible, setVisible] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [pulse, setPulse] = useState(true);

  // Fade in after mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(t);
  }, []);

  // Stop pulse after 6s so it doesn't annoy forever
  useEffect(() => {
    const t = setTimeout(() => setPulse(false), 6000);
    return () => clearTimeout(t);
  }, []);

  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`;

  return (
    <>
      <style>{`
        @keyframes wa-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }
        @keyframes wa-ripple {
          0%   { transform: scale(1);   opacity: 0.6; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes wa-slide-in {
          from { opacity: 0; transform: translateX(60px) scale(0.8); }
          to   { opacity: 1; transform: translateX(0)   scale(1); }
        }
        @keyframes wa-tooltip-in {
          from { opacity: 0; transform: translateX(8px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        .wa-btn {
          animation: wa-slide-in 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards,
                     wa-float 3.5s ease-in-out 0.5s infinite;
        }
        .wa-ripple {
          animation: wa-ripple 1.8s ease-out infinite;
        }
        .wa-tooltip {
          animation: wa-tooltip-in 0.25s ease forwards;
        }
      `}</style>

      {/* Floating container */}
      <div
        className="fixed bottom-20 right-5 z-[9999] flex flex-col items-end gap-3"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.4s ease' }}
      >
        {/* Tooltip bubble */}
        {showTooltip && (
          <div className="wa-tooltip pointer-events-none mr-1 max-w-[180px] rounded-2xl bg-white px-4 py-2.5 shadow-xl ring-1 ring-black/5">
            <p className="text-[11px] font-semibold leading-tight text-gray-800">
              Chat with us on WhatsApp!
            </p>
            <p className="mt-0.5 text-[10px] text-gray-500">සිරා.lk හි සහය</p>
            {/* Arrow */}
            <span
              className="absolute -bottom-2 right-6 h-0 w-0"
              style={{
                borderLeft: '7px solid transparent',
                borderRight: '7px solid transparent',
                borderTop: '8px solid white',
              }}
            />
          </div>
        )}

        {/* Button */}
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onFocus={() => setShowTooltip(true)}
          onBlur={() => setShowTooltip(false)}
          className="wa-btn relative flex h-[58px] w-[58px] items-center justify-center rounded-full shadow-2xl outline-none focus-visible:ring-4 focus-visible:ring-green-400 md:h-[62px] md:w-[62px]"
          style={{ background: 'linear-gradient(135deg, #25d366 0%, #128c5e 100%)' }}
        >
          {/* Pulse rings (only while pulse is active) */}
          {pulse && (
            <>
              <span
                className="wa-ripple absolute inset-0 rounded-full bg-[#25d366]"
                style={{ animationDelay: '0s' }}
              />
              <span
                className="wa-ripple absolute inset-0 rounded-full bg-[#25d366]"
                style={{ animationDelay: '0.8s' }}
              />
            </>
          )}

          {/* WhatsApp SVG icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            className="relative z-10 h-[30px] w-[30px] drop-shadow-sm"
            fill="white"
          >
            <path d="M16.004 2C8.28 2 2 8.28 2 16.004c0 2.47.65 4.8 1.786 6.82L2 30l7.38-1.76A13.96 13.96 0 0016.004 30C23.72 30 30 23.72 30 16.004 30 8.28 23.72 2 16.004 2zm0 25.56a11.54 11.54 0 01-5.88-1.6l-.42-.25-4.38 1.05 1.09-4.26-.28-.44a11.54 11.54 0 01-1.7-6.08c0-6.38 5.2-11.58 11.58-11.58 6.38 0 11.58 5.2 11.58 11.58 0 6.38-5.2 11.58-11.58 11.58zm6.36-8.67c-.35-.175-2.07-1.02-2.39-1.136-.32-.114-.554-.175-.788.175-.234.35-.907 1.136-1.11 1.37-.205.233-.41.262-.76.087-.35-.175-1.478-.544-2.815-1.736-1.04-.927-1.742-2.073-1.946-2.423-.204-.35-.022-.54.153-.714.158-.157.35-.41.525-.613.175-.205.234-.35.35-.584.117-.233.059-.437-.03-.612-.087-.175-.788-1.9-1.08-2.6-.284-.682-.573-.59-.788-.6l-.672-.012c-.234 0-.612.088-.932.437-.32.35-1.224 1.196-1.224 2.916 0 1.72 1.254 3.38 1.43 3.614.175.233 2.47 3.77 5.985 5.287.837.36 1.49.576 1.998.737.84.266 1.604.228 2.208.138.673-.1 2.07-.846 2.363-1.663.291-.816.291-1.516.204-1.663-.087-.146-.32-.233-.67-.408z" />
          </svg>
        </a>
      </div>
    </>
  );
}
