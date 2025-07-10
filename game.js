function Game() {
    // Конфигурация
    this.config = {
        width: 40,
        height: 24,
        rooms: { min: 5, max: 10, size: { min: 3, max: 8 } },
        passages: { h: 3, v: 5 },
        enemies: 10,
        swords: 2,
        potions: 10,
        tileSize: 20
    };

    // Состояние игры
    this.state = {
        map: [],
        hero: { x: 0, y: 0, health: 100, maxHealth: 100, attack: 1 },
        enemies: [],
        items: [],
        gameOver: false,
        gameWon: false
    };

    // Типы клеток
    this.TILE = {
        WALL: 0,
        FLOOR: 1,
        HERO: 2,
        ENEMY: 3,
        SWORD: 4,
        POTION: 5
    };
}

// Методы игры
Game.prototype = {
    init: function() {
        this.generateMap();
        this.placeObjects();
        this.render();
        this.setupControls();
    },

    generateMap: function() {
        this.state.map = Array(this.config.height).fill().map(() => 
            Array(this.config.width).fill(this.TILE.WALL)
        );

        this.generateRooms();
        this.generatePassages();
    },

    generateRooms: function() {
        const roomsCount = this.random(this.config.rooms.min, this.config.rooms.max);
        
        for (let i = 0; i < roomsCount; i++) {
            const width = this.random(this.config.rooms.size.min, this.config.rooms.size.max);
            const height = this.random(this.config.rooms.size.min, this.config.rooms.size.max);
            const x = this.random(1, this.config.width - width - 2);
            const y = this.random(1, this.config.height - height - 2);
            
            let canPlace = true;
            for (let dy = y-1; dy < y+height+1; dy++) {
                for (let dx = x-1; dx < x+width+1; dx++) {
                    if (this.state.map[dy][dx] === this.TILE.FLOOR) {
                        canPlace = false;
                        break;
                    }
                }
                if (!canPlace) break;
            }
            
            if (canPlace) {
                for (let dy = y; dy < y + height; dy++) {
                    for (let dx = x; dx < x + width; dx++) {
                        this.state.map[dy][dx] = this.TILE.FLOOR;
                    }
                }
            }
        }
    },

    generatePassages: function() {
        for (let i = 0; i < this.config.passages.h; i++) {
            const y = this.random(1, this.config.height - 2);
            for (let x = 1; x < this.config.width - 1; x++) {
                this.state.map[y][x] = this.TILE.FLOOR;
            }
        }
        
        for (let i = 0; i < this.config.passages.v; i++) {
            const x = this.random(1, this.config.width - 2);
            for (let y = 1; y < this.config.height - 1; y++) {
                this.state.map[y][x] = this.TILE.FLOOR;
            }
        }
    },

    placeObjects: function() {
        const heroPos = this.getEmptyPosition();
        this.state.hero.x = heroPos.x;
        this.state.hero.y = heroPos.y;
        this.state.map[heroPos.y][heroPos.x] = this.TILE.HERO;
        
        for (let i = 0; i < this.config.enemies; i++) {
            const pos = this.getEmptyPosition();
            this.state.enemies.push({
                x: pos.x,
                y: pos.y,
                health: 30,
                maxHealth: 30,
                attack: 10
            });
            this.state.map[pos.y][pos.x] = this.TILE.ENEMY;
        }
        
        for (let i = 0; i < this.config.swords; i++) {
            const pos = this.getEmptyPosition();
            this.state.items.push({
                x: pos.x,
                y: pos.y,
                type: 'sword'
            });
            this.state.map[pos.y][pos.x] = this.TILE.SWORD;
        }
        
        for (let i = 0; i < this.config.potions; i++) {
            const pos = this.getEmptyPosition();
            this.state.items.push({
                x: pos.x,
                y: pos.y,
                type: 'potion'
            });
            this.state.map[pos.y][pos.x] = this.TILE.POTION;
        }
    },

    getEmptyPosition: function() {
        const empty = [];
        for (let y = 0; y < this.config.height; y++) {
            for (let x = 0; x < this.config.width; x++) {
                if (this.state.map[y][x] === this.TILE.FLOOR) {
                    empty.push({ x, y });
                }
            }
        }
        return empty[Math.floor(Math.random() * empty.length)] || { x: 1, y: 1 };
    },

    render: function() {
        const $field = $('.field').empty();
        const tileSize = this.config.tileSize;

        for (let y = 0; y < this.config.height; y++) {
            for (let x = 0; x < this.config.width; x++) {
                let tileClass = 'tile';
                switch (this.state.map[y][x]) {
                    case this.TILE.WALL: tileClass += ' tileW'; break;
                    case this.TILE.FLOOR: break;
                    case this.TILE.HERO: tileClass += ' tileP'; break;
                    case this.TILE.ENEMY: tileClass += ' tileE'; break;
                    case this.TILE.SWORD: tileClass += ' tileSW'; break;
                    case this.TILE.POTION: tileClass += ' tileHP'; break;
                }
                
                const $tile = $(`<div class="${tileClass}"></div>`).css({
                    left: x * tileSize + 'px',
                    top: y * tileSize + 'px'
                });
                
                if (this.state.map[y][x] === this.TILE.HERO) {
                    $tile.append(`<div class="health" style="width:${this.state.hero.health}%"></div>`);
                } else if (this.state.map[y][x] === this.TILE.ENEMY) {
                    const enemy = this.state.enemies.find(e => e.x === x && e.y === y);
                    if (enemy) {
                        $tile.append(`<div class="health" style="width:${(enemy.health / enemy.maxHealth) * 100}%"></div>`);
                    }
                }
                
                $field.append($tile);
            }
        }
        
        $('#hero-health').text(this.state.hero.health);
        $('#hero-attack').text(this.state.hero.attack);
        
        if (this.state.gameOver) {
            const message = this.state.gameWon ? "ПОБЕДА! Все враги уничтожены!" : "Игра окончена. Вы погибли.";
            $('#game-message').text(message);
        } else {
            $('#game-message').empty();
        }
    },

    setupControls: function() {
        $(document).on('keydown', (e) => {
            if (this.state.gameOver) return;
            
            if (['a', 'd', 'w', 's', ' '].includes(e.key.toLowerCase())) {
                e.preventDefault();
            }

            let dx = 0, dy = 0;
            switch (e.key.toLowerCase()) {
                case 'a': dx = -1; break;
                case 'd': dx = 1; break;
                case 'w': dy = -1; break;
                case 's': dy = 1; break;
                case ' ': 
                    this.attackNearbyEnemies(); 
                    this.checkWinCondition();
                    return;
                default: return;
            }
            
            this.moveHero(dx, dy);
            this.moveEnemies();
            this.checkWinCondition();
        });
    },

    attackNearbyEnemies: function() {
        const {x, y} = this.state.hero;
        let attackedAny = false;
        
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                
                const nx = x + dx;
                const ny = y + dy;
                
                if (nx < 0 || ny < 0 || nx >= this.config.width || ny >= this.config.height) {
                    continue;
                }
                
                const enemyIndex = this.state.enemies.findIndex(e => e.x === nx && e.y === ny);
                if (enemyIndex !== -1) {
                    const enemy = this.state.enemies[enemyIndex];
                    enemy.health -= this.state.hero.attack;
                    attackedAny = true;
                    
                    if (enemy.health <= 0) {
                        this.state.enemies.splice(enemyIndex, 1);
                        this.state.map[ny][nx] = this.TILE.FLOOR;
                    }
                }
            }
        }
        
        if (attackedAny) {
            this.render();
        }
    },

    checkWinCondition: function() {
        if (this.state.enemies.length === 0 && !this.state.gameOver) {
            this.state.gameWon = true;
            this.state.gameOver = true;
            this.render();
        }
    },

    moveHero: function(dx, dy) {
        const newX = this.state.hero.x + dx;
        const newY = this.state.hero.y + dy;
        
        if (newX < 0 || newY < 0 || newX >= this.config.width || newY >= this.config.height) {
            return;
        }
        
        if (this.state.map[newY][newX] === this.TILE.WALL) {
            return;
        }
        
        this.state.map[this.state.hero.y][this.state.hero.x] = this.TILE.FLOOR;
        this.state.hero.x = newX;
        this.state.hero.y = newY;
        
        this.handleCollisions();
        
        this.state.map[newY][newX] = this.TILE.HERO;
        this.render();
    },

    moveEnemies: function() {
        const hero = this.state.hero;

        this.state.enemies.forEach(enemy => {
            const dx = Math.sign(hero.x - enemy.x);
            const dy = Math.sign(hero.y - enemy.y);

            let moveX = 0, moveY = 0;

            if (Math.random() < 0.5) {
                if (Math.random() < 0.5 && dx !== 0) {
                    moveX = dx;
                } else if (dy !== 0) {
                    moveY = dy;
                }
            } else {
                const dir = Math.floor(Math.random() * 4);
                switch(dir) {
                    case 0: moveX = 1; break;
                    case 1: moveX = -1; break;
                    case 2: moveY = 1; break;
                    case 3: moveY = -1; break;
                }
            }

            const newX = enemy.x + moveX;
            const newY = enemy.y + moveY;

            if (newX >= 0 && newY >= 0 && 
                newX < this.config.width && newY < this.config.height && 
                this.state.map[newY][newX] === this.TILE.FLOOR) {

                    this.state.map[enemy.y][enemy.x] = this.TILE.FLOOR;
                    enemy.x = newX;
                    enemy.y = newY;
                    this.state.map[newY][newX] = this.TILE.ENEMY;
                }
            
            if (Math.abs(enemy.x - hero.x) <= 1 &&
                Math.abs(enemy.y - hero.y) <= 1) {
                this.state.hero.health -= enemy.attack;

                if (this.state.hero.health <= 0) {
                    this.state.gameOver = true;
                    this.state.gameWon = false;
                    this.render();
                }
            }
        });

        this.render();
    },
    
    handleCollisions: function() {
        const { x, y } = this.state.hero;
    
        const itemIndex = this.state.items.findIndex(item => item.x === x && item.y === y);
        if (itemIndex !== -1) {
            const item = this.state.items[itemIndex];
            if (item.type === 'potion') {
                this.state.hero.health = Math.min(this.state.hero.health + 20, this.state.hero.maxHealth);
            } else if (item.type === 'sword') {
                this.state.hero.attack += 1;
            }
            this.state.items.splice(itemIndex, 1);
            this.state.map[y][x] = this.TILE.HERO;
        }
    },

    random: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
};

$(document).ready(function() {
    var game = new Game();
    game.init();
});