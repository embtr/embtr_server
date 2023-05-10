import { QuoteOfTheDay } from '@resources/schema';
import {
    CreateQuoteOfTheDayRequest,
    CreateQuoteOfTheDayResponse,
    GetQuoteOfTheDayResponse,
} from '@resources/types/requests/QuoteOfTheDayTypes';
import { GENERAL_FAILURE, SUCCESS } from '@src/common/RequestResponses';
import { AuthorizationController } from '@src/controller/AuthorizationController';
import { MetadataController } from '@src/controller/MetadataController';
import { QuoteOfTheDayController } from '@src/controller/QuoteOfTheDayController';
import { ModelConverter } from '@src/utility/model_conversion/ModelConverter';
import { Request } from 'express';

export class QuoteOfTheDayService {
    public static async add(request: Request): Promise<CreateQuoteOfTheDayResponse> {
        const userId: number = (await AuthorizationController.getUserIdFromToken(
            request.headers.authorization!
        )) as number;

        const body: CreateQuoteOfTheDayRequest = request.body;

        const quoteOfTheDay = await QuoteOfTheDayController.add(userId, body.quote, body.author);
        const quoteOfTheDayModel: QuoteOfTheDay = ModelConverter.convert(quoteOfTheDay);

        return { ...SUCCESS, quoteOfTheDay: quoteOfTheDayModel };
    }

    public static async get(): Promise<GetQuoteOfTheDayResponse> {
        const quoteOfTheDayIdString = await MetadataController.get('QUOTE_OF_THE_DAY');
        if (!quoteOfTheDayIdString?.value) {
            return { ...GENERAL_FAILURE };
        }

        const quoteOfTheDayId = parseInt(quoteOfTheDayIdString.value);
        if (isNaN(quoteOfTheDayId)) {
            return { ...GENERAL_FAILURE };
        }

        const quoteOfTheDay = await QuoteOfTheDayController.getById(quoteOfTheDayId);
        if (!quoteOfTheDay) {
            return { ...GENERAL_FAILURE };
        }

        const quoteOfTheDayModel: QuoteOfTheDay = ModelConverter.convert(quoteOfTheDay);

        return { ...SUCCESS, quoteOfTheDay: quoteOfTheDayModel };
    }
}
