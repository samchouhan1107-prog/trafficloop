import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { TriStationTrafficEngineService } from '../services/triStationTrafficEngineService.js';
import { StationControlPayload } from '../../src/types.js';

export const triStationRoutes = Router();

// Protect tri-station endpoints with auth
triStationRoutes.use(authMiddleware);

/**
 * GET /api/tri-station/state
 * Retrieves the live status, verified IP routing, performance telemetry, and metrics for all 3 stations
 */
triStationRoutes.get('/state', (req: AuthenticatedRequest, res: Response) => {
  try {
    const state = TriStationTrafficEngineService.getEngineState();
    res.json(state);
  } catch (error: any) {
    console.error('Failed to get tri-station state:', error);
    res.status(500).json({ error: 'Failed to retrieve tri-station state' });
  }
});

/**
 * POST /api/tri-station/control
 * Dispatches control command (start, pause, resume, stop, reset, step) to 1 or all 3 stations
 */
triStationRoutes.post('/control', (req: AuthenticatedRequest, res: Response) => {
  try {
    const payload = req.body as StationControlPayload;
    if (!payload || !payload.action) {
      res.status(400).json({ error: 'Action parameter is required (start, pause, resume, stop, reset, step)' });
      return;
    }

    const state = TriStationTrafficEngineService.executeControl(payload);
    res.json(state);
  } catch (error: any) {
    console.error('Failed to execute tri-station control:', error);
    res.status(500).json({ error: 'Failed to execute station control' });
  }
});

/**
 * POST /api/tri-station/push-url
 * Pushes a target destination URL with search theme/keywords and ad display metadata to 1 or all 3 stations
 */
triStationRoutes.post('/push-url', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { url, stationId, searchKeyword, searchTheme, targetCountry, targetCity, deviceProfile, dwellDurationSeconds, adDisplayCustom } = req.body;
    if (!url) {
      res.status(400).json({ error: 'Destination URL is required' });
      return;
    }

    const state = TriStationTrafficEngineService.executeControl({
      action: 'push_url',
      stationId: stationId || undefined,
      config: {
        targetUrl: url,
        searchKeyword: searchKeyword || 'repair tech hiring',
        searchTheme: searchTheme || 'repair tech hiring',
        targetCountry: targetCountry || 'US',
        targetCity: targetCity || undefined,
        deviceProfile: deviceProfile || 'desktop',
        dwellDurationSeconds: dwellDurationSeconds || 15,
        adDisplayCustom
      }
    });

    res.json({
      message: `Pushed URL "${url}" to ${stationId ? `Station ${stationId}` : 'all 3 stations'} as active Ad Display`,
      state
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to push URL to stations' });
  }
});

/**
 * POST /api/tri-station/rotational-class
 * Changes the active 24h rotational throughput class (e.g. 5K/hr unrestricted extra slot)
 */
triStationRoutes.post('/rotational-class', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { rotationalClass, stationId } = req.body;
    if (!rotationalClass) {
      res.status(400).json({ error: 'rotationalClass parameter is required (24h_rotational, hourly_5k_burst, standard)' });
      return;
    }

    const state = TriStationTrafficEngineService.executeControl({
      action: 'set_rotational_class',
      stationId: stationId || undefined,
      config: {
        rotationalClass
      }
    });

    res.json({
      message: `Rotational throughput class updated to ${rotationalClass}`,
      state
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update rotational class' });
  }
});

/**
 * POST /api/tri-station/start-all
 * Batch starts all 3 independent stations with specified or default configurations
 */
triStationRoutes.post('/start-all', (req: AuthenticatedRequest, res: Response) => {
  try {
    const state = TriStationTrafficEngineService.executeControl({ action: 'start' });
    res.json(state);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to start all stations' });
  }
});

/**
 * POST /api/tri-station/stop-all
 * Batch halts all 3 stations
 */
triStationRoutes.post('/stop-all', (req: AuthenticatedRequest, res: Response) => {
  try {
    const state = TriStationTrafficEngineService.executeControl({ action: 'stop' });
    res.json(state);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to stop all stations' });
  }
});
