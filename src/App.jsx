import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Sparkles, Star, Heart, Leaf, Octagon, Square, Circle, Triangle, Zap, Lightbulb, Shuffle, ArrowLeft, Lock, Play, Trophy, Volume2, VolumeX, Clock, Flame, Home, Unlock } from 'lucide-react';

// --- 1. 游戏常量与配置优化 ---

const TILE_COLORS = [
    'text-red-500', 'text-purple-500', 'text-green-500', 'text-yellow-500',
    'text-pink-500', 'text-blue-500', 'text-orange-500', 'text-teal-500',
    'text-indigo-500', 'text-lime-600', 'text-rose-500', 'text-cyan-600',
    'text-fuchsia-500', 'text-emerald-500', 'text-sky-500', 'text-amber-600'
];
const TILE_ICONS = [Heart, Star, Leaf, Octagon, Square, Circle, Triangle, Sparkles, Zap, Lightbulb, Trophy, Lock, Flame, Clock, Volume2, Shuffle];

const TILE_EMOJIS = [
    '🍎', '🍇', '🍋', '🥝', '🍓', '🍍', '🍉', '🍒',
    '🥭', '🍑', '🥥', '🍊', '🥑', '🍆', '🥕', '🌽'
];

// 增加难度策略：加入了 timeLimit (秒)
const LEVEL_CONFIGS = [
    { id: 1, rows: 6, cols: 6, types: 4, timeLimit: 60, label: "新手入门", desc: "轻松热身 (6x6)" },
    { id: 2, rows: 6, cols: 8, types: 6, timeLimit: 90, label: "初级挑战", desc: "渐入佳境 (6x8)" },
    { id: 3, rows: 8, cols: 8, types: 8, timeLimit: 120, label: "中级进阶", desc: "标准难度 (8x8)" },
    { id: 4, rows: 8, cols: 10, types: 10, timeLimit: 150, label: "高级大师", desc: "眼力考验 (8x10)" },
    { id: 5, rows: 9, cols: 12, types: 12, timeLimit: 180, label: "极限挑战", desc: "争分夺秒 (9x12)" },
    { id: 6, rows: 10, cols: 12, types: 14, timeLimit: 200, label: "神之领域", desc: "眼花缭乱 (10x12)" },
    { id: 7, rows: 10, cols: 14, types: 15, timeLimit: 220, label: "超凡入圣", desc: "密集恐惧 (10x14)" },
    { id: 8, rows: 12, cols: 14, types: 16, timeLimit: 240, label: "巅峰对决", desc: "极限烧脑 (12x14)" },
    { id: 9, rows: 12, cols: 16, types: 16, timeLimit: 260, label: "宇宙终点", desc: "万物归一 (12x16)" },
];

// --- 2. 核心算法函数 (保持稳定逻辑) ---

const isLineClear = (board, r1, c1, r2, c2) => {
    if (r1 === r2) { 
        const [start, end] = [Math.min(c1, c2), Math.max(c1, c2)];
        for (let c = start + 1; c < end; c++) if (board[r1][c] !== 0) return false;
    } else if (c1 === c2) { 
        const [start, end] = [Math.min(r1, r2), Math.max(r1, r2)];
        for (let r = start + 1; r < end; r++) if (board[r][c1] !== 0) return false;
    } else {
        return false;
    }
    return true;
};

const checkPath = (board, p1, p2) => {
    const ROWS = board.length;
    const COLS = board[0].length;
    if (board[p1.r][p1.c] === 0 || board[p1.r][p1.c] !== board[p2.r][p2.c]) return { connect: false, path: [] };
    if (isLineClear(board, p1.r, p1.c, p2.r, p2.c)) return { connect: true, path: [p1, p2] };

    // 一折
    const turnPoints1 = [{ r: p1.r, c: p2.c }, { r: p2.r, c: p1.c }];
    for (const turn of turnPoints1) {
        if (turn.r >= 0 && turn.r < ROWS && turn.c >= 0 && turn.c < COLS && board[turn.r][turn.c] === 0) {
            if (isLineClear(board, p1.r, p1.c, turn.r, turn.c) && isLineClear(board, turn.r, turn.c, p2.r, p2.c)) {
                return { connect: true, path: [p1, turn, p2] };
            }
        }
    }

    // 两折
    for (let r_ext = 0; r_ext < ROWS; r_ext++) {
        const p_ext = { r: r_ext, c: p1.c };
        if (r_ext === p1.r || board[r_ext][p1.c] !== 0) continue; 
        if (!isLineClear(board, p1.r, p1.c, p_ext.r, p_ext.c)) continue; 
        const turnPoints2 = [{ r: p_ext.r, c: p2.c }, { r: p2.r, c: p_ext.c }];
        for (const turn2 of turnPoints2) {
            if (turn2.r >= 0 && turn2.r < ROWS && turn2.c >= 0 && turn2.c < COLS && board[turn2.r][turn2.c] === 0) {
                if (isLineClear(board, p_ext.r, p_ext.c, turn2.r, turn2.c) && isLineClear(board, turn2.r, turn2.c, p2.r, p2.c)) {
                    return { connect: true, path: [p1, p_ext, turn2, p2] };
                }
            }
        }
    }
    for (let c_ext = 0; c_ext < COLS; c_ext++) {
        const p_ext = { r: p1.r, c: c_ext };
        if (c_ext === p1.c || board[p1.r][c_ext] !== 0) continue; 
        if (!isLineClear(board, p1.r, p1.c, p_ext.r, p_ext.c)) continue; 
        const turnPoints2 = [{ r: p_ext.r, c: p2.c }, { r: p2.r, c: p_ext.c }];
        for (const turn2 of turnPoints2) {
            if (turn2.r >= 0 && turn2.r < ROWS && turn2.c >= 0 && turn2.c < COLS && board[turn2.r][turn2.c] === 0) {
                if (isLineClear(board, p_ext.r, p_ext.c, turn2.r, turn2.c) && isLineClear(board, turn2.r, turn2.c, p2.r, p2.c)) {
                    return { connect: true, path: [p1, p_ext, turn2, p2] };
                }
            }
        }
    }
    return { connect: false, path: [] };
};

const initializeBoard = (rows, cols, tileTypes) => {
    const totalTiles = (rows - 2) * (cols - 2);
    let tiles = [];
    const numPairs = Math.floor(totalTiles / 2);
    for (let i = 0; i < numPairs; i++) {
        const type = (i % tileTypes) + 1;
        tiles.push(type, type);
    }
    // 填充剩余（如果 totalTiles 是奇数，虽然逻辑上连连看应该是偶数个）
    while(tiles.length < totalTiles) tiles.push(1);

    // Fisher-Yates Shuffle
    for (let i = tiles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }

    const board = Array.from({ length: rows }, () => Array(cols).fill(0));
    let tileIndex = 0;
    for (let r = 1; r < rows - 1; r++) {
        for (let c = 1; c < cols - 1; c++) {
            if (tileIndex < tiles.length) board[r][c] = tiles[tileIndex++];
        }
    }
    return board;
};

const performShuffle = (currentBoard) => {
    const ROWS = currentBoard.length;
    const COLS = currentBoard[0].length;
    let activeTypes = [];
    for (let r = 1; r < ROWS - 1; r++) {
        for (let c = 1; c < COLS - 1; c++) {
            if (currentBoard[r][c] !== 0) activeTypes.push(currentBoard[r][c]);
        }
    }
    if (activeTypes.length === 0) return currentBoard;
    for (let i = activeTypes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [activeTypes[i], activeTypes[j]] = [activeTypes[j], activeTypes[i]];
    }
    const newBoard = currentBoard.map(row => [...row]);
    let typeIndex = 0;
    for (let r = 1; r < ROWS - 1; r++) {
        for (let c = 1; c < COLS - 1; c++) {
            if (currentBoard[r][c] !== 0) newBoard[r][c] = activeTypes[typeIndex++];
        }
    }
    return newBoard;
};

const findHint = (currentBoard) => {
    const activeTiles = [];
    const ROWS = currentBoard.length;
    const COLS = currentBoard[0].length;
    for (let r = 1; r < ROWS - 1; r++) {
        for (let c = 1; c < COLS - 1; c++) {
            if (currentBoard[r][c] !== 0) activeTiles.push({ r, c, type: currentBoard[r][c] });
        }
    }
    for (let i = 0; i < activeTiles.length; i++) {
        for (let j = i + 1; j < activeTiles.length; j++) {
            const p1 = activeTiles[i];
            const p2 = activeTiles[j];
            if (p1.type === p2.type) {
                const { connect } = checkPath(currentBoard, p1, p2);
                if (connect) return [p1, p2];
            }
        }
    }
    return null;
};

// --- 3. 视觉特效组件 ---

// 爆炸粒子效果
const Explosion = ({ color }) => {
    return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50">
            {[...Array(8)].map((_, i) => (
                <div
                    key={i}
                    className={`absolute w-2 h-2 rounded-full ${color}`}
                    style={{
                        animation: `explode-${i} 0.6s ease-out forwards`,
                        '--tx': `${Math.cos(i * 45 * (Math.PI / 180)) * 60}px`,
                        '--ty': `${Math.sin(i * 45 * (Math.PI / 180)) * 60}px`,
                    }}
                />
            ))}
        </div>
    );
};

// Tile 组件：优化点击区域，增加动画
const Tile = React.memo(({ r, c, type, isSelected, isMatched, isHint, displayMode, onClick }) => {
    if (type === 0) return <div className="w-full h-full"></div>;

    let content;
    // 获取颜色，用于爆炸效果
    const colorIndex = (type - 1) % TILE_COLORS.length;
    const colorClass = TILE_COLORS[colorIndex];
    // 简单的映射 tailwind class 到 background color (近似) 用于粒子
    const bgClass = colorClass.replace('text-', 'bg-');

    if (displayMode === 'Icon') {
        const Icon = TILE_ICONS[(type - 1) % TILE_ICONS.length];
        content = Icon ? <Icon className={`w-3/5 h-3/5 md:w-2/3 md:h-2/3 ${colorClass} filter drop-shadow-md`} strokeWidth={2.5} /> : null;
    } else {
        const emoji = TILE_EMOJIS[(type - 1) % TILE_EMOJIS.length];
        content = <span className="text-2xl md:text-4xl select-none filter drop-shadow-sm">{emoji}</span>;
    }

    return (
        <div 
            className={`
                w-full h-full p-[2px] md:p-[3px] cursor-pointer relative
                transition-all duration-200
                ${isMatched ? 'animate-vanish pointer-events-none' : 'animate-pop-in'}
            `}
            onClick={() => onClick(r, c, type)}
        >
            {/* 主体方块 */}
            <div className={`
                w-full h-full flex items-center justify-center rounded-lg md:rounded-xl
                shadow-[0_4px_0_rgb(0,0,0,0.15)] active:shadow-none active:translate-y-[4px]
                border border-white/40
                transition-all duration-100 ease-out
                ${isSelected 
                    ? 'bg-yellow-100 ring-4 ring-yellow-400 scale-95 z-20' 
                    : 'bg-white/90 hover:bg-white hover:-translate-y-[2px] hover:shadow-[0_6px_0_rgb(0,0,0,0.1)]'
                }
                ${isHint ? 'ring-4 ring-cyan-400 animate-pulse z-10' : ''}
            `}>
                {content}
            </div>
            
            {/* 消除时的爆炸特效 */}
            {isMatched && <Explosion color={bgClass} />}
        </div>
    );
});

// 连线组件：优化为发光电流效果
const LineDrawer = ({ path, tileSize, rows, cols }) => {
    if (path.length < 2) return null;

    const points = path.map(p => {
        const x = (p.c + 0.5) * tileSize;
        const y = (p.r + 0.5) * tileSize;
        return `${x},${y}`;
    }).join(" ");

    return (
        <svg 
            className="absolute top-0 left-0 pointer-events-none z-30" 
            style={{ width: cols * tileSize, height: rows * tileSize }}
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#FF0080" />
                    <stop offset="100%" stopColor="#7928CA" />
                </linearGradient>
            </defs>
            <polyline 
                points={points} 
                fill="none" 
                stroke="url(#lineGradient)" 
                strokeWidth={Math.max(6, tileSize / 5)}
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glow)"
                className="animate-draw-line"
            />
        </svg>
    );
};

// --- 4. 游戏主面板 ---

const GameBoard = ({ levelConfig, onBack, onLevelComplete, playCorrect, playError, playTimeLow, displayMode, onToggleDisplayMode }) => {
    const ROWS = levelConfig.rows + 2;
    const COLS = levelConfig.cols + 2;
    
    const [board, setBoard] = useState([]);
    const [selectedTile, setSelectedTile] = useState(null);
    const [connectionPath, setConnectionPath] = useState([]);
    const [score, setScore] = useState(0);
    const [tilesLeft, setTilesLeft] = useState(null); 
    const [gameState, setGameState] = useState('init'); // init, playing, won, lost
    
    // 道具与状态
    const [hintsLeft, setHintsLeft] = useState(3);
    const [shufflesLeft, setShufflesLeft] = useState(3);
    const [hintTiles, setHintTiles] = useState([]);
    const [tileSize, setTileSize] = useState(45);
    
    // 难度策略：倒计时与连击
    const [timeLeft, setTimeLeft] = useState(levelConfig.timeLimit);
    const [combo, setCombo] = useState(0);
    const comboTimerRef = useRef(null);

    // 初始化与重置
    const resetGame = useCallback(() => {
        const newBoard = initializeBoard(ROWS, COLS, levelConfig.types);
        setBoard(newBoard);
        setSelectedTile(null);
        setConnectionPath([]);
        setScore(0);
        const total = levelConfig.rows * levelConfig.cols;
        setTilesLeft(total);
        setGameState('playing'); 
        setHintsLeft(3);
        setShufflesLeft(3);
        setHintTiles([]);
        setTimeLeft(levelConfig.timeLimit);
        setCombo(0);
    }, [ROWS, COLS, levelConfig]);

    // 响应式布局：让格子尽可能大
    useEffect(() => {
        resetGame();
        const handleResize = () => {
            // 留出顶部 Header (约100px) 和底部 Toolbar (约80px) 和 Padding
            const availableWidth = window.innerWidth - 24; 
            const availableHeight = window.innerHeight - 200; 
            
            const sizeW = Math.floor(availableWidth / COLS);
            const sizeH = Math.floor(availableHeight / ROWS);
            // 限制最大尺寸，防止在大屏上过于稀疏
            setTileSize(Math.min(80, Math.max(30, Math.min(sizeW, sizeH)))); 
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [levelConfig.id, resetGame]);

    // 倒计时逻辑
    useEffect(() => {
        if (gameState !== 'playing') return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setGameState('lost');
                    return 0;
                }
                if (prev <= 11) playTimeLow(); // 最后10秒警告音
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [gameState, playTimeLow]);

    // 自动死局检测与胜利判断
    useEffect(() => {
        if (tilesLeft !== null && tilesLeft === 0 && gameState === 'playing') {
            setTimeout(() => setGameState('won'), 500);
        } else if (tilesLeft > 0 && gameState === 'playing' && board.length > 0) {
            if (!findHint(board)) {
                const newBoard = performShuffle(board);
                setBoard(newBoard);
            }
        }
    }, [board, tilesLeft, gameState]);

    // 处理连击
    const addCombo = () => {
        setCombo(c => c + 1);
        if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
        comboTimerRef.current = setTimeout(() => setCombo(0), 2500); // 2.5秒内连续消除算Combo
    };

    const handleTileClick = useCallback((r, c, type) => {
        if (gameState !== 'playing' || type === 0) return;
        setHintTiles([]); // 清除提示

        if (!selectedTile) {
            setSelectedTile({ r, c, type });
        } else if (selectedTile.r === r && selectedTile.c === c) {
            setSelectedTile(null); // 取消选中
        } else {
            const p1 = selectedTile;
            const p2 = { r, c, type };

            if (p1.type !== p2.type) {
                setSelectedTile(p2); // 换个选
                playError();
                setCombo(0); // 断连
                return;
            }

            const { connect, path } = checkPath(board, p1, p2);

            if (connect) {
                setConnectionPath(path);
                playCorrect(combo); 
                addCombo();

                setTimeout(() => {
                    const newBoard = [...board];
                    newBoard[p1.r][p1.c] = 0;
                    newBoard[p2.r][p2.c] = 0;
                    setBoard(newBoard);
                    setSelectedTile(null);
                    setConnectionPath([]);
                    
                    const distBonus = Math.floor(path.length * 2);
                    const comboBonus = combo * 5;
                    setScore(s => s + 10 + distBonus + comboBonus);
                    
                    const timeBonus = Math.max(1, 3 - Math.floor(levelConfig.id / 3));
                    setTimeLeft(t => t + timeBonus);

                    setTilesLeft(t => t - 2);
                }, 250); 
            } else {
                setSelectedTile(p2);
                playError();
                setCombo(0);
            }
        }
    }, [selectedTile, board, gameState, combo, playCorrect, playError, levelConfig.id]);

    const handleHint = () => {
        if (gameState !== 'playing' || hintsLeft <= 0) return;
        setHintsLeft(h => h - 1);
        const pair = findHint(board);
        if (pair) {
            setHintTiles(pair);
            setScore(s => Math.max(0, s - 20));
            setTimeout(() => setHintTiles([]), 2000);
        }
    };

    const handleShuffle = () => {
        if (gameState !== 'playing' || shufflesLeft <= 0) return;
        setShufflesLeft(s => s - 1);
        let newBoard = performShuffle(board);
        let attempts = 0;
        while (!findHint(newBoard) && attempts < 10) {
            newBoard = performShuffle(newBoard);
            attempts++;
        }
        setBoard(newBoard);
        setSelectedTile(null);
        setHintTiles([]);
        setScore(s => Math.max(0, s - 30));
    };

    // 胜利/失败 弹窗
    if (gameState === 'won' || gameState === 'lost') {
        return (
             <div className="flex flex-col items-center justify-center h-full animate-fade-in p-4">
                <div className={`relative bg-white/95 backdrop-blur-xl p-8 rounded-3xl shadow-2xl text-center border-8 ${gameState === 'won' ? 'border-green-400' : 'border-red-400'} max-w-sm w-full`}>
                    {gameState === 'won' ? (
                        <Trophy className="w-24 h-24 text-yellow-500 mx-auto mb-4 animate-bounce" />
                    ) : (
                        <Clock className="w-24 h-24 text-gray-400 mx-auto mb-4 animate-pulse" />
                    )}
                    
                    <h2 className={`text-4xl font-black mb-2 ${gameState === 'won' ? 'text-green-600' : 'text-red-600'}`}>
                        {gameState === 'won' ? '关卡完成!' : '时间耗尽!'}
                    </h2>
                    <p className="text-xl text-gray-600 mb-6 font-bold">最终得分: {score}</p>
                    
                    <div className="flex flex-col gap-3">
                        {gameState === 'won' && (
                            <button onClick={() => onLevelComplete(score)} className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-lg shadow-lg transition-transform active:scale-95">
                                下一关
                            </button>
                        )}
                        <button onClick={resetGame} className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-lg shadow-lg transition-transform active:scale-95">
                            重玩本关
                        </button>
                        <button onClick={onBack} className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-bold text-lg transition-transform active:scale-95">
                            返回菜单
                        </button>
                    </div>
                </div>
             </div>
        );
    }

    return (
        <div className="flex flex-col items-center w-full h-full relative">
            {/* 顶部 HUD */}
            <div className="w-full max-w-2xl mx-auto mb-2 flex items-center justify-between px-4 py-2 bg-black/20 backdrop-blur-md rounded-full border border-white/10 shadow-lg z-40">
                <div className="flex items-center gap-2">
                    <button onClick={onBack} className="p-2 bg-white/20 hover:bg-white/40 rounded-full transition text-white">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex flex-col leading-tight">
                        <span className="text-[10px] text-green-200 font-bold tracking-wider">LEVEL</span>
                        <span className="text-lg font-black text-white">{levelConfig.id}</span>
                    </div>
                </div>

                <div className="flex-1 mx-4 h-2 bg-black/30 rounded-full overflow-hidden relative">
                    <div 
                        className={`h-full transition-all duration-1000 linear ${timeLeft < 10 ? 'bg-red-500 animate-pulse' : 'bg-green-400'}`}
                        style={{ width: `${(timeLeft / levelConfig.timeLimit) * 100}%` }}
                    />
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-center">
                        <div className="text-[10px] text-yellow-200 font-bold">SCORE</div>
                        <div className="text-xl font-black text-white tabular-nums">{score}</div>
                    </div>
                    <button onClick={onToggleDisplayMode} className="text-2xl hover:scale-110 transition" title="切换显示">
                        {displayMode === 'Icon' ? '🦁' : '💠'}
                    </button>
                </div>
            </div>

            {/* 连击提示 */}
            {combo > 1 && (
                <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-bounce-in">
                    <div className="text-3xl font-black text-yellow-400 drop-shadow-[0_4px_0_rgba(0,0,0,0.3)] rotate-[-5deg]">
                        COMBO x{combo}!
                    </div>
                </div>
            )}

            {/* 游戏盘面 */}
            <div className="flex-1 flex items-center justify-center w-full overflow-hidden px-2">
                <div 
                    className="relative bg-white/10 backdrop-blur-sm rounded-xl shadow-2xl border border-white/20"
                    style={{ 
                        width: COLS * tileSize, 
                        height: ROWS * tileSize,
                        padding: '4px'
                    }}
                >
                    <div className="grid w-full h-full" style={{
                        gridTemplateColumns: `repeat(${COLS}, 1fr)`,
                        gridTemplateRows: `repeat(${ROWS}, 1fr)`,
                    }}>
                        {board.map((row, r) => 
                            row.map((type, c) => (
                                <div key={`${r}-${c}`} className="w-full h-full flex items-center justify-center">
                                    {r > 0 && r < ROWS - 1 && c > 0 && c < COLS - 1 ? (
                                        <Tile 
                                            r={r} c={c} type={type} 
                                            isSelected={selectedTile?.r === r && selectedTile?.c === c}
                                            isMatched={type === 0} 
                                            isHint={hintTiles.some(p => p.r === r && p.c === c)}
                                            displayMode={displayMode}
                                            onClick={handleTileClick} 
                                        />
                                    ) : null}
                                </div>
                            ))
                        )}
                    </div>
                    <LineDrawer path={connectionPath} tileSize={tileSize} rows={ROWS} cols={COLS} />
                </div>
            </div>

            {/* 底部道具栏 */}

            <div className="mt-6 flex gap-6">
                <button 
                    onClick={handleHint} 
                    disabled={hintsLeft <= 0} 
                    className="flex flex-col items-center gap-1 group bg-transparent border-none p-0 focus:outline-none"
                >
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all border-2 bg-transparent ${
                        hintsLeft > 0 
                        ? 'border-white text-white group-hover:bg-white/20 group-hover:scale-110' 
                        : 'border-white/30 text-white/30 cursor-not-allowed'
                    }`}>
                        <Lightbulb className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-bold text-white drop-shadow-md">{hintsLeft}</span>
                </button>
                
                <button 
                    onClick={handleShuffle} 
                    disabled={shufflesLeft <= 0} 
                    className="flex flex-col items-center gap-1 group bg-transparent border-none p-0 focus:outline-none"
                >
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all border-2 bg-transparent ${
                        shufflesLeft > 0 
                        ? 'border-white text-white group-hover:bg-white/20 group-hover:scale-110' 
                        : 'border-white/30 text-white/30 cursor-not-allowed'
                    }`}>
                        <Shuffle className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-bold text-white drop-shadow-md">{shufflesLeft}</span>
                </button>
            </div>

            {/* 带图标的提示和洗牌按钮 <div className="w-full max-w-md mx-auto my-2 flex justify-center gap-8 pb-safe">
                <ToolButton icon={Lightbulb} count={hintsLeft} onClick={handleHint} bg="bg-blue-500" label="提示" />
                <ToolButton icon={Shuffle} count={shufflesLeft} onClick={handleShuffle} bg="bg-purple-500" label="洗牌" />
            </div> */}
        </div>
    );
};

const ToolButton = ({ icon: Icon, count, onClick, bg, label }) => (
    <button 
        onClick={onClick} 
        disabled={count <= 0}
        className={`
            relative group flex flex-col items-center gap-1 transition-all
            ${count > 0 ? 'hover:scale-110 active:scale-95' : 'opacity-50 grayscale cursor-not-allowed'}
        `}
    >
        <div className={`w-14 h-14 rounded-2xl ${bg} flex items-center justify-center shadow-lg border-b-4 border-black/20`}>
            <Icon className="w-7 h-7 text-white" strokeWidth={2.5} />
        </div>
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full text-white text-xs font-bold flex items-center justify-center border-2 border-white">
            {count}
        </div>
        <span className="text-xs font-bold text-white drop-shadow-md">{label}</span>
    </button>
);

// --- 5. 关卡菜单 (添加开发者解锁) ---

const LevelMenu = ({ unlockedLevel, onSelectLevel }) => {
    const [isDevUnlock, setIsDevUnlock] = useState(false);

    return (
        <div className="w-full max-w-5xl px-4 z-10 flex flex-col h-[90vh]">
             <div className="text-center mb-4 mt-4">
                <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-green-200 drop-shadow-sm"
                    style={{ filter: 'drop-shadow(0 4px 0 #14532d)' }}>
                    LINK LINK
                </h1>
                <div className="inline-block bg-black/20 backdrop-blur px-4 py-1 rounded-full mt-2">
                    <p className="text-green-100 text-sm font-bold tracking-[0.2em]">大师挑战赛</p>
                </div>
            </div>

            {/* 开发者解锁开关 */}
            <div className="flex justify-center mb-4">
                <button 
                    onClick={() => setIsDevUnlock(!isDevUnlock)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${isDevUnlock ? 'bg-yellow-400 text-black' : 'bg-black/30 text-white/50'}`}
                >
                    <Unlock size={14} />
                    {isDevUnlock ? '开发者模式：已解锁所有' : '开发者模式：点击解锁'}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pb-8 px-2 custom-scrollbar">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {LEVEL_CONFIGS.map((level) => {
                        const isLocked = !isDevUnlock && level.id > unlockedLevel;
                        const isCurrent = level.id === unlockedLevel;
                        return (
                            <button
                                key={level.id}
                                onClick={() => !isLocked && onSelectLevel(level)}
                                disabled={isLocked}
                                className={`
                                    relative overflow-hidden rounded-2xl p-4 transition-all duration-200 group text-left
                                    flex flex-col justify-between min-h-[140px]
                                    ${isLocked 
                                        ? 'bg-gray-800/30 border-2 border-gray-600/30 cursor-not-allowed opacity-60' 
                                        : 'bg-white border-b-8 border-green-600 hover:-translate-y-1 hover:shadow-xl active:border-b-0 active:translate-y-1'
                                    }
                                    ${isCurrent && !isDevUnlock ? 'ring-4 ring-yellow-400 animate-pulse-slow' : ''}
                                `}
                            >
                                <div className="flex justify-between items-start">
                                    <div className={`
                                        w-10 h-10 rounded-full flex items-center justify-center font-black text-xl
                                        ${isLocked ? 'bg-gray-700 text-gray-500' : 'bg-green-100 text-green-700'}
                                    `}>
                                        {level.id}
                                    </div>
                                    {isLocked ? <Lock className="w-5 h-5 text-gray-500" /> : <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />}
                                </div>
                                
                                <div className="mt-4">
                                    <h3 className={`font-bold text-lg leading-none mb-1 ${isLocked ? 'text-gray-400' : 'text-gray-800'}`}>
                                        {level.label}
                                    </h3>
                                    <p className="text-xs text-gray-500 font-medium">{level.desc}</p>
                                </div>
                                
                                {!isLocked && (
                                    <div className="absolute bottom-0 right-0 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Play className="w-24 h-24 text-green-900 -rotate-12 translate-x-4 translate-y-4" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// --- 6. 音效管理 (Tone.js) ---

const useGameSounds = (isMuted) => {
    const [Tone, setTone] = useState(null);
    const [synth, setSynth] = useState(null);
    const [hasInteracted, setHasInteracted] = useState(false);

    useEffect(() => {
        if (typeof window.Tone !== 'undefined') { setTone(window.Tone); return; }
        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.js";
        script.onload = () => { if (window.Tone) setTone(window.Tone); };
        document.head.appendChild(script);
        return () => document.head.removeChild(script);
    }, []);

    const initAudio = useCallback(async () => {
        if (!Tone || hasInteracted) return;
        await Tone.start();
        const polySynth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "triangle" },
            envelope: { attack: 0.02, decay: 0.1, sustain: 0.1, release: 1 }
        }).toDestination();
        polySynth.volume.value = -8;
        setSynth(polySynth);
        setHasInteracted(true);
    }, [Tone, hasInteracted]);

    const playCorrect = useCallback((combo) => {
        if (!synth || isMuted) return;
        const notes = ["C5", "E5", "G5", "C6", "E6", "G6"];
        const note = notes[Math.min(combo, notes.length - 1)];
        synth.triggerAttackRelease(note, "8n");
    }, [synth, isMuted]);

    const playError = useCallback(() => {
        if (!synth || isMuted) return;
        synth.triggerAttackRelease("A2", "16n");
    }, [synth, isMuted]);

    const playTimeLow = useCallback(() => {
        if (!synth || isMuted) return;
        synth.triggerAttackRelease("F4", "32n");
    }, [synth, isMuted]);

    useEffect(() => {
        const handleClick = () => initAudio();
        window.addEventListener('click', handleClick, { once: true });
        return () => window.removeEventListener('click', handleClick);
    }, [initAudio]);

    return { playCorrect, playError, playTimeLow, hasInteracted };
};

// --- 7. 主入口 ---

const App = () => {
    const [currentScreen, setCurrentScreen] = useState('menu'); 
    const [activeLevelConfig, setActiveLevelConfig] = useState(null);
    const [unlockedLevel, setUnlockedLevel] = useState(1);
    const [isMuted, setIsMuted] = useState(false); 
    const [displayMode, setDisplayMode] = useState('Icon');

    const { playCorrect, playError, playTimeLow, hasInteracted } = useGameSounds(isMuted);

    const handleSelectLevel = (levelConfig) => {
        setActiveLevelConfig(levelConfig);
        setCurrentScreen('game');
    };

    const handleBackToMenu = () => {
        setCurrentScreen('menu');
        setActiveLevelConfig(null);
    };

    const handleLevelComplete = (score) => {
        if (activeLevelConfig.id === unlockedLevel) {
            setUnlockedLevel(prev => Math.min(prev + 1, LEVEL_CONFIGS.length));
        }
        if (activeLevelConfig.id < LEVEL_CONFIGS.length) {
            const nextLevel = LEVEL_CONFIGS.find(l => l.id === activeLevelConfig.id + 1);
            setActiveLevelConfig(nextLevel);
        } else {
            setCurrentScreen('menu');
        }
    };
    
    return (
        <div className="w-full h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#1a2e1a]">
            {/* 返回首页按钮 (左上角) */}
            <a href="game_nav.html" className="absolute top-4 left-4 z-50 p-3 bg-white/20 backdrop-blur rounded-full text-white hover:bg-white/40 transition flex items-center justify-center shadow-lg border border-white/10">
                <Home size={20} />
            </a>

            {/* 背景动画 */}
            <div className="absolute inset-0 pointer-events-none opacity-30">
                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle,_#4ade80_0%,_transparent_60%)] animate-spin-slow" style={{ animationDuration: '60s' }}></div>
            </div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

            {/* 音量控制 */}
            <button
                onClick={() => setIsMuted(!isMuted)}
                className="absolute top-4 right-4 p-3 bg-black/40 backdrop-blur rounded-full text-white hover:bg-black/60 z-50 transition"
            >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>

            <style>{`
                @keyframes pop-in { 0% { transform: scale(0); } 80% { transform: scale(1.1); } 100% { transform: scale(1); } }
                .animate-pop-in { animation: pop-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
                
                @keyframes vanish { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(1.5); opacity: 0; } }
                .animate-vanish { animation: vanish 0.3s ease-out forwards; }
                
                @keyframes draw-line { 0% { stroke-dasharray: 1000; stroke-dashoffset: 1000; } 100% { stroke-dashoffset: 0; } }
                .animate-draw-line { animation: draw-line 0.4s ease-out forwards; stroke-dasharray: 1000; }
                
                @keyframes explode-0 { to { transform: translate(var(--tx), var(--ty)); opacity: 0; } }
                @keyframes explode-1 { to { transform: translate(var(--tx), var(--ty)); opacity: 0; } }
                
                @keyframes pulse-slow { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.02); } }
                .animate-pulse-slow { animation: pulse-slow 2s infinite; }

                @keyframes bounce-in { 0% { transform: translate(-50%, -50%) scale(0); } 60% { transform: translate(-50%, -50%) scale(1.2); } 100% { transform: translate(-50%, -50%) scale(1); } }
                .animate-bounce-in { animation: bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }

                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { bg: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
            `}</style>

            {currentScreen === 'menu' ? (
                <LevelMenu unlockedLevel={unlockedLevel} onSelectLevel={handleSelectLevel} />
            ) : (
                <GameBoard 
                    key={activeLevelConfig.id} 
                    levelConfig={activeLevelConfig} 
                    onBack={handleBackToMenu} 
                    onLevelComplete={handleLevelComplete} 
                    playCorrect={playCorrect} 
                    playError={playError}     
                    playTimeLow={playTimeLow}
                    displayMode={displayMode}
                    onToggleDisplayMode={() => setDisplayMode(m => m === 'Icon' ? 'Emoji' : 'Icon')}
                />
            )}
        </div>
    );
};

export default App;