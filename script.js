// ANIM OS — CORE APPLICATION LOGIC
// Keeps the existing links, contact actions and AI backend intact.
(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const intro = $('intro');
  const loading = $('loading');
  const main = $('main');
  const bar = $('bar');
  const status = $('status');

  let bootStarted = false;

  function enterAnimOS(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (bootStarted) return;
    bootStarted = true;

    if (intro) {
      intro.classList.add('is-exiting');
      intro.style.pointerEvents = 'none';
      // Hide immediately so no invisible layer can block the app while it boots.
      setTimeout(() => { intro.style.display = 'none'; }, 220);
    }
    if (loading) loading.style.display = 'flex';
    startBoot();
  }

  // pointerdown is the most reliable first contact event on modern phones.
  // click remains as a fallback for browsers/accessibility tools.
  if (intro) {
    intro.style.pointerEvents = 'auto';
    intro.addEventListener('pointerdown', enterAnimOS, { passive: false, capture: true });
    intro.addEventListener('touchstart', enterAnimOS, { passive: false, capture: true });
    intro.addEventListener('click', enterAnimOS, { passive: false, capture: true });
    intro.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') enterAnimOS(event);
    });
  }

  function startBoot() {
    let progress = 0;
    const messages = [
      'Loading Modules...',
      'Checking Identity...',
      'Initializing Profile...',
      'Connecting Social Systems...',
      'Launching Anim OS...'
    ];

    const interval = window.setInterval(() => {
      progress = Math.min(progress + 20, 100);
      if (bar) bar.style.width = `${progress}%`;
      if (status) status.textContent = messages[(progress / 20) - 1] || messages[messages.length - 1];

      if (progress >= 100) {
        window.clearInterval(interval);
        window.setTimeout(() => {
          if (loading) loading.style.display = 'none';
          if (main) main.style.display = 'block';
          startGreeting();

          // IMPORTANT: the 3D engine is initialized only after #main is visible.
          // Initializing ScrollTrigger while #main is display:none gives it a zero-height scene.
          requestAnimationFrame(() => {
            if (typeof window.initNarrativeWorld === 'function') {
              window.initNarrativeWorld();
            }
            if (window.ScrollTrigger) window.ScrollTrigger.refresh();
          });
        }, 450);
      }
    }, 500);
  }

  function startGreeting() {
    const greeting = $('greeting');
    if (!greeting) return;
    const hour = new Date().getHours();
    greeting.textContent = hour < 12 ? 'Good Morning ☀️' : hour < 18 ? 'Good Afternoon 🌤️' : 'Good Evening 🌙';
  }

  // SHARE
  const shareBtn = $('shareBtn');
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      const shareData = {
        title: 'Anim Katwal | Digital Identity',
        text: 'Check out Anim OS',
        url: window.location.href
      };
      try {
        if (navigator.share) {
          await navigator.share(shareData);
        } else {
          await copyText(window.location.href);
          showTemporaryButtonState(shareBtn, '🔗 Link Copied');
        }
      } catch (error) {
        // Abort/cancel is normal on mobile; don't show a scary error.
        if (error && error.name !== 'AbortError') console.warn('Share unavailable:', error);
      }
    });
  }

  // COPY PHONE
  const copyBtn = $('copyBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      try {
        await copyText('9700068507');
        showTemporaryButtonState(copyBtn, '✅ Copied!');
      } catch (error) {
        console.error('Copy failed:', error);
        showTemporaryButtonState(copyBtn, '⚠️ Copy failed');
      }
    });
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.left = '-9999px';
    document.body.appendChild(area);
    area.select();
    const copied = document.execCommand('copy');
    area.remove();
    if (!copied) throw new Error('Clipboard command failed');
  }

  function showTemporaryButtonState(button, text) {
    const original = button.textContent;
    button.textContent = text;
    window.setTimeout(() => { button.textContent = original; }, 2000);
  }

  // SAVE CONTACT
  const saveBtn = $('saveBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const contact = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        'FN:Anim Katwal',
        'TEL:9700068507',
        'TEL:9712036065',
        'EMAIL:katwalanim6@gmail.com',
        'END:VCARD'
      ].join('\r\n');

      const blob = new Blob([contact], { type: 'text/vcard;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Anim_Katwal.vcf';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Some mobile browsers need the object URL to survive the click task.
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    });
  }

  // =======================
  // AI ANIM CHAT
  // =======================
  const chatBox = $('chat-box');
  const input = $('user-input');
  const sendBtn = $('send-btn');
  let aiBusy = false;

  function addMessage(text, sender) {
    if (!chatBox) return;
    const message = document.createElement('div');
    message.className = `message ${sender}`;
    message.textContent = text;
    chatBox.appendChild(message);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  async function aiReply(message) {
    try {
      const response = await fetch('https://anim-core.onrender.com/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      const data = await response.json();
      return data.reply || "🤖 I couldn't generate a response.";
    } catch (error) {
      console.error('AI Error:', error);
      return '⚠️ AI Anim is temporarily unavailable. Please try again.';
    }
  }

  async function sendMessage() {
    if (!input || aiBusy) return;
    const text = input.value.trim();
    if (!text) return;

    aiBusy = true;
    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.textContent = 'Thinking…';
    }
    addMessage(text, 'user');
    input.value = '';

    // Keep the existing conversational delay, but don't block the UI thread.
    await new Promise(resolve => window.setTimeout(resolve, 350));
    const reply = await aiReply(text);
    addMessage(reply, 'ai');

    aiBusy = false;
    if (sendBtn) {
      sendBtn.disabled = false;
      sendBtn.textContent = 'Send';
    }
  }

  if (sendBtn) sendBtn.addEventListener('click', sendMessage);
  if (input) {
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
      }
    });
  }

  // Welcome message is safe because this script is loaded after the HTML.
  addMessage("🤖 Hello! I'm AI Anim. Ask me anything about Anim Katwal.", 'ai');
})();
