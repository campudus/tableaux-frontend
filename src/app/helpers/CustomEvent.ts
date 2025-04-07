import { useEffect } from "react";

const useCustomEvent = <T>(
    name: string,
  handler: (_: T) => void,
  element?: HTMLElement
) => {
    useEffect(() => {
        const target = element ?? document
        const wrappedHandler: (_: CustomEvent<T>) => void = evt => handler(evt.detail)
        target.addEventListener(name, wrappedHandler as any);
        return () => void target.removeEventListener(name, wrappedHandler as any)
    }, [element, handler])
};

const emit = <T>(name: string, detail: T, element?: HTMLElement) => {
    const target = element ?? document
    const evt = new CustomEvent<T>(name, {detail})
    target.dispatchEvent(evt)
}

export default {
    emit,
    useCustomEvent
}
