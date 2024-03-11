interface ConfirmPopUpProps {
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmPopUp: React.FC<ConfirmPopUpProps> = ({ onConfirm, onCancel }) => {
    return (
        <div className="flex flex-col items-center justify-center p-4 bg-discord-light-grey rounded shadow-lg">
            <p className="mb-4 ">Êtes-vous sûr de vouloir supprimer cet ami ?</p>
            <div className="flex space-x-4">
                <button
                    onClick={onConfirm}
                    className="px-4 py-2 bg-blurple text-black rounded hover:bg-blurple-hover"
                >
                    Oui
                </button>
                <button
                    onClick={onCancel}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                    Non
                </button>
            </div>
        </div>
    );
};
