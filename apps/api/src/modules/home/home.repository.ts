import prisma from "../../config/prisma.js";
import type { UpdateDashboardPreferencesDto } from "./home.validation.js";

const DEFAULT_WIDGET_ORDER = [
  "mail",
  "chat",
  "calendar",
  "meet",
  "drive",
  "tasks",
  "activity",
];

export class HomeRepository {
  async getPreferences(userId: bigint) {
    const pref = await prisma.userDashboardPreference.findUnique({
      where: { userId },
    });

    if (!pref) {
      return {
        widgetOrder: DEFAULT_WIDGET_ORDER,
        hiddenWidgets: [],
        collapsedWidgets: [],
        widgetSizes: {},
        summaryStrip: true,
      };
    }

    return {
      widgetOrder: (pref.widgetOrder as string[]) || DEFAULT_WIDGET_ORDER,
      hiddenWidgets: (pref.hiddenWidgets as string[]) || [],
      collapsedWidgets: (pref.collapsedWidgets as string[]) || [],
      widgetSizes: (pref.widgetSizes as Record<string, string>) || {},
      summaryStrip: pref.summaryStrip,
    };
  }

  async upsertPreferences(userId: bigint, dto: UpdateDashboardPreferencesDto) {
    const existing = await prisma.userDashboardPreference.findUnique({
      where: { userId },
    });

    const widgetOrder =
      dto.widgetOrder ??
      ((existing?.widgetOrder as string[]) || DEFAULT_WIDGET_ORDER);
    const hiddenWidgets =
      dto.hiddenWidgets ??
      ((existing?.hiddenWidgets as string[]) || []);
    const collapsedWidgets =
      dto.collapsedWidgets ??
      ((existing?.collapsedWidgets as string[]) || []);
    const widgetSizes =
      dto.widgetSizes ??
      ((existing?.widgetSizes as Record<string, string>) || {});
    const summaryStrip = dto.summaryStrip ?? existing?.summaryStrip ?? true;

    return prisma.userDashboardPreference.upsert({
      where: { userId },
      create: {
        userId,
        widgetOrder,
        hiddenWidgets,
        collapsedWidgets,
        widgetSizes,
        summaryStrip,
      },
      update: {
        widgetOrder,
        hiddenWidgets,
        collapsedWidgets,
        widgetSizes,
        summaryStrip,
      },
    });
  }

  async getRecentNotifications(userId: bigint, limit = 10) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        actor: {
          select: {
            id: true,
            fullName: true,
            username: true,
            profileImage: { select: { secureUrl: true } },
          },
        },
      },
    });
  }
}

export default HomeRepository;
