// feedback.js
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("feedback-form");
  if (!form) return;

  const messageInput = document.getElementById("feedback-message");
  const emailInput = document.getElementById("feedback-email");
  const statusEl = document.getElementById("feedback-status");
  const submitBtn = document.getElementById("feedbackSubmitBtn");

  function setStatus(text, ok) {
    if (!statusEl) return;
    statusEl.textContent = text || "";
    statusEl.classList.remove("success", "error");
    if (ok === true) statusEl.classList.add("success");
    if (ok === false) statusEl.classList.add("error");
  }

  function setLoading(isLoading) {
    if (!submitBtn) return;
    submitBtn.disabled = isLoading;
    submitBtn.textContent = isLoading ? "Sending..." : "Submit Feedback";
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setStatus("", null);

    const message = (messageInput?.value || "").trim();
    const email = (emailInput?.value || "").trim();

    if (!message || message.length < 3) {
      setStatus("Please write a bit more before submitting.", false);
      return;
    }

    setLoading(true);

    // Hard timeout so UI never hangs
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 15000); // 15s

    try {
      const res = await fetch("/api/send-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          message,
          email,
          page: window.location.href,
          website: "", // honeypot
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        const msg = data?.error || "Failed to send. Please try again.";
        setStatus(msg, false);
        return;
      }

      setStatus("Message sent. Thank you!", true);
      if (messageInput) messageInput.value = "";
      if (emailInput) emailInput.value = "";
    } catch (err) {
      if (err?.name === "AbortError") {
        setStatus("Request timed out. Please try again.", false);
      } else {
        setStatus("Network error. Please try again.", false);
      }
    } finally {
      clearTimeout(t);
      setLoading(false);
    }
  });
});
