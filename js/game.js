// 贪吃蛇游戏核心逻辑

class SnakeGame {
  constructor() {
    this.canvas = document.getElementById('game-board');
    this.ctx = this.canvas.getContext('2d');
    this.scoreEl = document.getElementById('score');
    this.highScoreEl = document.getElementById('high-score');
    this.finalScoreEl = document.getElementById('final-score');
    this.startScreen = document.getElementById('start-screen');
    this.gameOverScreen = document.getElementById('game-over-screen');
    this.startBtn = document.getElementById('start-btn');
    this.restartBtn = document.getElementById('restart-btn');
    
    // 游戏配置
    this.gridSize = 20;
    this.tileCount = 20;
    this.speed = 7; // 每秒移动次数
    
    // 初始化
    this.init();
    this.setupCanvas();
    this.setupControls();
    this.loadHighScore();
    this.gameLoop = this.gameLoop.bind(this);
  }
  
  init() {
    this.snake = {
      body: [{x: 10, y: 10}, {x: 10, y: 11}, {x: 10, y: 12}],
      direction: {x: 0, y: -1}, // 向上
      nextDirection: {x: 0, y: -1}
    };
    this.food = this.spawnFood();
    this.score = 0;
    this.gameOver = false;
    this.paused = false;
    this.lastRenderTime = 0;
  }
  
  setupCanvas() {
    const size = Math.min(window.innerWidth - 40, 400);
    this.canvas.width = this.gridSize * this.tileCount;
    this.canvas.height = this.gridSize * this.tileCount;
    this.canvas.style.width = size + 'px';
    this.canvas.style.height = size + 'px';
  }
  
  setupControls() {
    // 键盘控制
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (this.gameOver) {
          this.restart();
        } else if (!this.started) {
          this.start();
        }
        return;
      }
      
      const keyMap = {
        'ArrowUp': {x: 0, y: -1},
        'ArrowDown': {x: 0, y: 1},
        'ArrowLeft': {x: -1, y: 0},
        'ArrowRight': {x: 1, y: 0},
        'KeyW': {x: 0, y: -1},
        'KeyS': {x: 0, y: 1},
        'KeyA': {x: -1, y: 0},
        'KeyD': {x: 1, y: 0}
      };
      
      const newDir = keyMap[e.code];
      if (newDir) {
        e.preventDefault();
        this.changeDirection(newDir);
      }
    });
    
    // 按钮控制
    this.startBtn.addEventListener('click', () => this.start());
    this.restartBtn.addEventListener('click', () => this.restart());
    
    // 移动端触摸控制
    this.setupTouchControls();
    
    // 窗口大小变化
    window.addEventListener('resize', () => this.setupCanvas());
  }
  
  setupTouchControls() {
    let touchStartX = 0;
    let touchStartY = 0;
    
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, {passive: false});
    
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
    }, {passive: false});
    
    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      
      const dx = touchEndX - touchStartX;
      const dy = touchEndY - touchStartY;
      
      if (Math.abs(dx) > Math.abs(dy)) {
        // 水平滑动
        if (dx > 0) {
          this.changeDirection({x: 1, y: 0});
        } else {
          this.changeDirection({x: -1, y: 0});
        }
      } else {
        // 垂直滑动
        if (dy > 0) {
          this.changeDirection({x: 0, y: 1});
        } else {
          this.changeDirection({x: 0, y: -1});
        }
      }
    });
    
    // 虚拟按钮控制
    document.querySelectorAll('.control-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const dirMap = {
          'up': {x: 0, y: -1},
          'down': {x: 0, y: 1},
          'left': {x: -1, y: 0},
          'right': {x: 1, y: 0}
        };
        const dir = dirMap[btn.dataset.dir];
        if (dir) this.changeDirection(dir);
      });
    });
  }
  
  changeDirection(newDir) {
    // 禁止 180 度掉头
    if (newDir.x === -this.snake.direction.x && newDir.y === -this.snake.direction.y) {
      return;
    }
    this.snake.nextDirection = newDir;
  }
  
  start() {
    this.started = true;
    this.startScreen.style.display = 'none';
    this.init();
    requestAnimationFrame(this.gameLoop);
  }
  
  restart() {
    this.gameOverScreen.style.display = 'none';
    this.init();
    requestAnimationFrame(this.gameLoop);
  }
  
  spawnFood() {
    let food;
    do {
      food = {
        x: Math.floor(Math.random() * this.tileCount),
        y: Math.floor(Math.random() * this.tileCount)
      };
    } while (this.snake.body.some(segment => segment.x === food.x && segment.y === food.y));
    return food;
  }
  
  update() {
    if (this.gameOver || this.paused) return;
    
    // 更新方向
    this.snake.direction = this.snake.nextDirection;
    
    // 移动蛇头
    const head = {
      x: this.snake.body[0].x + this.snake.direction.x,
      y: this.snake.body[0].y + this.snake.direction.y
    };
    
    // 检测碰撞
    if (this.checkCollision(head)) {
      this.endGame();
      return;
    }
    
    // 添加新头
    this.snake.body.unshift(head);
    
    // 检测是否吃到食物
    if (head.x === this.food.x && head.y === this.food.y) {
      this.score += 10;
      this.scoreEl.textContent = this.score;
      this.food = this.spawnFood();
      // 加速
      if (this.score % 50 === 0) {
        this.speed += 1;
      }
    } else {
      // 移除尾巴
      this.snake.body.pop();
    }
  }
  
  checkCollision(head) {
    // 撞墙
    if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
      return true;
    }
    // 撞自己
    return this.snake.body.some(segment => segment.x === head.x && segment.y === head.y);
  }
  
  draw() {
    // 清空画布
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 绘制食物
    this.ctx.fillStyle = '#ff4757';
    this.ctx.beginPath();
    this.ctx.arc(
      this.food.x * this.gridSize + this.gridSize / 2,
      this.food.y * this.gridSize + this.gridSize / 2,
      this.gridSize / 2 - 2,
      0,
      Math.PI * 2
    );
    this.ctx.fill();
    
    // 绘制蛇
    this.snake.body.forEach((segment, index) => {
      const gradient = this.ctx.createRadialGradient(
        segment.x * this.gridSize + this.gridSize / 2,
        segment.y * this.gridSize + this.gridSize / 2,
        0,
        segment.x * this.gridSize + this.gridSize / 2,
        segment.y * this.gridSize + this.gridSize / 2,
        this.gridSize / 2
      );
      
      if (index === 0) {
        // 蛇头
        gradient.addColorStop(0, '#2ed573');
        gradient.addColorStop(1, '#26af61');
      } else {
        // 蛇身
        gradient.addColorStop(0, '#7bed9f');
        gradient.addColorStop(1, '#2ed573');
      }
      
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(
        segment.x * this.gridSize + 1,
        segment.y * this.gridSize + 1,
        this.gridSize - 2,
        this.gridSize - 2
      );
      
      // 绘制蛇眼睛
      if (index === 0) {
        this.ctx.fillStyle = 'white';
        const eyeSize = 4;
        const eyeOffset = 5;
        
        if (this.snake.direction.y === -1) { // 向上
          this.ctx.beginPath();
          this.ctx.arc(segment.x * this.gridSize + eyeOffset, segment.y * this.gridSize + eyeOffset, eyeSize / 2, 0, Math.PI * 2);
          this.ctx.arc(segment.x * this.gridSize + this.gridSize - eyeOffset, segment.y * this.gridSize + eyeOffset, eyeSize / 2, 0, Math.PI * 2);
          this.ctx.fill();
        } else if (this.snake.direction.y === 1) { // 向下
          this.ctx.beginPath();
          this.ctx.arc(segment.x * this.gridSize + eyeOffset, segment.y * this.gridSize + this.gridSize - eyeOffset, eyeSize / 2, 0, Math.PI * 2);
          this.ctx.arc(segment.x * this.gridSize + this.gridSize - eyeOffset, segment.y * this.gridSize + this.gridSize - eyeOffset, eyeSize / 2, 0, Math.PI * 2);
          this.ctx.fill();
        } else if (this.snake.direction.x === -1) { // 向左
          this.ctx.beginPath();
          this.ctx.arc(segment.x * this.gridSize + eyeOffset, segment.y * this.gridSize + eyeOffset, eyeSize / 2, 0, Math.PI * 2);
          this.ctx.arc(segment.x * this.gridSize + eyeOffset, segment.y * this.gridSize + this.gridSize - eyeOffset, eyeSize / 2, 0, Math.PI * 2);
          this.ctx.fill();
        } else { // 向右
          this.ctx.beginPath();
          this.ctx.arc(segment.x * this.gridSize + this.gridSize - eyeOffset, segment.y * this.gridSize + eyeOffset, eyeSize / 2, 0, Math.PI * 2);
          this.ctx.arc(segment.x * this.gridSize + this.gridSize - eyeOffset, segment.y * this.gridSize + this.gridSize - eyeOffset, eyeSize / 2, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }
    });
  }
  
  gameLoop(currentTime) {
    if (this.gameOver) return;
    
    window.requestAnimationFrame(this.gameLoop);
    
    const secondsSinceLastRender = (currentTime - this.lastRenderTime) / 1000;
    if (secondsSinceLastRender < 1 / this.speed) return;
    
    this.lastRenderTime = currentTime;
    
    this.update();
    this.draw();
  }
  
  endGame() {
    this.gameOver = true;
    this.finalScoreEl.textContent = this.score;
    this.gameOverScreen.style.display = 'block';
    this.saveHighScore();
  }
  
  loadHighScore() {
    const highScore = localStorage.getItem('snakeHighScore') || 0;
    this.highScoreEl.textContent = highScore;
  }
  
  saveHighScore() {
    const currentHighScore = parseInt(localStorage.getItem('snakeHighScore') || 0);
    if (this.score > currentHighScore) {
      localStorage.setItem('snakeHighScore', this.score);
      this.highScoreEl.textContent = this.score;
    }
  }
}

// 启动游戏
window.addEventListener('DOMContentLoaded', () => {
  new SnakeGame();
});
