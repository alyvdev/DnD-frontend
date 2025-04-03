// Wanderer's Fate - Game Logic

// Game State
const gameState = {
  player: {
    name: "",
    health: 100,
    maxHealth: 100,
    stamina: 100,
    maxStamina: 100,
    gold: 50,
    experience: 0,
    level: 1,
    attributes: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    },
    skills: {
      combat: 1,
      survival: 1,
      persuasion: 1,
      stealth: 1,
      arcana: 1,
      perception: 1,
    },
    equipment: {
      weapon: null,
      armor: null,
      accessory: null,
    },
    inventory: [],
    currentLocation: "starting_point",
    questLog: [],
  },
  gameProgress: {
    visitedLocations: [],
    completedQuests: [],
    currentStoryNode: "intro",
    reputation: {
      village: 0,
      forest: 0,
      temple: 0,
    },
    daysPassed: 0,
    timeOfDay: "morning", // morning, afternoon, evening, night
  },
  settings: {
    soundEnabled: true,
    musicVolume: 0.7,
    effectsVolume: 1.0,
    difficultyLevel: "normal", // easy, normal, hard
  },
  combat: {
    inCombat: false,
    enemies: [],
    turn: "player",
    round: 0,
  },
};

// Inventory Management
const inventoryManager = {
  // Item categories
  categories: {
    WEAPON: "weapon",
    ARMOR: "armor",
    POTION: "potion",
    SCROLL: "scroll",
    QUEST: "quest",
    MISC: "misc",
  },

  // Add item to inventory
  addItem(item) {
    // Ensure item has required properties
    if (!item.id || !item.name) {
      console.error("Invalid item format", item);
      return false;
    }

    // Add category if not specified
    if (!item.category) {
      item.category = this.categories.MISC;
    }

    // Add quantity if not specified
    if (item.stackable && !item.quantity) {
      item.quantity = 1;
    }

    // Check if item is stackable and already exists
    if (item.stackable) {
      const existingItem = gameState.player.inventory.find(
        (i) => i.id === item.id
      );

      if (existingItem) {
        existingItem.quantity += item.quantity || 1;
        this.updateInventoryUI();
        return true;
      }
    }

    // Add new item to inventory
    gameState.player.inventory.push(item);
    this.updateInventoryUI();
    return true;
  },

  // Remove item from inventory
  removeItem(itemId, quantity = 1) {
    const index = gameState.player.inventory.findIndex(
      (item) => item.id === itemId
    );

    if (index === -1) return false;

    const item = gameState.player.inventory[index];

    // Handle stackable items
    if (item.stackable && item.quantity > quantity) {
      item.quantity -= quantity;
      this.updateInventoryUI();
      return true;
    }

    // Remove item completely
    gameState.player.inventory.splice(index, 1);
    this.updateInventoryUI();
    return true;
  },

  // Use an item
  useItem(itemId) {
    const item = gameState.player.inventory.find((item) => item.id === itemId);
    if (!item) return false;

    // Handle different item types
    switch (item.category) {
      case this.categories.POTION:
        if (item.effect) {
          applyItemEffect(item.effect);
          // Show message
          storyManager.showMessage(`You used ${item.name}.`);
        }
        break;

      case this.categories.WEAPON:
      case this.categories.ARMOR:
        this.equipItem(item);
        return true;

      case this.categories.SCROLL:
        if (item.spell) {
          // Cast spell logic would go here
          storyManager.showMessage(`You cast ${item.spell.name}.`);
        }
        break;

      case this.categories.QUEST:
        storyManager.showMessage(
          "This is a quest item and cannot be used directly."
        );
        return false;

      default:
        if (item.effect) {
          applyItemEffect(item.effect);
        }
        storyManager.showMessage(`You used ${item.name}.`);
    }

    // Remove consumable item from inventory
    if (item.consumable) {
      this.removeItem(itemId, 1);
    }

    return true;
  },

  // Equip an item
  equipItem(item) {
    if (!item) return false;

    let slot = null;

    // Determine equipment slot
    if (item.category === this.categories.WEAPON) {
      slot = "weapon";
    } else if (item.category === this.categories.ARMOR) {
      slot = "armor";
    } else if (item.category === "accessory") {
      slot = "accessory";
    }

    if (!slot) return false;

    // Unequip current item if any
    const currentItem = gameState.player.equipment[slot];
    if (currentItem) {
      // Add current item back to inventory
      gameState.player.inventory.push(currentItem);
    }

    // Remove new item from inventory
    this.removeItem(item.id);

    // Equip new item
    gameState.player.equipment[slot] = item;

    // Apply item bonuses
    if (item.bonuses) {
      // Apply attribute bonuses
      if (item.bonuses.attributes) {
        for (const [attr, value] of Object.entries(item.bonuses.attributes)) {
          if (gameState.player.attributes[attr] !== undefined) {
            // Bonuses are applied in updateCharacterStats
          }
        }
      }

      // Apply skill bonuses
      if (item.bonuses.skills) {
        for (const [skill, value] of Object.entries(item.bonuses.skills)) {
          if (gameState.player.skills[skill] !== undefined) {
            // Bonuses are applied in updateCharacterStats
          }
        }
      }
    }

    // Update UI
    updateCharacterStats();
    this.updateInventoryUI();

    storyManager.showMessage(`You equipped ${item.name}.`);
    return true;
  },

  // Update inventory UI
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

    // Group items by category
    const categorizedItems = {};
    gameState.player.inventory.forEach((item) => {
      const category = item.category || this.categories.MISC;
      if (!categorizedItems[category]) {
        categorizedItems[category] = [];
      }
      categorizedItems[category].push(item);
    });

    // Create category sections
    for (const [category, items] of Object.entries(categorizedItems)) {
      // Create category header
      const categoryHeader = document.createElement("div");
      categoryHeader.className = "mb-2 mt-4 first:mt-0";
      categoryHeader.innerHTML = `<h3 class="text-md font-medieval text-green-300 border-b border-green-700 pb-1">${this.getCategoryName(
        category
      )}</h3>`;
      inventoryContainer.appendChild(categoryHeader);

      // Add items in this category
      items.forEach((item) => {
        const itemElement = document.createElement("div");
        itemElement.className =
          "inventory-item flex items-center p-2 border border-green-700 rounded mb-2 bg-gray-800 hover:bg-gray-700 transition-colors";

        // Determine action button based on item type
        let actionButton = "";
        if (
          item.category === this.categories.WEAPON ||
          item.category === this.categories.ARMOR
        ) {
          actionButton = `<button class="equip-item-btn px-2 py-1 bg-blue-700 text-xs rounded hover:bg-blue-600" data-item-id="${item.id}">Equip</button>`;
        } else if (item.consumable) {
          actionButton = `<button class="use-item-btn px-2 py-1 bg-green-700 text-xs rounded hover:bg-green-600" data-item-id="${item.id}">Use</button>`;
        } else if (item.category !== this.categories.QUEST) {
          actionButton = `<button class="examine-item-btn px-2 py-1 bg-gray-600 text-xs rounded hover:bg-gray-500" data-item-id="${item.id}">Examine</button>`;
        }

        // Show quantity for stackable items
        const quantityDisplay =
          item.stackable && item.quantity > 1
            ? `<span class="text-xs bg-gray-700 px-1 rounded ml-1">${item.quantity}</span>`
            : "";

        itemElement.innerHTML = `
          <img src="${item.icon || "./Images/items/default.png"}" alt="${
          item.name
        }" class="w-8 h-8 mr-2">
          <div class="flex-grow">
            <div class="flex items-center">
              <h4 class="text-green-300">${item.name}</h4>
              ${quantityDisplay}
            </div>
            <p class="text-xs text-gray-400">${item.description}</p>
          </div>
          ${actionButton}
        `;

        inventoryContainer.appendChild(itemElement);
      });
    }

    // Add event listeners to item buttons
    document.querySelectorAll(".use-item-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const itemId = e.target.getAttribute("data-item-id");
        this.useItem(itemId);
      });
    });

    document.querySelectorAll(".equip-item-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const itemId = e.target.getAttribute("data-item-id");
        const item = gameState.player.inventory.find((i) => i.id === itemId);
        if (item) this.equipItem(item);
      });
    });

    document.querySelectorAll(".examine-item-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const itemId = e.target.getAttribute("data-item-id");
        const item = gameState.player.inventory.find((i) => i.id === itemId);
        if (item) storyManager.showMessage(`${item.name}: ${item.description}`);
      });
    });
  },

  // Get friendly category name
  getCategoryName(category) {
    const categoryNames = {
      [this.categories.WEAPON]: "Weapons",
      [this.categories.ARMOR]: "Armor",
      [this.categories.POTION]: "Potions",
      [this.categories.SCROLL]: "Scrolls",
      [this.categories.QUEST]: "Quest Items",
      [this.categories.MISC]: "Miscellaneous",
    };

    return categoryNames[category] || "Items";
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
  // Basic stats
  const nameEl = document.getElementById("player-name");
  const healthEl = document.getElementById("player-health");
  const maxHealthEl = document.getElementById("player-max-health");
  const staminaEl = document.getElementById("player-stamina");
  const maxStaminaEl = document.getElementById("player-max-stamina");
  const goldEl = document.getElementById("player-gold");
  const levelEl = document.getElementById("player-level");

  // Update basic stats
  if (nameEl) nameEl.textContent = gameState.player.name || "Wanderer";
  if (healthEl) healthEl.textContent = gameState.player.health;
  if (maxHealthEl) maxHealthEl.textContent = gameState.player.maxHealth;
  if (staminaEl) staminaEl.textContent = gameState.player.stamina;
  if (maxStaminaEl) maxStaminaEl.textContent = gameState.player.maxStamina;
  if (goldEl) goldEl.textContent = gameState.player.gold;
  if (levelEl) levelEl.textContent = gameState.player.level;

  // Update attributes
  const attributeElements = {
    strength: document.getElementById("player-strength"),
    dexterity: document.getElementById("player-dexterity"),
    constitution: document.getElementById("player-constitution"),
    intelligence: document.getElementById("player-intelligence"),
    wisdom: document.getElementById("player-wisdom"),
    charisma: document.getElementById("player-charisma"),
  };

  // Update each attribute
  for (const [attr, element] of Object.entries(attributeElements)) {
    if (element && gameState.player.attributes[attr] !== undefined) {
      element.textContent = gameState.player.attributes[attr];
    }
  }

  // Update skills
  const skillElements = {
    combat: document.getElementById("player-combat"),
    survival: document.getElementById("player-survival"),
    persuasion: document.getElementById("player-persuasion"),
    stealth: document.getElementById("player-stealth"),
    arcana: document.getElementById("player-arcana"),
    perception: document.getElementById("player-perception"),
  };

  // Update each skill
  for (const [skill, element] of Object.entries(skillElements)) {
    if (element && gameState.player.skills[skill] !== undefined) {
      element.textContent = gameState.player.skills[skill];
    }
  }

  // Update equipment
  const equipmentElements = {
    weapon: document.getElementById("player-weapon"),
    armor: document.getElementById("player-armor"),
    accessory: document.getElementById("player-accessory"),
  };

  // Update each equipment slot
  for (const [slot, element] of Object.entries(equipmentElements)) {
    if (element) {
      const item = gameState.player.equipment[slot];
      element.textContent = item ? item.name : "None";
    }
  }
}

// Story Management
const storyManager = {
  storyNodes: {}, // Story nodes will be defined here
  messageTimeout: null,

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
      guard_conversation: {
        text: "'Halt, stranger!' the guard says. 'We don't get many visitors these days. What brings you to our village?'",
        choices: [
          {
            text: "'I'm lost and seeking shelter.'",
            nextNode: "guard_shelter",
          },
          {
            text: "'I'm an adventurer looking for work.'",
            nextNode: "guard_work",
          },
          {
            text: "'That's none of your business.'",
            nextNode: "guard_hostile",
          },
        ],
      },
      guard_shelter: {
        text: "The guard's expression softens. 'Very well. You may enter, but mind your manners. Speak with the innkeeper if you need a place to stay.'",
        choices: [
          { text: "Enter the village", nextNode: "village_center" },
          { text: "Ask about the area first", nextNode: "guard_area_info" },
        ],
        onEnter: function () {
          // Increase village reputation
          gameState.gameProgress.reputation.village += 5;
          // Give player a quest
          questManager.addQuest("village_inn");
        },
      },
      guard_work: {
        text: "'An adventurer, eh?' The guard looks you up and down. 'Well, we could use someone with your skills. The mayor has been looking for help with some... problems.'",
        choices: [
          {
            text: "'I'd like to speak with the mayor.'",
            nextNode: "village_center",
          },
          { text: "'What kind of problems?'", nextNode: "guard_problems" },
        ],
        onEnter: function () {
          // Add mayor quest
          questManager.addQuest("village_mayor");
        },
      },
      temple_entrance: {
        text: "You step into the ancient temple. The air is cool and still. Faded murals depict scenes of forgotten rituals. A stone pedestal stands in the center of the room.",
        choices: [
          { text: "Examine the pedestal", nextNode: "temple_pedestal" },
          { text: "Look around for valuables", nextNode: "temple_search" },
          { text: "Leave the temple", nextNode: "forest_exploration" },
        ],
        onEnter: function () {
          // Add temple exploration to visited locations
          if (
            !gameState.gameProgress.visitedLocations.includes("temple_interior")
          ) {
            gameState.gameProgress.visitedLocations.push("temple_interior");
            // Award XP for discovering new location
            this.awardExperience(25);
          }
        },
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

    // Execute onEnter function if it exists
    if (currentNode.onEnter && typeof currentNode.onEnter === "function") {
      currentNode.onEnter.call(this);
    }
  },

  makeChoice(nextNodeId) {
    // Process the choice and advance the story
    gameState.gameProgress.currentStoryNode = nextNodeId;

    // Display the new story node
    this.displayCurrentNode();

    // Update the map if needed
    mapManager.updateMapBasedOnStory(nextNodeId);
  },

  // Show a message to the player
  showMessage(message, duration = 3000) {
    // Create message container if it doesn't exist
    let messageContainer = document.getElementById("message-container");

    if (!messageContainer) {
      messageContainer = document.createElement("div");
      messageContainer.id = "message-container";
      messageContainer.className =
        "fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50";
      document.body.appendChild(messageContainer);
    }

    // Create message element
    const messageElement = document.createElement("div");
    messageElement.className =
      "bg-gray-800 text-green-200 px-4 py-2 rounded border border-green-700 shadow-lg mb-2 animate-fade-in";
    messageElement.textContent = message;

    // Add to container
    messageContainer.appendChild(messageElement);

    // Remove after duration
    setTimeout(() => {
      messageElement.classList.add("animate-fade-out");
      setTimeout(() => {
        if (messageContainer.contains(messageElement)) {
          messageContainer.removeChild(messageElement);
        }

        // Remove container if empty
        if (messageContainer.children.length === 0) {
          document.body.removeChild(messageContainer);
        }
      }, 500); // Fade out animation duration
    }, duration);
  },

  // Award experience to the player
  awardExperience(amount) {
    if (!amount || amount <= 0) return;

    gameState.player.experience += amount;
    this.showMessage(`You gained ${amount} experience!`);

    // Check for level up
    this.checkLevelUp();

    // Update experience bar
    updateExperienceBar();
  },

  // Check if player should level up
  checkLevelUp() {
    const currentLevel = gameState.player.level;
    const xpForNextLevel = currentLevel * 100; // Simple formula: level * 100

    if (gameState.player.experience >= xpForNextLevel) {
      // Level up!
      gameState.player.level += 1;
      gameState.player.experience -= xpForNextLevel;

      // Increase stats
      gameState.player.maxHealth += 10;
      gameState.player.health = gameState.player.maxHealth; // Heal to full on level up
      gameState.player.maxStamina += 5;
      gameState.player.stamina = gameState.player.maxStamina;

      // Show level up message
      this.showMessage(
        `Level up! You are now level ${gameState.player.level}!`,
        5000
      );

      // Update character stats
      updateCharacterStats();

      // Check if player should level up again (in case of multiple levels)
      this.checkLevelUp();
    }
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

// Game Initialization
function initGame() {
  console.log("Initializing Wanderer's Fate...");

  // Load story and map data
  storyManager.loadStoryData();
  mapManager.loadMapData();

  // Check for saved game
  if (localStorage.getItem("wanderersFateSave")) {
    // If saved game exists, ask player
    const loadSave = confirm(
      "A saved game was found. Would you like to load it?"
    );
    if (loadSave) {
      saveManager.loadGame();
    } else {
      saveManager.newGame();
    }
  } else {
    // Start new game
    saveManager.newGame();
  }

  // Add event listeners for game controls
  document
    .getElementById("save-game-btn")
    ?.addEventListener("click", saveManager.saveGame);
  document
    .getElementById("new-game-btn")
    ?.addEventListener("click", saveManager.newGame);

  // Setup tab navigation
  setupTabNavigation();

  // Initialize experience bar
  updateExperienceBar();

  // Setup encounter button
  const encounterBtn = document.getElementById("encounter-btn");
  if (encounterBtn) {
    encounterBtn.addEventListener("click", startRandomEncounter);
  }

  console.log("Game initialized!");
}

// Tab Navigation Setup
function setupTabNavigation() {
  const tabs = [
    { id: "inventory-tab", contentId: "inventory-content" },
    { id: "quests-tab", contentId: "quests-content" },
    { id: "skills-tab", contentId: "skills-content" },
  ];

  tabs.forEach((tab) => {
    const tabButton = document.getElementById(tab.id);
    if (tabButton) {
      tabButton.addEventListener("click", () =>
        switchTab(tab.id, tab.contentId)
      );
    }
  });
}

// Switch between tabs
function switchTab(selectedTabId, selectedContentId) {
  // Get all tab buttons and content divs
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  // Hide all tab contents and reset tab button styles
  tabContents.forEach((content) => content.classList.add("hidden"));
  tabButtons.forEach((button) => {
    button.classList.remove("border-b-2", "border-green-500", "text-green-300");
    button.classList.add("text-gray-400");
  });

  // Show selected tab content and style the selected tab button
  document.getElementById(selectedContentId)?.classList.remove("hidden");
  const selectedButton = document.getElementById(selectedTabId);
  if (selectedButton) {
    selectedButton.classList.remove("text-gray-400");
    selectedButton.classList.add(
      "border-b-2",
      "border-green-500",
      "text-green-300"
    );
  }
}

// Update experience bar
function updateExperienceBar() {
  const xpBar = document.getElementById("xp-bar");
  const currentXpSpan = document.getElementById("current-xp");
  const nextLevelXpSpan = document.getElementById("next-level-xp");

  if (!xpBar || !currentXpSpan || !nextLevelXpSpan) return;

  // Calculate XP needed for next level (simple formula: level * 100)
  const currentLevel = gameState.player.level;
  const xpForNextLevel = currentLevel * 100;
  const currentXp = gameState.player.experience;

  // Calculate percentage for XP bar
  const percentage = Math.min((currentXp / xpForNextLevel) * 100, 100);
  xpBar.style.width = `${percentage}%`;

  // Update text
  currentXpSpan.textContent = `${currentXp} XP`;
  nextLevelXpSpan.textContent = `${xpForNextLevel} XP needed for next level`;
}

// Quest Management System
const questManager = {
  quests: {
    // Quest definitions
    village_inn: {
      id: "village_inn",
      title: "A Place to Rest",
      description: "Find the village inn and secure a room for the night.",
      objectives: [
        { id: "find_inn", description: "Locate the inn", completed: false },
        {
          id: "talk_innkeeper",
          description: "Speak with the innkeeper",
          completed: false,
        },
        { id: "get_room", description: "Secure a room", completed: false },
      ],
      reward: {
        gold: 15,
        experience: 50,
        items: [],
      },
      isCompleted: false,
      isActive: true,
    },
    village_mayor: {
      id: "village_mayor",
      title: "The Mayor's Request",
      description:
        "Meet with the village mayor to discuss the problems plaguing the area.",
      objectives: [
        {
          id: "find_mayor",
          description: "Find the mayor's house",
          completed: false,
        },
        {
          id: "speak_mayor",
          description: "Speak with the mayor",
          completed: false,
        },
      ],
      reward: {
        gold: 25,
        experience: 75,
        items: [
          {
            id: "map_forest",
            name: "Forest Map",
            description: "A detailed map of the surrounding forest.",
            category: "quest",
            icon: "./Images/items/map.png",
          },
        ],
      },
      isCompleted: false,
      isActive: true,
    },
    temple_artifact: {
      id: "temple_artifact",
      title: "Ancient Secrets",
      description: "Recover the ancient artifact from the temple ruins.",
      objectives: [
        {
          id: "enter_temple",
          description: "Enter the temple ruins",
          completed: false,
        },
        {
          id: "find_pedestal",
          description: "Locate the central pedestal",
          completed: false,
        },
        {
          id: "solve_puzzle",
          description: "Solve the temple puzzle",
          completed: false,
        },
        {
          id: "retrieve_artifact",
          description: "Retrieve the artifact",
          completed: false,
        },
      ],
      reward: {
        gold: 50,
        experience: 150,
        items: [
          {
            id: "ancient_amulet",
            name: "Ancient Amulet",
            description: "A mysterious amulet that glows with arcane energy.",
            category: "accessory",
            bonuses: {
              attributes: { wisdom: 2 },
              skills: { arcana: 1 },
            },
            icon: "./Images/items/amulet.png",
          },
        ],
      },
      isCompleted: false,
      isActive: false,
    },
  },

  // Add a quest to the player's quest log
  addQuest(questId) {
    const quest = this.quests[questId];
    if (!quest) return false;

    // Check if player already has this quest
    if (gameState.player.questLog.some((q) => q.id === questId)) {
      return false;
    }

    // Add quest to player's quest log
    const playerQuest = JSON.parse(JSON.stringify(quest)); // Deep copy
    gameState.player.questLog.push(playerQuest);

    // Update quest UI
    this.updateQuestUI();

    // Show notification
    storyManager.showMessage(`New quest added: ${quest.title}`);

    return true;
  },

  // Complete an objective for a quest
  completeObjective(questId, objectiveId) {
    const questIndex = gameState.player.questLog.findIndex(
      (q) => q.id === questId
    );
    if (questIndex === -1) return false;

    const quest = gameState.player.questLog[questIndex];
    const objective = quest.objectives.find((o) => o.id === objectiveId);

    if (!objective || objective.completed) return false;

    // Mark objective as completed
    objective.completed = true;

    // Check if all objectives are completed
    const allCompleted = quest.objectives.every((o) => o.completed);
    if (allCompleted) {
      this.completeQuest(questId);
    } else {
      // Update UI
      this.updateQuestUI();
      // Show notification
      storyManager.showMessage(`Objective completed: ${objective.description}`);
    }

    return true;
  },

  // Complete a quest and give rewards
  completeQuest(questId) {
    const questIndex = gameState.player.questLog.findIndex(
      (q) => q.id === questId
    );
    if (questIndex === -1) return false;

    const quest = gameState.player.questLog[questIndex];
    if (quest.isCompleted) return false;

    // Mark quest as completed
    quest.isCompleted = true;
    quest.isActive = false;

    // Give rewards
    if (quest.reward) {
      // Gold
      if (quest.reward.gold) {
        gameState.player.gold += quest.reward.gold;
      }

      // Experience
      if (quest.reward.experience) {
        storyManager.awardExperience(quest.reward.experience);
      }

      // Items
      if (quest.reward.items && quest.reward.items.length > 0) {
        quest.reward.items.forEach((item) => {
          inventoryManager.addItem(item);
        });
      }
    }

    // Update UI
    this.updateQuestUI();
    updateCharacterStats();

    // Show notification
    storyManager.showMessage(`Quest completed: ${quest.title}!`, 5000);

    return true;
  },

  // Update the quest UI
  updateQuestUI() {
    const questContainer = document.getElementById("quest-items");
    if (!questContainer) return;

    questContainer.innerHTML = "";

    if (gameState.player.questLog.length === 0) {
      questContainer.innerHTML =
        '<p class="text-gray-400">You have no active quests.</p>';
      return;
    }

    // Sort quests: active first, then by completion status
    const sortedQuests = [...gameState.player.questLog].sort((a, b) => {
      if (a.isActive !== b.isActive) return b.isActive ? 1 : -1;
      if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
      return 0;
    });

    sortedQuests.forEach((quest) => {
      const questElement = document.createElement("div");
      questElement.className = `quest-item p-3 mb-3 rounded border ${
        quest.isCompleted
          ? "border-gray-600 bg-gray-800 opacity-75"
          : "border-green-700 bg-gray-800"
      }`;

      // Calculate progress
      const completedObjectives = quest.objectives.filter(
        (o) => o.completed
      ).length;
      const totalObjectives = quest.objectives.length;
      const progressPercent = Math.round(
        (completedObjectives / totalObjectives) * 100
      );

      // Create quest HTML
      questElement.innerHTML = `
        <div class="flex justify-between items-start mb-2">
          <h3 class="text-lg font-medieval ${
            quest.isCompleted ? "text-gray-400" : "text-green-300"
          }">${quest.title}</h3>
          <span class="text-xs px-2 py-1 rounded ${
            quest.isCompleted
              ? "bg-gray-700 text-gray-400"
              : "bg-green-900 text-green-200"
          }">
            ${quest.isCompleted ? "Completed" : "Active"}
          </span>
        </div>
        <p class="text-sm text-gray-400 mb-3">${quest.description}</p>

        <div class="mb-2">
          <div class="flex justify-between text-xs mb-1">
            <span>Progress</span>
            <span>${completedObjectives}/${totalObjectives}</span>
          </div>
          <div class="w-full bg-gray-700 rounded-full h-2">
            <div class="bg-green-600 h-2 rounded-full" style="width: ${progressPercent}%"></div>
          </div>
        </div>

        <div class="objectives mt-2">
          <h4 class="text-sm font-semibold text-gray-300 mb-1">Objectives:</h4>
          <ul class="text-sm">
            ${quest.objectives
              .map(
                (obj) => `
              <li class="flex items-center ${
                obj.completed ? "text-gray-500 line-through" : "text-gray-300"
              }">
                <span class="mr-2">${obj.completed ? "✓" : "○"}</span>
                ${obj.description}
              </li>
            `
              )
              .join("")}
          </ul>
        </div>

        ${
          quest.isCompleted
            ? ""
            : `
          <div class="rewards mt-3">
            <h4 class="text-sm font-semibold text-gray-300 mb-1">Rewards:</h4>
            <ul class="text-sm text-gray-400">
              ${quest.reward.gold ? `<li>• ${quest.reward.gold} Gold</li>` : ""}
              ${
                quest.reward.experience
                  ? `<li>• ${quest.reward.experience} XP</li>`
                  : ""
              }
              ${
                quest.reward.items && quest.reward.items.length > 0
                  ? quest.reward.items
                      .map((item) => `<li>• ${item.name}</li>`)
                      .join("")
                  : ""
              }
            </ul>
          </div>
        `
        }
      `;

      questContainer.appendChild(questElement);
    });
  },
};

// Combat System
const combatManager = {
  // Enemy definitions
  enemies: {
    wolf: {
      name: "Forest Wolf",
      health: 30,
      maxHealth: 30,
      damage: [3, 6], // Min and max damage
      defense: 2,
      experience: 25,
      gold: [5, 15], // Min and max gold
      loot: [
        {
          id: "wolf_pelt",
          name: "Wolf Pelt",
          description:
            "A thick wolf pelt that could be sold or crafted into armor.",
          category: "misc",
          value: 10,
          dropChance: 0.7, // 70% chance to drop
          icon: "./Images/items/pelt.png",
        },
      ],
      image: "./Images/enemies/wolf.png",
    },
    bandit: {
      name: "Forest Bandit",
      health: 45,
      maxHealth: 45,
      damage: [4, 8],
      defense: 3,
      experience: 40,
      gold: [10, 25],
      loot: [
        {
          id: "rusty_dagger",
          name: "Rusty Dagger",
          description: "A worn dagger that has seen better days.",
          category: "weapon",
          damage: [2, 5],
          value: 15,
          dropChance: 0.4,
          icon: "./Images/items/dagger.png",
        },
      ],
      image: "./Images/enemies/bandit.png",
    },
    skeleton: {
      name: "Ancient Skeleton",
      health: 60,
      maxHealth: 60,
      damage: [5, 10],
      defense: 4,
      experience: 60,
      gold: [15, 30],
      loot: [
        {
          id: "bone_fragment",
          name: "Bone Fragment",
          description: "A fragment of ancient bone with magical properties.",
          category: "misc",
          value: 20,
          dropChance: 0.6,
          icon: "./Images/items/bone.png",
        },
        {
          id: "ancient_sword",
          name: "Ancient Sword",
          description: "A well-preserved sword from a bygone era.",
          category: "weapon",
          damage: [6, 10],
          value: 45,
          dropChance: 0.2,
          icon: "./Images/items/sword.png",
        },
      ],
      image: "./Images/enemies/skeleton.png",
    },
  },

  // Current enemy in combat
  currentEnemy: null,

  // Start combat with an enemy
  startCombat(enemyType) {
    // Check if already in combat
    if (gameState.combat.inCombat) return false;

    // Get enemy definition
    const enemyDef = this.enemies[enemyType];
    if (!enemyDef) return false;

    // Create enemy instance
    this.currentEnemy = JSON.parse(JSON.stringify(enemyDef)); // Deep copy

    // Set combat state
    gameState.combat.inCombat = true;
    gameState.combat.turn = "player";
    gameState.combat.round = 1;
    gameState.combat.enemies = [this.currentEnemy];

    // Show combat view
    this.showCombatView();

    // Update UI
    this.updateCombatUI();

    // Add log entry
    this.addCombatLog(`Combat with ${this.currentEnemy.name} has begun!`);

    return true;
  },

  // Show combat view
  showCombatView() {
    const mapView = document.getElementById("map-view");
    const combatView = document.getElementById("combat-view");

    if (mapView) mapView.classList.add("hidden");
    if (combatView) combatView.classList.remove("hidden");

    // Setup combat buttons
    this.setupCombatButtons();
  },

  // Hide combat view
  hideCombatView() {
    const mapView = document.getElementById("map-view");
    const combatView = document.getElementById("combat-view");

    if (mapView) mapView.classList.remove("hidden");
    if (combatView) combatView.classList.add("hidden");
  },

  // Setup combat buttons
  setupCombatButtons() {
    const attackBtn = document.getElementById("attack-btn");
    const defendBtn = document.getElementById("defend-btn");
    const useItemBtn = document.getElementById("use-item-btn");
    const fleeBtn = document.getElementById("flee-btn");

    // Attack button
    if (attackBtn) {
      attackBtn.onclick = () => this.playerAttack();
    }

    // Defend button
    if (defendBtn) {
      defendBtn.onclick = () => this.playerDefend();
    }

    // Use item button
    if (useItemBtn) {
      useItemBtn.onclick = () => this.showCombatItemMenu();
    }

    // Flee button
    if (fleeBtn) {
      fleeBtn.onclick = () => this.attemptFlee();
    }
  },

  // Update combat UI
  updateCombatUI() {
    if (!this.currentEnemy) return;

    // Update enemy display
    const enemyContainer = document.getElementById("enemy-container");
    if (enemyContainer) {
      enemyContainer.innerHTML = `
        <div class="mb-2">
          <div class="text-xl font-medieval text-green-300 mb-1">${
            this.currentEnemy.name
          }</div>
          <div class="flex justify-center items-center mb-2">
            <div class="text-sm text-gray-400 mr-2">HP:</div>
            <div class="w-32 bg-gray-700 rounded-full h-2">
              <div class="bg-red-600 h-2 rounded-full" style="width: ${
                (this.currentEnemy.health / this.currentEnemy.maxHealth) * 100
              }%"></div>
            </div>
            <div class="text-sm text-gray-400 ml-2">${
              this.currentEnemy.health
            }/${this.currentEnemy.maxHealth}</div>
          </div>
        </div>
        <div class="enemy-image mb-2">
          <img src="${
            this.currentEnemy.image || "./Images/enemies/default.png"
          }" alt="${this.currentEnemy.name}" class="h-32 mx-auto">
        </div>
      `;
    }

    // Update combat status
    const combatStatus = document.getElementById("combat-status");
    if (combatStatus) {
      if (gameState.combat.turn === "player") {
        combatStatus.textContent = "Your turn";
        combatStatus.className = "text-sm text-yellow-400";
      } else {
        combatStatus.textContent = "Enemy turn";
        combatStatus.className = "text-sm text-red-400";
      }
    }

    // Enable/disable buttons based on turn
    const combatButtons = document.querySelectorAll("#combat-actions button");
    combatButtons.forEach((button) => {
      button.disabled = gameState.combat.turn !== "player";
      if (gameState.combat.turn !== "player") {
        button.classList.add("opacity-50");
      } else {
        button.classList.remove("opacity-50");
      }
    });
  },

  // Add entry to combat log
  addCombatLog(message) {
    const combatLog = document.getElementById("combat-log");
    if (!combatLog) return;

    const logEntry = document.createElement("p");
    logEntry.textContent = message;
    combatLog.appendChild(logEntry);

    // Scroll to bottom
    combatLog.scrollTop = combatLog.scrollHeight;
  },

  // Player attacks enemy
  playerAttack() {
    if (!this.currentEnemy || gameState.combat.turn !== "player") return;

    // Calculate damage
    let minDamage = 5;
    let maxDamage = 10;

    // Add weapon damage if equipped
    const weapon = gameState.player.equipment.weapon;
    if (weapon && weapon.damage) {
      minDamage = weapon.damage[0];
      maxDamage = weapon.damage[1];
    }

    // Add strength bonus
    minDamage += Math.floor(gameState.player.attributes.strength / 5);
    maxDamage += Math.floor(gameState.player.attributes.strength / 3);

    // Calculate final damage
    const damage =
      Math.floor(Math.random() * (maxDamage - minDamage + 1)) + minDamage;

    // Apply enemy defense
    const finalDamage = Math.max(1, damage - this.currentEnemy.defense);

    // Apply damage to enemy
    this.currentEnemy.health = Math.max(
      0,
      this.currentEnemy.health - finalDamage
    );

    // Add log entry
    this.addCombatLog(
      `You attack ${this.currentEnemy.name} for ${finalDamage} damage!`
    );

    // Update UI
    this.updateCombatUI();

    // Check if enemy is defeated
    if (this.currentEnemy.health <= 0) {
      this.enemyDefeated();
      return;
    }

    // Switch to enemy turn
    gameState.combat.turn = "enemy";
    this.updateCombatUI();

    // Enemy attacks after a short delay
    setTimeout(() => this.enemyAttack(), 1000);
  },

  // Player defends
  playerDefend() {
    if (!this.currentEnemy || gameState.combat.turn !== "player") return;

    // Increase defense temporarily
    gameState.player.defending = true;

    // Add log entry
    this.addCombatLog("You take a defensive stance, reducing incoming damage.");

    // Switch to enemy turn
    gameState.combat.turn = "enemy";
    this.updateCombatUI();

    // Enemy attacks after a short delay
    setTimeout(() => this.enemyAttack(), 1000);
  },

  // Show combat item menu
  showCombatItemMenu() {
    // Filter for usable items in combat
    const usableItems = gameState.player.inventory.filter(
      (item) =>
        item.consumable || item.category === inventoryManager.categories.POTION
    );

    if (usableItems.length === 0) {
      this.addCombatLog("You don't have any usable items!");
      return;
    }

    // Create a simple modal for item selection
    const modal = document.createElement("div");
    modal.className =
      "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
    modal.id = "combat-item-modal";

    const modalContent = document.createElement("div");
    modalContent.className =
      "bg-gray-800 border border-green-700 rounded-lg p-4 max-w-md w-full max-h-96 overflow-y-auto";

    modalContent.innerHTML = `
      <h3 class="text-xl font-medieval text-green-300 mb-4">Use Item</h3>
      <div id="combat-item-list" class="mb-4">
        ${usableItems
          .map(
            (item) => `
          <div class="item-option flex items-center p-2 border border-green-700 rounded mb-2 bg-gray-700 hover:bg-gray-600 cursor-pointer" data-item-id="${
            item.id
          }">
            <img src="${item.icon || "./Images/items/default.png"}" alt="${
              item.name
            }" class="w-8 h-8 mr-2">
            <div class="flex-grow">
              <h4 class="text-green-300">${item.name}</h4>
              <p class="text-xs text-gray-400">${item.description}</p>
            </div>
            ${
              item.stackable && item.quantity > 1
                ? `<span class="text-xs bg-gray-800 px-1 rounded">${item.quantity}</span>`
                : ""
            }
          </div>
        `
          )
          .join("")}
      </div>
      <div class="flex justify-end">
        <button id="cancel-item-btn" class="bg-gray-700 hover:bg-gray-600 text-white py-1 px-3 rounded">Cancel</button>
      </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Add event listeners
    document.querySelectorAll(".item-option").forEach((option) => {
      option.addEventListener("click", (e) => {
        const itemId = e.currentTarget.getAttribute("data-item-id");
        document.body.removeChild(modal);
        this.useItemInCombat(itemId);
      });
    });

    document.getElementById("cancel-item-btn").addEventListener("click", () => {
      document.body.removeChild(modal);
    });
  },

  // Use item in combat
  useItemInCombat(itemId) {
    if (!this.currentEnemy || gameState.combat.turn !== "player") return;

    const item = gameState.player.inventory.find((i) => i.id === itemId);
    if (!item) return;

    // Use the item
    const success = inventoryManager.useItem(itemId);

    if (success) {
      // Switch to enemy turn
      gameState.combat.turn = "enemy";
      this.updateCombatUI();

      // Enemy attacks after a short delay
      setTimeout(() => this.enemyAttack(), 1000);
    }
  },

  // Attempt to flee from combat
  attemptFlee() {
    if (!this.currentEnemy || gameState.combat.turn !== "player") return;

    // Calculate flee chance based on dexterity
    const fleeChance = 0.4 + gameState.player.attributes.dexterity / 100;

    if (Math.random() < fleeChance) {
      // Successful flee
      this.addCombatLog("You successfully fled from combat!");

      // End combat
      this.endCombat();
    } else {
      // Failed flee attempt
      this.addCombatLog("You failed to escape!");

      // Switch to enemy turn
      gameState.combat.turn = "enemy";
      this.updateCombatUI();

      // Enemy attacks after a short delay
      setTimeout(() => this.enemyAttack(), 1000);
    }
  },

  // Enemy attacks player
  enemyAttack() {
    if (!this.currentEnemy || gameState.combat.turn !== "enemy") return;

    // Calculate damage
    const minDamage = this.currentEnemy.damage[0];
    const maxDamage = this.currentEnemy.damage[1];
    const damage =
      Math.floor(Math.random() * (maxDamage - minDamage + 1)) + minDamage;

    // Calculate player defense
    let defense = 0;

    // Add armor defense if equipped
    const armor = gameState.player.equipment.armor;
    if (armor && armor.defense) {
      defense += armor.defense;
    }

    // Add constitution bonus
    defense += Math.floor(gameState.player.attributes.constitution / 5);

    // Add defensive stance bonus
    if (gameState.player.defending) {
      defense *= 2;
      gameState.player.defending = false; // Reset defending status
    }

    // Apply final damage
    const finalDamage = Math.max(1, damage - defense);
    gameState.player.health = Math.max(
      0,
      gameState.player.health - finalDamage
    );

    // Add log entry
    this.addCombatLog(
      `${this.currentEnemy.name} attacks you for ${finalDamage} damage!`
    );

    // Update character stats
    updateCharacterStats();

    // Check if player is defeated
    if (gameState.player.health <= 0) {
      this.playerDefeated();
      return;
    }

    // Switch back to player turn
    gameState.combat.turn = "player";
    gameState.combat.round++;
    this.updateCombatUI();
  },

  // Player defeated enemy
  enemyDefeated() {
    if (!this.currentEnemy) return;

    // Add log entry
    this.addCombatLog(`You defeated ${this.currentEnemy.name}!`);

    // Calculate rewards
    const experience = this.currentEnemy.experience;
    const gold =
      Math.floor(
        Math.random() *
          (this.currentEnemy.gold[1] - this.currentEnemy.gold[0] + 1)
      ) + this.currentEnemy.gold[0];

    // Award experience
    storyManager.awardExperience(experience);

    // Award gold
    gameState.player.gold += gold;
    this.addCombatLog(`You gained ${gold} gold!`);

    // Award loot
    if (this.currentEnemy.loot && this.currentEnemy.loot.length > 0) {
      this.currentEnemy.loot.forEach((loot) => {
        if (Math.random() < (loot.dropChance || 1)) {
          // Create a copy of the loot item
          const lootItem = JSON.parse(JSON.stringify(loot));
          inventoryManager.addItem(lootItem);
          this.addCombatLog(`You found: ${lootItem.name}!`);
        }
      });
    }

    // Update character stats
    updateCharacterStats();

    // End combat after a delay
    setTimeout(() => this.endCombat(), 2000);
  },

  // Player was defeated
  playerDefeated() {
    // Add log entry
    this.addCombatLog("You have been defeated!");

    // Disable combat buttons
    const combatButtons = document.querySelectorAll("#combat-actions button");
    combatButtons.forEach((button) => {
      button.disabled = true;
      button.classList.add("opacity-50");
    });

    // Show defeat message
    setTimeout(() => {
      alert(
        "You have been defeated! You will respawn at the last safe location."
      );

      // Restore some health
      gameState.player.health = Math.floor(gameState.player.maxHealth * 0.5);
      updateCharacterStats();

      // End combat
      this.endCombat();

      // Return to a safe location (could be implemented with mapManager)
      // mapManager.moveToSafeLocation();
    }, 1500);
  },

  // End combat
  endCombat() {
    // Reset combat state
    gameState.combat.inCombat = false;
    gameState.combat.turn = "player";
    gameState.combat.round = 0;
    gameState.combat.enemies = [];
    this.currentEnemy = null;

    // Hide combat view
    this.hideCombatView();
  },
};

// Start a random encounter
function startRandomEncounter() {
  // Don't start an encounter if already in combat
  if (gameState.combat.inCombat) return;

  // Get random enemy type based on player level
  const enemyTypes = Object.keys(combatManager.enemies);
  let possibleEnemies;

  if (gameState.player.level <= 2) {
    // Low level - only wolves
    possibleEnemies = ["wolf"];
  } else if (gameState.player.level <= 5) {
    // Mid level - wolves and bandits
    possibleEnemies = ["wolf", "bandit"];
  } else {
    // High level - all enemies
    possibleEnemies = enemyTypes;
  }

  // Select random enemy from possible enemies
  const randomIndex = Math.floor(Math.random() * possibleEnemies.length);
  const enemyType = possibleEnemies[randomIndex];

  // Start combat
  combatManager.startCombat(enemyType);
}

// Initialize the game when the page loads
document.addEventListener("DOMContentLoaded", initGame);
