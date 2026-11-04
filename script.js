(() => {
  "use strict";
  const $ = (selector) => document.querySelector(selector);
  const toast = $("#toast");
  let toastTimer;
  function notify(message) {
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2100);
  }
  function updateClock() {
    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 12 ? "Good morning," : hour < 18 ? "Good afternoon," : "Good evening,";
    $("#greeting").innerHTML = greeting + "<br><span>Anim.</span>";
    $("#clock").textContent = now.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit", hour12:false});
    $("#date-label").textContent = now.toLocaleDateString([], {weekday:"long", month:"long", day:"numeric"}).toUpperCase();
    $("#day-label").textContent = now.toLocaleDateString([], {weekday:"long"}).toUpperCase();
  }
  updateClock();
  window.setInterval(updateClock, 30000);

  document.querySelectorAll("[data-app]").forEach((button) => {
    button.addEventListener("click", () => notify(button.dataset.app + " will be available in a future update."));
  });
  document.querySelectorAll("[data-project]").forEach((button) => {
    button.addEventListener("click", () => notify(button.dataset.project + " workspace is coming soon."));
  });
  $("#nova-button").addEventListener("click", () => notify("NOVA connection will be added in a future update."));
  $("#profile-button").addEventListener("click", () => notify("Your personal profile is coming soon."));
  $("#all-apps").addEventListener("click", () => {
    $("#apps-section").scrollIntoView({behavior:"smooth", block:"center"});
    notify("This is your current app collection.");
  });
  $("#settings-button").addEventListener("click", () => notify("System settings are coming soon."));

  let installPrompt = null;
  const installButton = $("#install-button");
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
    installButton.hidden = false;
  });
  installButton.addEventListener("click", async () => {
    if (!installPrompt) {
      notify("Open your browser menu and choose Add to Home screen.");
      return;
    }
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    installButton.hidden = true;
  });
  window.addEventListener("appinstalled", () => {
    installButton.hidden = true;
    notify("ANIM OS installed successfully.");
  });

  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch((error) => {
        console.warn("ANIM OS offline support could not be registered:", error);
      });
    });
  }
  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-tab]").forEach((item) => {
        item.classList.remove("active");
        item.removeAttribute("aria-current");
      });
      button.classList.add("active");
      button.setAttribute("aria-current","page");
      const tab = button.dataset.tab;
      if (tab === "Home") window.scrollTo({top:0, behavior:"smooth"});
      else if (tab === "Apps") $("#apps-section").scrollIntoView({behavior:"smooth",block:"start"});
      else notify(tab + " section is planned for a future update.");
    });
  });
})();