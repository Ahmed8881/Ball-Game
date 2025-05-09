  let score = 0;
        let lives = 3;
        let level = 1;
        let gameRunning = false;
        let gamePaused = false;
        let basketPosition = 160;
        let ballInterval;
        let ballSpeed = 2;
        let ballFrequency = 1500;
        let specialBallChance = 0.2;
        let badBallChance = 0.1;
        let activeBalls = [];
        let lastTime = 0;
        let animationFrameId;
        
        // DOM elements
        const gameContainer = document.getElementById('game-container');
        const basket = document.getElementById('basket');
        const scoreDisplay = document.getElementById('score');
        const livesDisplay = document.getElementById('lives');
        const levelDisplay = document.getElementById('level-indicator');
        const startButton = document.getElementById('start-button');
        const pauseButton = document.getElementById('pause-button');
        const gameOverScreen = document.getElementById('game-over');
        const finalScoreDisplay = document.getElementById('final-score');
        const restartButton = document.getElementById('restart-button');
        
        // Set basket initial position
        basket.style.left = basketPosition + 'px';
        
        // Event listeners
        startButton.addEventListener('click', startGame);
        pauseButton.addEventListener('click', togglePause);
        restartButton.addEventListener('click', restartGame);
        
        // Mouse movement for basket
        gameContainer.addEventListener('mousemove', (e) => {
            if (gameRunning && !gamePaused) {
                const containerRect = gameContainer.getBoundingClientRect();
                const mouseX = e.clientX - containerRect.left;
                
                // Ensure basket stays within the game container
                basketPosition = Math.max(0, Math.min(gameContainer.clientWidth - basket.clientWidth, mouseX - basket.clientWidth / 2));
                basket.style.left = basketPosition + 'px';
            }
        });
        
        // Touch movement for mobile
        gameContainer.addEventListener('touchmove', (e) => {
            if (gameRunning && !gamePaused) {
                e.preventDefault();
                const containerRect = gameContainer.getBoundingClientRect();
                const touchX = e.touches[0].clientX - containerRect.left;
                
                basketPosition = Math.max(0, Math.min(gameContainer.clientWidth - basket.clientWidth, touchX - basket.clientWidth / 2));
                basket.style.left = basketPosition + 'px';
            }
        });
        
        // Handle window focus/blur
        window.addEventListener('blur', () => {
            if (gameRunning && !gamePaused) {
                togglePause();
            }
        });
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (gameRunning && !gamePaused) {
                const step = 20;
                
                if (e.key === 'ArrowLeft') {
                    basketPosition = Math.max(0, basketPosition - step);
                    basket.style.left = basketPosition + 'px';
                } else if (e.key === 'ArrowRight') {
                    basketPosition = Math.min(gameContainer.clientWidth - basket.clientWidth, basketPosition + step);
                    basket.style.left = basketPosition + 'px';
                } else if (e.key === ' ' || e.key === 'p') {
                    togglePause();
                }
            }
        });
        
        // Game functions
        function startGame() {
            gameRunning = true;
            gamePaused = false;
            startButton.disabled = true;
            pauseButton.disabled = false;
            pauseButton.textContent = 'Pause';
            gameOverScreen.style.display = 'none';
            
            createBall();
            ballInterval = setInterval(createBall, ballFrequency);
            
            // Start game loop
            lastTime = performance.now();
            animationFrameId = requestAnimationFrame(gameLoop);
        }
        
        function togglePause() {
            if (gameRunning) {
                gamePaused = !gamePaused;
                
                if (gamePaused) {
                    pauseButton.textContent = 'Resume';
                    clearInterval(ballInterval);
                    cancelAnimationFrame(animationFrameId);
                } else {
                    pauseButton.textContent = 'Pause';
                    ballInterval = setInterval(createBall, ballFrequency);
                    lastTime = performance.now();
                    animationFrameId = requestAnimationFrame(gameLoop);
                }
            }
        }
        
        function gameLoop(timestamp) {
            if (!gameRunning || gamePaused) return;
            
            const deltaTime = timestamp - lastTime;
            lastTime = timestamp;
            
            // Move balls
            moveBalls(deltaTime);
            
            // Check for collisions
            checkCollisions();
            
            // Remove out-of-bounds balls
            removeOutOfBoundsBalls();
            
            // Continue the loop
            animationFrameId = requestAnimationFrame(gameLoop);
        }
        
        function createBall() {
            if (!gameRunning || gamePaused) return;
            
            const ball = document.createElement('div');
            const randomX = Math.random() * (gameContainer.clientWidth - 30);
            const randomType = Math.random();
            
            ball.className = 'ball';
            
            // Determine ball type
            let type = 'normal';
            let points = 1;
            
            if (randomType < specialBallChance) {
                ball.classList.add('special-ball');
                type = 'special';
                points = 5;
            } else if (randomType < specialBallChance + badBallChance) {
                ball.classList.add('bad-ball');
                type = 'bad';
                points = -2;
            }
            
            ball.style.left = randomX + 'px';
            ball.style.top = '0px';
            gameContainer.appendChild(ball);
            
            activeBalls.push({
                element: ball,
                x: randomX,
                y: 0,
                type: type,
                points: points
            });
        }
        
        function moveBalls(deltaTime) {
            const speedFactor = ballSpeed * (deltaTime / 16);
            
            activeBalls.forEach(ball => {
                ball.y += speedFactor;
                ball.element.style.top = ball.y + 'px';
            });
        }
        
        function checkCollisions() {
            const basketRect = basket.getBoundingClientRect();
            
            for (let i = activeBalls.length - 1; i >= 0; i--) {
                const ball = activeBalls[i];
                const ballRect = ball.element.getBoundingClientRect();
                
                // Check if ball is caught by basket
                if (ballRect.bottom >= basketRect.top && 
                    ballRect.top <= basketRect.bottom &&
                    ballRect.right >= basketRect.left &&
                    ballRect.left <= basketRect.right &&
                    ballRect.top <= basketRect.top) {
                    
                    // Handle ball catch
                    if (ball.type === 'bad') {
                        lives--;
                        livesDisplay.textContent = lives;
                        createParticles(ball.x + 15, ball.y, '#cc0000');
                    } else {
                        score += ball.points;
                        scoreDisplay.textContent = score;
                        createParticles(ball.x + 15, ball.y, ball.type === 'special' ? '#ffd700' : '#ff4500');
                    }
                    
                    // Remove the caught ball
                    gameContainer.removeChild(ball.element);
                    activeBalls.splice(i, 1);
                    
                    // Check level up
                    checkLevelUp();
                    
                    // Check game over
                    if (lives <= 0) {
                        endGame();
                    }
                }
            }
        }
        
        function removeOutOfBoundsBalls() {
            for (let i = activeBalls.length - 1; i >= 0; i--) {
                const ball = activeBalls[i];
                
                if (ball.y > gameContainer.clientHeight) {
                    // Missed ball
                    if (ball.type !== 'bad') {
                        lives--;
                        livesDisplay.textContent = lives;
                        
                        // Check game over
                        if (lives <= 0) {
                            endGame();
                        }
                    }
                    
                    // Remove the missed ball
                    gameContainer.removeChild(ball.element);
                    activeBalls.splice(i, 1);
                }
            }
        }
        
        function checkLevelUp() {
            const levelThreshold = level * 50;
            
            if (score >= levelThreshold) {
                level++;
                levelDisplay.textContent = 'Level: ' + level;
                
                // Increase difficulty
                ballSpeed += 0.5;
                ballFrequency = Math.max(500, ballFrequency - 100);
                specialBallChance = Math.min(0.4, specialBallChance + 0.05);
                badBallChance = Math.min(0.3, badBallChance + 0.05);
                
                // Clear current interval and set new one
                clearInterval(ballInterval);
                ballInterval = setInterval(createBall, ballFrequency);
            }
        }
        
        function endGame() {
            gameRunning = false;
            clearInterval(ballInterval);
            cancelAnimationFrame(animationFrameId);
            
            // Display game over screen
            finalScoreDisplay.textContent = score;
            gameOverScreen.style.display = 'flex';
            
            // Reset buttons
            startButton.disabled = false;
            pauseButton.disabled = true;
        }
        
        function restartGame() {
            // Reset game variables
            score = 0;
            lives = 3;
            level = 1;
            ballSpeed = 2;
            ballFrequency = 1500;
            specialBallChance = 0.2;
            badBallChance = 0.1;
            
            // Update displays
            scoreDisplay.textContent = score;
            livesDisplay.textContent = lives;
            levelDisplay.textContent = 'Level: ' + level;
            
            // Clear existing balls
            activeBalls.forEach(ball => {
                gameContainer.removeChild(ball.element);
            });
            activeBalls = [];
            
            // Remove particles
            document.querySelectorAll('.particle').forEach(p => p.remove());
            
            // Start new game
            startGame();
        }
        
        function createParticles(x, y, color) {
            for (let i = 0; i < 8; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.backgroundColor = color;
                particle.style.left = x + 'px';
                particle.style.top = y + 'px';
                
                const angle = Math.random() * Math.PI * 2;
                const speed = 1 + Math.random() * 3;
                const vx = Math.cos(angle) * speed;
                const vy = Math.sin(angle) * speed;
                
                gameContainer.appendChild(particle);
                
                let posX = x;
                let posY = y;
                let opacity = 1;
                let lifeTime = 0;
                
                function animateParticle() {
                    lifeTime += 16;
                    posX += vx;
                    posY += vy;
                    opacity -= 0.02;
                    
                    particle.style.left = posX + 'px';
                    particle.style.top = posY + 'px';
                    particle.style.opacity = opacity;
                    
                    if (opacity > 0 && lifeTime < 500) {
                        requestAnimationFrame(animateParticle);
                    } else {
                        gameContainer.removeChild(particle);
                    }
                }
                
                requestAnimationFrame(animateParticle);
            }
        }