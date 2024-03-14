import { SportsEsportsRounded } from "@mui/icons-material";
import { useState } from "react";
import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded";
import ModalLayout from "../../UIKit/ModalLayout";
import { ChanPopUp } from "../ChanPopUp";
import { NavLink } from "react-router-dom";

export const NavBar = () => {
  const [showChanPopUp, setShowChanPopUp] = useState(false);

  const closePopup = () => {
    setShowChanPopUp(false);
  };

  return (
    <div
      id="nav-bar"
      className="top-0 z-50 gap-4 flex flex-col justify-center items-center bg-discord-light-black sticky"
      style={{
        minWidth: "75px",
        maxWidth: "75px",
        height: "100vh",
      }}
    >
      <NavItem to="/settings">
        {() => (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="white"
            style={{ display: "block", margin: "auto" }}
          >
            <path d="M19.73 4.87a18.2 18.2 0 0 0-4.6-1.44c-.21.4-.4.8-.58 1.21-1.69-.25-3.4-.25-5.1 0-.18-.41-.37-.82-.59-1.2-1.6.27-3.14.75-4.6 1.43A19.04 19.04 0 0 0 .96 17.7a18.43 18.43 0 0 0 5.63 2.87c.46-.62.86-1.28 1.2-1.98-.65-.25-1.29-.55-1.9-.92.17-.12.32-.24.47-.37 3.58 1.7 7.7 1.7 11.28 0l.46.37c-.6.36-1.25.67-1.9.92.35.7.75 1.35 1.2 1.98 2.03-.63 3.94-1.6 5.64-2.87.47-4.87-.78-9.09-3.3-12.83ZM8.3 15.12c-1.1 0-2-1.02-2-2.27 0-1.24.88-2.26 2-2.26s2.02 1.02 2 2.26c0 1.25-.89 2.27-2 2.27Zm7.4 0c-1.1 0-2-1.02-2-2.27 0-1.24.88-2.26 2-2.26s2.02 1.02 2 2.26c0 1.25-.88 2.27-2 2.27Z" />
          </svg>
        )}
      </NavItem>

      <NavItem to="/home">
        {() => <ChatBubbleRoundedIcon fontSize="small" />}
      </NavItem>

      <NavItem to="/explore">
        {({ isActive }) => (
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              display: "block",
              margin: "auto",
              fill: isActive ? "white" : "green",
            }}
          >
            <path
              fill="white"
              fillRule="evenodd"
              d="M23 12a11 11 0 1 1-22 0 11 11 0 0 1 22 0ZM7.74 9.3A2 2 0 0 1 9.3 7.75l7.22-1.45a1 1 0 0 1 1.18 1.18l-1.45 7.22a2 2 0 0 1-1.57 1.57l-7.22 1.45a1 1 0 0 1-1.18-1.18L7.74 9.3Z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </NavItem>
      <NavItem to="/play">{() => <SportsEsportsRounded />}</NavItem>

      <div className="">
        {showChanPopUp && (
          <ModalLayout>
            <ChanPopUp onClose={closePopup} />
          </ModalLayout>
        )}
      </div>
    </div>
  );
};

const NavItem = ({
  to,
  children,
}: {
  to: string;
  children: (props: any) => React.ReactNode;
}) => {
  return (
    <div className="relative w-full flex justify-center items-center">
      <NavLink
        to={to}
        className={({ isActive }) =>
          `flex justify-center items-center transition-all p-2 ${
            isActive
              ? "rounded-2xl bg-indigo-500"
              : "bg-not-quite-black hover:rounded-2xl rounded-[30px] hover:bg-indigo-500"
          }`
        }
        style={{ height: "50px", width: "50px" }}
      >
        {(props) => (
          <>
            <div
              className={`absolute left-0 w-[4px] bg-white transition-all rounded-tr-lg rounded-br-lg ${
                props.isActive ? "h-[70%] opacity-100" : "h-[20%] opacity-50"
              }`}
            ></div>
            {children(props)}
          </>
        )}
      </NavLink>
    </div>
  );
};
