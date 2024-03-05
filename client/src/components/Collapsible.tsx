import { useState } from "react";
import { ArrowDropDown, ArrowDropUp } from "@mui/icons-material";

interface Props {
    title: string;
    children: React.ReactNode;
}

export const Collapsible: React.FC<Props> = ({ title, children }: Props) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleCollapse = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div>
            <div
                className="border-b border-b-almost-black w-[270px] hover:bg-discord-light-grey"
                style={{
                    borderBottomWidth: "3px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px",
                }}
                onClick={toggleCollapse}
            >
                <span className="font-bold text-greyple">{title}</span>
                {isOpen ? <ArrowDropUp /> : <ArrowDropDown />}
            </div>
            {isOpen && <div className="">{children}</div>}
        </div>
    );
};
