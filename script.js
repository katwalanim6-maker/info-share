(() => {
  "use strict";
  const $ = (selector) => document.querySelector(selector);
  const toast = $("#toast");
  let toastTimer;
  function notify(message) {
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2600);
  }
  function openNova() {
    if (window.AnimOSBridge && typeof window.AnimOSBridge.openNova === "function") {
      window.AnimOSBridge.openNova();
      return;
    }
    notify("NOVA's on-device AI chat is available in the ANIM OS Android app. Open the APK to choose your local model.");
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
    button.addEventListener("click", () => {
      if (button.dataset.project === "NOVA Assistant") openNova();
      else notify(button.dataset.project + " workspace is coming soon.");
    });
  });
  $("#nova-button").addEventListener("click", openNova);
  $("#profile-button").addEventListener("click", openProfile);
  $("#all-apps").addEventListener("click", () => {
    $("#apps-section").scrollIntoView({behavior:"smooth", block:"center"});
    notify("This is your current app collection.");
  });
  $("#settings-button").addEventListener("click", () => notify("System settings are coming soon."));


  const profileScreen = $("#profile-screen");
  const profileModal = $("#profile-modal");
  const profileForm = $("#profile-form");
  const profileDefaults = {
    displayName: "Anim Katwal",
    handle: "anim",
    bio: "Building ideas into experiences."
  };
  let profileData = {...profileDefaults};
  try {
    const savedProfile = JSON.parse(localStorage.getItem("animOS.profile") || "null");
    if (savedProfile && typeof savedProfile === "object") {
      profileData = {
        displayName: typeof savedProfile.displayName === "string" ? savedProfile.displayName.slice(0, 40) : profileDefaults.displayName,
        handle: typeof savedProfile.handle === "string" ? savedProfile.handle.replace(/^@/, "").slice(0, 24) : profileDefaults.handle,
        bio: typeof savedProfile.bio === "string" ? savedProfile.bio.slice(0, 140) : profileDefaults.bio
      };
    }
  } catch (error) {
    console.warn("Profile storage is unavailable:", error);
  }

  function renderProfile() {
    $("#profile-name").textContent = profileData.displayName || profileDefaults.displayName;
    $("#profile-handle").textContent = "@" + (profileData.handle || profileDefaults.handle);
    $("#profile-bio").textContent = profileData.bio || "Add a short introduction about yourself.";
    const shortName = (profileData.displayName || "Anim").trim().split(/\\s+/)[0] || "Anim";
    $("#greeting").innerHTML = $("#greeting").innerHTML.replace(/<span>.*?<\\/span>/, "<span></span>");
    $("#greeting span").textContent = shortName + ".";
    $(".hero-copy h2").textContent = "Hey, " + shortName + ".";
  }

  function openProfile() {
    profileScreen.hidden = false;
    $("main").classList.add("profile-view-active");
    document.querySelectorAll("[data-tab]").forEach((item) => {
      const active = item.dataset.tab === "Profile";
      item.classList.toggle("active", active);
      if (active) item.setAttribute("aria-current", "page");
      else item.removeAttribute("aria-current");
    });
    window.scrollTo({top:0, behavior:"smooth"});
  }

  function closeProfile() {
    profileScreen.hidden = true;
    $("main").classList.remove("profile-view-active");
    document.querySelectorAll("[data-tab]").forEach((item) => {
      const active = item.dataset.tab === "Home";
      item.classList.toggle("active", active);
      if (active) item.setAttribute("aria-current", "page");
      else item.removeAttribute("aria-current");
    });
  }

  function openProfileEditor() {
    profileForm.elements.displayName.value = profileData.displayName;
    profileForm.elements.handle.value = profileData.handle;
    profileForm.elements.bio.value = profileData.bio;
    profileModal.hidden = false;
    profileForm.elements.displayName.focus();
  }

  function closeProfileEditor() {
    profileModal.hidden = true;
  }

  renderProfile();
  $("#profile-button").addEventListener("click", openProfile);
  $("#profile-back").addEventListener("click", closeProfile);
  $("#edit-profile-button").addEventListener("click", openProfileEditor);
  document.querySelectorAll("[data-close-profile]").forEach((button) => {
    button.addEventListener("click", closeProfileEditor);
  });
  profileForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const displayName = profileForm.elements.displayName.value.trim();
    const handle = profileForm.elements.handle.value.trim().replace(/^@/, "").replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 24);
    const bio = profileForm.elements.bio.value.trim().slice(0, 140);
    if (!displayName || !handle) {
      notify("Please add a display name and username.");
      return;
    }
    profileData = {displayName:displayName.slice(0, 40), handle, bio};
    try {
      localStorage.setItem("animOS.profile", JSON.stringify(profileData));
    } catch (error) {
      console.warn("Could not save profile on this device:", error);
      notify("Profile updated for this session, but device storage is unavailable.");
    }
    renderProfile();
    closeProfileEditor();
    notify("Your profile has been updated.");
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !profileModal.hidden) closeProfileEditor();
    else if (event.key === "Escape" && !profileScreen.hidden) closeProfile();
  });
\n  let installPrompt = null;
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
      if (tab === "Home") {
        if (!profileScreen.hidden) closeProfile();
        else window.scrollTo({top:0, behavior:"smooth"});
      } else if (tab === "Profile") openProfile();
      else if (tab === "Apps") {
        if (!profileScreen.hidden) closeProfile();
        $("#apps-section").scrollIntoView({behavior:"smooth",block:"start"});
      } else if (tab === "NOVA") openNova();
      else notify(tab + " section is planned for a future update.");
    });
  });
})();