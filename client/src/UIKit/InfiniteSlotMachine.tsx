import { useEffect, useRef, useState } from "react";

const TRANSITION_TIME = 0.2;

const goDown = (el: HTMLSpanElement) => {
  el.style.top = "0%";

  window.requestAnimationFrame(() => {
    el.style.transition = `all ${TRANSITION_TIME}s`;
    el.style.top = "100%";
  });
};

const goDownRound = (el: HTMLSpanElement) => {
  el.style.top = "-100%";

  window.requestAnimationFrame(() => {
    el.style.transition = `all ${TRANSITION_TIME}s`;
    el.style.top = "0%";
  });
};

const goUp = (el: HTMLSpanElement) => {
  el.style.top = "0%";

  window.requestAnimationFrame(() => {
    el.style.transition = `all ${TRANSITION_TIME}s`;
    el.style.top = "-100%";
  });
};

const goUpRound = (el: HTMLSpanElement) => {
  el.style.top = "100%";

  window.requestAnimationFrame(() => {
    el.style.transition = `all ${TRANSITION_TIME}s`;
    el.style.top = "0%";
  });
};

const InfiniteSlotMachine = ({ state }: { state: number }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [slotDisplayed, setSlotDisplayed] = useState(1);
  const [stateCopy, setStateCopy] = useState(state);
  const slot1 = useRef<HTMLSpanElement>(null);
  const slot2 = useRef<HTMLSpanElement>(null);
  const [slot1Value, setSlot1Value] = useState(state);
  const [slot2Value, setSlot2Value] = useState(state);

  const whatToDisplay = (isDisplayed: boolean) => {
    if (isDisplayed) {
      return stateCopy;
    }
    return state;
  };

  useEffect(() => {
    if (!wrapperRef || !wrapperRef.current) {
      return;
    }

    const wBefore = wrapperRef.current.getBoundingClientRect().width;
    wrapperRef.current.style.width = "auto";
    const wAfter = wrapperRef.current.getBoundingClientRect().width;
    wrapperRef.current.style.width = `${wBefore}px`;

    requestAnimationFrame(() => {
      if (wrapperRef.current) {
        wrapperRef.current.style.width = `${wAfter}px`;
      }
    });
  }, [wrapperRef, stateCopy]);

  useEffect(() => {
    if (state == stateCopy) {
      return;
    }
    if (!slot1 || !slot1.current || !slot2 || !slot2.current) {
      return;
    }

    slot1.current.style.transition = "none";
    slot2.current.style.transition = "none";

    const isGoingUp = state > stateCopy;
    if (isGoingUp) {
      goDown(slotDisplayed == 1 ? slot1.current : slot2.current);
      goDownRound(slotDisplayed == 1 ? slot2.current : slot1.current);
    } else {
      goUp(slotDisplayed == 2 ? slot2.current : slot1.current);
      goUpRound(slotDisplayed == 2 ? slot1.current : slot2.current);
    }

    setSlot1Value(whatToDisplay(slotDisplayed == 1));
    setSlot2Value(whatToDisplay(slotDisplayed == 2));

    setSlotDisplayed(slotDisplayed == 1 ? 2 : 1);
    setStateCopy(state);
  }, [state, slot1, slot2]);

  return (
    <div className={`flex h-full flex-col overflow-hidden`}>
      <div
        ref={wrapperRef}
        className={`relative flex h-[100%] flex-none flex-col items-center opacity-90 [transition:transform_0.2s,width_0.2s]`}
      >
        <span className="text-inherit opacity-0">{stateCopy}</span>
        <span
          ref={slot1}
          className={`text-inherit absolute flex h-full select-none items-center justify-center`}
        >
          {slot1Value}
        </span>

        <span
          style={{ top: "-100%" }}
          ref={slot2}
          className={`text-inherit absolute flex h-full select-none items-center justify-center`}
        >
          {slot2Value}
        </span>
      </div>
    </div>
  );
};

export default InfiniteSlotMachine;
