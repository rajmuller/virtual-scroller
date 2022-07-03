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
  viewportHeightPx: number;
  totalHeightPx: number;
  toleranceHeightPx: number;
  bufferHeight: number;
  bufferedItems: number;
  topPaddingHeightPx: number;
  bottomPaddingHeightPx: number;
  initialPositionPx: number;
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
  const viewportHeightPx = amount * itemHeightPx;
  // 2) total height of rendered and virtualized items (px)
  const totalHeightPx = (maxIndex - minIndex + 1) * itemHeightPx;
  // 3) single viewport outlet height, filled with rendered but invisible rows (px)
  const toleranceHeightPx = tolerance * itemHeightPx;
  // 4) all rendered rows height, visible part + invisible outlets (px)
  const bufferHeight = viewportHeightPx + 2 * toleranceHeightPx;
  // 5) number of items to be rendered, buffered dataset length (pcs)
  const bufferedItems = amount + 2 * tolerance;
  // 6) how many items will be virtualized above (pcs)
  const itemsAbove = startIndex - tolerance - minIndex;
  // 7) initial height of the top padding element (px)
  const topPaddingHeightPx = itemsAbove * itemHeightPx;
  // 8) initial height of the bottom padding element (px)
  const bottomPaddingHeightPx = totalHeightPx - topPaddingHeightPx;
  // 9) initial scroll position (px)
  const initialPositionPx = topPaddingHeightPx + toleranceHeightPx;
  // initial state object
  return {
    viewportHeightPx,
    totalHeightPx,
    toleranceHeightPx,
    bufferHeight,
    bufferedItems,
    topPaddingHeightPx,
    bottomPaddingHeightPx,
    initialPositionPx,
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
    toleranceHeightPx,
    bufferedItems,
    totalHeightPx,
    initialPositionPx,
    viewportHeightPx,
    topPaddingHeightPx,
    bottomPaddingHeightPx,
    data,
  } = scrollerState;

  const onScroll = useCallback(
    //NOTE: strange type decoding, I suspect CRA does some wierd stuff here
    ({ target: { scrollTop } }: any) => {
      console.log({ scrollTop });
      // const index =
      //   minIndex + Math.floor((scrollTop - toleranceHeightPx) / itemHeightPx);
      const index =
        minIndex + Math.floor((scrollTop - toleranceHeightPx) / itemHeightPx);
      const data = getData(index, bufferedItems);
      const topPaddingHeightPx = Math.max((index - minIndex) * itemHeightPx, 0);
      const bottomPaddingHeightPx = Math.max(
        totalHeightPx - topPaddingHeightPx - data.length * itemHeightPx,
        0
      );

      setScrollerState({
        ...scrollerState,
        topPaddingHeightPx,
        bottomPaddingHeightPx,
        data,
      });
    },
    [
      bufferedItems,
      getData,
      itemHeightPx,
      minIndex,
      scrollerState,
      toleranceHeightPx,
      totalHeightPx,
    ]
  );

  useEffect(() => {
    if (viewportEl.current) {
      viewportEl.current.scrollTop = initialPositionPx;

      if (!initialPositionPx) {
        onScroll({ target: { scrollTop: 0 } });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={viewportEl}
      className="viewport"
      style={{ height: viewportHeightPx }}
      onScroll={onScroll}
    >
      <div style={{ height: topPaddingHeightPx }} />
      {data.map((item) => (
        <Row key={item.i} item={item} />
      ))}
      <div style={{ height: bottomPaddingHeightPx }} />
    </div>
  );
};

export default VirtualScroller;
