import { ReactNode, useCallback, useEffect, useRef, useState } from "react";

export type DefaultSettingsType = {
  minIndex: number;
  maxIndex: number;
  startIndex: number;
  itemHeightPx: number;
  amount: number;
  tolerance: number;
};

export type Item = {
  i: number;
  content: string;
};

type ScrollerState = {
  viewportHeight: number;
  totalHeight: number;
  toleranceHeight: number;
  bufferHeight: number;
  bufferedItems: number;
  topPaddingHeight: number;
  bottomPaddingHeight: number;
  initialPosition: number;
  data: Item[];
};

type VirtualScrollerProps = {
  defaultSettings: DefaultSettingsType;
  getData: (offset: number, amount: number) => Item[];
  children?: ReactNode;
};

const setInitialScrollerState = ({
  minIndex,
  maxIndex,
  startIndex,
  itemHeightPx,
  amount,
  tolerance,
}: DefaultSettingsType): ScrollerState => {
  // 1) height of the visible part of the viewport (px)
  const viewportHeight = amount * itemHeightPx;
  // 2) total height of rendered and virtualized items (px)
  const totalHeight = (maxIndex - minIndex + 1) * itemHeightPx;
  // 3) single viewport outlet height, filled with rendered but invisible rows (px)
  const toleranceHeight = tolerance * itemHeightPx;
  // 4) all rendered rows height, visible part + invisible outlets (px)
  const bufferHeight = viewportHeight + 2 * toleranceHeight;
  // 5) number of items to be rendered, buffered dataset length (pcs)
  const bufferedItems = amount + 2 * tolerance;
  // 6) how many items will be virtualized above (pcs)
  const itemsAbove = startIndex - tolerance - minIndex;
  // 7) initial height of the top padding element (px)
  const topPaddingHeight = itemsAbove * itemHeightPx;
  // 8) initial height of the bottom padding element (px)
  const bottomPaddingHeight = totalHeight - topPaddingHeight;
  // 9) initial scroll position (px)
  const initialPosition = topPaddingHeight + toleranceHeight;
  // initial state object
  return {
    viewportHeight,
    totalHeight,
    toleranceHeight,
    bufferHeight,
    bufferedItems,
    topPaddingHeight,
    bottomPaddingHeight,
    initialPosition,
    data: [],
  };
};

const Row = ({ item }: { item: Item }) => {
  return <div className="item">{item.content}</div>;
};

const VirtualScroller = ({
  defaultSettings,
  getData,
}: VirtualScrollerProps) => {
  const [scrollerState, setScrollerState] = useState<ScrollerState>(
    setInitialScrollerState(defaultSettings)
  );

  const viewportEl = useRef<HTMLDivElement>(null);

  const { minIndex, itemHeightPx } = defaultSettings;
  const {
    toleranceHeight,
    bufferedItems,
    totalHeight,
    initialPosition,
    viewportHeight,
    topPaddingHeight,
    bottomPaddingHeight,
    data,
  } = scrollerState;

  const onScroll = useCallback(
    //NOTE: strange type decoding, I suspect CRA does some wierd stuff here
    ({ target: { scrollTop } }: any) => {
      console.log({ scrollTop });
      // const index =
      //   minIndex + Math.floor((scrollTop - toleranceHeight) / itemHeightPx);
      const index =
        minIndex + Math.floor((scrollTop - toleranceHeight) / itemHeightPx);
      const data = getData(index, bufferedItems);
      const topPaddingHeight = Math.max((index - minIndex) * itemHeightPx, 0);
      const bottomPaddingHeight = Math.max(
        totalHeight - topPaddingHeight - data.length * itemHeightPx,
        0
      );

      setScrollerState({
        ...scrollerState,
        topPaddingHeight,
        bottomPaddingHeight,
        data,
      });
    },
    [
      bufferedItems,
      getData,
      itemHeightPx,
      minIndex,
      scrollerState,
      toleranceHeight,
      totalHeight,
    ]
  );

  useEffect(() => {
    if (viewportEl.current) {
      viewportEl.current.scrollTop = initialPosition;

      if (!initialPosition) {
        onScroll({ target: { scrollTop: 0 } });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={viewportEl}
      className="viewport"
      style={{ height: viewportHeight }}
      onScroll={onScroll}
    >
      <div style={{ height: topPaddingHeight }} />
      {data.map((item) => (
        <Row key={item.i} item={item} />
      ))}
      <div style={{ height: bottomPaddingHeight }} />
    </div>
  );
};

export default VirtualScroller;
