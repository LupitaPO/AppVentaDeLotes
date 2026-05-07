import { I18n } from "i18n-js";
import { Languages, traslations } from "./localizacion";

const i18n = new I18n(traslations);

i18n.defaultLocale="en";
i18n.enableFallback = true;

export const changeLanguage = (lang: Languages) => {
  i18n.locale=lang
};

export default i18n
