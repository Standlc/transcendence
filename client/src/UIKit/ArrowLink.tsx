import { ChevronRight } from "@mui/icons-material";
import { Link } from "react-router-dom";

export const ArrowLink = ({ children, to }: { children: any; to: string }) => {
  return (
    <Link to={to} className="flex items-center gap-2">
      <h1 className="font-title text-3xl font-[900] peer cursor-pointer">
        {children}
      </h1>
      <div className="peer-hover:opacity-100 peer-hover:translate-x-0 -translate-x-2 pee opacity-0 transition ease-in-out">
        <ChevronRight fontSize="small" />
      </div>
    </Link>
  );
};
