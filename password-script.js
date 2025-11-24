(function(){
  const $ = id => document.getElementById(id);

  function showToast(msg, ok){
    const t = $('toast');
    if(!t) return;
    t.textContent = msg || '';
    t.style.display = msg ? 'inline' : 'none';
    t.style.color = ok ? 'green' : 'red';
  }

  function init(){
    const out   = $('passwordOutput');
    const len   = $('length');
    const up    = $('includeUppercase');
    const low   = $('includeLowercase');
    const num   = $('includeNumbers');
    const sym   = $('includeSymbols');
    const gen   = $('generateBtn');
    const copy  = $('copyPasswordBtn');

    if(!out || !gen || !copy) return;

    const UPP='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const LOW='abcdefghijklmnopqrstuvwxyz';
    const NUM='0123456789';
    const SYM='!@#$%^&*()_+~`|}{[]:;?><,./-=';

    function enableCopyIfReady(){
      copy.disabled = !(out.value && out.value.length > 0);
    }

    gen.addEventListener('click', () => {
      const sets = [];
      if (up && up.checked)   sets.push(UPP);
      if (low && low.checked) sets.push(LOW);
      if (num && num.checked) sets.push(NUM);
      if (sym && sym.checked) sets.push(SYM);

      if (!sets.length) {
        out.value = '';
        showToast('Select at least one character type.');
        enableCopyIfReady();
        return;
      }

      const length = Math.max(4, Number(len?.value) || 12);
      const all = sets.join('');
      const pick = s => s[Math.floor(Math.random()*s.length)];
      const chars = [];

      sets.forEach(s => chars.push(pick(s)));
      while (chars.length < length) chars.push(pick(all));

      for (let i = chars.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random()*(i+1));
        [chars[i], chars[j]] = [chars[j], chars[i]];
      }

      out.value = chars.join('');
      showToast('Password generated successfully!', true);
      enableCopyIfReady();
    });

    async function copyText(text){
      try{
        if(navigator.clipboard && window.isSecureContext){
          await navigator.clipboard.writeText(text);
          return true;
        }
      }catch(_){}
      const ta=document.createElement('textarea');
      ta.value=text; ta.setAttribute('readonly','');
      ta.style.position='fixed'; ta.style.left='-9999px';
      document.body.appendChild(ta); ta.select();
      let ok=false; try{ ok=document.execCommand('copy'); }catch(_){}
      document.body.removeChild(ta);
      return ok;
    }

    copy.addEventListener('click', async () => {
      if (!out.value){ showToast('Generate a password first.'); enableCopyIfReady(); return; }
      const ok = await copyText(out.value);
      showToast(ok ? 'Password copied to clipboard!' : 'Copy failed. Select and copy manually.', ok);
    });

    out.addEventListener('input', enableCopyIfReady);
    enableCopyIfReady();
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
