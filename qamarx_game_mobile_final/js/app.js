document.addEventListener("DOMContentLoaded", initApp);

// Game variables
let gameBoard = [];
let selectedTile = null;
let score = 0;
let isBoardFilling = false;
let gameInitialized = false;
let soundEnabled = true;
let bgMusic = null;
let matchSound = null;
let swapSound = null;

// Sound files
const SOUND_FILES = {
  background: "assets/tom_and_jerry.mp3",
  match: "assets/match.mp3",
  swap: "assets/swap.mp3",
  bgMusic: "assets/bg_music.mp3"
};

// Colors for tiles
const COLORS = ["red", "blue", "green", "yellow", "purple"];

// Cordova device ready event
document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {
  // Now safe to use device APIs
  console.log("Cordova initialized");
  
  // Handle Android back button
  document.addEventListener("backbutton", function(e) {
    e.preventDefault();
    // Show a confirm dialog to exit the app
    if (confirm("Do you want to exit the game?")) {
      navigator.app.exitApp();
    }
  }, false);
}

function initApp() {
  // Simulate loading process
  simulateLoading().then(() => {
    // Initialize game components
    document.getElementById("start-game").addEventListener("click", startGame);
    document.getElementById("sound-toggle").addEventListener("click", toggleSound);
    
    // Initialize sound elements
    initSounds();
    
    // Display the game UI after loading
    document.getElementById("loading-screen").style.display = "none";
    document.getElementById("start-game").style.display = "block";
  });
}

function simulateLoading() {
  return new Promise(resolve => {
    const progressBar = document.getElementById("loading-progress");
    const loadingPercent = document.getElementById("loading-percent");
    let progress = 0;
    
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress > 100) progress = 100;
      
      progressBar.style.width = `${progress}%`;
      loadingPercent.innerText = `${Math.round(progress)}%`;
      
      if (progress === 100) {
        clearInterval(interval);
        setTimeout(resolve, 500); // Short delay after reaching 100%
      }
    }, 200);
  });
}

function initSounds() {
  // Use Cordova Media API for sounds if available, otherwise use HTML5 Audio
  if (window.Media) {
    try {
      // Use Cordova Media API
      bgMusic = new Media(
        SOUND_FILES.bgMusic,
        () => console.log("Background music loaded successfully"),
        (err) => console.error("Error loading background music:", err)
      );
      
      matchSound = new Media(
        SOUND_FILES.match,
        () => console.log("Match sound loaded successfully"),
        (err) => console.error("Error loading match sound:", err)
      );
      
      swapSound = new Media(
        SOUND_FILES.swap,
        () => console.log("Swap sound loaded successfully"),
        (err) => console.error("Error loading swap sound:", err)
      );
    } catch (error) {
      console.error("Error initializing Cordova Media:", error);
      fallbackToHtmlAudio();
    }
  } else {
    // Fall back to HTML5 Audio
    fallbackToHtmlAudio();
  }
}

function fallbackToHtmlAudio() {
  console.log("Using HTML5 Audio fallback");
  bgMusic = new Audio(SOUND_FILES.bgMusic);
  bgMusic.loop = true;
  
  matchSound = new Audio(SOUND_FILES.match);
  swapSound = new Audio(SOUND_FILES.swap);
}

function playSound(sound) {
  if (!soundEnabled) return;
  
  try {
    if (sound === "background") {
      if (window.Media && bgMusic) {
        bgMusic.play();
      } else if (bgMusic) {
        bgMusic.currentTime = 0;
        bgMusic.play().catch(err => console.error("Error playing background music:", err));
      }
    } else if (sound === "match") {
      if (window.Media && matchSound) {
        matchSound.play();
      } else if (matchSound) {
        matchSound.currentTime = 0;
        matchSound.play().catch(err => console.error("Error playing match sound:", err));
      }
    } else if (sound === "swap") {
      if (window.Media && swapSound) {
        swapSound.play();
      } else if (swapSound) {
        swapSound.currentTime = 0;
        swapSound.play().catch(err => console.error("Error playing swap sound:", err));
      }
    }
  } catch (error) {
    console.error("Error playing sound:", error);
  }
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  const soundBtn = document.getElementById("sound-toggle");
  
  if (soundEnabled) {
    soundBtn.textContent = "🔊";
    if (gameInitialized) {
      playSound("background");
    }
  } else {
    soundBtn.textContent = "🔇";
    if (window.Media && bgMusic) {
      bgMusic.pause();
    } else if (bgMusic) {
      bgMusic.pause();
    }
  }
}

function startGame() {
  // Display game board and hide start button
  document.getElementById("game-board").style.display = "grid";
  document.getElementById("start-game").style.display = "none";
  
  // Clear any previous game state
  gameBoard = [];
  score = 0;
  document.getElementById("score").textContent = score;
  
  // Create the game board
  createGameBoard();
  
  // Play background music
  playSound("background");
  
  gameInitialized = true;
}

function createGameBoard() {
  const boardElement = document.getElementById("game-board");
  boardElement.innerHTML = "";
  
  // Create an 8x8 grid of tiles
  for (let row = 0; row < 8; row++) {
    gameBoard[row] = [];
    
    for (let col = 0; col < 8; col++) {
      // Create a color that doesn't immediately form a match
      let color;
      do {
        color = getRandomColor();
      } while (
        (row >= 2 && gameBoard[row-1][col] && gameBoard[row-2][col] && 
         gameBoard[row-1][col].color === color && gameBoard[row-2][col].color === color) ||
        (col >= 2 && gameBoard[row][col-1] && gameBoard[row][col-2] && 
         gameBoard[row][col-1].color === color && gameBoard[row][col-2].color === color)
      );
      
      // Create tile object
      const tile = {
        row: row,
        col: col,
        color: color,
        element: createTileElement(row, col, color)
      };
      
      // Add to game board array
      gameBoard[row][col] = tile;
      
      // Add to DOM
      boardElement.appendChild(tile.element);
    }
  }
  
  // Add touch event listeners
  addEventListeners();
}

function getRandomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function createTileElement(row, col, color) {
  const tile = document.createElement("div");
  tile.classList.add("tile", color);
  tile.dataset.row = row;
  tile.dataset.col = col;
  
  const sparkle = document.createElement("div");
  sparkle.classList.add("sparkle");
  tile.appendChild(sparkle);
  
  return tile;
}

function addEventListeners() {
  const tiles = document.querySelectorAll(".tile");
  
  tiles.forEach(tile => {
    tile.addEventListener("touchstart", handleTileClick);
    tile.addEventListener("click", handleTileClick);
  });
}

function handleTileClick(event) {
  event.preventDefault();
  
  if (isBoardFilling) return;
  
  const row = parseInt(this.dataset.row);
  const col = parseInt(this.dataset.col);
  const tile = gameBoard[row][col];
  
  if (!selectedTile) {
    // First tile selected
    selectedTile = tile;
    tile.element.classList.add("selected");
  } else if (selectedTile === tile) {
    // Same tile clicked, deselect
    selectedTile.element.classList.remove("selected");
    selectedTile = null;
  } else if (isAdjacent(selectedTile, tile)) {
    // Adjacent tile, try to swap
    selectedTile.element.classList.remove("selected");
    swapTiles(selectedTile, tile);
    selectedTile = null;
  } else {
    // Non-adjacent tile, select new tile
    selectedTile.element.classList.remove("selected");
    selectedTile = tile;
    tile.element.classList.add("selected");
  }
}

function isAdjacent(tile1, tile2) {
  const rowDiff = Math.abs(tile1.row - tile2.row);
  const colDiff = Math.abs(tile1.col - tile2.col);
  
  // Adjacent tiles are exactly one space away in only one direction
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

function swapTiles(tile1, tile2) {
  // Visual swap
  tile1.element.classList.add("swap-a");
  tile2.element.classList.add("swap-b");
  
  // Play swap sound
  playSound("swap");
  
  // Swap in game board array
  const tempColor = tile1.color;
  tile1.color = tile2.color;
  tile2.color = tempColor;
  
  // Update visual appearance
  updateTileAppearance(tile1);
  updateTileAppearance(tile2);
  
  // Check if the swap creates a match
  setTimeout(() => {
    // Remove animation classes
    tile1.element.classList.remove("swap-a");
    tile2.element.classList.remove("swap-b");
    
    const matches = [...findMatches(tile1), ...findMatches(tile2)];
    
    if (matches.length > 0) {
      // Valid move with matches
      processMatches(matches);
    } else {
      // Not a valid move, swap back
      const tempColor = tile1.color;
      tile1.color = tile2.color;
      tile2.color = tempColor;
      
      updateTileAppearance(tile1);
      updateTileAppearance(tile2);
      
      // Visual indicator for invalid move
      document.getElementById("game-board").classList.add("shake");
      setTimeout(() => {
        document.getElementById("game-board").classList.remove("shake");
      }, 500);
    }
  }, 400);
}

function updateTileAppearance(tile) {
  // Remove all color classes
  COLORS.forEach(color => {
    tile.element.classList.remove(color);
  });
  
  // Add the correct color class
  tile.element.classList.add(tile.color);
}

function findMatches(tile) {
  const { row, col, color } = tile;
  const matches = [];
  
  // Check for horizontal matches
  let horizontalMatches = [tile];
  
  // Check left
  let leftCol = col - 1;
  while (leftCol >= 0 && gameBoard[row][leftCol].color === color) {
    horizontalMatches.unshift(gameBoard[row][leftCol]);
    leftCol--;
  }
  
  // Check right
  let rightCol = col + 1;
  while (rightCol < 8 && gameBoard[row][rightCol].color === color) {
    horizontalMatches.push(gameBoard[row][rightCol]);
    rightCol++;
  }
  
  if (horizontalMatches.length >= 3) {
    matches.push(...horizontalMatches);
  }
  
  // Check for vertical matches
  let verticalMatches = [tile];
  
  // Check up
  let upRow = row - 1;
  while (upRow >= 0 && gameBoard[upRow][col].color === color) {
    verticalMatches.unshift(gameBoard[upRow][col]);
    upRow--;
  }
  
  // Check down
  let downRow = row + 1;
  while (downRow < 8 && gameBoard[downRow][col].color === color) {
    verticalMatches.push(gameBoard[downRow][col]);
    downRow++;
  }
  
  if (verticalMatches.length >= 3) {
    matches.push(...verticalMatches);
  }
  
  // Return unique matches
  return [...new Set(matches)];
}

function processMatches(matches) {
  // Play match sound
  playSound("match");
  
  // Add match animation
  matches.forEach(tile => {
    tile.element.classList.add("matched");
  });
  
  // Update score
  score += matches.length * 10;
  document.getElementById("score").textContent = score;
  document.getElementById("score-display").classList.add("pulse");
  
  setTimeout(() => {
    document.getElementById("score-display").classList.remove("pulse");
    
    // Remove matched tiles and drop tiles above
    dropTiles(matches);
  }, 500);
}

function dropTiles(matches) {
  isBoardFilling = true;
  
  // Sort matches by position (top to bottom, left to right)
  matches.sort((a, b) => {
    if (a.row === b.row) return a.col - b.col;
    return a.row - b.row;
  });
  
  // Mark matched tiles as empty (null)
  matches.forEach(tile => {
    gameBoard[tile.row][tile.col] = null;
    tile.element.remove();
  });
  
  // Drop tiles from above to fill empty spaces
  for (let col = 0; col < 8; col++) {
    let emptyCount = 0;
    
    // Start from the bottom, move upward
    for (let row = 7; row >= 0; row--) {
      if (gameBoard[row][col] === null) {
        emptyCount++;
      } else if (emptyCount > 0) {
        // Move this tile down by emptyCount rows
        const tile = gameBoard[row][col];
        const newRow = row + emptyCount;
        
        // Update game board array
        gameBoard[newRow][col] = tile;
        gameBoard[row][col] = null;
        
        // Update tile properties
        tile.row = newRow;
        tile.element.dataset.row = newRow;
        
        // Add animation class
        tile.element.classList.add("drop");
        
        // Update position in DOM (CSS grid will handle position)
        document.getElementById("game-board").appendChild(tile.element);
      }
    }
    
    // Fill the top empty spaces with new tiles
    for (let row = emptyCount - 1; row >= 0; row--) {
      const color = getRandomColor();
      const tile = {
        row: row,
        col: col,
        color: color,
        element: createTileElement(row, col, color)
      };
      
      // Add to game board array
      gameBoard[row][col] = tile;
      
      // Add to DOM
      const boardElement = document.getElementById("game-board");
      boardElement.appendChild(tile.element);
      
      // Add animation class
      tile.element.classList.add("drop");
      
      // Add event listener
      tile.element.addEventListener("touchstart", handleTileClick);
      tile.element.addEventListener("click", handleTileClick);
    }
  }
  
  // Remove animation classes after animation completes
  setTimeout(() => {
    document.querySelectorAll(".drop").forEach(element => {
      element.classList.remove("drop");
    });
    
    // Check for new matches after dropping
    checkForMatches();
  }, 400);
}

function checkForMatches() {
  const allMatches = [];
  
  // Check each tile for matches
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const tile = gameBoard[row][col];
      const matches = findMatches(tile);
      
      if (matches.length >= 3) {
        // Add unique matches
        matches.forEach(match => {
          if (!allMatches.includes(match)) {
            allMatches.push(match);
          }
        });
      }
    }
  }
  
  if (allMatches.length > 0) {
    // Process matches
    processMatches(allMatches);
  } else {
    // No more matches, end turn
    isBoardFilling = false;
  }
}