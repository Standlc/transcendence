import { useContext, useEffect, useRef, useState } from "react";
import { GameSoundEffectsSettingType } from "../../types/game";
import { GameSettingsContext } from "../../ContextsProviders/GameSettingsContext";

export const VolumeKnob = ({
  soundEffectsSetting,
}: {
  soundEffectsSetting: GameSoundEffectsSettingType;
}) => {
  const { upadteGameSetting } = useContext(GameSettingsContext);
  const knob = useRef<HTMLDivElement | null>(null);
  const [isClicked, setIsClicked] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [newVolume, setNewVolume] = useState(soundEffectsSetting.volume);

  const updateSoundVolume = (mouseX: number) => {
    if (!knob.current) return;
    const { left, width } = knob.current?.getBoundingClientRect();

    let newVolume = (mouseX - left) / width;
    newVolume = newVolume > 1 ? 1 : newVolume;
    newVolume = newVolume < 0 ? 0 : newVolume;

    setNewVolume(newVolume);
  };

  useEffect(() => {
    if (!isClicked || !knob.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      updateSoundVolume(e.x);
    };

    const handleMouseUp = () => {
      setIsClicked(false);
      upadteGameSetting("soundEffects", {
        isOn: newVolume > 0 ? true : false,
        volume: newVolume,
      });
    };

    addEventListener("mousemove", handleMouseMove);
    addEventListener("mouseup", handleMouseUp);
    return () => {
      removeEventListener("mousemove", handleMouseMove);
      removeEventListener("mouseup", handleMouseUp);
    };
  }, [isClicked, newVolume]);

  return (
    <div
      ref={knob}
      onMouseDown={(e) => {
        e.preventDefault();
        setIsClicked(true);
        updateSoundVolume(e.pageX);
        upadteGameSetting("soundEffects", {
          isOn: newVolume > 0 ? true : false,
          volume: newVolume,
        });
      }}
      style={{
        opacity: soundEffectsSetting.isOn ? 1 : 0.3,
      }}
      className="py-2 -my-2 transition-opacity"
    >
      <div className="relative flex items-center w-full h-[10px] bg-white bg-opacity-10 rounded-md my-0">
        {(isClicked || isHovering) && (
          <div
            style={{
              left: `${newVolume * 100}%`,
            }}
            className="absolute top-0 [transform:translate(-50%,calc(-100%-15px))] bg-zinc-900 rounded-md text-sm font-bold px-2 py-1"
          >
            {Math.floor(newVolume * 100)}%
          </div>
        )}

        <div
          style={{
            width: `${newVolume * 100}%`,
          }}
          className="absolute h-full bg-indigo-500 rounded-l-md"
        ></div>

        <div
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          style={{
            left: `${newVolume * 100}%`,
          }}
          className="absolute h-[25px] w-[10px] rounded-sm bg-white cursor-ew-resize translate-x-[-50%]"
        ></div>
      </div>
    </div>
  );
};
