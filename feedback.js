// feedback.js
document.addEventListener('DOMContentLoaded', () => {
  const form          = document.getElementById('feedback-form');
  const messageInput  = document.getElementById('feedback-message');
  const emailInput    = document.getElementById('feedback-email');
  const statusEl      = document.getElementById('feedback-status');
  const submitBtn     = document.getElementById('feedbackSubmitBtn');

  if (!form) return; // احتياط لو الصفحة ما فيها فورم

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusEl.textContent = '';
    statusEl.style.color = '';
    
    const message = (messageInput.value || '').trim();
    const email   = (emailInput.value || '').trim();

    if (!message || message.length < 3) {
      statusEl.textContent = 'Please write a bit more before submitting.';
      statusEl.style.color = '#ff5c5c';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    try {
      const res = await fetch('/api/send-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, email })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        throw new Error('Failed');
      }

      statusEl.textContent = 'Message sent. Thank you!';
      statusEl.style.color = '#44cc77';
      messageInput.value = '';
      emailInput.value = '';
    } catch (err) {
      console.error(err);
      statusEl.textContent = 'Something went wrong. Please try again later.';
      statusEl.style.color = '#ff5c5c';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Feedback';
    }
  });
});
