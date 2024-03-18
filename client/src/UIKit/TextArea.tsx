import React, { useEffect, useRef, KeyboardEventHandler } from "react";

type TextAreaProps = {
  value: string;
  onChange: React.ChangeEventHandler<HTMLTextAreaElement> | undefined;
  style?: React.CSSProperties;
  placeholder: string;
  autoFocus?: boolean;
  onKeyDown?: KeyboardEventHandler<HTMLTextAreaElement>;
  disabled?: boolean;
  id?: string;
};

export default function TextArea({
  value,
  onChange,
  style,
  placeholder,
  autoFocus,
  onKeyDown,
  disabled,
  id,
}: TextAreaProps) {
  const area = useRef<HTMLTextAreaElement>(null);

  // useEffect(() => {
  //   if (!area.current) return;

  //   area.current.style.height = "0px";
  //   const height = `${area.current.scrollHeight}px`;
  //   area.current.style.height = height;
  //   area.current.setAttribute("rows", "");
  // }, [value]);

  useEffect(() => {
    if (!area.current) return;

    area.current.style.height = "auto";

    let newHeight = area.current.scrollHeight;
    const maxHeight = 20 * 5;

    if (newHeight > maxHeight) {
      newHeight = maxHeight;
      area.current.style.overflowY = "auto";
    } else {
      area.current.style.overflowY = "hidden";
    }

    area.current.style.height = `${newHeight}px`;
  }, [value]);

  return (
    <textarea
      rows={1}
      autoFocus={autoFocus !== undefined ? autoFocus : true}
      style={style}
      onChange={onChange}
      onKeyDown={onKeyDown}
      value={value}
      ref={area}
      id={id}
      placeholder={placeholder}
      className={`text-md w-full resize-none overflow-hidden bg-transparent leading-snug placeholder:opacity-50 focus:outline-none ${
        disabled ? "" : "text-white"
      }`}
      disabled={disabled}
      maxLength={800}
    />
  );
}
