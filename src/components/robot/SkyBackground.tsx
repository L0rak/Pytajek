// Pastelowe tło ekranu dziecka: gradient nieba, chmurki, gwiazdki i doodle, które delikatnie pływają.

function Star({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2.5c.6 0 1 .4 1.2 1l1.9 4.6 4.9.5c1.1.1 1.5 1.4.7 2.1l-3.7 3.3 1.1 4.8c.2 1-.9 1.8-1.8 1.2L12 17.5 7.7 20c-.9.6-2-.2-1.8-1.2L7 14l-3.7-3.3c-.8-.7-.4-2 .7-2.1l4.9-.5 1.9-4.6c.2-.6.6-1 1.2-1z" />
    </svg>
  );
}

function Cloud({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 60" className={className} fill="currentColor" aria-hidden>
      <path d="M30 58C14 58 2 48 2 36c0-11 9-20 21-21C27 6 37 0 49 0c14 0 26 9 29 22 2-1 5-1 7-1 14 0 25 9 25 20 0 10-9 17-21 17H30z" />
    </svg>
  );
}

function Squiggle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 24" className={className} fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" aria-hidden>
      <path d="M4 12c8-10 16-10 24 0s16 10 24 0 16-10 24 0" />
    </svg>
  );
}

export function SkyBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden bg-gradient-to-b from-sky-light via-[#e8f6fb] to-mint-light"
    >
      {/* miękkie plamy koloru */}
      <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-sky/40 blur-3xl" />
      <div className="absolute top-1/3 -right-28 h-96 w-96 rounded-full bg-sun/30 blur-3xl" />
      <div className="absolute -bottom-24 left-1/4 h-80 w-80 rounded-full bg-mint/30 blur-3xl" />

      {/* chmurki */}
      <Cloud className="absolute top-[8%] left-[6%] w-32 text-white/80 animate-float" />
      <Cloud className="absolute top-[16%] right-[8%] w-24 text-white/70 animate-float [animation-delay:-3s]" />
      <Cloud className="absolute bottom-[30%] left-[3%] w-20 text-white/60 animate-float [animation-delay:-5s]" />

      {/* gwiazdki */}
      <Star className="absolute top-[12%] left-[38%] w-6 text-sun animate-twinkle" />
      <Star className="absolute top-[30%] right-[20%] w-8 text-sun animate-twinkle [animation-delay:-1s]" />
      <Star className="absolute bottom-[38%] left-[16%] w-5 text-orange/70 animate-twinkle [animation-delay:-2s]" />
      <Star className="absolute top-[6%] right-[34%] w-4 text-orange/60 animate-twinkle [animation-delay:-1.5s]" />

      {/* doodle */}
      <Squiggle className="absolute top-[44%] left-[8%] w-16 text-mint/70 animate-float [animation-delay:-2s]" />
      <Squiggle className="absolute top-[52%] right-[6%] w-20 text-sky/80 animate-float [animation-delay:-4s]" />
      <div className="absolute top-[22%] left-[22%] h-4 w-4 rounded-full border-4 border-orange/50 animate-float" />
      <div className="absolute bottom-[42%] right-[24%] h-5 w-5 rounded-full bg-sun/60 animate-float [animation-delay:-6s]" />
    </div>
  );
}
