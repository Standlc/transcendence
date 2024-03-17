import { useState } from "react";
import { Spinner } from "../../UIKit/Kit";
import { ReloadButton } from "../../UIKit/ReloadButton";
import { SearchInput } from "../../UIKit/SearchInput";

export const UsersListWithSearch = ({
  isLoading,
  children,
  onSearch,
  title,
  emptyListDescription,
  refetch,
}: {
  isLoading: boolean;
  children: JSX.Element[];
  onSearch: (filter: string) => void;
  title: string;
  emptyListDescription: string;
  refetch: () => void;
}) => {
  const [filterInput, setFilterInput] = useState("");

  return (
    <div className="flex flex-col gap-5 w-full">
      <SearchInput
        input={filterInput}
        onSearch={(value) => {
          setFilterInput(value);
          onSearch(value);
        }}
      />

      <div className="w-full flex items-center justify-between">
        <span className="opacity-50 text-left text-sm font-[600]">
          {title} — {children.length ?? 0}
        </span>

        <ReloadButton onClick={refetch} />
      </div>

      <div className="flex flex-col gap-[2px]">
        {isLoading ? (
          <Spinner isLoading />
        ) : !children.length ? (
          <span className="opacity-50 text-lg">
            {filterInput !== "" ? "No results" : emptyListDescription}
          </span>
        ) : (
          children
        )}
      </div>
    </div>
  );
};
