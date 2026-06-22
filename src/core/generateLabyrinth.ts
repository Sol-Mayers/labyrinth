type LabyrinthCell = 0 | 1;
export type Labyrinth = LabyrinthCell[][];

interface Position {
  row: number;
  col: number;
}

/**
 * Итеративная генерация лабиринта методом Recursive Backtracking
 */
export default function generateLabyrinth(size: number = 21): Labyrinth {
  // 1. Инициализация: всё заполнено стенами (1)
  const labyrinth: Labyrinth = Array.from({ length: size }, () =>
    Array(size).fill(1),
  );

  const stack: [number, number][] = [];

  // Определяем вход
  const startRow = generateGate(1, size - 2);
  const startCol = 1;
  labyrinth[startRow][startCol] = 0;
  labyrinth[startRow][0] = 0; // Внешний вход

  stack.push([startRow, startCol]);

  const dirs = [
    [0, 2],
    [0, -2],
    [2, 0],
    [-2, 0],
  ];

  // 2. Генерация основного тела лабиринта
  while (stack.length > 0) {
    const [r, c] = stack[stack.length - 1];
    const neighbors: [number, number, number, number][] = [];

    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;

      if (
        nr > 0 &&
        nr < size - 1 &&
        nc > 0 &&
        nc < size - 1 &&
        labyrinth[nr][nc] === 1
      ) {
        neighbors.push([nr, nc, dr, dc]);
      }
    }

    if (neighbors.length > 0) {
      const [nr, nc, dr, dc] =
        neighbors[Math.floor(Math.random() * neighbors.length)];
      labyrinth[r + dr / 2][c + dc / 2] = 0;
      labyrinth[nr][nc] = 0;
      stack.push([nr, nc]);
    } else {
      stack.pop();
    }
  }

  // 3. Исправленный блок: Генерация выхода
  const exitRow = generateGate(1, size - 2);
  const exitCol = size - 1;
  labyrinth[exitRow][exitCol] = 0;
  let connectionCol = exitCol - 1;
  while (connectionCol >= 0 && labyrinth[exitRow][connectionCol] !== 0) {
    labyrinth[exitRow][connectionCol] = 0;
    connectionCol--;
  }

  // 4. Создание центральной комнаты 7x7 с единственным входом
  createCentralRoom(labyrinth, size);

  // 5. Проверка на слишком простой лабиринт
  if (checkStraightLabyrynth(labyrinth)) {
    return generateLabyrinth(size);
  }

  return labyrinth;
}

/**
 * Создает центральную комнату 7x7 с единственным входом
 */
function createCentralRoom(labyrinth: Labyrinth, size: number): void {
  const center = Math.floor(size / 2);
  const roomSize = 7;
  const halfRoom = Math.floor(roomSize / 2); // 3

  // Координаты центральной комнаты
  const roomTop = center - halfRoom;
  const roomBottom = center + halfRoom;
  const roomLeft = center - halfRoom;
  const roomRight = center + halfRoom;

  // 1. Создаем комнату 7x7 из нулей
  for (let r = roomTop; r <= roomBottom; r++) {
    for (let c = roomLeft; c <= roomRight; c++) {
      labyrinth[r][c] = 0;
    }
  }

  // 2. Создаем единственный вход к комнате (сверху)
  const entranceRow = roomTop - 1;
  const entranceCol = center;

  // Очищаем входную клетку
  labyrinth[entranceRow][entranceCol] = 0;

  // 3. Закрываем все остальные возможные входы стенами
  const directions = [
    [roomTop - 1, center], // верх (уже открыт)
    [center, roomRight + 1], // право
    [roomBottom + 1, center], // низ
    [center, roomLeft - 1], // лево
  ];

  for (const [r, c] of directions.slice(1)) {
    // пропускаем верх
    if (r >= 0 && r < labyrinth.length && c >= 0 && c < labyrinth[0].length) {
      labyrinth[r][c] = 1;
    }
  }
}

function checkStraightLabyrynth(arr: Labyrinth) {
  for (let i = 1; i <= arr.length - 2; i++) {
    if (arr[i].every((cell) => cell === 0)) {
      return true;
    }
  }
  return false;
}

function generateGate(start: number, end: number) {
  return Math.floor(Math.random() * (end - start + 1)) + start;
}
