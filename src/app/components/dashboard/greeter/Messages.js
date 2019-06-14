import Moment from "moment";
import { getMultiLangValue } from "../../../helpers/multiLanguage";
import f from "lodash/fp";
import { doto } from "../../../helpers/functools";

/**
 * A collection of message-of-the-day strings.
 * {{day}} will be replaced with the day name,
 * {{Day}} will be replaced with an Startcase day name, e.g. to begin a sentence
 *
 * @type {{langtag: {generic: string[], mon: {name: string, values: Array}, tue: {name: string, values: Array}, wed: {name: string, values: Array}, thu: {name: string, values: Array}, fri: {name: string, values: string[]}, sat: {name: string, values: Array}, sun: {name: string, values: Array}}}}}
 */
const defaultMessages = {
  de: {
    generic: [
      "lass uns loslegen.",
      "lass uns die Aufgaben angehen.",
      "einen schönen {{day}}.",
      "hey, ist es schon wieder {{day}}?",
      "behalte deine Daten im Überblick.",
      "schön dass du wieder hier bist."
    ],
    mon: {
      name: "Montag",
      values: [
        "ah eine neue Woche. Diese wird bestimmt fantastisch!",
        "neue Woche, neues Glück."
      ]
    },
    tue: {
      name: "Dienstag",
      values: []
    },
    wed: {
      name: "Mittwoch",
      values: ["heute ist Halbzeit."]
    },
    thu: {
      name: "Donnerstag",
      values: ["morgen ist Freitag"]
    },
    fri: {
      name: "Freitag",
      values: ["hurra, schon wieder {{day}}!"]
    },
    sat: {
      name: "Samstag",
      values: ["du arbeitest auch am {{day}}? +1xp"]
    },
    sun: {
      name: "Sonntag",
      values: ["wow, du arbeitest am {{day}}? Du bist ja drauf!"]
    }
  },
  en: {
    generic: [
      "let's get a-rollin'.",
      "let's start something new.",
      "keep connected with your data.",
      "have a nice {{day}}.",
      "wait, it's {{day}} again?",
      "nice to see you again"
    ],
    mon: {
      name: "monday",
      values: ["this is the start of a great week."]
    },
    tue: {
      name: "tuesday",
      values: []
    },
    wed: {
      name: "wednesday",
      values: ["you're halfway through the week."]
    },
    thu: {
      name: "thursday",
      values: ["it's friday tomorrow"]
    },
    fri: {
      name: "friday",
      values: ["yay, it's {{day}}!", "let's finish strong"]
    },
    sat: {
      name: "saturday",
      values: ["working on {{day}} -> +1xp!"]
    },
    sun: {
      name: "sunday",
      values: ["you're here on {{day}}? You're rad!"]
    }
  }
};

/**
 * Generate message of the day
 * @param langtag: string
 * @param messages: Message object to use
 */
const getMotd = (langtag, messages = defaultMessages) => {
  const dayOfWeek = Moment()
    .format("ddd")
    .toLowerCase();
  const messagesInMyLang = getMultiLangValue(
    langtag,
    { generic: ["You're using GRUD."] },
    messages
  );
  const messageArray = f.flatten(
    f.props(["generic", [dayOfWeek, "values"]], messagesInMyLang)
  );
  const n = f.size(messageArray);
  const messageIdx = Math.min((Math.random() * n) | 0, n - 1);
  const dayOfWeekName = f.get([dayOfWeek, "name"], messagesInMyLang);
  return doto(
    messageArray,
    f.getOr("", messageIdx),
    f.replace("{{day}}", dayOfWeekName),
    f.replace("{{Day}}", dayOfWeekName.replace(/./, f.toUpper))
  );
};

export default getMotd;
