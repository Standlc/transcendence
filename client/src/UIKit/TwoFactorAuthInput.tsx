import { useState } from "react";

export const TwoFactorAuthInput = ({
  onSubmit,
  isError,
  resetError,
}: {
  onSubmit: (code: string) => void;
  isError: boolean;
  resetError: () => void;
}) => {
  const [input, setInput] = useState("");

  return (
    <div className="relative w-full flex flex-col gap-3">
      <input
        spellCheck={false}
        onChange={(e) => {
          const value = e.target.value;
          if (
            (value === "" || value.match(/^[0-9]+$/) != null) &&
            value.length <= 6
          ) {
            if (value.length === 6) {
              onSubmit(value);
            }
            resetError();
            setInput(value);
          }
        }}
        style={{
          outline: isError ? "1px solid rgba(255,0,0,0.7)" : "",
        }}
        value={input}
        type="text"
        className="w-full bg-black bg-opacity-40 px-3 py-2 rounded-md border-none outline-none focus:outline focus:outline-[1px] focus:outline-indigo-500"
        placeholder="XXXXXX"
        autoFocus
      />
      {isError && (
        <span className="text-red-600 opacity-70 text-sm text-center leading-none">
          Incorrect code
        </span>
      )}
    </div>
  );
};
