export const ChanColumn = () => {
    return (
        <div className="bg-not-quite-black chan-column">
            <div
                className="bg-not-quite-black topbar-section border-b border-b-almost-black "
                style={{ borderBottomWidth: "3px" }}
            ></div>
            <div className="w-full item-center justify-center">
                <div className="cell-chan text-xl align-center hover:bg-discord-light-grey hover:rounded-lg">
                    <svg
                        aria-hidden="true"
                        role="img"
                        xmlns="http://www.w3.org/2000/svg"
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                    >
                        <path
                            fill="currentColor"
                            d="M3 5v-.75C3 3.56 3.56 3 4.25 3s1.24.56 1.33 1.25C6.12 8.65 9.46 12 13 12h1a8 8 0 0 1 8 8 2 2 0 0 1-2 2 .21.21 0 0 1-.2-.15 7.65 7.65 0 0 0-1.32-2.3c-.15-.2-.42-.06-.39.17l.25 2c.02.15-.1.28-.25.28H9a2 2 0 0 1-2-2v-2.22c0-1.57-.67-3.05-1.53-4.37A15.85 15.85 0 0 1 3 5Z"
                        ></path>
                        <path
                            fill="currentColor"
                            d="M13 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
                        ></path>
                    </svg>
                    <div className="ml-5">Amis</div>
                </div>
            </div>
            <div className="cell-chan  font-bold text-greyple hover:text-white hover:rounded-md text-sm text-left flex items-center justify-between">
                <div>MESSAGE PRIVES</div>
                <span className="bloc text-right">+</span>
            </div>
            <div className="bg-almost-black text-m bloc user-chancolumn">
                <span className="avatar bg-greyple">IMG </span>
                <span> </span>
                <span className="text-greyple bloc text-left">
                    {" "}
                    <br></br> en ligne
                </span>
            </div>
        </div>
    );
};
