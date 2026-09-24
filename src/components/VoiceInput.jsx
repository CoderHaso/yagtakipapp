import { useState, useEffect, useRef } from 'react'
import Icon from './Icon'

// Turkish spoken numbers parser
function parseTurkishNumber(str) {
  if (!str) return '';
  let cleanStr = str.toLowerCase().replace(/,/g, '.').trim();

  // If it's already standard numeric format, just return it
  if (!isNaN(cleanStr) && cleanStr !== '') {
    return Number(cleanStr);
  }

  const units = { 'sıfır': 0, 'bir': 1, 'iki': 2, 'üç': 3, 'dört': 4, 'beş': 5, 'altı': 6, 'yedi': 7, 'sekiz': 8, 'dokuz': 9 };
  const tens = { 'on': 10, 'yirmi': 20, 'otuz': 30, 'kırk': 40, 'elli': 50, 'altmış': 60, 'yetmiş': 70, 'seksen': 80, 'doksan': 90 };

  const words = cleanStr.split(/\s+/);
  let total = 0;
  let current = 0;
  let isDecimal = false;
  let decimalDivisor = 10;

  for (let word of words) {
    if (word === 'virgül' || word === 'nokta' || word === 'dizem') {
      isDecimal = true;
      continue;
    }

    let val = null;
    if (units[word] !== undefined) {
      val = units[word];
    } else if (tens[word] !== undefined) {
      val = tens[word];
    } else if (word === 'yüz') {
      current = (current === 0 ? 1 : current) * 100;
      continue;
    } else if (word === 'bin') {
      total += (current === 0 ? 1 : current) * 1000;
      current = 0;
      continue;
    }

    if (val !== null) {
      if (isDecimal) {
        total += val / decimalDivisor;
        decimalDivisor *= 10;
      } else {
        current += val;
      }
    }
  }
  total += current;

  // Fallback: If calculation resulted in 0 but there are digits in the string, extract digits
  if (total === 0) {
    const digitsOnly = cleanStr.replace(/[^0-9.]/g, '');
    if (digitsOnly && !isNaN(digitsOnly)) {
      return Number(digitsOnly);
    }
  }

  return total;
}

export default function VoiceInput({ onResult, isNumber = false, className = '' }) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'tr-TR';

      rec.onstart = () => {
        setListening(true);
      };

      rec.onend = () => {
        setListening(false);
      };

      rec.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setListening(false);
      };

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          if (isNumber) {
            const numVal = parseTurkishNumber(transcript);
            onResult(numVal);
          } else {
            onResult(transcript);
          }
        }
      };

      recognitionRef.current = rec;
    }
  }, [onResult, isNumber]);

  const toggleListen = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!supported || !recognitionRef.current) return;

    if (listening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={toggleListen}
      className={`btn-mic ${listening ? 'listening' : ''} ${className}`}
      title={listening ? 'Dinleniyor... Durdurmak için tıklayın' : 'Sesle yazdır'}
      style={{
        width: 44,
        height: 44,
        borderRadius: 8,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: listening ? 'var(--bad)' : 'var(--bg-3)',
        color: listening ? 'white' : 'var(--ink-2)',
        border: '1px solid var(--line)',
        padding: 0,
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'all 0.2s ease',
        boxShadow: listening ? '0 0 12px var(--bad)' : 'none',
      }}
    >
      <Icon name="mic" size={20} className={listening ? 'pulse-anim' : ''} />
    </button>
  );
}
