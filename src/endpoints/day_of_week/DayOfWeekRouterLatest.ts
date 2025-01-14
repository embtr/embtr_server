import express from 'express';
import { authenticate } from '@src/middleware/authentication';
import { authorize } from '@src/middleware/general/GeneralAuthorization';
import { DayOfWeekService } from '@src/service/DayOfWeekService';
import { ContextService } from '@src/service/ContextService';
import { GetDaysOfWeekResponse } from '@resources/types/requests/DayOfWeekTypes';
import { SUCCESS } from '@src/common/RequestResponses';
import { routeLogger } from '@src/middleware/logging/LoggingMiddleware';

const dayOfWeekRouterLatest = express.Router();
const v = '✓';

dayOfWeekRouterLatest.get('/', routeLogger(v), authenticate, authorize, async (req, res) => {
    const context = await ContextService.get(req);

    const daysOfWeek = await DayOfWeekService.getAll(context);
    const response: GetDaysOfWeekResponse = { ...SUCCESS, daysOfWeek };
    res.json(response);
});

export default dayOfWeekRouterLatest;
