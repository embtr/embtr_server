import { Badge } from '@resources/schema';
import { Constants } from '@resources/types/constants/constants';
import { BadgeDao } from '@src/database/BadgeDao';
import { Context } from '@src/general/auth/Context';
import { ModelConverter } from '@src/utility/model_conversion/ModelConverter';

export class BadgeService {
    public static async get(context: Context, key: Constants.Badge): Promise<Badge | undefined> {
        const badge = await BadgeDao.get(key);
        if (!badge) {
            return undefined;
        }

        const badgeModel: Badge = ModelConverter.convert(badge);
        return badgeModel;
    }

    public static async getAllByCategory(
        context: Context,
        category: Constants.BadgeCategory
    ): Promise<Badge[]> {
        const badges = await BadgeDao.getAllByCategory(category);
        const badgeModels: Badge[] = badges.map((badge) => ModelConverter.convert(badge));
        return badgeModels;
    }
}
