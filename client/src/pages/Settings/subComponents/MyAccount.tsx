import defaultAvatar from "../../../components/defaultAvatar.png";

export const MonCompte = () => {
    return (
        <div className="w-full ">
            <div className=" mb-5">
                <h1 className="ml-10 mt-20 text-3xl text-left font-bold">Mon Compte</h1>
            </div>
            <div className="ml-10 items-center justify-center h-full">
                <div className="rounded-t-xl settings-account-header"></div>
                <div className="rounded-b-xl settings-account bg-discord-black flex items-center justify-center">
                    <div className="flex flex-row">
                        <div className="block rounded-full bg-greyple mt-4 mb-4 mr-[100px]">
                            <img
                                src={defaultAvatar}
                                alt="avatar"
                                className="w-32 h-32 "
                            />
                        </div>
                        <div className="text-xl block font-bold mt-5 ">Monpachi</div>
                    </div>

                    <div className="rounded-xl settings-account-body bg-discord-dark-grey">
                        <div className="w-[500px] ml-5 mt-5 text-greyple text-left">
                            <div>NOM D'AFFICHAGE</div>
                            <div className="w-full flex block text-white">
                                <div className=" w-full tata">
                                    <div>Monpachi</div>
                                    <button className=" rounded-l  px-4  py-2 bg-grey block text-right ">
                                        Modifier
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="w-[500px] ml-5 mt-5 text-greyple text-left">
                            <div>NOM D'UTILASATEUR</div>
                            <div className="w-full flex block text-white">
                                <div className=" w-full tata">
                                    <div>Monpachi</div>
                                    <button className=" rounded-l  px-4  py-2 bg-grey block text-right ">
                                        Modifier
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="w-[500px] ml-5 mt-5 text-greyple text-left">
                            <div>EMAIL</div>
                            <div className="w-full flex block text-white">
                                <div className=" w-full tata">
                                    <div>********@gmail.com</div>
                                    <button className=" rounded-l  px-4  py-2 bg-grey block text-right ">
                                        Modifier
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="w-[500px] ml-5 mt-5 text-greyple text-left">
                            <div>NUMERO</div>
                            <div className="w-full flex block text-white">
                                <div className=" w-full tata">
                                    <div>0610912391</div>
                                    <button className=" rounded-l  px-4  py-2 bg-grey block text-right ">
                                        Modifier
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="mt-10 bg-grey border-b border-b-grey w-2/3 "></div>
            <div className="mt-10 w-2/3">
                <div className="text-left ml-10 font-bold text-xl">
                    Mot de passe et authentification
                </div>
                <div className="text-left ml-10">
                    <button
                        type="submit"
                        className="text-white mt-5 bg-blurple hover:bg-blurple-hover font-bold rounded-lg text-s w-1/3  py-2.5 text-center"
                    >
                        Changer le mot de passe
                    </button>
                </div>
            </div>
        </div>
    );
};
