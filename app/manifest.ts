import type { MetadataRoute } from "next";
import {
  PWA_BACKGROUND_COLOR,
  PWA_ICONS,
  PWA_ID,
  PWA_LANG,
  PWA_SCOPE,
  PWA_SHORT_NAME,
  PWA_START_URL,
  PWA_THEME_COLOR,
} from "@/lib/pwa/constants";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export default function manifest(): MetadataRoute.Manifest {
  const messages = getMessages(DEFAULT_LOCALE);

  return {
    id: PWA_ID,
    name: messages.app.name,
    short_name: PWA_SHORT_NAME,
    description: messages.app.description,
    start_url: PWA_START_URL,
    scope: PWA_SCOPE,
    display: "standalone",
    orientation: "portrait",
    background_color: PWA_BACKGROUND_COLOR,
    theme_color: PWA_THEME_COLOR,
    lang: PWA_LANG,
    prefer_related_applications: false,
    categories: ["finance"],
    icons: PWA_ICONS.map((icon) => ({
      src: icon.src,
      sizes: icon.sizes,
      type: icon.type,
      purpose: icon.purpose,
    })),
  };
}
