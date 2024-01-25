export const ChanColumn = () => {
    return (
        <div className="bg-not-quite-black chan-column">
            <div className="w-full item-center justify-center">
                <div className="cell-chan text-xl align-center ml-2 hover:bg-discord-light-grey hover:rounded-lg">Amis</div>
            </div>

            <div className="w-full font-bold text-greyple hover:bg-black text-sm text-left ml-2">MESSAGE PRIVES <span className="text-right">+</span></div>
            <div className="bg-almost-black text-m bloc user-chancolumn" > 
                <span className='avatar bg-greyple'>IMG </span>
                <span> Monpachi</span>
                <span className='text-greyple bloc text-left'> <br></br> en ligne</span>
            </div>
        </div>
    )
}