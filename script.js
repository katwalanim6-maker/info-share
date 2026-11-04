(() => {
  const toast = document.getElementById("toast");
  let toastTimer;
  function notify(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 1900);
  }
  const now = new Date();
  const hour = now.getHours();
  document.getElementById("greeting").firstChild.textContent =
    (hour < 12 ? "Good morning, Anim" : hour < 18 ? "Good afternoon, Anim" : "Good evening, Anim");
  document.getElementById("date-label").textContent =
    now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }).toUpperCase();

  document.querySelectorAll("[data-app]").forEach(button => {
    button.addEventListener("click", () => notify(button.dataset.app + " is coming soon."));
  });
  document.getElementById("nova-button").addEventListener("click", () => notify("NOVA integration is planned for a later phase."));
  document.getElementById("profile-button").addEventListener("click", () => notify("Anim's profile is coming soon."));
  document.getElementById("all-apps").addEventListener("click", () => notify("The full app library is coming soon."));
  document.querySelectorAll("[data-tab]").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-tab]").forEach(item => item.classList.remove("active"));
      button.classList.add("active");
      if (button.dataset.tab !== "Home") notify(button.dataset.tab + " view is coming soon.");
    });
  });
})();