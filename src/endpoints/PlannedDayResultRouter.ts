import { Interactable } from '@resources/types/interactable/Interactable';
import { CreatePlannedDayResultRequest, GetPlannedDayResultRequest } from '@resources/types/requests/PlannedDayResultTypes';
import { GetUserResponse } from '@resources/types/requests/UserTypes';
import { authenticate } from '@src/middleware/authentication';
import { authorize } from '@src/middleware/general/GeneralAuthorization';
import { validateCommentDelete, validateCommentPost } from '@src/middleware/general/GeneralValidation';
import {
    validateGetById,
    validateGetByUser,
    validateLikePost,
    validatePatch,
    validatePost,
} from '@src/middleware/planned_day_result/PlannedDayResultValidation';
import { CommentService } from '@src/service/CommentService';
import { LikeService } from '@src/service/LikeService';
import { PlannedDayResultService } from '@src/service/PlannedDayResultService';
import express from 'express';

const plannedDayResultRouter = express.Router();

plannedDayResultRouter.get('/', authenticate, authorize, async (req, res) => {
    const response: GetUserResponse = await PlannedDayResultService.getAll();
    res.status(response.httpCode).json(response);
});

plannedDayResultRouter.get('/:id', authenticate, authorize, validateGetById, async (req, res) => {
    const id = Number(req.params.id);
    const response: GetUserResponse = await PlannedDayResultService.getById(id);

    res.status(response.httpCode).json(response);
});

plannedDayResultRouter.get('/:userId/:dayKey', authenticate, authorize, validateGetByUser, async (req, res) => {
    const request: GetPlannedDayResultRequest = {
        userId: Number(req.params.userId),
        dayKey: req.params.dayKey,
    };

    const response: GetUserResponse = await PlannedDayResultService.getByUserAndDayKey(request);

    res.status(response.httpCode).json(response);
});

plannedDayResultRouter.post('/', authenticate, authorize, validatePost, async (req, res) => {
    const request: CreatePlannedDayResultRequest = {
        plannedDayId: req.body.plannedDayId,
    };
    const response = await PlannedDayResultService.create(request);
    res.status(response.httpCode).json(response);
});

plannedDayResultRouter.patch('/', authenticate, authorize, validatePatch, async (req, res) => {
    const response = await PlannedDayResultService.update(req);
    res.status(response.httpCode).json(response);
});

plannedDayResultRouter.post('/:id/comment/', authenticate, authorize, validateCommentPost, async (req, res) => {
    const response = await CommentService.create(Interactable.PLANNED_DAY_RESULT, req);
    res.status(response.httpCode).json(response);
});

plannedDayResultRouter.delete('/comment/:id', authenticate, authorize, validateCommentDelete, async (req, res) => {
    const response = await CommentService.delete(req);
    res.status(response.httpCode).json(response);
});

plannedDayResultRouter.post('/:id/like/', authenticate, authorize, validateLikePost, async (req, res) => {
    const response = await LikeService.create(Interactable.PLANNED_DAY_RESULT, req);
    res.status(response.httpCode).json(response);
});

export default plannedDayResultRouter;
