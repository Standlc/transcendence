import React, { useEffect, useRef, KeyboardEventHandler } from "react";

type TextAreaProps = {
    value: string;
    onChange: React.ChangeEventHandler<HTMLTextAreaElement> | undefined;
    style?: React.CSSProperties;
    placeholder: string;
    autoFocus?: boolean;
    onKeyDown?: KeyboardEventHandler<HTMLTextAreaElement>;
};

export default function TextArea({
    value,
    onChange,
    style,
    placeholder,
    autoFocus,
    onKeyDown,
}: TextAreaProps) {
    const area = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (!area.current || value === "") return;

        area.current.style.height = "0px";
        const height = `${area.current.scrollHeight}px`;
        area.current.style.height = height;
        area.current.setAttribute("rows", "");
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
            placeholder={placeholder}
            className="text-md w-full resize-none overflow-hidden bg-transparent leading-snug placeholder:opacity-50 focus:outline-none"
        />
    );
}
