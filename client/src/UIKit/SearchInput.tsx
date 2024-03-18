import { SearchRounded } from "@mui/icons-material";

export const SearchInput = ({
  input,
  placeHolder,
  onSearch,
  autoFocus,
  size,
}: {
  input: string;
  placeHolder?: string;
  onSearch: (value: string) => void;
  autoFocus?: boolean;
  size?: "sm" | "xl";
}) => {
  const sizes = {
    sm: "px-3 py-2",
    xl: "py-3 px-5",
  };

  return (
    <label
      className={`bg-black w-[100%] flex justify-between cursor-text has-[:focus]:outline outline-offset-2 has-[:focus]:outline-indigo-500 has-[:focus]:outline-[1px] bg-opacity-30 rounded-md ${
        sizes[size ?? "xl"]
      }`}
    >
      <input
        type="text"
        value={input}
        onChange={(e) => {
          onSearch(e.target.value);
        }}
        autoFocus={autoFocus}
        className="bg-transparent outline-none border-none w-full"
        placeholder={placeHolder ?? "Search"}
      />
      <SearchRounded />
    </label>
  );
};
