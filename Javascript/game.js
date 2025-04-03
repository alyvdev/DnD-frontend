// Wanderer's Fate - Game Logic

// Game State
const gameState = {
  player: {
    name: "",
    health: 100,
    stamina: 100,
    gold: 50,
    inventory: [],
    currentLocation: "starting_point",
  },
  gameProgress: {
    visitedLocations: [],
    completedQuests: [],
    currentStoryNode: "intro",
  },
  settings: {
    soundEnabled: true,
    musicVolume: 0.7,
    effectsVolume: 1.0,
  },
};

// Inventory Management
const inventoryManager = {
  addItem(item) {
    gameState.player.inventory.push(item);
    this.updateInventoryUI();
    return true;
  },
  removeItem(itemId) {
    const index = gameState.player.inventory.findIndex(
      (item) => item.id === itemId
    );
    if (index !== -1) {
      gameState.player.inventory.splice(index, 1);
      this.updateInventoryUI();
      return true;
    }
    return false;
  },
  useItem(itemId) {
    const item = gameState.player.inventory.find((item) => item.id === itemId);
    if (!item) return false;

    // Apply item effects
    if (item.effect) {
      applyItemEffect(item.effect);
    }

    // Remove consumable item from inventory
    if (item.consumable) {
      this.removeItem(itemId);
    }

    return true;
  },
  updateInventoryUI() {
    // Update DOM
    const inventoryContainer = document.getElementById("inventory-items");
    if (!inventoryContainer) return;

    inventoryContainer.innerHTML = "";

    if (gameState.player.inventory.length === 0) {
      inventoryContainer.innerHTML =
        '<p class="text-gray-400">Your inventory is empty.</p>';
      return;
    }

    gameState.player.inventory.forEach((item) => {
      const itemElement = document.createElement("div");
      itemElement.className =
        "inventory-item flex items-center p-2 border border-green-700 rounded mb-2 bg-gray-800";
      itemElement.innerHTML = `
                <img src="${item.icon || "./Images/items/default.png"}" alt="${
        item.name
      }" class="w-8 h-8 mr-2">
                <div class="flex-grow">
                    <h4 class="text-green-300">${item.name}</h4>
                    <p class="text-xs text-gray-400">${item.description}</p>
                </div>
                <button class="use-item-btn px-2 py-1 bg-green-700 text-xs rounded" data-item-id="${
                  item.id
                }">Use</button>
            `;
      inventoryContainer.appendChild(itemElement);
    });

    // Add event listeners to item use buttons
    document.querySelectorAll(".use-item-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const itemId = e.target.getAttribute("data-item-id");
        this.useItem(itemId);
      });
    });
  },
};

// Apply item effects
function applyItemEffect(effect) {
  if (effect.health) {
    gameState.player.health = Math.min(
      100,
      gameState.player.health + effect.health
    );
  }
  if (effect.stamina) {
    gameState.player.stamina = Math.min(
      100,
      gameState.player.stamina + effect.stamina
    );
  }
  if (effect.gold) {
    gameState.player.gold += effect.gold;
  }

  // Karakter durumunu güncelle
  updateCharacterStats();
}

// Update Character Statistics
function updateCharacterStats() {
  const healthEl = document.getElementById("player-health");
  const staminaEl = document.getElementById("player-stamina");
  const goldEl = document.getElementById("player-gold");

  if (healthEl) healthEl.textContent = gameState.player.health;
  if (staminaEl) staminaEl.textContent = gameState.player.stamina;
  if (goldEl) goldEl.textContent = gameState.player.gold;
}

// Story Management
const storyManager = {
  storyNodes: {}, // Story nodes will be defined here

  loadStoryData() {
    // Load story data (can be loaded from JSON later)
    this.storyNodes = {
      intro: {
        text: "You open your eyes in a dark forest. Mist surrounds you, and you can't remember where you came from. Distant lights catch your attention.",
        choices: [
          { text: "Move toward the lights", nextNode: "village_approach" },
          { text: "Explore the surroundings", nextNode: "forest_exploration" },
        ],
      },
      village_approach: {
        text: "As you move toward the lights, a small village appears. An old guard stops you at the entrance.",
        choices: [
          { text: "Talk to the guard", nextNode: "guard_conversation" },
          {
            text: "Try to sneak into the village",
            nextNode: "sneaking_attempt",
          },
        ],
      },
      forest_exploration: {
        text: "As you explore the forest, you find ruins of an ancient temple. Strange symbols are carved on its door.",
        choices: [
          { text: "Enter the temple", nextNode: "temple_entrance" },
          { text: "Return to the village", nextNode: "village_approach" },
        ],
      },
      // More story nodes will be added
    };
  },

  displayCurrentNode() {
    const currentNode =
      this.storyNodes[gameState.gameProgress.currentStoryNode];
    if (!currentNode) return;

    const storyTextEl = document.getElementById("story-text");
    const choicesEl = document.getElementById("story-choices");

    if (storyTextEl) storyTextEl.textContent = currentNode.text;

    if (choicesEl) {
      choicesEl.innerHTML = "";
      currentNode.choices.forEach((choice) => {
        const choiceBtn = document.createElement("button");
        choiceBtn.className =
          "choice-btn w-full text-left p-3 mb-2 bg-gray-800 border border-green-700 rounded hover:bg-gray-700";
        choiceBtn.textContent = choice.text;
        choiceBtn.addEventListener("click", () =>
          this.makeChoice(choice.nextNode)
        );
        choicesEl.appendChild(choiceBtn);
      });
    }
  },

  makeChoice(nextNodeId) {
    // Seçimi işle ve hikayeyi ilerlet
    gameState.gameProgress.currentStoryNode = nextNodeId;

    // Yeni hikaye düğümünü göster
    this.displayCurrentNode();

    // Haritayı güncelle (gerekirse)
    mapManager.updateMapBasedOnStory(nextNodeId);
  },
};

// Map Management
const mapManager = {
  locations: {}, // Map locations will be defined here

  loadMapData() {
    // Load map data
    this.locations = {
      starting_point: {
        name: "Starting Point",
        description: "A clearing in the dark forest.",
        x: 50,
        y: 80,
        accessible: true,
        connections: ["forest_path", "river_crossing"],
      },
      forest_path: {
        name: "Forest Path",
        description: "A narrow path winding through the trees.",
        x: 40,
        y: 60,
        accessible: true,
        connections: ["starting_point", "village"],
      },
      river_crossing: {
        name: "River Crossing",
        description: "An old bridge over a fast-flowing river.",
        x: 65,
        y: 70,
        accessible: true,
        connections: ["starting_point", "ancient_temple"],
      },
      village: {
        name: "Village",
        description: "A small, peaceful village.",
        x: 30,
        y: 40,
        accessible: false, // Not accessible at the beginning
        connections: ["forest_path", "market"],
      },
      ancient_temple: {
        name: "Ancient Temple",
        description: "A mysterious temple abandoned centuries ago.",
        x: 80,
        y: 60,
        accessible: false, // Not accessible at the beginning
        connections: ["river_crossing", "temple_interior"],
      },
      // More locations will be added
    };
  },

  renderMap() {
    const mapContainer = document.getElementById("game-map");
    if (!mapContainer) return;

    mapContainer.innerHTML = "";

    // Create map background
    const mapBackground = document.createElement("div");
    mapBackground.className =
      "map-background relative w-full h-full bg-cover bg-center";
    mapBackground.style.backgroundImage = 'url("./Images/witchlightmap.jpg")';
    mapContainer.appendChild(mapBackground);

    // Add locations to the map
    Object.entries(this.locations).forEach(([id, location]) => {
      const locationMarker = document.createElement("div");
      locationMarker.className = `location-marker absolute w-4 h-4 rounded-full cursor-pointer transform -translate-x-1/2 -translate-y-1/2 ${
        location.accessible ? "bg-green-500" : "bg-gray-500"
      }`;
      locationMarker.style.left = `${location.x}%`;
      locationMarker.style.top = `${location.y}%`;
      locationMarker.setAttribute("data-location-id", id);
      locationMarker.setAttribute("title", location.name);

      // Location click event
      if (location.accessible) {
        locationMarker.addEventListener("click", () =>
          this.travelToLocation(id)
        );
      }

      mapBackground.appendChild(locationMarker);

      // Draw location connections
      location.connections.forEach((connectedId) => {
        const connectedLocation = this.locations[connectedId];
        if (!connectedLocation) return;

        // Only draw accessible connections
        if (location.accessible || connectedLocation.accessible) {
          this.drawConnection(mapBackground, location, connectedLocation);
        }
      });
    });
  },

  drawConnection(container, location1, location2) {
    const line = document.createElement("div");
    line.className = "location-connection absolute bg-gray-400";

    // Calculate the line between two points
    const x1 = location1.x;
    const y1 = location1.y;
    const x2 = location2.x;
    const y2 = location2.y;

    const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;

    line.style.width = `${length}%`;
    line.style.height = "2px";
    line.style.left = `${x1}%`;
    line.style.top = `${y1}%`;
    line.style.transformOrigin = "0 0";
    line.style.transform = `rotate(${angle}deg)`;

    container.appendChild(line);
  },

  travelToLocation(locationId) {
    // Travel to location
    const location = this.locations[locationId];
    if (!location || !location.accessible) return;

    gameState.player.currentLocation = locationId;

    // Update visited locations
    if (!gameState.gameProgress.visitedLocations.includes(locationId)) {
      gameState.gameProgress.visitedLocations.push(locationId);
    }

    // Display location information
    this.displayLocationInfo(location);

    // Update story if needed
    // This part can change the story node based on location change
  },

  displayLocationInfo(location) {
    const locationNameEl = document.getElementById("location-name");
    const locationDescEl = document.getElementById("location-description");

    if (locationNameEl) locationNameEl.textContent = location.name;
    if (locationDescEl) locationDescEl.textContent = location.description;
  },

  updateMapBasedOnStory(storyNodeId) {
    // Update the map based on story progression
    // For example, make new locations accessible when reaching certain story nodes

    // Example: Village access
    if (storyNodeId === "guard_conversation") {
      this.locations["village"].accessible = true;
    }

    // Example: Temple access
    if (storyNodeId === "temple_entrance") {
      this.locations["ancient_temple"].accessible = true;
    }

    // Redraw the map
    this.renderMap();
  },
};

// Game Save/Load
const saveManager = {
  saveGame() {
    const saveData = JSON.stringify(gameState);
    localStorage.setItem("wanderersFateSave", saveData);
    return true;
  },

  loadGame() {
    const saveData = localStorage.getItem("wanderersFateSave");
    if (!saveData) return false;

    try {
      const parsedData = JSON.parse(saveData);
      // Load game state
      Object.assign(gameState, parsedData);

      // Update UI
      updateCharacterStats();
      inventoryManager.updateInventoryUI();
      storyManager.displayCurrentNode();
      mapManager.renderMap();

      return true;
    } catch (error) {
      console.error("Error loading save:", error);
      return false;
    }
  },

  newGame() {
    // Oyun durumunu sıfırla
    gameState.player = {
      name: "",
      health: 100,
      stamina: 100,
      gold: 50,
      inventory: [],
      currentLocation: "starting_point",
    };

    gameState.gameProgress = {
      visitedLocations: [],
      completedQuests: [],
      currentStoryNode: "intro",
    };

    // Oyuncu adını sor
    const playerName = prompt("Adınız nedir, gezgin?", "Gezgin");
    if (playerName) gameState.player.name = playerName;

    // UI'ı güncelle
    updateCharacterStats();
    inventoryManager.updateInventoryUI();
    storyManager.displayCurrentNode();
    mapManager.renderMap();

    return true;
  },
};

// Oyun Başlatma
function initGame() {
  console.log("Wanderer's Fate oyunu başlatılıyor...");

  // Hikaye ve harita verilerini yükle
  storyManager.loadStoryData();
  mapManager.loadMapData();

  // Kayıtlı oyun var mı kontrol et
  if (localStorage.getItem("wanderersFateSave")) {
    // Kayıtlı oyun varsa, oyuncuya sorabilirsin
    const loadSave = confirm(
      "Kaydedilmiş bir oyun bulundu. Yüklemek ister misiniz?"
    );
    if (loadSave) {
      saveManager.loadGame();
    } else {
      saveManager.newGame();
    }
  } else {
    // Yeni oyun başlat
    saveManager.newGame();
  }

  // Olay dinleyicilerini ekle
  document
    .getElementById("save-game-btn")
    ?.addEventListener("click", saveManager.saveGame);
  document
    .getElementById("new-game-btn")
    ?.addEventListener("click", saveManager.newGame);

  console.log("Oyun başlatıldı!");
}

// Sayfa yüklendiğinde oyunu başlat
document.addEventListener("DOMContentLoaded", initGame);
