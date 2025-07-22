import f from "lodash/fp";
import { useCallback, useRef, useState } from "react";

export function useMeasure() {
  const [dimensions, setDimensions] = useState<{
    width?: number;
    height?: number;
  }>({});

  const previousObserver = useRef<ResizeObserver | null>(null);

  const customRef = useCallback(node => {
    if (previousObserver.current) {
      previousObserver.current.disconnect();
      previousObserver.current = null;
    }

    if (node?.nodeType === Node.ELEMENT_NODE) {
      const observer = new ResizeObserver(
        f.debounce(100, ([entry]) => {
          if (entry && entry.borderBoxSize) {
            const {
              inlineSize: width,
              blockSize: height
            } = entry.borderBoxSize[0];

            setDimensions({ width, height });
          }
        })
      );

      observer.observe(node);
      previousObserver.current = observer;
    }
  }, []);

  return [customRef, dimensions] as const;
}
