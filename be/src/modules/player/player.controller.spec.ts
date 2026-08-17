import {HttpStatus} from '@nestjs/common'
import type {Request, Response} from 'express'
import type {AuthContext} from '../../common/auth/auth-context'
import {PlayerController} from './player.controller'
import type {PlayerService} from './player.service'

const auth: AuthContext = {type: 'TEAM', id: 2, sessionId: 'session-2'}
const runtime = {runtimeVersion: 'runtime-v1', totalPoints: 75}
const service = {
  getV2Runtime: jest.fn(),
  getStationPlayingCountsSnapshot: jest.fn(),
}

function createHttpMocks(ifNoneMatch?: string) {
  const request = {
    header: jest.fn().mockReturnValue(ifNoneMatch),
  } as unknown as Request
  const response = {
    setHeader: jest.fn(),
    status: jest.fn(),
    end: jest.fn(),
  } as unknown as Response
  ;(response.status as jest.Mock).mockReturnValue(response)
  return {request, response}
}

describe('PlayerController private polling revalidation', () => {
  let controller: PlayerController

  beforeEach(() => {
    jest.clearAllMocks()
    controller = new PlayerController(service as unknown as PlayerService)
    service.getV2Runtime.mockResolvedValue(runtime)
    service.getStationPlayingCountsSnapshot.mockResolvedValue({
      version: 'counts-v1',
      rows: [{stationId: 'ST001', playingTeamCount: 2}],
    })
  })

  it('returns the compact V2 runtime with a private ETag', async () => {
    const {request, response} = createHttpMocks()

    await expect(controller.getV2Runtime(auth, request, response)).resolves.toBe(runtime)
    expect(response.setHeader).toHaveBeenCalledWith('Cache-Control', 'private, no-cache')
    expect(response.setHeader).toHaveBeenCalledWith('ETag', '"runtime-v1"')
    expect(response.status).not.toHaveBeenCalled()
  })

  it('returns a bodyless 304 when the V2 runtime ETag matches', async () => {
    const {request, response} = createHttpMocks('"runtime-v1"')

    await expect(controller.getV2Runtime(auth, request, response)).resolves.toBeUndefined()
    expect(response.status).toHaveBeenCalledWith(HttpStatus.NOT_MODIFIED)
    expect(response.end).toHaveBeenCalled()
  })

  it('revalidates Station playing counts independently', async () => {
    const {request, response} = createHttpMocks('"counts-v1"')

    await expect(controller.getStationPlayingCounts(auth, request, response)).resolves.toBeUndefined()
    expect(response.status).toHaveBeenCalledWith(HttpStatus.NOT_MODIFIED)
    expect(response.end).toHaveBeenCalled()
  })
})
