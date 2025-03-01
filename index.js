// Selects the canvas element and sets up the 2D rendering context
const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

// Sets the canvas dimensions
canvas.width = 1280
canvas.height = 768

// Fills the canvas background with white
c.fillStyle = 'white'
c.fillRect(0, 0, canvas.width, canvas.height)

// Creates a 2D array from placementTilesData to represent rows of placement tiles
const placementTilesData2D = []

for (let i = 0; i < placementTilesData.length; i += 20) {
  placementTilesData2D.push(placementTilesData.slice(i, i + 20))
}

// Array to hold individual placement tiles
const placementTiles = []

// Populates the placementTiles array with placement tile objects where the symbol is 14
placementTilesData2D.forEach((row, y) => {
  row.forEach((symbol, x) => {
    if (symbol === 14) {
      placementTiles.push(
        new PlacementTile({
          position: {
            x: x * 64,
            y: y * 64
          }
        })
      )
    }
  })
})

// Loads the game map image and starts the animation loop
const image = new Image()

image.onload = () => {
  animate()
}
image.src = 'img/gameMap.png'

// Array to store enemy instances
const enemies = []

// Function to spawn enemies at specific offsets based on spawnCount
function spawnEnemies(spawnCount) {
  for (let i = 1; i < spawnCount + 1; i++) {
    const xOffset = i * 150
    enemies.push(
      new Enemy({
        position: { x: waypoints[0].x - xOffset, y: waypoints[0].y }
      })
    )
  }
}

// Variables for game state
const buildings = []
let activeTile = undefined
let enemyCount = 3
let hearts = 10
let coins = 100
const explosions = []
spawnEnemies(enemyCount)

// Main game loop that continuously redraws the canvas
function animate() {
  const animationId = requestAnimationFrame(animate)

  // Draws the game map
  c.drawImage(image, 0, 0)

  // Updates and removes enemies that reach the end of the canvas
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i]
    enemy.update()

    if (enemy.position.x > canvas.width) {
      hearts -= 1
      enemies.splice(i, 1)
      document.querySelector('#hearts').innerHTML = hearts

      if (hearts === 0) {
        console.log('game over')
        cancelAnimationFrame(animationId)
        document.querySelector('#gameOver').style.display = 'flex'
      }
    }
  }

  // Updates explosions and removes those that have completed their animation
  for (let i = explosions.length - 1; i >= 0; i--) {
    const explosion = explosions[i]
    explosion.draw()
    explosion.update()

    if (explosion.frames.current >= explosion.frames.max - 1) {
      explosions.splice(i, 1)
    }
  }

  // Spawns more enemies when all current ones are defeated
  if (enemies.length === 0) {
    enemyCount += 2
    spawnEnemies(enemyCount)
  }

  // Updates each placement tile's state
  placementTiles.forEach((tile) => {
    tile.update(mouse)
  })

  // Updates buildings and their interactions with enemies
  buildings.forEach((building) => {
    building.update()
    building.target = null
    const validEnemies = enemies.filter((enemy) => {
      const xDifference = enemy.center.x - building.center.x
      const yDifference = enemy.center.y - building.center.y
      const distance = Math.hypot(xDifference, yDifference)
      return distance < enemy.radius + building.radius
    })
    building.target = validEnemies[0]

    for (let i = building.projectiles.length - 1; i >= 0; i--) {
      const projectile = building.projectiles[i]

      projectile.update()

      const xDifference = projectile.enemy.center.x - projectile.position.x
      const yDifference = projectile.enemy.center.y - projectile.position.y
      const distance = Math.hypot(xDifference, yDifference)

      // Handles projectile collision with an enemy
      if (distance < projectile.enemy.radius + projectile.radius) {
        projectile.enemy.health -= 20
        if (projectile.enemy.health <= 0) {
          const enemyIndex = enemies.findIndex((enemy) => {
            return projectile.enemy === enemy
          })

          if (enemyIndex > -1) {
            enemies.splice(enemyIndex, 1)
            coins += 25
            document.querySelector('#coins').innerHTML = coins
          }
        }

        explosions.push(
          new Sprite({
            position: { x: projectile.position.x, y: projectile.position.y },
            imageSrc: './img/explosion.png',
            frames: { max: 4 },
            offset: { x: 0, y: 0 }
          })
        )
        building.projectiles.splice(i, 1)
      }
    }
  })
}

// Object to store mouse position
const mouse = {
  x: undefined,
  y: undefined
}

// Event listener for placing buildings on valid tiles
canvas.addEventListener('click', (event) => {
  if (activeTile && !activeTile.isOccupied && coins - 50 >= 0) {
    coins -= 50
    document.querySelector('#coins').innerHTML = coins
    buildings.push(
      new Building({
        position: {
          x: activeTile.position.x,
          y: activeTile.position.y
        }
      })
    )
    activeTile.isOccupied = true
    buildings.sort((a, b) => {
      return a.position.y - b.position.y
    })
  }
})

// Updates the activeTile based on mouse movement
window.addEventListener('mousemove', (event) => {
  mouse.x = event.clientX
  mouse.y = event.clientY

  activeTile = null
  for (let i = 0; i < placementTiles.length; i++) {
    const tile = placementTiles[i]
    if (
      mouse.x > tile.position.x &&
      mouse.x < tile.position.x + tile.size &&
      mouse.y > tile.position.y &&
      mouse.y < tile.position.y + tile.size
    ) {
      activeTile = tile
      break
    }
  }
})
