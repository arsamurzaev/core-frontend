import { describe, expect, it } from "vitest";
import type {
  CatalogContactDto,
  CatalogCurrentDto,
  CatalogSettingsDto,
} from "@/shared/api/generated/react-query";
import { CatalogContactDtoType } from "@/shared/api/generated/react-query";
import {
  buildCheckoutSummary,
  DEFAULT_PREORDER_SETTINGS,
  getCatalogCheckoutConfig,
  getCatalogCheckoutLocation,
  normalizeCheckoutData,
} from "./checkout-methods";

function catalogType(code: string): CatalogCurrentDto["type"] {
  return {
    id: `type-${code}`,
    code,
    name: code,
    attributes: [],
  };
}

function settings(
  overrides: Partial<CatalogSettingsDto> = {},
): CatalogSettingsDto {
  return {
    isActive: true,
    defaultMode: "DELIVERY",
    allowedModes: ["DELIVERY"],
    inventoryMode: "NONE",
    address: null,
    checkout: {
      availableMethods: ["DELIVERY", "PICKUP"],
      enabledMethods: [],
      methodContacts: {},
      methodFields: {},
      preorder: DEFAULT_PREORDER_SETTINGS,
    } as CatalogSettingsDto["checkout"],
    googleVerification: null,
    yandexVerification: null,
    ...overrides,
  };
}

function catalog(
  catalogSettings: CatalogSettingsDto | null = null,
  contacts: CatalogContactDto[] = [],
): Pick<CatalogCurrentDto, "type" | "settings" | "contacts"> {
  return {
    contacts,
    settings: catalogSettings,
    type: catalogType("restaurant"),
  };
}

function futureVisit(daysFromNow = 1): { visitDate: string; visitTime: string } {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(19, 30, 0, 0);
  return {
    visitDate: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0",
    )}-${String(date.getDate()).padStart(2, "0")}`,
    visitTime: "19:30",
  };
}

describe("getCatalogCheckoutConfig", () => {
  it("uses generic default checkout methods without catalog-type branches", () => {
    const config = getCatalogCheckoutConfig(catalog());

    expect(config.availableMethods).toEqual(["DELIVERY", "PICKUP"]);
    expect(config.enabledMethods).toEqual([]);
    expect(config.preorder).toEqual(DEFAULT_PREORDER_SETTINGS);
  });

  it("accepts runtime-provided available and default enabled methods", () => {
    const config = getCatalogCheckoutConfig(catalog(), {
      availableMethods: ["DELIVERY", "PICKUP", "PREORDER"],
      defaultEnabledMethods: ["DELIVERY", "PICKUP"],
    });

    expect(config.availableMethods).toEqual(["DELIVERY", "PICKUP", "PREORDER"]);
    expect(config.enabledMethods).toEqual(["DELIVERY", "PICKUP"]);
  });

  it("lets catalog settings override runtime defaults within available methods", () => {
    const config = getCatalogCheckoutConfig(
      catalog(
        settings({
          checkout: {
            availableMethods: ["DELIVERY", "PICKUP", "PREORDER"],
            enabledMethods: [
              "PREORDER",
              "UNKNOWN",
            ] as unknown as CatalogSettingsDto["checkout"]["enabledMethods"],
            methodContacts: {},
            methodFields: {},
          },
        }),
      ),
      {
        availableMethods: ["DELIVERY", "PICKUP", "PREORDER"],
        defaultEnabledMethods: ["DELIVERY"],
      },
    );

    expect(config.enabledMethods).toEqual(["PREORDER"]);
  });

  it("normalizes preorder settings from catalog settings", () => {
    const config = getCatalogCheckoutConfig(
      catalog(
        settings({
          checkout: {
            availableMethods: ["DELIVERY", "PICKUP", "PREORDER"],
            enabledMethods: ["PREORDER"],
            methodContacts: {},
            methodFields: {},
            preorder: {
              minLeadTimeMinutes: 60,
              maxAdvanceDays: 3,
            },
          } as CatalogSettingsDto["checkout"],
        }),
      ),
      {
        availableMethods: ["DELIVERY", "PICKUP", "PREORDER"],
        defaultEnabledMethods: ["DELIVERY"],
      },
    );

    expect(config.preorder).toEqual({
      minLeadTimeMinutes: 60,
      maxAdvanceDays: 3,
    });
  });

  it("keeps venue address formatting from catalog settings", () => {
    const location = getCatalogCheckoutLocation(
      catalog(
        settings({
          address: "  Москва\nул. Ленина, 1\nвход со двора  ",
        }),
        [
          {
            id: "contact-map",
            type: CatalogContactDtoType.MAP,
            position: 0,
            value: "https://maps.example/location",
          },
        ],
      ),
    );

    expect(location).toEqual({
      address: "Москва\nул. Ленина, 1\nвход со двора",
      mapUrl: "https://maps.example/location",
    });
  });

  it("normalizes preorder date and time into scheduledAt", () => {
    const visit = futureVisit();

    expect(
      normalizeCheckoutData({
        data: {
          customerName: "Ivan",
          personsCount: 4,
          phone: "+79990000000",
          ...visit,
        },
        location: {
          address: "Main street, 1",
          mapUrl: "https://maps.example/location",
        },
        method: "PREORDER",
      }),
    ).toEqual({
      data: {
        address: "Main street, 1",
        customerName: "Ivan",
        mapUrl: "https://maps.example/location",
        personsCount: 4,
        phone: "+79990000000",
        scheduledAt: `${visit.visitDate}T19:30:00.000`,
        visitDate: visit.visitDate,
        visitTime: "19:30",
      },
      error: null,
    });
  });

  it("requires preorder date and time", () => {
    expect(
      normalizeCheckoutData({
        data: { personsCount: 4 },
        location: { address: null, mapUrl: null },
        method: "PREORDER",
      }),
    ).toEqual({ data: {}, error: "Выберите дату визита." });

    expect(
      normalizeCheckoutData({
        data: { personsCount: 4, visitDate: "2020-01-01", visitTime: "19:30" },
        location: { address: null, mapUrl: null },
        method: "PREORDER",
      }),
    ).toEqual({
      data: {},
      error: "Выберите время визита не раньше чем через 30 мин.",
    });
  });

  it("validates preorder max advance window from config", () => {
    expect(
      normalizeCheckoutData({
        config: {
          preorder: {
            minLeadTimeMinutes: 0,
            maxAdvanceDays: 1,
          },
        },
        data: {
          personsCount: 4,
          ...futureVisit(2),
        },
        location: { address: null, mapUrl: null },
        method: "PREORDER",
      }),
    ).toEqual({
      data: {},
      error: "Выберите дату визита не позднее чем через 1 дн.",
    });
  });

  it("shows preorder date and time in checkout summary", () => {
    expect(
      buildCheckoutSummary({
        data: {
          personsCount: 4,
          visitDate: "2026-05-26",
          visitTime: "19:30",
        },
        method: "PREORDER",
      }),
    ).toContain("Дата визита: 26.05.2026");
  });
});
