(() => {
  "use strict";

  // GlitchTip DSN keys are public write-only ingestion keys. Never place the
  // GlitchTip authentication token in a GitHub Pages site.
  const STORE_URL =
    "https://app.glitchtip.com/api/29645/store/" +
    "?sentry_key=8fcca38ce2bd4832bd5fdca9a6120e52";
  const modal = document.getElementById("feedback-modal");
  const form = document.getElementById("feedback-form");
  const titleInput = document.getElementById("feedback-title");
  const contentInput = document.getElementById("feedback-content");
  const statusNode = document.getElementById("feedback-status");
  const submitButton = document.getElementById("feedback-submit");
  const kicker = document.getElementById("feedback-kicker");
  const heading = document.getElementById("feedback-dialog-title");
  const intro = document.getElementById("feedback-intro");
  let mode = "problem";
  let opener = null;

  if (!modal || !form || !titleInput || !contentInput || !submitButton) return;

  function feedbackTypeOf(value) {
    return value === "suggestion" ? "suggestion" : "problem";
  }

  function eventId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID().replace(/-/g, "");
    }
    return Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)).join("");
  }

  function releaseVersion() {
    const node = document.querySelector("[data-release-version]");
    return node ? String(node.textContent || "").trim() : "";
  }

  function setMode(nextMode) {
    mode = feedbackTypeOf(nextMode);
    const suggestion = mode === "suggestion";
    kicker.textContent = suggestion ? "功能建议" : "问题反馈";
    heading.textContent = suggestion ? "告诉我们你的想法" : "描述你遇到的问题";
    intro.textContent = suggestion
      ? "请说明使用场景和期望效果，不要填写密码、学号等敏感信息。"
      : "请说明问题现象和操作步骤，不要填写密码、学号等敏感信息。";
    submitButton.textContent = suggestion ? "提交建议" : "提交问题";
    statusNode.textContent = "";
  }

  function openModal(nextMode, trigger) {
    opener = trigger || document.activeElement;
    setMode(nextMode);
    form.reset();
    modal.hidden = false;
    document.body.classList.add("feedback-open");
    window.setTimeout(() => titleInput.focus(), 0);
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove("feedback-open");
    if (opener && typeof opener.focus === "function") opener.focus();
  }

  async function submitFeedback(event) {
    event.preventDefault();
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    if (!title || !content) {
      statusNode.textContent = "请填写标题和内容。";
      return;
    }
    const lastSubmitted = Number(localStorage.getItem("website-feedback-at") || 0);
    if (Date.now() - lastSubmitted < 10000) {
      statusNode.textContent = "提交过于频繁，请稍后再试。";
      return;
    }
    const version = releaseVersion();
    const typeLabel = mode === "suggestion" ? "功能建议" : "问题反馈";
    const payload = {
      event_id: eventId(),
      timestamp: new Date().toISOString(),
      platform: "javascript",
      level: mode === "suggestion" ? "info" : "warning",
      logger: "crowkit-website-feedback",
      release: version ? `crowkit-website@${version}` : "crowkit-website",
      environment: "production",
      message: `[${typeLabel}] ${title}`,
      fingerprint: ["crowkit-website", mode, title.toLowerCase().slice(0, 120)],
      tags: {
        application: "crowkit-website",
        feedback_type: mode,
        page: location.pathname,
      },
      extra: {
        title,
        content,
        page_url: location.href,
        release_version: version,
        user_agent: navigator.userAgent,
      },
    };
    submitButton.disabled = true;
    submitButton.textContent = "正在提交…";
    statusNode.textContent = "正在提交到 GlitchTip…";
    try {
      const response = await fetch(STORE_URL, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      localStorage.setItem("website-feedback-at", String(Date.now()));
      statusNode.textContent = "提交成功，感谢你的反馈。";
      form.reset();
    } catch (error) {
      console.error("GlitchTip feedback submission failed:", error);
      statusNode.textContent = "提交失败，请检查网络后重试。";
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = mode === "suggestion" ? "提交建议" : "提交问题";
    }
  }

  document.querySelectorAll("[data-feedback-open]").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      openModal(trigger.getAttribute("data-feedback-open"), trigger);
    });
  });
  document.querySelectorAll("[data-feedback-close]").forEach((trigger) => {
    trigger.addEventListener("click", closeModal);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) closeModal();
  });
  form.addEventListener("submit", submitFeedback);
})();
