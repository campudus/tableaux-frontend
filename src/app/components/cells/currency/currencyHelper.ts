import f from "lodash/fp";
import { useEffect, useState } from "react";
import { getFallbackCurrencyValue } from "../../../helpers/multiLanguage";

export function getCurrencyWithCountry(
  currencyObj: Record<string, number>,
  country: string,
  withFallback = false
) {
  const result = f.getOr(null, country, currencyObj);
  const fallBack =
    ((getFallbackCurrencyValue as unknown) as (
      ..._: unknown[]
    ) => number | undefined)({ country }, currencyObj) || null;
  return withFallback ? result || fallBack : result;
}

export function splitPriceDecimals(priceValue: string) {
  if (!f.isFinite(priceValue)) {
    return ["", ""];
  }
  const priceValueAsArray = String(priceValue).split(".");

  return priceValueAsArray.length === 1
    ? [...priceValueAsArray, "00"]
    : priceValueAsArray;
}

export const maybeAddZeroToDecimals = (splittedValue: [string, string]) => {
  const [currencyInteger, currencyDecimals] = splittedValue;
  if (currencyDecimals.length === 1) {
    return [currencyInteger, currencyDecimals + "0"];
  }
  return splittedValue;
};

export const useCurrencyInputValue = (
  initial: number | null,
  onChange?: (_: number | null) => void
): [
  { pre: string | null; post: string | null; value: number | null },
  (_: string | null, __: string | null) => void
] => {
  const [pre, setPre] = useState("");
  const [post, setPost] = useState("");
  const isClearedTextInput = (x: string | null) => x === null || x === "";

  useEffect(() => {
    if (f.isNumber(initial) && !isNaN(initial)) {
      const [l = "", r = ""] = String(initial).split(".");
      setPre(l);
      setPost(r);
    } else {
      setPre("");
      setPost("");
    }
  }, [initial]);

  const handleInput = (inputPre: string | null, inputPost: string | null) => {
    if (isClearedTextInput(inputPre) && isClearedTextInput(inputPost)) {
      setPre("");
      setPost("");
    } else {
      const newPre = isClearedTextInput(inputPre) ? "" : inputPre;
      const newPost = isClearedTextInput(inputPost) ? "" : inputPost;
      setPre(newPre);
      setPost(newPost);
    }
  };

  const value =
    isClearedTextInput(pre) && isClearedTextInput(post)
      ? null
      : parseFloat(`${pre || 0}.${post || 0}`);
  useEffect(() => {
    if (onChange && value !== initial) onChange(value);
  }, [onChange, value]);
  return [{ pre, post, value }, handleInput];
};
