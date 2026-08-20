import { QrPurpose } from '@prisma/client';
import { isSupportedYoutubeUrl } from '../src/common/game/game-type';

export type CanonicalStationInput = {
  name: string;
  nameEn: string;
  shortDescription: string;
  shortDescriptionEn: string;
  youtubeLink: string | null;
  maxScore: number | null;
  mapX: number;
  mapY: number;
  gameType: string | null | undefined;
};

export type CanonicalStation = {
  id: string;
  name: string;
  nameEn: string;
  shortDescription: string;
  shortDescriptionEn: string;
  mediaUrl: string | null;
  maxScore: number | null;
  gameType: 'ST' | 'STANDARD';
  mapX: number;
  mapY: number;
  sortOrder: number;
};

export const CANONICAL_STATION_INPUT: CanonicalStationInput[] = [
  { name: 'Thủy Lộ Ký Ức', nameEn: 'Memory Waterway', shortDescription: 'Dòng nước êm đềm dẫn lối ta đi, liệu điều gì đã bị lãng quên?', shortDescriptionEn: 'A gentle stream guides our way, what has been forgotten?', youtubeLink: 'https://www.youtube.com/shorts/ZEsYjNMSVXI', maxScore: 20, mapX: 46.22961734, mapY: 87.55421871, gameType: 'ST' },
  { name: 'Ngự Ảnh Tái Hiện', nameEn: 'Imperial Reflection', shortDescription: 'Giữa chốn hoàng cung, bóng hình năm cũ đang chờ ngày trở lại.', shortDescriptionEn: 'Amidst the royal palace, figures from the past await their return.', youtubeLink: 'https://youtu.be/USiXAUqd_Xo?si=1Xs8DQaiAjQtVumM', maxScore: 20, mapX: 14.67705457, mapY: 67.46147259, gameType: 'ST' },
  { name: 'Vạn Vật Ghi Tâm', nameEn: 'Mindful Relics', shortDescription: 'Muôn vật thoáng qua trong chớp mắt, tâm trí ta lưu giữ điều gì ?', shortDescriptionEn: 'All things pass in the blink of an eye, what does our mind retain?', youtubeLink: 'https://www.youtube.com/watch?v=05qtFxN-2bI', maxScore: 36, mapX: 70.4706302, mapY: 52.05187384, gameType: 'ST' },
  { name: 'Thiên Địa Chao Đảo', nameEn: 'Tilting Heaven and Earth', shortDescription: 'Khi nhạc nổi lên và đất trời nghiêng ngả, liệu ai còn giữ vững được mình?', shortDescriptionEn: 'When the music plays and the world tilts, who can still hold their ground?', youtubeLink: 'https://www.youtube.com/shorts/JAeGyyyTbhc', maxScore: 15, mapX: 66.11272887, mapY: 34.49381157, gameType: 'ST' },
  { name: 'Phi Thuyền Xuyên Không', nameEn: 'Time-Skipping Vessel', shortDescription: 'Ngoài quỹ đạo quen thuộc, một chuyến du hành kỳ lạ đang chờ đợi.', shortDescriptionEn: 'Beyond the familiar orbit, a strange journey awaits.', youtubeLink: null, maxScore: 105, mapX: 53.24718271, mapY: 71.83090008, gameType: 'standard' },
  { name: 'Tâm Đầu Ý Lon', nameEn: 'Can-to-Can Connection', shortDescription: 'Giữa muôn sắc lạc đường, liệu sự đồng điệu có dẫn lối?', shortDescriptionEn: 'Amidst a myriad of lost colors, will harmony lead the way?', youtubeLink: null, maxScore: 20, mapX: 79.47850563, mapY: 32.87500686, gameType: 'standard' },
  { name: 'Vòng Quay Công Lý', nameEn: 'Wheel of Justice', shortDescription: 'Khi bánh xe cất lời, phán quyết sẽ thuộc về ai?', shortDescriptionEn: 'When the wheel speaks, to whom will the verdict belong?', youtubeLink: null, maxScore: null, mapX: 65.60074589, mapY: 83.44960501, gameType: 'standard' },
  { name: 'Song Tâm Dẫn Ngọc', nameEn: 'Twin Hearts, Guided Gem', shortDescription: 'Một viên ngọc chông chênh đang chờ những nhịp lòng dẫn lối.', shortDescriptionEn: 'A precarious gem awaits the guidance of beating hearts.', youtubeLink: null, maxScore: 36, mapX: 85.84656084656085, mapY: 71.6931216931217, gameType: 'standard' },
  { name: 'Ba Tiêu Cuồng Phong', nameEn: 'Plantain Fan Storm', shortDescription: 'Khi Quạt Ba Tiêu thức giấc, mọi thứ liệu có còn nguyên vẹn?', shortDescriptionEn: 'When the Banana Leaf Fan awakens, will everything remain intact?', youtubeLink: null, maxScore: 25, mapX: 78.76075928, mapY: 68.22863704, gameType: 'standard' },
  { name: 'Bách Thú Quy Hội', nameEn: 'Gathering of Beasts', shortDescription: 'Giữa muôn thanh âm, liệu chúng ta có tìm thấy nhau?', shortDescriptionEn: 'Amidst countless sounds, will we find each other?', youtubeLink: null, maxScore: 15, mapX: 18.55097488, mapY: 50.31129788, gameType: 'standard' },
  { name: 'Mê Trận Đồng Tâm', nameEn: 'Maze of One Heart', shortDescription: 'Giữa mê trận rối ren, liệu đồng lòng có mở được lối ra?', shortDescriptionEn: 'In the midst of a tangled maze, will unity open the way out?', youtubeLink: null, maxScore: 20, mapX: 60.84044646, mapY: 45.53447676, gameType: 'standard' },
  { name: 'Trụ Vững Càn Khôn', nameEn: 'Pillar of Balance', shortDescription: 'Khi càn khôn chuyển động, điều gì vẫn còn đứng vững?', shortDescriptionEn: 'When the universe shifts, what still stands firm?', youtubeLink: null, maxScore: 40, mapX: 74.92580611, mapY: 59.29883029, gameType: 'standard' },
  { name: 'Liên Hoàn Thần Chưởng', nameEn: 'Chain of Divine Palms', shortDescription: 'Một nhịp lỡ làng, cả chuỗi liền đứt đoạn.', shortDescriptionEn: 'One missed beat, and the entire chain is broken.', youtubeLink: null, maxScore: 36, mapX: 90.06484405, mapY: 57.51286895, gameType: 'standard' },
  { name: 'Hỏa Nhãn Kim Tinh', nameEn: 'Golden-Eyed Focus', shortDescription: 'Điều khác biệt thường ẩn nơi mắt người dễ bỏ qua.', shortDescriptionEn: 'The difference is often hidden where the eye easily overlooks.', youtubeLink: null, maxScore: 20, mapX: 60.93772104, mapY: 34.54244886, gameType: 'standard' },
  { name: 'Tam Sao Thất Vậy', nameEn: 'Three Stars Astray', shortDescription: 'Liệu sự thật có còn nguyên vẹn như ban đầu?', shortDescriptionEn: 'Will the truth remain as intact as it was in the beginning?', youtubeLink: null, maxScore: 30, mapX: 46.95785525, mapY: 64.91263989, gameType: 'standard' },
  { name: 'Vạn Ly Trường Thành', nameEn: 'Great Wall of Many Miles', shortDescription: 'Từ những điều nhỏ bé, liệu một kỳ tích có thể thành hình?', shortDescriptionEn: 'From small things, can a miracle take shape?', youtubeLink: null, maxScore: 30, mapX: 21.69461993, mapY: 69.41447427, gameType: 'standard' },
  { name: 'Nhất Nhịp Đồng Tâm', nameEn: 'One Beat, One Heart', shortDescription: 'Khi mọi bước chân cùng hòa một nhịp, lối đi phía trước sẽ dần hiện ra.', shortDescriptionEn: 'When all footsteps harmonize to one beat, the path ahead will gradually appear.', youtubeLink: null, maxScore: 20, mapX: 27.53376395, mapY: 63.82028301, gameType: 'standard' },
];

export const CANONICAL_STATION_COUNT = 17;
export const CANONICAL_ST_COUNT = 4;
export const CANONICAL_STANDARD_COUNT = 13;
export const CANONICAL_TOTAL_MAX_SCORE = 1785;
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
  nameEn: station.nameEn,
  shortDescription: station.shortDescription,
  shortDescriptionEn: station.shortDescriptionEn,
  mediaUrl: station.youtubeLink,
  maxScore: station.maxScore,
  gameType: normalizeGameType(station.gameType),
  mapX: station.mapX,
  mapY: station.mapY,
  sortOrder: index + 1,
}));

export const CANONICAL_STATION_IDS = CANONICAL_STATIONS.map((station) => station.id);

export function canonicalStationTrackingMode(stationId: string) {
  return stationId === 'ST009' ? 'TIME' : 'SCORE';
}

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
    if (!station.nameEn.trim()) {
      throw new Error(`Missing English Station name for ${station.id}`);
    }
    if ((station.maxScore === null && station.id !== 'ST007') || (station.maxScore !== null && (!Number.isInteger(station.maxScore) || station.maxScore < 0))) {
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
  games: Array<{ type: string; maxPoints: number | null; mediaUrl: string | null; isActive: boolean }>;
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
