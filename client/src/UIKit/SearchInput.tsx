import { SearchRounded } from "@mui/icons-material";

export const SearchInput = ({
  input,
  placeHolder,
  onSearch,
  autoFocus
}: {
  input: string;
  placeHolder?: string;
  onSearch: (value: string) => void;
  autoFocus?: boolean
}) => {
  return (
    <label className="bg-black w-[100%] flex justify-between cursor-text has-[:focus]:outline outline-offset-2 has-[:focus]:outline-indigo-500 has-[:focus]:outline-[1px] bg-opacity-30 py-3 px-5 rounded-md">
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
