// Main website navigation and functionality

document.addEventListener("DOMContentLoaded", function () {
  // Navigation handling
  const navLinks = document.querySelectorAll("header ul a[data-page]");

  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const page = this.getAttribute("data-page");

      // Navigate to the appropriate page
      switch (page) {
        case "home":
          window.location.href = "index.html";
          break;
        case "story":
          window.location.href = "Story/story.html";
          break;
        case "map":
          window.location.href = "Map/map.html";
          break;
        case "characters":
          window.location.href = "Characters/characters.html";
          break;
        default:
          window.location.href = "index.html";
      }
    });
  });

  // Adventure button handling
  const adventureBtn = document.querySelector("button.bg-green-600");
  if (adventureBtn) {
    adventureBtn.addEventListener("click", function () {
      window.location.href = "game.html";
    });
  }

  // Story page buttons
  const storyReadMoreBtns = document.querySelectorAll(
    ".story-card a.bg-green-700"
  );
  if (storyReadMoreBtns.length > 0) {
    storyReadMoreBtns.forEach((btn) => {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        alert("Story content will be available soon!");
      });
    });
  }

  const startAdventureBtn = document.querySelector(
    ".featured-campaign a.bg-green-700"
  );
  if (startAdventureBtn) {
    startAdventureBtn.addEventListener("click", function (e) {
      e.preventDefault();
      window.location.href = "../game.html";
    });
  }

  // Map page buttons
  const viewAdventuresBtn = document.querySelector(
    ".location-info button.bg-green-700"
  );
  if (viewAdventuresBtn) {
    viewAdventuresBtn.addEventListener("click", function () {
      alert("Adventures for this location will be available soon!");
    });
  }

  const notableNpcsBtn = document.querySelector(
    ".location-info button.bg-gray-600"
  );
  if (notableNpcsBtn) {
    notableNpcsBtn.addEventListener("click", function () {
      alert("Notable NPCs for this location will be available soon!");
    });
  }

  const exploreRegionLinks = document.querySelectorAll(
    ".mt-12 a.text-green-400"
  );
  if (exploreRegionLinks.length > 0) {
    exploreRegionLinks.forEach((link) => {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        const region = this.parentElement.querySelector("h3").textContent;
        alert(`Detailed information about ${region} will be available soon!`);
      });
    });
  }

  // Characters page buttons
  const createCharBtn = document.querySelector(
    "button.bg-green-700:not(.character-card button)"
  );
  if (createCharBtn && window.location.href.includes("Characters")) {
    createCharBtn.addEventListener("click", function () {
      alert("Character creation tool will be available soon!");
    });
  }

  const viewDetailsButtons = document.querySelectorAll(
    ".group button.bg-green-700"
  );
  if (viewDetailsButtons.length > 0) {
    viewDetailsButtons.forEach((btn) => {
      btn.addEventListener("click", function () {
        const charName = this.closest(".group").querySelector("h3").textContent;
        alert(`Detailed information about ${charName} will be available soon!`);
      });
    });
  }

  const useTemplateButtons = document.querySelectorAll(
    ".group button.bg-gray-700"
  );
  if (useTemplateButtons.length > 0) {
    useTemplateButtons.forEach((btn) => {
      btn.addEventListener("click", function () {
        const charName = this.closest(".group").querySelector("h3").textContent;
        alert(
          `Using ${charName} as a template for character creation will be available soon!`
        );
      });
    });
  }

  const startCharCreationBtn = document.querySelector(
    ".mt-12 button.bg-green-700"
  );
  if (startCharCreationBtn && window.location.href.includes("Characters")) {
    startCharCreationBtn.addEventListener("click", function () {
      alert("Character creation tool will be available soon!");
    });
  }

  // Login page functionality
  const loginForm = document.querySelector("form");
  if (loginForm && window.location.href.includes("Login")) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const username = document.getElementById("username").value;
      if (username) {
        alert(`Welcome, ${username}! You are now logged in.`);
        setTimeout(() => {
          window.location.href = "../index.html";
        }, 1500);
      } else {
        alert("Please enter a username.");
      }
    });
  }

  const socialLoginBtns = document.querySelectorAll(
    ".flex.items-center.justify-center.w-10.h-10.rounded-full"
  );
  if (socialLoginBtns.length > 0) {
    socialLoginBtns.forEach((btn) => {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        const platform = this.querySelector("i").className.split("-")[2];
        alert(
          `${
            platform.charAt(0).toUpperCase() + platform.slice(1)
          } login will be available soon!`
        );
      });
    });
  }

  const registerLink = document.querySelector(".mt-6 a.text-green-400");
  if (registerLink && window.location.href.includes("Login")) {
    registerLink.addEventListener("click", function (e) {
      e.preventDefault();
      alert("Registration will be available soon!");
    });
  }

  const forgotPasswordLink = document.querySelector(
    ".flex.items-center.justify-between a"
  );
  if (forgotPasswordLink && window.location.href.includes("Login")) {
    forgotPasswordLink.addEventListener("click", function (e) {
      e.preventDefault();
      alert("Password recovery will be available soon!");
    });
  }
});
