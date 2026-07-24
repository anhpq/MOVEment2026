import { QrPurpose } from '@prisma/client';
import { isSupportedYoutubeUrl } from '../src/common/game/game-type';

export type CanonicalStationInput = {
  name: string;
  shortDescription: string;
  youtubeLink: string | null;
  maxScore: number;
  gameType: string | null | undefined;
};

export type CanonicalStation = {
  id: string;
  name: string;
  shortDescription: string;
  mediaUrl: string | null;
  maxScore: number;
  gameType: 'ST' | 'STANDARD';
  mapX: number;
  mapY: number;
  sortOrder: number;
};

export const CANONICAL_STATION_INPUT: CanonicalStationInput[] = [
  { name: 'Thủy Lộ Ký Ức', shortDescription: 'Dòng nước êm đềm dẫn lối ta đi, liệu điều gì đã bị lãng quên?', youtubeLink: 'https://www.youtube.com/shorts/ZEsYjNMSVXI', maxScore: 10, gameType: 'ST' },
  { name: 'Ngự Ảnh Tái Hiện', shortDescription: 'Giữa chốn hoàng cung, bóng hình năm cũ đang chờ ngày trở lại.', youtubeLink: 'https://youtu.be/USiXAUqd_Xo?si=1Xs8DQaiAjQtVumM', maxScore: 10, gameType: 'ST' },
  { name: 'Vạn Vật Ghi Tâm', shortDescription: 'Muôn vật thoáng qua trong chớp mắt, tâm trí ta lưu giữ điều gì?', youtubeLink: 'https://www.youtube.com/watch?v=05qtFxN-2bI', maxScore: 12, gameType: 'ST' },
  { name: 'Thiên Địa Chao Đảo', shortDescription: 'Khi đất trời nghiêng ngả, liệu ai còn giữ vững được mình?', youtubeLink: 'https://www.youtube.com/shorts/JAeGyyyTbhc', maxScore: 10, gameType: 'ST' },
  { name: 'Phi Thuyền Xuyên Không', shortDescription: 'Ngoài quỹ đạo quen thuộc, một chuyến du hành kỳ lạ đang chờ đợi.', youtubeLink: null, maxScore: 10, gameType: 'standard' },
  { name: 'Tâm Đầu Ý Lon', shortDescription: 'Giữa muôn sắc lạc đường, liệu sự đồng điệu có dẫn lối?', youtubeLink: null, maxScore: 20, gameType: 'standard' },
  { name: 'Vòng Quay Công Lý', shortDescription: 'Khi bánh xe cất lời, phán quyết sẽ thuộc về ai?', youtubeLink: null, maxScore: 50, gameType: 'standard' },
  { name: 'Song Tâm Dẫn Ngọc', shortDescription: 'Một viên ngọc chông chênh đang chờ những nhịp lòng dẫn lối.', youtubeLink: null, maxScore: 50, gameType: 'standard' },
  { name: 'Ba Tiêu Cuồng Phong', shortDescription: 'Khi Quạt Ba Tiêu thức giấc, mọi thứ liệu có còn nguyên vẹn?', youtubeLink: null, maxScore: 25, gameType: 'standard' },
  { name: 'Bách Thú Quy Hội', shortDescription: 'Giữa muôn thanh âm, liệu chúng ta có tìm thấy nhau?', youtubeLink: null, maxScore: 10, gameType: 'standard' },
  { name: 'Mê Trận Đồng Tâm', shortDescription: 'Giữa mê trận rối ren, liệu đồng lòng có mở được lối ra?', youtubeLink: null, maxScore: 10, gameType: 'standard' },
  { name: 'Trụ Vững Càn Khôn', shortDescription: 'Khi càn khôn chuyển động, điều gì vẫn còn đứng vững?', youtubeLink: null, maxScore: 15, gameType: 'standard' },
  { name: 'Liên Hoàn Thần Chưởng', shortDescription: 'Một nhịp lỡ làng, cả chuỗi liền đứt đoạn.', youtubeLink: null, maxScore: 15, gameType: 'standard' },
  { name: 'Hỏa Nhãn Kim Tinh', shortDescription: 'Điều khác biệt thường ẩn nơi mắt người dễ bỏ qua.', youtubeLink: null, maxScore: 10, gameType: 'standard' },
  { name: 'Tam Sao Thất Vậy', shortDescription: 'Liệu sự thật có còn nguyên vẹn như ban đầu?', youtubeLink: null, maxScore: 10, gameType: 'standard' },
  { name: 'Vạn Ly Trường Thành', shortDescription: 'Từ những điều nhỏ bé, liệu một kỳ tích có thể thành hình?', youtubeLink: null, maxScore: 10, gameType: 'standard' },
  { name: 'Nhất Nhịp Đồng Tâm', shortDescription: 'Khi mọi bước chân cùng hòa một nhịp, lối đi phía trước sẽ dần hiện ra.', youtubeLink: null, maxScore: 10, gameType: 'standard' },
];

export const CANONICAL_STATION_COUNT = 17;
export const CANONICAL_ST_COUNT = 4;
export const CANONICAL_STANDARD_COUNT = 13;
export const CANONICAL_TOTAL_MAX_SCORE = 300;
export const CANONICAL_QR_TOKEN_COUNT = CANONICAL_STATION_COUNT * 2;
export const CANONICAL_QR_PURPOSES = [QrPurpose.CHECK_IN, QrPurpose.CHECK_OUT] as const;

export function normalizeGameType(value: string | null | undefined) {
  const normalized = value?.trim().toUpperCase();
  if (!normalized || normalized === 'STANDARD') {
    return 'STANDARD' as const;
  }
  if (normalized === 'ST') {
    return 'ST' as const;
  }
  throw new Error(`Unsupported canonical Station gameType: ${value}`);
}

export const CANONICAL_STATIONS: CanonicalStation[] = CANONICAL_STATION_INPUT.map((station, index) => ({
  id: `ST${String(index + 1).padStart(3, '0')}`,
  name: station.name,
  shortDescription: station.shortDescription,
  mediaUrl: station.youtubeLink,
  maxScore: station.maxScore,
  gameType: normalizeGameType(station.gameType),
  mapX: 10 + ((index % 5) * 20),
  mapY: 10 + (Math.floor(index / 5) * 20),
  sortOrder: index + 1,
}));

export const CANONICAL_STATION_IDS = CANONICAL_STATIONS.map((station) => station.id);

export function validateCanonicalStations(allowedGameTypes: readonly string[] = ['ST', 'STANDARD']) {
  const ids = new Set<string>();
  const names = new Set<string>();
  if (CANONICAL_STATIONS.length !== CANONICAL_STATION_COUNT) {
    throw new Error(`Canonical Station count expected ${CANONICAL_STATION_COUNT}, found ${CANONICAL_STATIONS.length}`);
  }
  for (const station of CANONICAL_STATIONS) {
    if (ids.has(station.id)) {
      throw new Error(`Duplicate canonical Station ID: ${station.id}`);
    }
    if (names.has(station.name)) {
      throw new Error(`Duplicate canonical Station name: ${station.name}`);
    }
    ids.add(station.id);
    names.add(station.name);
    if (!Number.isInteger(station.maxScore) || station.maxScore < 0) {
      throw new Error(`Invalid maxScore for ${station.id}`);
    }
    if (!allowedGameTypes.includes(station.gameType)) {
      throw new Error(`Game Type ${station.gameType} for ${station.id} is not allowed by target DB`);
    }
    if (station.gameType === 'ST' && !station.mediaUrl) {
      throw new Error(`ST Station ${station.id} requires mediaUrl`);
    }
    if (station.mediaUrl) {
      new URL(station.mediaUrl);
    }
    if (station.gameType === 'ST' && !isSupportedYoutubeUrl(station.mediaUrl)) {
      throw new Error(`ST Station ${station.id} requires a supported HTTPS YouTube URL`);
    }
    if (station.mapX < 0 || station.mapX > 100 || station.mapY < 0 || station.mapY > 100) {
      throw new Error(`Placeholder coordinates out of range for ${station.id}`);
    }
  }
  const stCount = CANONICAL_STATIONS.filter((station) => station.gameType === 'ST').length;
  const standardCount = CANONICAL_STATIONS.filter((station) => station.gameType === 'STANDARD').length;
  if (stCount !== CANONICAL_ST_COUNT || standardCount !== CANONICAL_STANDARD_COUNT) {
    throw new Error('Canonical Station game type counts do not match expected constants');
  }
}

export function canonicalStationSignatureInput(stations: Array<{
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  games: Array<{ type: string; maxPoints: number; mediaUrl: string | null; isActive: boolean }>;
}>) {
  return JSON.stringify(
    stations
      .map((station) => {
        const activeGame = station.games.find((game) => game.isActive) ?? null;
        return {
          id: station.id,
          name: station.name,
          description: station.description,
          sortOrder: station.sortOrder,
          isActive: station.isActive,
          type: activeGame?.type ?? null,
          maxPoints: activeGame?.maxPoints ?? null,
          mediaUrl: activeGame?.mediaUrl ?? null,
        };
      })
      .sort((a, b) => a.id.localeCompare(b.id)),
  );
}

export function canonicalStationSignature() {
  return JSON.stringify(
    CANONICAL_STATIONS.map((station) => ({
      id: station.id,
      name: station.name,
      description: station.shortDescription,
      sortOrder: station.sortOrder,
      isActive: true,
      type: station.gameType,
      maxPoints: station.maxScore,
      mediaUrl: station.mediaUrl,
    })).sort((a, b) => a.id.localeCompare(b.id)),
  );
}
