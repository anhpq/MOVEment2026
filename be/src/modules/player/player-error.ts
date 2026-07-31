import { HttpException, HttpStatus } from '@nestjs/common';

export const PLAYER_ERROR_CODES = {
  stationsClosed: 'PLAYER_STATIONS_CLOSED',
  qrInvalid: 'PLAYER_QR_INVALID',
  qrRevoked: 'PLAYER_QR_REVOKED',
  qrExpired: 'PLAYER_QR_EXPIRED',
  qrPurposeMismatch: 'PLAYER_QR_PURPOSE_MISMATCH',
  qrStationMismatch: 'PLAYER_QR_STATION_MISMATCH',
  stationInactive: 'PLAYER_STATION_INACTIVE',
  progressNotFound: 'PLAYER_PROGRESS_NOT_FOUND',
  stationNotAvailable: 'PLAYER_STATION_NOT_AVAILABLE',
  cancelCooldownActive: 'PLAYER_CANCEL_COOLDOWN_ACTIVE',
  activeStationConflict: 'PLAYER_ACTIVE_STATION_CONFLICT',
  stationNotPlaying: 'PLAYER_STATION_NOT_PLAYING',
  checkoutConflict: 'PLAYER_CHECKOUT_CONFLICT',
  cancelConflict: 'PLAYER_CANCEL_CONFLICT',
  scoreNotPending: 'PLAYER_SCORE_NOT_PENDING',
  timeStationScoreForbidden: 'PLAYER_TIME_STATION_SCORE_FORBIDDEN',
  scoreInvalid: 'PLAYER_SCORE_INVALID',
  scoreConflict: 'PLAYER_SCORE_CONFLICT',
} as const;

export type PlayerErrorCode =
  (typeof PLAYER_ERROR_CODES)[keyof typeof PLAYER_ERROR_CODES];

export class PlayerActionException extends HttpException {
  constructor(status: HttpStatus, code: PlayerErrorCode, message: string) {
    super(
      {
        statusCode: status,
        error: HttpStatus[status],
        code,
        message,
      },
      status,
    );
  }
}
