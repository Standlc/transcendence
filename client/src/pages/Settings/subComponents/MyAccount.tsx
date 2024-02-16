export const MonCompte = () => {
    return (
        <div className="w-full h-full">
            <div className=" mb-5">
                <h1 className="ml-10 mt-20 text-3xl text-left font-bold">Mon Compte</h1>
            </div>
            <div className="ml-10 items-center justify-center h-full">
                <div className="rounded-t-xl settings-account-header"></div>
                <div className="rounded-b-xl settings-account bg-discord-black flex items-center justify-center">
                    <span>AVATAR</span>
                    <span>Monpachi</span>
                    <div className="rounded-xl settings-account-body bg-discord-dark-grey">
                        <div className="w-5/6 ml-5 mt-5 text-greyple text-left">
                            <div className="flex justify-between items-center">
                                <span>NOM D'AFFICHAGE</span>
                                <button className="rounded-l bg-grey px-4 py-2">
                                    Modifier
                                </button>
                            </div>
                            <div className="w-full text-white">
                                <span>Monpachi</span>
                            </div>
                        </div>
                        <div className="w-full ml-5 mt-5 text-greyple text-left">
                            NOM D'UTILISATEUR
                            <span className="w-full flex block text-white">
                                Monpachi
                                <button className="w-30 rounded-l bg-grey block text-right ">
                                    Modifier
                                </button>
                            </span>
                        </div>
                        <div className="w-full ml-5 mt-5 text-greyple text-left">
                            EMAIL
                            <span className="w-full flex block text-white">
                                ********@gmail.com
                                <button className=" w-30 rounded-l  bg-grey block text-right ">
                                    Modifier
                                </button>
                            </span>
                        </div>
                        <div className="w-full ml-5 mt-5 text-greyple text-left">
                            NUMERO DE TELEPHONE
                            <span className="w-full flex block text-white">
                                **********
                                <button className=" w-30 rounded-l  bg-grey block text-right ">
                                    Modifier
                                </button>
                            </span>
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
