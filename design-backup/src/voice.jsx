// Voice input: mic button on inputs + global voice command FAB
// Uses Web Speech API (webkitSpeechRecognition), Turkish (tr-TR)

const SpeechRec = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);

// Turkish number word -> integer
const TR_NUMBER_WORDS = {
  "sıfır":0,"bir":1,"iki":2,"üç":3,"dört":4,"beş":5,"altı":6,"yedi":7,"sekiz":8,"dokuz":9,"on":10,
  "yirmi":20,"otuz":30,"kırk":40,"elli":50,"altmış":60,"yetmiş":70,"seksen":80,"doksan":90,
  "yüz":100,"bin":1000,"milyon":1000000,
};

function parseTurkishNumber(text) {
  if (!text) return null;
  text = text.toLocaleLowerCase("tr-TR").trim();
  // direct digits
  const direct = text.match(/-?\d+([.,]\d+)?/);
  if (direct) return parseFloat(direct[0].replace(",", "."));
  // word-based summation (basic)
  const tokens = text.split(/\s+/);
  let total = 0, current = 0;
  for (const t of tokens) {
    const n = TR_NUMBER_WORDS[t];
    if (n == null) continue;
    if (n === 100 || n === 1000) {
      current = (current || 1) * n;
      if (n === 1000) { total += current; current = 0; }
    } else {
      current += n;
    }
  }
  total += current;
  return total > 0 ? total : null;
}

// Hook: useSpeech({ lang, continuous, onResult, onError, parse })
function useSpeech({ lang = "tr-TR", parse = "text", onResult, onPartial, onError, continuous = false } = {}) {
  const recRef = React.useRef(null);
  const [listening, setListening] = React.useState(false);
  const [transcript, setTranscript] = React.useState("");

  const start = React.useCallback(() => {
    if (!SpeechRec) {
      onError?.("Tarayıcınız sesli giriş desteklemiyor.");
      return false;
    }
    if (recRef.current) { try { recRef.current.stop(); } catch(_) {} }
    const r = new SpeechRec();
    r.lang = lang;
    r.continuous = continuous;
    r.interimResults = true;
    r.maxAlternatives = 1;

    let finalText = "";
    r.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const text = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += text;
        else interim += text;
      }
      const all = (finalText + interim).trim();
      setTranscript(all);
      onPartial?.(all);
      if (finalText) {
        const val = parse === "number" ? parseTurkishNumber(finalText) : finalText.trim();
        onResult?.(val, finalText.trim());
        finalText = "";
      }
    };
    r.onerror = (e) => { onError?.(e.error || "Hata"); setListening(false); };
    r.onend = () => { setListening(false); };
    r.onstart = () => { setListening(true); };

    try { r.start(); recRef.current = r; return true; } catch(e) { onError?.(e.message); return false; }
  }, [lang, parse, continuous]);

  const stop = React.useCallback(() => {
    try { recRef.current?.stop(); } catch(_) {}
    setListening(false);
  }, []);

  React.useEffect(() => () => stop(), [stop]);

  return { listening, transcript, start, stop, supported: !!SpeechRec };
}

// MicButton component to embed inside a field
function MicButton({ onResult, parse = "text", isTextarea = false, lang = "tr-TR", placeholder }) {
  const { listening, transcript, start, stop, supported } = useSpeech({
    lang, parse,
    onResult: (val) => { onResult(val); stop(); },
  });
  if (!supported) return null;
  return (
    <>
      <button
        type="button"
        className={`mic-btn ${listening ? "listening" : ""} ${isTextarea ? "textarea-pos" : ""}`}
        onClick={(e) => { e.preventDefault(); listening ? stop() : start(); }}
        title={listening ? "Dinleniyor… (kapatmak için tıklayın)" : "Sesli giriş — tıklayıp konuşun"}
        aria-label="Sesli giriş"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="3" width="6" height="12" rx="3"/>
          <path d="M5 11a7 7 0 0014 0M12 18v3M8 21h8"/>
        </svg>
      </button>
      {listening && transcript && (
        <div className="vtranscript">{transcript}</div>
      )}
    </>
  );
}

// Helper: wrap a text/number input with a mic
function VInput({ value, onChange, mode = "text", as = "input", ...props }) {
  const inputRef = React.useRef(null);
  const handleVoice = (val) => {
    if (val == null || val === "") return;
    if (mode === "number") {
      onChange({ target: { value: val } });
    } else {
      // append to existing text if any
      const newVal = (value ? value + " " : "") + val;
      onChange({ target: { value: newVal } });
    }
  };
  const Cmp = as === "textarea" ? "textarea" : "input";
  return (
    <div className="vinput-wrap">
      <Cmp ref={inputRef} value={value} onChange={onChange} {...props} />
      <MicButton onResult={handleVoice} parse={mode} isTextarea={as === "textarea"} />
    </div>
  );
}

// Global voice command FAB - listens for navigation/action commands
function VoiceCommandFAB({ onCommand }) {
  const [open, setOpen] = React.useState(false);
  const [hint, setHint] = React.useState("");
  const { listening, transcript, start, stop, supported } = useSpeech({
    continuous: false,
    onResult: (val, raw) => {
      const cmd = (raw || "").toLocaleLowerCase("tr-TR");
      // Match commands
      const matches = [
        { kw: ["yeni işlem", "yeni sıkım", "yeni sipariş"], action: () => onCommand("nav", "yeni-islem") },
        { kw: ["müşteri", "müşteriler"], action: () => onCommand("nav", "musteri") },
        { kw: ["bidon"], action: () => onCommand("nav", "bidon") },
        { kw: ["aktif", "sıkımda", "preste", "kuyruk"], action: () => onCommand("nav", "aktif") },
        { kw: ["pano", "panel", "ana sayfa", "özet", "dashboard"], action: () => onCommand("nav", "dashboard") },
        { kw: ["rapor"], action: () => onCommand("nav", "raporlar") },
        { kw: ["köy", "bölge"], action: () => onCommand("nav", "koy") },
        { kw: ["sezon"], action: () => onCommand("nav", "sezon") },
        { kw: ["asit", "dizem"], action: () => onCommand("nav", "asit") },
        { kw: ["stok"], action: () => onCommand("nav", "stok") },
        { kw: ["cari", "borç", "alacak"], action: () => onCommand("nav", "cari") },
        { kw: ["yazdırma", "yazdır"], action: () => onCommand("nav", "yazdirma") },
        { kw: ["hareket", "emanet"], action: () => onCommand("nav", "hareket") },
        { kw: ["ayar", "ayarlar", "ayarları"], action: () => onCommand("nav", "ayarlar") },
        { kw: ["kapat", "çıkış", "iptal"], action: () => { setOpen(false); } },
      ];
      const m = matches.find(m => m.kw.some(k => cmd.includes(k)));
      if (m) {
        m.action();
        setHint(`✓ ${cmd}`);
      } else {
        setHint(`? "${cmd}" — anlaşılamadı`);
      }
      setTimeout(() => { setOpen(false); setHint(""); }, 900);
    },
    onError: (err) => { setHint("Hata: " + err); setTimeout(() => setOpen(false), 1500); },
  });

  const trigger = () => {
    if (!supported) {
      alert("Tarayıcınız sesli komutları desteklemiyor. Chrome/Safari deneyin.");
      return;
    }
    setOpen(true);
    setHint("");
    setTimeout(() => start(), 200);
  };

  if (!supported) return null;

  return (
    <>
      <button className={`voice-fab ${listening ? "listening" : ""}`} onClick={trigger} title="Sesli komut">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="3" width="6" height="12" rx="3"/>
          <path d="M5 11a7 7 0 0014 0M12 18v3M8 21h8"/>
        </svg>
      </button>

      {open && (
        <div className="voice-overlay" onClick={() => { stop(); setOpen(false); }}>
          <div className="vo-card" onClick={e => e.stopPropagation()}>
            <div className="vo-orb">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="3" width="6" height="12" rx="3"/>
                <path d="M5 11a7 7 0 0014 0M12 18v3M8 21h8"/>
              </svg>
            </div>
            <h3>{listening ? "Dinliyorum…" : "Sesli komut"}</h3>
            <div className="vo-transcript">
              {transcript || hint || "konuşmaya başlayın"}
            </div>
            <div className="vo-hints">
              <div><code>"yeni işlem"</code> — yeni sıkım kaydı aç</div>
              <div><code>"müşteri"</code> — müşteri listesine git</div>
              <div><code>"bidon"</code> — bidon takibine git</div>
              <div><code>"aktif"</code> — işlemdeki siparişler</div>
              <div><code>"rapor"</code>, <code>"köy"</code>, <code>"sezon"</code> …</div>
            </div>
            <button className="btn" style={{marginTop: 16, width: "100%", justifyContent:"center"}}
              onClick={() => { stop(); setOpen(false); }}>İptal</button>
          </div>
        </div>
      )}
    </>
  );
}

Object.assign(window, { useSpeech, MicButton, VInput, VoiceCommandFAB, parseTurkishNumber, SpeechRec });
